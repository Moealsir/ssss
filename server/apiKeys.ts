import { storage } from './storage';
import crypto from 'crypto';
import { InsertApiKey } from '@shared/schema';

// Generate a secure API key
export function generateApiKey(): string {
  return `wa_api_${crypto.randomBytes(16).toString('hex')}`;
}

// Create a new API key
export async function createApiKey(
  userId: number, 
  name: string, 
  rateLimit: number = 60, 
  expiresAt?: Date
): Promise<string> {
  // Generate a new key
  const key = generateApiKey();
  
  // Create the API key in storage
  const apiKeyData: InsertApiKey = {
    user_id: userId,
    name,
    rate_limit: rateLimit,
    is_active: true,
    expires_at: expiresAt
  };
  
  await storage.createApiKey(apiKeyData, key);
  
  // Log the creation
  await storage.createLog({
    user_id: userId,
    type: 'system',
    message: `API key created: ${name}`,
    details: {
      name,
      rateLimit,
      expiresAt: expiresAt?.toISOString()
    }
  });
  
  return key;
}

// Verify API key and apply rate limiting
export async function verifyApiKey(key: string): Promise<{ valid: boolean; userId?: number; error?: string }> {
  // Get the API key from storage
  const apiKey = await storage.getApiKey(key);
  
  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }
  
  if (!apiKey.is_active) {
    return { valid: false, error: 'API key is not active' };
  }
  
  if (apiKey.expires_at && apiKey.expires_at < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }
  
  // Simple rate limiting - in a real app, this would use Redis or another cache system
  // Here we're just incrementing the usage count
  await storage.incrementApiKeyUsage(key);
  
  return { valid: true, userId: apiKey.user_id };
}

// Revoke an API key
export async function revokeApiKey(userId: number, keyId: number): Promise<boolean> {
  // Check if the API key exists and belongs to the user
  const apiKeys = await storage.getApiKeysByUserId(userId);
  const apiKey = apiKeys.find(k => k.id === keyId);
  
  if (!apiKey) {
    return false;
  }
  
  // Revoke the key
  const success = await storage.revokeApiKey(keyId);
  
  if (success) {
    // Log the revocation
    await storage.createLog({
      user_id: userId,
      type: 'system',
      message: `API key revoked: ${apiKey.name}`,
      details: {
        keyId,
        name: apiKey.name
      }
    });
  }
  
  return success;
}
