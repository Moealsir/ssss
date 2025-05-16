import { storage } from './storage';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { InsertMediaFile } from '@shared/schema';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);
const unlinkAsync = promisify(fs.unlink);

// Ensure storage directory exists
const MEDIA_DIR = path.join(process.cwd(), 'media');

// Initialize media storage
export async function initMediaStorage(): Promise<void> {
  try {
    if (!await existsAsync(MEDIA_DIR)) {
      await mkdirAsync(MEDIA_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to initialize media storage:', error);
    throw error;
  }
}

// Save media file from URL
export async function saveMediaFromUrl(
  userId: number,
  url: string,
  mimeType: string,
  durationHours: number = 24
): Promise<{ filePath: string; publicUrl: string }> {
  try {
    // Download the file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch media from URL: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    
    // Generate a unique filename
    const fileExtension = mimeType.split('/')[1] || 'bin';
    const fileName = `${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;
    const storagePath = path.join(MEDIA_DIR, fileName);
    
    // Ensure media directory exists
    await initMediaStorage();
    
    // Write the file
    await writeFileAsync(storagePath, Buffer.from(buffer));
    
    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);
    
    // Create a record in the database
    const mediaFile: InsertMediaFile = {
      user_id: userId,
      file_name: fileName,
      storage_path: storagePath,
      mime_type: mimeType,
      size_bytes: Buffer.from(buffer).length,
      public_url: `/api/media/${fileName}`,
      expires_at: expiresAt
    };
    
    await storage.createMediaFile(mediaFile);
    
    // Log the media creation
    await storage.createLog({
      user_id: userId,
      type: 'system',
      message: `Media file uploaded: ${fileName}`,
      details: {
        fileName,
        mimeType,
        sizeBytes: mediaFile.size_bytes,
        expiresAt: expiresAt.toISOString()
      }
    });
    
    return {
      filePath: storagePath,
      publicUrl: `/api/media/${fileName}`
    };
  } catch (error) {
    console.error('Failed to save media from URL:', error);
    throw error;
  }
}

// Get media file by filename
export async function getMediaFile(fileName: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(MEDIA_DIR, fileName);
    
    if (!await existsAsync(filePath)) {
      return null;
    }
    
    return await readFileAsync(filePath);
  } catch (error) {
    console.error('Failed to get media file:', error);
    return null;
  }
}

// Clean up expired media files
export async function cleanupExpiredMedia(): Promise<number> {
  try {
    // Get all expired media files from the database and delete them
    const deletedCount = await storage.deleteExpiredMediaFiles();
    
    // Log the cleanup
    if (deletedCount > 0) {
      await storage.createLog({
        user_id: 0, // System operation
        type: 'system',
        message: `Cleaned up ${deletedCount} expired media files`,
        details: { deletedCount }
      });
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Failed to clean up expired media:', error);
    throw error;
  }
}
