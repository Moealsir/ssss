import { storage } from './storage';
import crypto from 'crypto';
import { InsertUser } from '@shared/schema';

// Simple hash function for development without bcrypt
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export interface AuthRequestBody {
  email: string;
  password?: string;
  name?: string;
  provider?: string;
  providerId?: string;
}

export async function authenticateUser(email: string, password: string) {
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // In a real app, use the Supabase auth API directly instead of this
  // This is just a placeholder for the demo
  
  return {
    user,
    session: {
      accessToken: `token-${user.id}-${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  };
}

export async function createUser(userData: AuthRequestBody) {
  const existingUser = await storage.getUserByEmail(userData.email);
  
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  const user: InsertUser = {
    email: userData.email,
    name: userData.name || null,
    provider: userData.provider || 'email',
    provider_id: userData.providerId || null,
    avatar_url: null,
  };
  
  const createdUser = await storage.createUser(user);
  
  return {
    user: createdUser,
    session: {
      accessToken: `token-${createdUser.id}-${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  };
}

export function getAuthTokenFromRequest(req: any): string | null {
  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // No token found
  return null;
}

export async function getUserIdFromToken(token: string): Promise<number | null> {
  // In a real implementation, we would verify the JWT token
  // This is a simplified placeholder for the demo
  const parts = token.split('-');
  if (parts.length >= 2) {
    const userId = parseInt(parts[1], 10);
    if (!isNaN(userId)) {
      const user = await storage.getUser(userId);
      return user ? userId : null;
    }
  }
  return null;
}
