import { Request, Response, NextFunction } from 'express';
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
export declare function authenticateApiKey(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to check if API key has access to a specific API
 */
export declare function checkApiAccess(apiId: string): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function rateLimit(maxRequests: number, windowMs: number): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Audit logging middleware
 */
export declare function auditLog(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Middleware to authenticate user token (JWT)
 */
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.d.ts.map