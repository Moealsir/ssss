import { storage } from './storage';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Helper to calculate HMAC signature for webhook payload
function calculateSignature(payload: any, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

// Send webhook with exponential backoff retry
export async function sendWebhook(
  webhookId: number, 
  url: string, 
  payload: any, 
  headers: Record<string, string> = {}, 
  secret?: string,
  maxAttempts: number = 3
): Promise<boolean> {
  let attempts = 0;
  
  const executeWebhook = async (): Promise<boolean> => {
    try {
      // Add signature if secret is provided
      const requestHeaders = { ...headers, 'Content-Type': 'application/json' };
      
      if (secret) {
        const signature = calculateSignature(payload, secret);
        requestHeaders['X-Signature'] = signature;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(payload),
        timeout: 10000 // 10 second timeout
      });
      
      const success = response.ok;
      
      // Update webhook stats
      await storage.updateWebhookStats(webhookId, success);
      
      // Log the webhook attempt
      await storage.createLog({
        user_id: payload.userId,
        session_id: payload.sessionId,
        type: 'webhook',
        message: success ? 'Webhook delivered successfully' : `Webhook delivery failed with status ${response.status}`,
        details: {
          webhookId,
          url,
          status: response.status,
          attempt: attempts + 1,
          success
        }
      });
      
      return success;
    } catch (error) {
      // Update webhook stats as failed
      await storage.updateWebhookStats(webhookId, false);
      
      // Log the webhook error
      await storage.createLog({
        user_id: payload.userId,
        session_id: payload.sessionId,
        type: 'webhook',
        message: `Webhook delivery failed: ${error.message}`,
        details: {
          webhookId,
          url,
          attempt: attempts + 1,
          error: error.message,
          success: false
        }
      });
      
      return false;
    }
  };
  
  // First attempt
  attempts++;
  let success = await executeWebhook();
  
  // Retry with exponential backoff if failed
  while (!success && attempts < maxAttempts) {
    const backoffMs = Math.pow(2, attempts) * 1000; // Exponential backoff: 2s, 4s, 8s, ...
    await new Promise(resolve => setTimeout(resolve, backoffMs));
    
    attempts++;
    success = await executeWebhook();
  }
  
  return success;
}

// Trigger webhooks for a specific event type
export async function triggerWebhooks(
  userId: number, 
  sessionId: string, 
  eventType: string, 
  payload: any
): Promise<void> {
  // Get all active webhooks for this user and event type
  const webhooks = await storage.getWebhooksByEventType(userId, eventType);
  
  // Add user and session info to the payload
  const webhookPayload = {
    ...payload,
    userId,
    sessionId,
    eventType,
    timestamp: new Date().toISOString()
  };
  
  // Send webhooks in parallel
  const promises = webhooks.map(webhook => {
    return sendWebhook(
      webhook.id,
      webhook.url,
      webhookPayload,
      webhook.custom_headers as Record<string, string>,
      webhook.secret
    );
  });
  
  // Wait for all webhooks to complete
  await Promise.all(promises);
}

// Send a test webhook
export async function sendTestWebhook(webhookId: number, userId: number): Promise<boolean> {
  // Get the webhook
  const webhooks = await storage.getWebhooksByUserId(userId);
  const webhook = webhooks.find(w => w.id === webhookId);
  
  if (!webhook) {
    throw new Error('Webhook not found');
  }
  
  // Create a test payload
  const testPayload = {
    userId,
    sessionId: 'test_session',
    eventType: webhook.event_type,
    timestamp: new Date().toISOString(),
    test: true,
    message: {
      id: 'test_message_id',
      body: 'This is a test webhook message',
      from: '+1234567890',
      to: '+0987654321',
      timestamp: new Date().toISOString(),
    }
  };
  
  // Send the test webhook
  return await sendWebhook(
    webhook.id,
    webhook.url,
    testPayload,
    webhook.custom_headers as Record<string, string>,
    webhook.secret,
    1 // Only try once for test webhooks
  );
}
