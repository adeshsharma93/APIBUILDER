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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiKey = authenticateApiKey;
exports.checkApiAccess = checkApiAccess;
exports.rateLimit = rateLimit;
exports.auditLog = auditLog;
exports.authenticateToken = authenticateToken;
const apiKeyService_1 = require("../services/apiKeyService");
const apiKeyService = new apiKeyService_1.ApiKeyService();
/**
 * Middleware to authenticate API requests using API keys
 */
async function authenticateApiKey(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Missing or invalid Authorization header. Expected: Bearer <API_KEY>',
            },
        });
    }
    const apiKey = authHeader.substring(7); // Remove 'Bearer '
    try {
        const result = await apiKeyService.verifyApiKey(apiKey);
        if (!result.valid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid API key',
                },
            });
        }
        req.apiKey = result.apiKey;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Authentication failed',
            },
        });
    }
}
/**
 * Middleware to check if API key has access to a specific API
 */
function checkApiAccess(apiId) {
    return async (req, res, next) => {
        if (!req.apiKey) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Not authenticated',
                },
            });
        }
        const hasAccess = await apiKeyService.hasAccessToApi(req.apiKey.id, apiId);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'This API key does not have access to this endpoint',
                },
            });
        }
        next();
    };
}
/**
 * Simple rate limiter using in-memory storage
 * For production, use Redis or similar
 */
const rateLimitStore = new Map();
// Cleanup expired rate limit entries every minute to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
            rateLimitStore.delete(key);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired rate limit entries`);
    }
}, 60000); // Clean up every 60 seconds
function rateLimit(maxRequests, windowMs) {
    return (req, res, next) => {
        const key = req.apiKey?.id || req.ip;
        const now = Date.now();
        let record = rateLimitStore.get(key);
        if (!record || now > record.resetTime) {
            record = { count: 0, resetTime: now + windowMs };
            rateLimitStore.set(key, record);
        }
        record.count++;
        if (record.count > maxRequests) {
            return res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000} seconds`,
                },
            });
        }
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
        next();
    };
}
/**
 * Audit logging middleware
 */
async function auditLog(req, res, next) {
    const originalSend = res.send;
    res.send = function (body) {
        // Log after response is sent
        setImmediate(async () => {
            try {
                const { getMysqlPool } = await Promise.resolve().then(() => __importStar(require('../config/mysqlDatabase')));
                const pool = await getMysqlPool();
                // Log to MySQL database
                const values = [
                    req.userId || null,
                    `${req.method} ${req.path}`,
                    'api_request',
                    null,
                    JSON.stringify({
                        endpoint: req.path,
                        method: req.method,
                        status: res.statusCode,
                        ip: req.ip,
                    }),
                    req.ip || '',
                    req.get('user-agent') || ''
                ];
                await pool.execute(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`, values);
            }
            catch (error) {
                console.error('Audit log error:', error);
            }
        });
        return originalSend.call(this, body);
    };
    next();
}
/**
 * Middleware to authenticate user token (JWT)
 */
async function authenticateToken(req, res, next) {
    // For now, allow all requests - implement proper JWT auth later
    // This is a placeholder for user authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // For development, allow requests without token
        // In production, this should return 401
        req.user = { id: 1, projectId: 'default-project-id' }; // Default user and project for development
        return next();
    }
    const token = authHeader.substring(7);
    try {
        // TODO: Implement proper JWT verification
        // For now, just extract user ID from token (in real app, verify JWT signature)
        req.user = { id: 1, projectId: 'default-project-id', token };
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
        });
    }
}
//# sourceMappingURL=auth.js.map