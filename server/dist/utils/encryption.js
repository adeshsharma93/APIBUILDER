"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.encryptCredential = encryptCredential;
exports.decryptCredential = decryptCredential;
exports.testDecryption = testDecryption;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateApiKey = generateApiKey;
exports.hashApiKey = hashApiKey;
exports.verifyApiKey = verifyApiKey;
const crypto_1 = __importDefault(require("crypto"));
// Encryption key from environment (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-prod!';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
// Ensure key is exactly 32 bytes
const key = crypto_1.default.scryptSync(ENCRYPTION_KEY, 'salt', 32);
/**
 * Encrypt a credential (password, API key, etc.)
 * Returns: iv:authTag:encrypted (all base64 encoded)
 */
function encrypt(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Cannot encrypt empty or invalid text');
    }
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    // Format: iv:authTag:encrypted
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}
/**
 * Decrypt a credential
 */
function decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'string') {
        throw new Error('Cannot decrypt empty or invalid data');
    }
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }
    const [ivBase64, authTagBase64, encrypted] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Encrypt a credential (password, API key, etc.) - legacy alias
 * Returns: iv:authTag:encrypted (all base64 encoded)
 */
function encryptCredential(plaintext) {
    return encrypt(plaintext);
}
/**
 * Decrypt a credential - legacy alias
 */
async function decryptCredential(encryptedData) {
    return decrypt(encryptedData);
}
/**
 * Test if a credential can be decrypted with the current key
 * Useful for checking if credentials need to be re-encrypted
 */
async function testDecryption(encryptedData) {
    try {
        await decryptCredential(encryptedData);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
    const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}
/**
 * Verify a password against a hash
 */
async function verifyPassword(password, hash) {
    const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
    return bcrypt.compare(password, hash);
}
/**
 * Generate a secure API key
 */
function generateApiKey() {
    return `sk_live_${crypto_1.default.randomBytes(32).toString('base64url')}`;
}
/**
 * Hash an API key for storage
 */
async function hashApiKey(apiKey) {
    const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(apiKey, salt);
}
/**
 * Verify an API key against a hash
 */
async function verifyApiKey(apiKey, hash) {
    const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
    return bcrypt.compare(apiKey, hash);
}
//# sourceMappingURL=encryption.js.map