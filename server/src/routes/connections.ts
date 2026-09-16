import { Router, Request, Response } from 'express';
import { databaseConnectionService } from '../services/databaseConnectionService';
import { authenticateApiKey } from '../middleware/auth';

const router = Router();

/**
 * GET /api/connections
 * Get all database connections for a project
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.query.project_id as string;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETER', message: 'project_id is required' },
      });
    }

    const connections = await databaseConnectionService.getConnections(projectId);
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
    const { project_id, name, type, host, port, database_name, username, password, ssl_enabled, connection_timeout } = req.body;

    if (!project_id || !name || !host || !database_name || !username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETER', message: 'Missing required fields' },
      });
    }

    const connection = await databaseConnectionService.createConnection({
      project_id,
      name,
      type: type || 'sqlserver',
      host,
      port: port || 1433,
      database_name,
      username,
      password,
      ssl_enabled: ssl_enabled !== false,
      connection_timeout: connection_timeout || 30,
    });

    res.status(201).json({ success: true, data: connection });
  } catch (error: any) {
    console.error('Create connection error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create connection' },
    });
  }
});

/**
 * GET /api/connections/:id
 * Get a single connection
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const connection = await databaseConnectionService.getConnection(req.params.id);
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
    const result = await databaseConnectionService.testConnection(req.params.id);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'CONNECTION_FAILED', message: result.error || 'Connection test failed' },
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
 * DELETE /api/connections/:id
 * Delete a connection
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await databaseConnectionService.deleteConnection(req.params.id);
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
