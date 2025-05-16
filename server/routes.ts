import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { whatsappManager } from "./whatsapp";
import { getAuthTokenFromRequest, getUserIdFromToken, authenticateUser, createUser, AuthRequestBody } from "./supabase";
import { verifyApiKey, createApiKey, revokeApiKey } from "./apiKeys";
import { triggerWebhooks, sendTestWebhook } from "./webhooks";
import { saveMediaFromUrl, getMediaFile, initMediaStorage, cleanupExpiredMedia } from "./mediaStorage";
import { 
  sendMessageSchema, 
  sendMediaSchema, 
  replyMessageSchema, 
  sendGroupMessageSchema,
  insertWebhookSchema,
  insertApiKeySchema
} from "@shared/schema";
import { z } from "zod";
import { createHash } from "crypto";

// Add userId property to Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// Middleware to check if the user is authenticated
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getAuthTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }
    
    req.userId = userId;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Middleware to verify API key
const verifyApiKeyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "API key required" });
    }
    
    const apiKey = authHeader.substring(7);
    const verification = await verifyApiKey(apiKey);
    
    if (!verification.valid) {
      return res.status(401).json({ message: verification.error || "Invalid API key" });
    }
    
    req.userId = verification.userId;
    next();
  } catch (error) {
    console.error("API key verification error:", error);
    res.status(500).json({ message: "API key verification error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket functionality is disabled in development mode
  // This improves stability during initial setup
  
  // Placeholder function for notifications
  // In production, this would send real-time updates to connected clients
  const notifyUser = (userId: number, eventType: string, data: any) => {
    console.log(`[Notification for user ${userId}] ${eventType}:`, data);
  };
  
  // Initialize media storage
  await initMediaStorage();
  
  // Set up a daily cron job to clean up expired media files
  setInterval(async () => {
    try {
      const deletedCount = await cleanupExpiredMedia();
      console.log(`Cleaned up ${deletedCount} expired media files`);
    } catch (error) {
      console.error('Error cleaning up expired media files:', error);
    }
  }, 24 * 60 * 60 * 1000); // Run once per day
  
  // ===== Authentication Routes =====
  
  // Register a new user
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const body: AuthRequestBody = req.body;
      
      if (!body.email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Create user
      const userAuth = await createUser(body);
      
      res.status(201).json({ user: userAuth.user, token: userAuth.session.accessToken });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });
  
  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Authenticate user
      const userAuth = await authenticateUser(email, password);
      
      res.status(200).json({ user: userAuth.user, token: userAuth.session.accessToken });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: error.message || "Login failed" });
    }
  });
  
  // Get current user
  app.get('/api/auth/me', authenticate, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });
  
  // ===== WhatsApp Session Routes =====
  
  // Get all WhatsApp sessions for a user
  app.get('/api/whatsapp/sessions', authenticate, async (req: Request, res: Response) => {
    try {
      const sessions = await storage.getWhatsappSessionsByUserId(req.userId!);
      res.status(200).json({ sessions });
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ message: "Failed to get WhatsApp sessions" });
    }
  });
  
  // Create a new WhatsApp session
  app.post('/api/whatsapp/sessions', authenticate, async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Session name is required" });
      }
      
      // Create a new WhatsApp client and generate QR code
      const { session, qrCode } = await whatsappManager.createClient(req.userId!, name);
      
      // Log the creation
      await storage.createLog({
        user_id: req.userId!,
        session_id: session.session_id,
        type: 'system',
        message: `WhatsApp session created: ${name}`,
        details: { sessionId: session.session_id, name }
      });
      
      // Notify connected clients
      notifyUser(req.userId!, 'session_created', { session });
      
      res.status(201).json({ session, qrCode });
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ message: "Failed to create WhatsApp session" });
    }
  });
  
  // Get QR code for a session
  app.get('/api/whatsapp/sessions/:sessionId/qr', authenticate, async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      // Get the session to ensure it belongs to the user
      const session = await storage.getWhatsappSession(sessionId);
      
      if (!session || session.user_id !== req.userId) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Get the client and generate a new QR code
      const client = await whatsappManager.getClient(sessionId, req.userId!);
      const qrCode = await client.initialize();
      
      res.status(200).json({ qrCode });
    } catch (error) {
      console.error("Get QR code error:", error);
      res.status(500).json({ message: "Failed to get QR code" });
    }
  });
  
  // Connect/reconnect a WhatsApp session
  app.post('/api/whatsapp/sessions/:sessionId/connect', authenticate, async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      // Get the session to ensure it belongs to the user
      const session = await storage.getWhatsappSession(sessionId);
      
      if (!session || session.user_id !== req.userId) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Reconnect the client
      const connected = await whatsappManager.reconnectClient(sessionId, req.userId!);
      
      if (connected) {
        // Get the updated session
        const updatedSession = await storage.getWhatsappSession(sessionId);
        
        // Notify connected clients
        notifyUser(req.userId!, 'session_connected', { session: updatedSession });
        
        res.status(200).json({ connected: true, session: updatedSession });
      } else {
        res.status(500).json({ connected: false, message: "Failed to connect WhatsApp session" });
      }
    } catch (error) {
      console.error("Connect session error:", error);
      res.status(500).json({ message: "Failed to connect WhatsApp session" });
    }
  });
  
  // Disconnect a WhatsApp session
  app.post('/api/whatsapp/sessions/:sessionId/disconnect', authenticate, async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      // Get the session to ensure it belongs to the user
      const session = await storage.getWhatsappSession(sessionId);
      
      if (!session || session.user_id !== req.userId) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Disconnect the client
      await whatsappManager.disconnectClient(sessionId);
      
      // Get the updated session
      const updatedSession = await storage.getWhatsappSession(sessionId);
      
      // Notify connected clients
      notifyUser(req.userId!, 'session_disconnected', { session: updatedSession });
      
      res.status(200).json({ session: updatedSession });
    } catch (error) {
      console.error("Disconnect session error:", error);
      res.status(500).json({ message: "Failed to disconnect WhatsApp session" });
    }
  });
  
  // Delete a WhatsApp session
  app.delete('/api/whatsapp/sessions/:sessionId', authenticate, async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      // Get the session to ensure it belongs to the user
      const session = await storage.getWhatsappSession(sessionId);
      
      if (!session || session.user_id !== req.userId) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Remove the client and delete the session
      const deleted = await whatsappManager.removeClient(sessionId);
      
      if (deleted) {
        // Log the deletion
        await storage.createLog({
          user_id: req.userId!,
          type: 'system',
          message: `WhatsApp session deleted: ${session.name}`,
          details: { sessionId: session.session_id, name: session.name }
        });
        
        // Notify connected clients
        notifyUser(req.userId!, 'session_deleted', { sessionId });
        
        res.status(200).json({ deleted: true });
      } else {
        res.status(500).json({ deleted: false, message: "Failed to delete WhatsApp session" });
      }
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ message: "Failed to delete WhatsApp session" });
    }
  });
  
  // ===== API Key Routes =====
  
  // Get all API keys for a user
  app.get('/api/api-keys', authenticate, async (req: Request, res: Response) => {
    try {
      const apiKeys = await storage.getApiKeysByUserId(req.userId!);
      
      // Mask the actual keys for security
      const maskedKeys = apiKeys.map(key => ({
        ...key,
        key: `${key.key.substring(0, 7)}•••••••••••••••••••••••${key.key.substring(key.key.length - 4)}`
      }));
      
      res.status(200).json({ apiKeys: maskedKeys });
    } catch (error) {
      console.error("Get API keys error:", error);
      res.status(500).json({ message: "Failed to get API keys" });
    }
  });
  
  // Create a new API key
  app.post('/api/api-keys', authenticate, async (req: Request, res: Response) => {
    try {
      const apiKeyData = req.body;
      
      // Validate input
      const validatedData = insertApiKeySchema.parse(apiKeyData);
      
      // Ensure user_id matches the authenticated user
      validatedData.user_id = req.userId!;
      
      // Create the API key
      const key = await createApiKey(
        req.userId!, 
        validatedData.name, 
        validatedData.rate_limit || 60, 
        validatedData.expires_at || undefined
      );
      
      // Get the created API key
      const apiKey = await storage.getApiKey(key);
      
      // Notify connected clients
      notifyUser(req.userId!, 'api_key_created', { 
        apiKey: {
          ...apiKey,
          key: `${key.substring(0, 7)}•••••••••••••••••••••••${key.substring(key.length - 4)}`
        }
      });
      
      res.status(201).json({ 
        apiKey: {
          ...apiKey,
          key
        },
        // Show the full key only on creation 
        message: "Store this API key securely. It won't be shown again." 
      });
    } catch (error) {
      console.error("Create API key error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid API key data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create API key" });
      }
    }
  });
  
  // Revoke an API key
  app.delete('/api/api-keys/:keyId', authenticate, async (req: Request, res: Response) => {
    try {
      const keyId = parseInt(req.params.keyId, 10);
      
      if (isNaN(keyId)) {
        return res.status(400).json({ message: "Invalid API key ID" });
      }
      
      // Revoke the key
      const revoked = await revokeApiKey(req.userId!, keyId);
      
      if (revoked) {
        // Notify connected clients
        notifyUser(req.userId!, 'api_key_revoked', { keyId });
        
        res.status(200).json({ revoked: true });
      } else {
        res.status(404).json({ revoked: false, message: "API key not found" });
      }
    } catch (error) {
      console.error("Revoke API key error:", error);
      res.status(500).json({ message: "Failed to revoke API key" });
    }
  });
  
  // ===== Webhook Routes =====
  
  // Get all webhooks for a user
  app.get('/api/webhooks', authenticate, async (req: Request, res: Response) => {
    try {
      const webhooks = await storage.getWebhooksByUserId(req.userId!);
      
      // Mask webhook secrets
      const maskedWebhooks = webhooks.map(webhook => ({
        ...webhook,
        secret: webhook.secret ? `${webhook.secret.substring(0, 3)}•••••` : null
      }));
      
      res.status(200).json({ webhooks: maskedWebhooks });
    } catch (error) {
      console.error("Get webhooks error:", error);
      res.status(500).json({ message: "Failed to get webhooks" });
    }
  });
  
  // Create a new webhook
  app.post('/api/webhooks', authenticate, async (req: Request, res: Response) => {
    try {
      const webhookData = req.body;
      
      // Validate input
      const validatedData = insertWebhookSchema.parse(webhookData);
      
      // Ensure user_id matches the authenticated user
      validatedData.user_id = req.userId!;
      
      // Create the webhook
      const webhook = await storage.createWebhook(validatedData);
      
      // Log the creation
      await storage.createLog({
        user_id: req.userId!,
        type: 'system',
        message: `Webhook created: ${webhook.url} for event ${webhook.event_type}`,
        details: { webhookId: webhook.id, url: webhook.url, eventType: webhook.event_type }
      });
      
      // Notify connected clients
      notifyUser(req.userId!, 'webhook_created', { webhook });
      
      res.status(201).json({ webhook });
    } catch (error) {
      console.error("Create webhook error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid webhook data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create webhook" });
      }
    }
  });
  
  // Update a webhook
  app.patch('/api/webhooks/:webhookId', authenticate, async (req: Request, res: Response) => {
    try {
      const webhookId = parseInt(req.params.webhookId, 10);
      const updateData = req.body;
      
      if (isNaN(webhookId)) {
        return res.status(400).json({ message: "Invalid webhook ID" });
      }
      
      // Get the webhook to ensure it belongs to the user
      const webhooks = await storage.getWebhooksByUserId(req.userId!);
      const webhook = webhooks.find(w => w.id === webhookId);
      
      if (!webhook) {
        return res.status(404).json({ message: "Webhook not found" });
      }
      
      // Update the webhook
      const updatedWebhook = await storage.updateWebhook(webhookId, updateData);
      
      if (updatedWebhook) {
        // Log the update
        await storage.createLog({
          user_id: req.userId!,
          type: 'system',
          message: `Webhook updated: ${updatedWebhook.url}`,
          details: { webhookId, url: updatedWebhook.url }
        });
        
        // Notify connected clients
        notifyUser(req.userId!, 'webhook_updated', { webhook: updatedWebhook });
        
        res.status(200).json({ webhook: updatedWebhook });
      } else {
        res.status(500).json({ message: "Failed to update webhook" });
      }
    } catch (error) {
      console.error("Update webhook error:", error);
      res.status(500).json({ message: "Failed to update webhook" });
    }
  });
  
  // Delete a webhook
  app.delete('/api/webhooks/:webhookId', authenticate, async (req: Request, res: Response) => {
    try {
      const webhookId = parseInt(req.params.webhookId, 10);
      
      if (isNaN(webhookId)) {
        return res.status(400).json({ message: "Invalid webhook ID" });
      }
      
      // Get the webhook to ensure it belongs to the user
      const webhooks = await storage.getWebhooksByUserId(req.userId!);
      const webhook = webhooks.find(w => w.id === webhookId);
      
      if (!webhook) {
        return res.status(404).json({ message: "Webhook not found" });
      }
      
      // Delete the webhook
      const deleted = await storage.deleteWebhook(webhookId);
      
      if (deleted) {
        // Log the deletion
        await storage.createLog({
          user_id: req.userId!,
          type: 'system',
          message: `Webhook deleted: ${webhook.url}`,
          details: { webhookId, url: webhook.url }
        });
        
        // Notify connected clients
        notifyUser(req.userId!, 'webhook_deleted', { webhookId });
        
        res.status(200).json({ deleted: true });
      } else {
        res.status(500).json({ deleted: false, message: "Failed to delete webhook" });
      }
    } catch (error) {
      console.error("Delete webhook error:", error);
      res.status(500).json({ message: "Failed to delete webhook" });
    }
  });
  
  // Test a webhook
  app.post('/api/webhooks/:webhookId/test', authenticate, async (req: Request, res: Response) => {
    try {
      const webhookId = parseInt(req.params.webhookId, 10);
      
      if (isNaN(webhookId)) {
        return res.status(400).json({ message: "Invalid webhook ID" });
      }
      
      // Send a test webhook
      const success = await sendTestWebhook(webhookId, req.userId!);
      
      res.status(200).json({ success });
    } catch (error) {
      console.error("Test webhook error:", error);
      res.status(500).json({ message: "Failed to test webhook" });
    }
  });
  
  // ===== WhatsApp Message Sending API (API Key Protected) =====
  
  // Send a text message
  app.post('/api/send', verifyApiKeyMiddleware, async (req: Request, res: Response) => {
    try {
      const messageData = req.body;
      
      // Validate input
      const validatedData = sendMessageSchema.parse(messageData);
      
      // Get the session
      const session = await storage.getWhatsappSession(validatedData.sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "WhatsApp session not found" });
      }
      
      // Check if the session belongs to the user associated with the API key
      if (session.user_id !== req.userId) {
        return res.status(403).json({ message: "You don't have access to this WhatsApp session" });
      }
      
      // Get the WhatsApp client
      const client = await whatsappManager.getClient(validatedData.sessionId, req.userId!);
      
      if (!client.isConnected()) {
        return res.status(400).json({ message: "WhatsApp session is not connected" });
      }
      
      // Send the message
      const result = await client.sendMessage(validatedData.to, validatedData.text);
      
      // Trigger webhooks
      await triggerWebhooks(req.userId!, validatedData.sessionId, 'message_sent', {
        to: validatedData.to,
        text: validatedData.text,
        messageId: result.id
      });
      
      // Notify connected clients
      notifyUser(req.userId!, 'message_sent', {
        sessionId: validatedData.sessionId,
        to: validatedData.to,
        text: validatedData.text,
        messageId: result.id
      });
      
      res.status(200).json({ 
        success: true, 
        messageId: result.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Send message error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: error.message || "Failed to send message" });
      }
    }
  });
  
  // Send a media message
  app.post('/api/send-media', verifyApiKeyMiddleware, async (req: Request, res: Response) => {
    try {
      const messageData = req.body;
      
      // Validate input
      const validatedData = sendMediaSchema.parse(messageData);
      
      // Get the session
      const session = await storage.getWhatsappSession(validatedData.sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "WhatsApp session not found" });
      }
      
      // Check if the session belongs to the user associated with the API key
      if (session.user_id !== req.userId) {
        return res.status(403).json({ message: "You don't have access to this WhatsApp session" });
      }
      
      // Get the WhatsApp client
      const client = await whatsappManager.getClient(validatedData.sessionId, req.userId!);
      
      if (!client.isConnected()) {
        return res.status(400).json({ message: "WhatsApp session is not connected" });
      }
      
      // Send the media message
      const result = await client.sendMedia(
        validatedData.to, 
        validatedData.mediaUrl, 
        validatedData.caption
      );
      
      // Trigger webhooks
      await triggerWebhooks(req.userId!, validatedData.sessionId, 'message_sent', {
        to: validatedData.to,
        mediaUrl: validatedData.mediaUrl,
        caption: validatedData.caption,
        messageId: result.id
      });
      
      // Notify connected clients
      notifyUser(req.userId!, 'media_sent', {
        sessionId: validatedData.sessionId,
        to: validatedData.to,
        mediaUrl: validatedData.mediaUrl,
        caption: validatedData.caption,
        messageId: result.id
      });
      
      res.status(200).json({ 
        success: true, 
        messageId: result.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Send media error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid media message data", errors: error.errors });
      } else {
        res.status(500).json({ message: error.message || "Failed to send media message" });
      }
    }
  });
  
  // Reply to a message
  app.post('/api/reply', verifyApiKeyMiddleware, async (req: Request, res: Response) => {
    try {
      const messageData = req.body;
      
      // Validate input
      const validatedData = replyMessageSchema.parse(messageData);
      
      // Get the session
      const session = await storage.getWhatsappSession(validatedData.sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "WhatsApp session not found" });
      }
      
      // Check if the session belongs to the user associated with the API key
      if (session.user_id !== req.userId) {
        return res.status(403).json({ message: "You don't have access to this WhatsApp session" });
      }
      
      // Get the WhatsApp client
      const client = await whatsappManager.getClient(validatedData.sessionId, req.userId!);
      
      if (!client.isConnected()) {
        return res.status(400).json({ message: "WhatsApp session is not connected" });
      }
      
      // Reply to the message
      const result = await client.replyToMessage(validatedData.messageId, validatedData.text);
      
      // Trigger webhooks
      await triggerWebhooks(req.userId!, validatedData.sessionId, 'message_sent', {
        replyToMessageId: validatedData.messageId,
        text: validatedData.text,
        messageId: result.id
      });
      
      // Notify connected clients
      notifyUser(req.userId!, 'message_replied', {
        sessionId: validatedData.sessionId,
        replyToMessageId: validatedData.messageId,
        text: validatedData.text,
        messageId: result.id
      });
      
      res.status(200).json({ 
        success: true, 
        messageId: result.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Reply message error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid reply data", errors: error.errors });
      } else {
        res.status(500).json({ message: error.message || "Failed to reply to message" });
      }
    }
  });
  
  // Send a message to a group
  app.post('/api/send-group', verifyApiKeyMiddleware, async (req: Request, res: Response) => {
    try {
      const messageData = req.body;
      
      // Validate input
      const validatedData = sendGroupMessageSchema.parse(messageData);
      
      // Get the session
      const session = await storage.getWhatsappSession(validatedData.sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "WhatsApp session not found" });
      }
      
      // Check if the session belongs to the user associated with the API key
      if (session.user_id !== req.userId) {
        return res.status(403).json({ message: "You don't have access to this WhatsApp session" });
      }
      
      // Get the WhatsApp client
      const client = await whatsappManager.getClient(validatedData.sessionId, req.userId!);
      
      if (!client.isConnected()) {
        return res.status(400).json({ message: "WhatsApp session is not connected" });
      }
      
      // Send the group message
      const result = await client.sendGroupMessage(validatedData.groupId, validatedData.text);
      
      // Trigger webhooks
      await triggerWebhooks(req.userId!, validatedData.sessionId, 'message_sent', {
        groupId: validatedData.groupId,
        text: validatedData.text,
        messageId: result.id
      });
      
      // Notify connected clients
      notifyUser(req.userId!, 'group_message_sent', {
        sessionId: validatedData.sessionId,
        groupId: validatedData.groupId,
        text: validatedData.text,
        messageId: result.id
      });
      
      res.status(200).json({ 
        success: true, 
        messageId: result.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Send group message error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid group message data", errors: error.errors });
      } else {
        res.status(500).json({ message: error.message || "Failed to send group message" });
      }
    }
  });
  
  // Get group members
  app.get('/api/groups/:groupId/members', verifyApiKeyMiddleware, async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const { sessionId } = req.query;
      
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ message: "sessionId query parameter is required" });
      }
      
      // Get the session
      const session = await storage.getWhatsappSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "WhatsApp session not found" });
      }
      
      // Check if the session belongs to the user associated with the API key
      if (session.user_id !== req.userId) {
        return res.status(403).json({ message: "You don't have access to this WhatsApp session" });
      }
      
      // Get the WhatsApp client
      const client = await whatsappManager.getClient(sessionId, req.userId!);
      
      if (!client.isConnected()) {
        return res.status(400).json({ message: "WhatsApp session is not connected" });
      }
      
      // Get the group members
      const members = await client.getGroupMembers(groupId);
      
      res.status(200).json({ 
        success: true, 
        groupId,
        members
      });
    } catch (error) {
      console.error("Get group members error:", error);
      res.status(500).json({ message: error.message || "Failed to get group members" });
    }
  });
  
  // ===== Media Routes =====
  
  // Get a media file
  app.get('/api/media/:fileName', async (req: Request, res: Response) => {
    try {
      const { fileName } = req.params;
      
      // Get the media file
      const fileBuffer = await getMediaFile(fileName);
      
      if (!fileBuffer) {
        return res.status(404).json({ message: "Media file not found" });
      }
      
      // Determine content type based on file extension
      const extension = fileName.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (extension === 'jpg' || extension === 'jpeg') {
        contentType = 'image/jpeg';
      } else if (extension === 'png') {
        contentType = 'image/png';
      } else if (extension === 'gif') {
        contentType = 'image/gif';
      } else if (extension === 'pdf') {
        contentType = 'application/pdf';
      } else if (extension === 'mp4') {
        contentType = 'video/mp4';
      } else if (extension === 'mp3') {
        contentType = 'audio/mpeg';
      }
      
      // Set the content type and send the file
      res.setHeader('Content-Type', contentType);
      res.send(fileBuffer);
    } catch (error) {
      console.error("Get media error:", error);
      res.status(500).json({ message: "Failed to get media file" });
    }
  });
  
  // Upload a media file
  app.post('/api/media', authenticate, async (req: Request, res: Response) => {
    try {
      const { url, mimeType, expiryHours } = req.body;
      
      if (!url || !mimeType) {
        return res.status(400).json({ message: "URL and MIME type are required" });
      }
      
      // Save the media file
      const mediaFile = await saveMediaFromUrl(
        req.userId!,
        url,
        mimeType,
        expiryHours ? parseInt(expiryHours, 10) : 24
      );
      
      res.status(201).json({ mediaFile });
    } catch (error) {
      console.error("Upload media error:", error);
      res.status(500).json({ message: "Failed to upload media file" });
    }
  });
  
  // ===== Logs Routes =====
  
  // Get system logs
  app.get('/api/logs', authenticate, async (req: Request, res: Response) => {
    try {
      const { limit, type } = req.query;
      
      // Get logs
      const logs = await storage.getLogs(
        req.userId!,
        limit ? parseInt(limit as string, 10) : 100,
        type as string | undefined
      );
      
      res.status(200).json({ logs });
    } catch (error) {
      console.error("Get logs error:", error);
      res.status(500).json({ message: "Failed to get logs" });
    }
  });
  
  // ===== Stats Routes =====
  
  // Get user stats
  app.get('/api/stats', authenticate, async (req: Request, res: Response) => {
    try {
      // Get WhatsApp sessions
      const sessions = await storage.getWhatsappSessionsByUserId(req.userId!);
      const activeSessions = sessions.filter(session => session.is_active).length;
      const totalMessages = sessions.reduce((sum, session) => sum + session.message_count, 0);
      
      // Get API keys
      const apiKeys = await storage.getApiKeysByUserId(req.userId!);
      const activeApiKeys = apiKeys.filter(key => key.is_active).length;
      const totalRequests = apiKeys.reduce((sum, key) => sum + key.request_count, 0);
      
      // Get webhooks
      const webhooks = await storage.getWebhooksByUserId(req.userId!);
      const activeWebhooks = webhooks.filter(webhook => webhook.is_active).length;
      const totalWebhookCalls = webhooks.reduce(
        (sum, webhook) => sum + webhook.delivery_success_count + webhook.delivery_failure_count, 
        0
      );
      
      res.status(200).json({
        activeSessions,
        totalSessions: sessions.length,
        totalMessages,
        activeApiKeys,
        totalApiKeys: apiKeys.length,
        totalRequests,
        activeWebhooks,
        totalWebhooks: webhooks.length,
        totalWebhookCalls
      });
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });
  
  return httpServer;
}
