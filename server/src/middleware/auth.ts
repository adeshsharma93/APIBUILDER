import { Request, Response, NextFunction } from 'express';
import * as mssql from 'mssql';
import { ApiKeyService } from '../services/apiKeyService';

const apiKeyService = new ApiKeyService();

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
          message: 'Invalid API key',
        },
      });
    }

    req.apiKey = result.apiKey!;
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
        const { getMysqlPool } = await import('../config/mysqlDatabase');
        const pool = await getMysqlPool();
        
        // Log to MySQL database
        const values: (string | number | null)[] = [
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
        
        await pool.execute(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          values
        );
      } catch (error) {
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
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // For now, allow all requests - implement proper JWT auth later
  // This is a placeholder for user authentication
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For development, allow requests without token
    // In production, this should return 401
    (req as any).user = { id: 1 }; // Default user for development
    return next();
  }
  
  const token = authHeader.substring(7);
  
  try {
    // TODO: Implement proper JWT verification
    // For now, just extract user ID from token (in real app, verify JWT signature)
    (req as any).user = { id: 1, token };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  }
}
