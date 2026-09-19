import crypto from 'crypto';

// Encryption key from environment (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-prod!';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Ensure key is exactly 32 bytes
const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

/**
 * Encrypt a credential (password, API key, etc.)
 * Returns: iv:authTag:encrypted (all base64 encoded)
 */
export function encryptCredential(plaintext: string): string {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Cannot encrypt empty or invalid plaintext');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  const result = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  
  // Validate the result can be decrypted
  try {
    const parts = result.split(':');
    if (parts.length !== 3) {
      throw new Error('Encryption produced invalid format');
    }
  } catch (error) {
    throw new Error('Encryption validation failed');
  }

  return result;
}

/**
 * Test if a credential can be decrypted with the current key
 * Useful for checking if credentials need to be re-encrypted
 */
export async function testDecryption(encryptedData: string): Promise<boolean> {
  try {
    await decryptCredential(encryptedData);
    return true;
  } catch {
    return false;
  }
}

/**
 * Decrypt a credential
 * Input format: iv:authTag:encrypted (all base64 encoded)
 */
export function decryptCredential(encryptedData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Validate input format
      if (!encryptedData || typeof encryptedData !== 'string') {
        throw new Error('Encrypted data is empty or invalid');
      }

      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error(`Invalid encrypted data format. Expected 3 parts (iv:authTag:encrypted), got ${parts.length}`);
      }

      const [ivBase64, authTagBase64, encrypted] = parts;

      // Validate base64 encoding
      if (!ivBase64 || !authTagBase64 || !encrypted) {
        throw new Error('One or more parts of encrypted data are empty');
      }

      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      // Validate buffer lengths
      if (iv.length !== IV_LENGTH) {
        throw new Error(`Invalid IV length. Expected ${IV_LENGTH}, got ${iv.length}`);
      }

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      resolve(decrypted);
    } catch (error: any) {
      // Provide detailed error message
      const errorMessage = error.message || 'Unknown error';
      console.error('❌ Decryption failed:', errorMessage);
      console.error('   This usually means:');
      console.error('   1. The ENCRYPTION_KEY in .env has changed since the credential was encrypted');
      console.error('   2. The encrypted data is corrupted');
      console.error('   3. The credential was encrypted with a different key');
      console.error('');
      console.error('💡 Solution: Delete the connection and create a new one with the current ENCRYPTION_KEY');
      reject(new Error(`Failed to decrypt credential: ${errorMessage}`));
    }
  });
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure API key
 */
export function generateApiKey(): string {
  return `sk_live_${crypto.randomBytes(32).toString('base64url')}`;
}

/**
 * Hash an API key for storage
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(apiKey, salt);
}

/**
 * Verify an API key against a hash
 */
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(apiKey, hash);
}
