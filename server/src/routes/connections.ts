import { Router, Request, Response } from 'express';
import connectionService from '../services/connectionService';
import { authenticateToken } from '../middleware/auth';
import { decrypt } from '../utils/encryption';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/connections
 * Get all database connections for the authenticated user's project
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = (req as any).user?.projectId;
    if (!projectId) {
      // For backward compatibility, try to get from query param
      const projectIdParam = req.query.projectId as string;
      if (!projectIdParam) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Project ID not found' },
        });
      }
      return await getConnections(req, res, projectIdParam);
    }
    await getConnections(req, res, projectId);
  } catch (error: any) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch connections' },
    });
  }
});

async function getConnections(req: Request, res: Response, projectId: string) {
  const connections = await connectionService.getAllConnections(projectId);
  res.json({ success: true, data: connections });
}

/**
 * POST /api/connections
 * Create a new database connection
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const projectId = (req as any).user?.projectId || req.body.project_id;
    if (!projectId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Project ID required' },
      });
    }

    const { name, type, host, port, database_name, username, password, ssl_enabled, connection_timeout } = req.body;

    if (!name || !type || !host || !username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETER', message: 'Missing required fields: name, type, host, username, password' },
      });
    }

    // For MySQL connections, database_name is required
    if (type === 'mysql' && !database_name) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETER', message: 'Database name is required for MySQL connections' },
      });
    }

    const connection = await connectionService.createConnection({
      project_id: projectId,
      name,
      type: type || 'mysql',
      host: host || 'localhost',
      port: port || (type === 'mysql' ? 3306 : 1433),
      database_name: database_name || '',
      username,
      password_encrypted: password,
      ssl_enabled: ssl_enabled || false,
      connection_timeout: connection_timeout || 30,
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
    const projectId = (req as any).user?.projectId;
    if (!projectId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Project ID not found' },
      });
    }

    const connection = await connectionService.getConnectionById(req.params.id as string, projectId);
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
    const projectId = (req as any).user?.projectId;
    if (!projectId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Project ID not found' },
      });
    }

    const connection = await connectionService.getConnectionById(req.params.id as string, projectId);
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
    
    // Update connection status
    await connectionService.updateConnection(req.params.id as string, projectId, {
      status: 'connected',
      last_tested_at: new Date(),
    });
    
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
    const projectId = (req as any).user?.projectId;
    if (!projectId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Project ID not found' },
      });
    }

    const updates = req.body;
    const connection = await connectionService.updateConnection(req.params.id as string, projectId, updates);
    
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
    const projectId = (req as any).user?.projectId;
    if (!projectId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Project ID not found' },
      });
    }

    const deleted = await connectionService.deleteConnection(req.params.id as string, projectId);
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
