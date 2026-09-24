/**
 * Encrypt a credential (password, API key, etc.)
 * Returns: iv:authTag:encrypted (all base64 encoded)
 */
export declare function encrypt(text: string): string;
/**
 * Decrypt a credential
 */
export declare function decrypt(encryptedData: string): string;
/**
 * Encrypt a credential (password, API key, etc.) - legacy alias
 * Returns: iv:authTag:encrypted (all base64 encoded)
 */
export declare function encryptCredential(plaintext: string): string;
/**
 * Decrypt a credential - legacy alias
 */
export declare function decryptCredential(encryptedData: string): Promise<string>;
/**
 * Test if a credential can be decrypted with the current key
 * Useful for checking if credentials need to be re-encrypted
 */
export declare function testDecryption(encryptedData: string): Promise<boolean>;
/**
 * Hash a password using bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verify a password against a hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Generate a secure API key
 */
export declare function generateApiKey(): string;
/**
 * Hash an API key for storage
 */
export declare function hashApiKey(apiKey: string): Promise<string>;
/**
 * Verify an API key against a hash
 */
export declare function verifyApiKey(apiKey: string, hash: string): Promise<boolean>;
//# sourceMappingURL=encryption.d.ts.map