import { Router, Request, Response } from 'express';
import connectionService from '../services/connectionService';
import { authenticateToken } from '../middleware/auth';
import { decrypt } from '../utils/encryption';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/connections
 * Get all database connections for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
    }

    const connections = await connectionService.getAllConnections(userId);
    res.json({ success: true, data: connections });
  } catch (error: any) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch connections' },
    });
  }
});

/**
 * POST /api/connections
 * Create a new database connection
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
    }

    const { name, type, host, port, database_name, username, password, is_default } = req.body;

    if (!name || !type || !username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETER', message: 'Missing required fields: name, type, username, password' },
      });
    }

    const connection = await connectionService.createConnection({
      user_id: userId,
      name,
      type: type || 'sqlserver',
      host: host || 'localhost',
      port: port || (type === 'mysql' ? 3306 : 1433),
      database_name: database_name || '',
      username,
      password_encrypted: password,
      is_default: is_default || false,
    });

    res.status(201).json({ success: true, data: connection });
  } catch (error: any) {
    console.error('Create connection error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to create connection' },
    });
  }
});

/**
 * GET /api/connections/:id
 * Get a single connection
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
    }

    const connection = await connectionService.getConnectionById(parseInt(req.params.id), userId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Connection not found' },
      });
    }
    res.json({ success: true, data: connection });
  } catch (error: any) {
    console.error('Get connection error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch connection' },
    });
  }
});

/**
 * POST /api/connections/:id/test
 * Test a database connection
 */
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
    }

    const connection = await connectionService.getConnectionById(parseInt(req.params.id), userId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Connection not found' },
      });
    }

    // Import testConnection from database config
    const { testConnection } = await import('../config/database');
    
    const result = await testConnection({
      host: connection.host || 'localhost',
      port: connection.port || (connection.type === 'mysql' ? 3306 : 1433),
      database: connection.database_name || '',
      username: connection.username || '',
      password: decrypt(connection.password_encrypted),
      ssl: connection.ssl_enabled || false,
      type: connection.type,
    });

    if (!result) {
      return res.status(400).json({
        success: false,
        error: { code: 'CONNECTION_FAILED', message: 'Connection test failed' },
      });
    }
    res.json({ success: true, message: 'Connection test successful' });
  } catch (error: any) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to test connection' },
    });
  }
});

/**
 * PUT /api/connections/:id
 * Update a connection
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
    }

    const updates = req.body;
    const connection = await connectionService.updateConnection(parseInt(req.params.id), userId, updates);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Connection not found' },
      });
    }
    
    res.json({ success: true, data: connection });
  } catch (error: any) {
    console.error('Update connection error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update connection' },
    });
  }
});

/**
 * DELETE /api/connections/:id
 * Delete a connection
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
    }

    const deleted = await connectionService.deleteConnection(parseInt(req.params.id), userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Connection not found' },
      });
    }
    res.json({ success: true, message: 'Connection deleted' });
  } catch (error: any) {
    console.error('Delete connection error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete connection' },
    });
  }
});

export default router;
