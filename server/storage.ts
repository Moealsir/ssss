import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import { and, eq, isNull, gte, or } from "drizzle-orm";
import crypto from 'crypto';

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  
  // WhatsApp session operations
  getWhatsappSession(sessionId: string): Promise<schema.WhatsappSession | undefined>;
  getWhatsappSessionsByUserId(userId: number): Promise<schema.WhatsappSession[]>;
  createWhatsappSession(session: schema.InsertWhatsappSession): Promise<schema.WhatsappSession>;
  updateWhatsappSession(sessionId: string, data: Partial<schema.WhatsappSession>): Promise<schema.WhatsappSession | undefined>;
  deleteWhatsappSession(sessionId: string): Promise<boolean>;
  incrementMessageCount(sessionId: string): Promise<void>;
  
  // API key operations
  getApiKey(key: string): Promise<schema.ApiKey | undefined>;
  getApiKeysByUserId(userId: number): Promise<schema.ApiKey[]>;
  createApiKey(apiKey: schema.InsertApiKey, key: string): Promise<schema.ApiKey>;
  revokeApiKey(id: number): Promise<boolean>;
  incrementApiKeyUsage(key: string): Promise<void>;
  
  // Webhook operations
  getWebhooksByUserId(userId: number): Promise<schema.Webhook[]>;
  getWebhooksByEventType(userId: number, eventType: string): Promise<schema.Webhook[]>;
  createWebhook(webhook: schema.InsertWebhook): Promise<schema.Webhook>;
  updateWebhook(id: number, data: Partial<schema.Webhook>): Promise<schema.Webhook | undefined>;
  deleteWebhook(id: number): Promise<boolean>;
  updateWebhookStats(id: number, success: boolean): Promise<void>;
  
  // Media operations
  createMediaFile(media: schema.InsertMediaFile): Promise<schema.MediaFile>;
  getMediaFilesByUserId(userId: number): Promise<schema.MediaFile[]>;
  deleteExpiredMediaFiles(): Promise<number>;
  
  // Logs operations
  createLog(log: schema.InsertSystemLog): Promise<schema.SystemLog>;
  getLogs(userId: number, limit?: number, type?: string): Promise<schema.SystemLog[]>;
}

