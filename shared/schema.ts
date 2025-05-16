import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatar_url: text("avatar_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  provider: text("provider").default("email").notNull(), // 'email' or 'google'
  provider_id: text("provider_id"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// WhatsApp sessions
export const whatsappSessions = pgTable("whatsapp_sessions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  session_id: text("session_id").notNull().unique(),
  name: text("name").notNull(),
  phone_number: text("phone_number"),
  session_data: text("session_data"), // encrypted session data
  is_active: boolean("is_active").default(false).notNull(),
  last_connected: timestamp("last_connected"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  message_count: integer("message_count").default(0).notNull(),
});

export const insertWhatsappSessionSchema = createInsertSchema(whatsappSessions).omit({
  id: true,
  created_at: true,
  last_connected: true,
  message_count: true,
});
export type InsertWhatsappSession = z.infer<typeof insertWhatsappSessionSchema>;
export type WhatsappSession = typeof whatsappSessions.$inferSelect;

// API keys
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  is_active: boolean("is_active").default(true).notNull(),
  rate_limit: integer("rate_limit").default(60).notNull(), // requests per minute
  expires_at: timestamp("expires_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  request_count: integer("request_count").default(0).notNull(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  key: true,
  created_at: true,
  request_count: true,
});
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// Webhook configurations
export const webhookEventTypeEnum = pgEnum('webhook_event_type', [
  'message_received',
  'message_delivered',
  'message_read',
  'all'
]);

export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  event_type: webhookEventTypeEnum("event_type").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  custom_headers: json("custom_headers").$type<Record<string, string>>(),
  secret: text("secret"), // for HMAC signing
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_triggered: timestamp("last_triggered"),
  delivery_success_count: integer("delivery_success_count").default(0).notNull(),
  delivery_failure_count: integer("delivery_failure_count").default(0).notNull(),
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  created_at: true,
  last_triggered: true,
  delivery_success_count: true,
  delivery_failure_count: true,
});
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;

// Media files
export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  file_name: text("file_name").notNull(),
  storage_path: text("storage_path").notNull(),
  mime_type: text("mime_type").notNull(),
  size_bytes: integer("size_bytes").notNull(),
  public_url: text("public_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  expires_at: timestamp("expires_at").notNull(),
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({
  id: true,
  created_at: true,
});
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;
export type MediaFile = typeof mediaFiles.$inferSelect;

// System logs
export const logTypeEnum = pgEnum('log_type', [
  'message',
  'api_call',
  'connection',
  'webhook',
  'error',
  'system'
]);

export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  session_id: text("session_id"),
  type: logTypeEnum("type").notNull(),
  message: text("message").notNull(),
  details: json("details").$type<Record<string, any>>(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  created_at: true,
});
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;

// API request schemas
export const sendMessageSchema = z.object({
  sessionId: z.string(),
  to: z.string(),
  text: z.string(),
});
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;

export const sendMediaSchema = z.object({
  sessionId: z.string(),
  to: z.string(),
  mediaUrl: z.string().url(),
  caption: z.string().optional(),
});
export type SendMediaRequest = z.infer<typeof sendMediaSchema>;

export const replyMessageSchema = z.object({
  sessionId: z.string(),
  messageId: z.string(),
  text: z.string(),
});
export type ReplyMessageRequest = z.infer<typeof replyMessageSchema>;

export const sendGroupMessageSchema = z.object({
  sessionId: z.string(),
  groupId: z.string(),
  text: z.string(),
});
export type SendGroupMessageRequest = z.infer<typeof sendGroupMessageSchema>;
