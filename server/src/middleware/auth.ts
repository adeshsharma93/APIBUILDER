import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../services/apiKeyService';

// Extend Express Request to include authenticated user/api key
declare global {
  namespace Express {
    interface Request {
      apiKey?: any;
      userId?: string;
    }
  }
}

/**
 * Middleware to authenticate API requests using API keys
 */
export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
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
          message: result.error || 'Invalid API key',
        },
      });
    }

    req.apiKey = result.apiKey;
    next();
  } catch (error) {
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
export function checkApiAccess(apiId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
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
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

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

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
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
export async function auditLog(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;

  res.send = function (body: any) {
    // Log after response is sent
    setImmediate(async () => {
      try {
        const { getAppDbPool } = await import('../config/database');
        const pool = await getAppDbPool();

        await pool.request()
          .input('user_id', req.userId || null)
          .input('action', `${req.method} ${req.path}`)
          .input('entity_type', 'api_request')
          .input('entity_id', null)
          .input('details', JSON.stringify({
            endpoint: req.path,
            method: req.method,
            status: res.statusCode,
            ip: req.ip,
          }))
          .input('ip_address', req.ip)
          .input('user_agent', req.get('user-agent'))
          .query(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
            VALUES (@user_id, @action, @entity_type, @entity_id, @details, @ip_address, @user_agent)
          `);
      } catch (error) {
        console.error('Audit log error:', error);
      }
    });

    return originalSend.call(this, body);
  };

  next();
}