export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  
  constructor() {
    // Connect to the PostgreSQL database
    const client = postgres(process.env.DATABASE_URL || "", {
      max: 10, // Maximum number of connections
      ssl: true, // Enable SSL for secure connections
    });
    
    // Initialize Drizzle with the PostgreSQL client
    this.db = drizzle(client, { schema });
  }
  
  // User operations
  async getUser(id: number): Promise<schema.User | undefined> {
    const users = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }
  
  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    const users = await this.db.select().from(schema.users).where(eq(schema.users.email, email));
    return users[0];
  }
  
  async createUser(user: schema.InsertUser): Promise<schema.User> {
    const result = await this.db.insert(schema.users).values(user).returning();
    return result[0];
  }
  
  // WhatsApp session operations
  async getWhatsappSession(sessionId: string): Promise<schema.WhatsappSession | undefined> {
    const sessions = await this.db.select().from(schema.whatsappSessions).where(eq(schema.whatsappSessions.session_id, sessionId));
    return sessions[0];
  }
  
  async getWhatsappSessionsByUserId(userId: number): Promise<schema.WhatsappSession[]> {
    return await this.db.select().from(schema.whatsappSessions).where(eq(schema.whatsappSessions.user_id, userId));
  }
  
  async createWhatsappSession(session: schema.InsertWhatsappSession): Promise<schema.WhatsappSession> {
    const result = await this.db.insert(schema.whatsappSessions).values(session).returning();
    return result[0];
  }
  
  async updateWhatsappSession(sessionId: string, data: Partial<schema.WhatsappSession>): Promise<schema.WhatsappSession | undefined> {
    const result = await this.db.update(schema.whatsappSessions)
      .set(data)
      .where(eq(schema.whatsappSessions.session_id, sessionId))
      .returning();
    
    return result[0];
  }
  
  async deleteWhatsappSession(sessionId: string): Promise<boolean> {
    const result = await this.db.delete(schema.whatsappSessions)
      .where(eq(schema.whatsappSessions.session_id, sessionId))
      .returning();
    
    return result.length > 0;
  }
  
  async incrementMessageCount(sessionId: string): Promise<void> {
    const session = await this.getWhatsappSession(sessionId);
    if (session) {
      await this.db.update(schema.whatsappSessions)
        .set({ message_count: session.message_count + 1 })
        .where(eq(schema.whatsappSessions.session_id, sessionId));
    }
  }
  
  // API key operations
  async getApiKey(key: string): Promise<schema.ApiKey | undefined> {
    const keys = await this.db.select().from(schema.apiKeys)
      .where(and(
        eq(schema.apiKeys.key, key),
        eq(schema.apiKeys.is_active, true),
        or(
          isNull(schema.apiKeys.expires_at),
          gte(schema.apiKeys.expires_at, new Date())
        )
      ));
    
    return keys[0];
  }
  
  async getApiKeysByUserId(userId: number): Promise<schema.ApiKey[]> {
    return await this.db.select().from(schema.apiKeys)
      .where(eq(schema.apiKeys.user_id, userId));
  }
  
  async createApiKey(apiKeyData: schema.InsertApiKey, key: string): Promise<schema.ApiKey> {
    const result = await this.db.insert(schema.apiKeys)
      .values({ ...apiKeyData, key })
      .returning();
    
    return result[0];
  }
  
  async revokeApiKey(id: number): Promise<boolean> {
    const result = await this.db.update(schema.apiKeys)
      .set({ is_active: false })
      .where(eq(schema.apiKeys.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  async incrementApiKeyUsage(key: string): Promise<void> {
    const apiKey = await this.getApiKey(key);
    if (apiKey) {
      await this.db.update(schema.apiKeys)
        .set({ request_count: apiKey.request_count + 1 })
        .where(eq(schema.apiKeys.key, key));
    }
  }
  
  // Webhook operations
  async getWebhooksByUserId(userId: number): Promise<schema.Webhook[]> {
    return await this.db.select().from(schema.webhooks)
      .where(eq(schema.webhooks.user_id, userId));
  }
  
  async getWebhooksByEventType(userId: number, eventType: string): Promise<schema.Webhook[]> {
    return await this.db.select().from(schema.webhooks)
      .where(and(
        eq(schema.webhooks.user_id, userId),
        eq(schema.webhooks.is_active, true),
        or(
          eq(schema.webhooks.event_type, eventType),
          eq(schema.webhooks.event_type, 'all')
        )
      ));
  }
  
  async createWebhook(webhook: schema.InsertWebhook): Promise<schema.Webhook> {
    const result = await this.db.insert(schema.webhooks)
      .values(webhook)
      .returning();
    
    return result[0];
  }
  
  async updateWebhook(id: number, data: Partial<schema.Webhook>): Promise<schema.Webhook | undefined> {
    const result = await this.db.update(schema.webhooks)
      .set(data)
      .where(eq(schema.webhooks.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteWebhook(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  async updateWebhookStats(id: number, success: boolean): Promise<void> {
    const webhook = await this.db.select().from(schema.webhooks).where(eq(schema.webhooks.id, id));
    
    if (webhook[0]) {
      if (success) {
        await this.db.update(schema.webhooks)
          .set({
            delivery_success_count: webhook[0].delivery_success_count + 1,
            last_triggered: new Date()
          })
          .where(eq(schema.webhooks.id, id));
      } else {
        await this.db.update(schema.webhooks)
          .set({
            delivery_failure_count: webhook[0].delivery_failure_count + 1,
            last_triggered: new Date()
          })
          .where(eq(schema.webhooks.id, id));
      }
    }
  }
  
  // Media operations
  async createMediaFile(media: schema.InsertMediaFile): Promise<schema.MediaFile> {
    const result = await this.db.insert(schema.mediaFiles)
      .values(media)
      .returning();
    
    return result[0];
  }
  
  async getMediaFilesByUserId(userId: number): Promise<schema.MediaFile[]> {
    return await this.db.select().from(schema.mediaFiles)
      .where(eq(schema.mediaFiles.user_id, userId));
  }
  
  async deleteExpiredMediaFiles(): Promise<number> {
    const now = new Date();
    const result = await this.db.delete(schema.mediaFiles)
      .where(gte(schema.mediaFiles.expires_at, now))
      .returning();
    
    return result.length;
  }
  
  // Logs operations
  async createLog(log: schema.InsertSystemLog): Promise<schema.SystemLog> {
    const result = await this.db.insert(schema.systemLogs)
      .values(log)
      .returning();
    
    return result[0];
  }
  
  async getLogs(userId: number, limit: number = 100, type?: string): Promise<schema.SystemLog[]> {
    let query = this.db.select().from(schema.systemLogs)
      .where(eq(schema.systemLogs.user_id, userId))
      .orderBy(schema.systemLogs.created_at)
      .limit(limit);
    
    if (type) {
      query = this.db.select().from(schema.systemLogs)
        .where(and(
          eq(schema.systemLogs.user_id, userId),
          eq(schema.systemLogs.type, type as any)
        ))
        .orderBy(schema.systemLogs.created_at)
        .limit(limit);
    }
    
    return await query;
  }
}

// Fallback to in-memory storage for development
export class MemStorage implements IStorage {
  private users: Map<number, schema.User>;
  private whatsappSessions: Map<string, schema.WhatsappSession>;
  private apiKeys: Map<string, schema.ApiKey>;
  private webhooks: Map<number, schema.Webhook>;
  private mediaFiles: Map<number, schema.MediaFile>;
  private logs: Map<number, schema.SystemLog>;
  
  private userId: number;
  private sessionId: number;
  private apiKeyId: number;
  private webhookId: number;
  private mediaFileId: number;
  private logId: number;
  
  constructor() {
    this.users = new Map();
    this.whatsappSessions = new Map();
    this.apiKeys = new Map();
    this.webhooks = new Map();
    this.mediaFiles = new Map();
    this.logs = new Map();
    
    this.userId = 1;
    this.sessionId = 1;
    this.apiKeyId = 1;
    this.webhookId = 1;
    this.mediaFileId = 1;
    this.logId = 1;
    
    // Add demo user
    this.users.set(1, {
      id: 1,
      email: "demo@example.com",
      name: "Demo User",
      avatar_url: null,
      created_at: new Date(),
      provider: "email",
      provider_id: null
    });
    
    // Add sample WhatsApp session
    this.whatsappSessions.set("wa_123", {
      id: 1,
      user_id: 1,
      session_id: "wa_123",
      name: "Personal WhatsApp",
      phone_number: "+1234567890",
      session_data: null,
      is_active: true,
      last_connected: new Date(),
      created_at: new Date(),
      message_count: 120
    });
    
    // Add sample API key
    this.apiKeys.set("wa_api_test1", {
      id: 1,
      user_id: 1,
      name: "Test API Key",
      key: "wa_api_test1",
      is_active: true,
      rate_limit: 60,
      expires_at: null,
      created_at: new Date(),
      request_count: 42
    });
  }
  
  // User operations
  async getUser(id: number): Promise<schema.User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(user: schema.InsertUser): Promise<schema.User> {
    const id = this.userId++;
    const newUser: schema.User = { 
      ...user, 
      id, 
      created_at: new Date(),
      name: user.name || null,
      avatar_url: null,
      provider: user.provider || 'local',
      provider_id: user.provider_id || null
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  // WhatsApp session operations
  async getWhatsappSession(sessionId: string): Promise<schema.WhatsappSession | undefined> {
    return this.whatsappSessions.get(sessionId);
  }
  
  async getWhatsappSessionsByUserId(userId: number): Promise<schema.WhatsappSession[]> {
    return Array.from(this.whatsappSessions.values())
      .filter(session => session.user_id === userId);
  }
  
  async createWhatsappSession(session: schema.InsertWhatsappSession): Promise<schema.WhatsappSession> {
    const id = this.sessionId++;
    const newSession: schema.WhatsappSession = {
      ...session,
      id,
      is_active: false,
      last_connected: null,
      created_at: new Date(),
      message_count: 0,
      phone_number: session.phone_number || null,
      session_data: session.session_data || null
    };
    this.whatsappSessions.set(session.session_id, newSession);
    return newSession;
  }
  
  async updateWhatsappSession(sessionId: string, data: Partial<schema.WhatsappSession>): Promise<schema.WhatsappSession | undefined> {
    const session = this.whatsappSessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...data };
    this.whatsappSessions.set(sessionId, updatedSession);
    return updatedSession;
  }
  
  async deleteWhatsappSession(sessionId: string): Promise<boolean> {
    return this.whatsappSessions.delete(sessionId);
  }
  
  async incrementMessageCount(sessionId: string): Promise<void> {
    const session = this.whatsappSessions.get(sessionId);
    if (session) {
      session.message_count += 1;
      this.whatsappSessions.set(sessionId, session);
    }
  }
  
  // API key operations
  async getApiKey(key: string): Promise<schema.ApiKey | undefined> {
    const apiKey = this.apiKeys.get(key);
    if (!apiKey || !apiKey.is_active) return undefined;
    if (apiKey.expires_at && apiKey.expires_at < new Date()) return undefined;
    
    return apiKey;
  }
  
  async getApiKeysByUserId(userId: number): Promise<schema.ApiKey[]> {
    return Array.from(this.apiKeys.values())
      .filter(key => key.user_id === userId);
  }
  
  async createApiKey(apiKeyData: schema.InsertApiKey, key: string): Promise<schema.ApiKey> {
    const id = this.apiKeyId++;
    const apiKey: schema.ApiKey = {
      ...apiKeyData,
      id,
      key,
      created_at: new Date(),
      request_count: 0,
      is_active: apiKeyData.is_active !== undefined ? apiKeyData.is_active : true,
      rate_limit: apiKeyData.rate_limit !== undefined ? apiKeyData.rate_limit : 60,
      expires_at: apiKeyData.expires_at || null
    };
    this.apiKeys.set(key, apiKey);
    return apiKey;
  }
  
  async revokeApiKey(id: number): Promise<boolean> {
    const apiKey = Array.from(this.apiKeys.values()).find(key => key.id === id);
    if (!apiKey) return false;
    
    apiKey.is_active = false;
    this.apiKeys.set(apiKey.key, apiKey);
    return true;
  }
  
  async incrementApiKeyUsage(key: string): Promise<void> {
    const apiKey = this.apiKeys.get(key);
    if (apiKey) {
      apiKey.request_count += 1;
      this.apiKeys.set(key, apiKey);
    }
  }
  
  // Webhook operations
  async getWebhooksByUserId(userId: number): Promise<schema.Webhook[]> {
    return Array.from(this.webhooks.values())
      .filter(webhook => webhook.user_id === userId);
  }
  
  async getWebhooksByEventType(userId: number, eventType: string): Promise<schema.Webhook[]> {
    return Array.from(this.webhooks.values())
      .filter(webhook => 
        webhook.user_id === userId && 
        webhook.is_active && 
        (webhook.event_type === eventType || webhook.event_type === 'all')
      );
  }
  
  async createWebhook(webhook: schema.InsertWebhook): Promise<schema.Webhook> {
    const id = this.webhookId++;
    const newWebhook: schema.Webhook = {
      ...webhook,
      id,
      created_at: new Date(),
      last_triggered: null,
      delivery_success_count: 0,
      delivery_failure_count: 0,
      is_active: webhook.is_active !== undefined ? webhook.is_active : true,
      custom_headers: webhook.custom_headers || null,
      secret: webhook.secret || null
    };
    this.webhooks.set(id, newWebhook);
    return newWebhook;
  }
  
  async updateWebhook(id: number, data: Partial<schema.Webhook>): Promise<schema.Webhook | undefined> {
    const webhook = this.webhooks.get(id);
    if (!webhook) return undefined;
    
    const updatedWebhook = { ...webhook, ...data };
    this.webhooks.set(id, updatedWebhook);
    return updatedWebhook;
  }
  
  async deleteWebhook(id: number): Promise<boolean> {
    return this.webhooks.delete(id);
  }
  
  async updateWebhookStats(id: number, success: boolean): Promise<void> {
    const webhook = this.webhooks.get(id);
    if (webhook) {
      if (success) {
        webhook.delivery_success_count += 1;
      } else {
        webhook.delivery_failure_count += 1;
      }
      webhook.last_triggered = new Date();
      this.webhooks.set(id, webhook);
    }
  }
  
  // Media operations
  async createMediaFile(media: schema.InsertMediaFile): Promise<schema.MediaFile> {
    const id = this.mediaFileId++;
    const newMedia: schema.MediaFile = {
      ...media,
      id,
      created_at: new Date(),
      public_url: media.public_url || null
    };
    this.mediaFiles.set(id, newMedia);
    return newMedia;
  }
  
  async getMediaFilesByUserId(userId: number): Promise<schema.MediaFile[]> {
    return Array.from(this.mediaFiles.values())
      .filter(media => media.user_id === userId);
  }
  
  async deleteExpiredMediaFiles(): Promise<number> {
    const now = new Date();
    let deleted = 0;
    
    Array.from(this.mediaFiles.entries()).forEach(([id, media]) => {
      if (media.expires_at <= now) {
        this.mediaFiles.delete(id);
        deleted++;
      }
    });
    
    return deleted;
  }
  
  // Logs operations
  async createLog(log: schema.InsertSystemLog): Promise<schema.SystemLog> {
    const id = this.logId++;
    const newLog: schema.SystemLog = {
      ...log,
      id,
      created_at: new Date(),
      user_id: log.user_id || null,
      session_id: log.session_id || null,
      details: log.details || null
    };
    this.logs.set(id, newLog);
    return newLog;
  }
  
  async getLogs(userId: number, limit: number = 100, type?: string): Promise<schema.SystemLog[]> {
    let filteredLogs = Array.from(this.logs.values())
      .filter(log => log.user_id === userId);
    
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }
    
    // Sort by created_at descending
    filteredLogs.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    
    return filteredLogs.slice(0, limit);
  }
}

// For development, we'll use in-memory storage
// Later, you can switch to PostgreSQL by uncommenting the line below
// export const storage = process.env.DATABASE_URL ? new PostgresStorage() : new MemStorage();
export const storage = new MemStorage();
