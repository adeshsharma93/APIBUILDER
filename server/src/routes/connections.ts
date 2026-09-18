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
    // Accept both field name formats for flexibility
    const { 
      project_id, 
      name, 
      type, 
      host, 
      port, 
      database_name,
      database,  // Alternative field name
      username, 
      password, 
      ssl_enabled,
      ssl,  // Alternative field name
      connection_timeout,
      timeout  // Alternative field name
    } = req.body;

    // Use default project_id if not provided
    const finalProjectId = project_id || 'default-project';
    const finalDatabaseName = database_name || database;
    const finalSsl = ssl_enabled !== undefined ? ssl_enabled : (ssl !== undefined ? ssl : true);
    const finalTimeout = connection_timeout || timeout || 30;

    if (!name || !host || !finalDatabaseName || !username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETER', message: 'Missing required fields: name, host, database, username, password' },
      });
    }

    // Ensure default project exists
    try {
      const { getAppDbPool } = await import('../config/database');
      const pool = await getAppDbPool();
      await pool.request()
        .input('project_id', finalProjectId)
        .input('name', 'Default Project')
        .input('owner_id', 'default-user')
        .query(`
          IF NOT EXISTS (SELECT 1 FROM projects WHERE id = @project_id)
          INSERT INTO projects (id, name, owner_id) VALUES (@project_id, @name, @owner_id)
        `);
    } catch (err) {
      console.log('Note: Could not create default project (may already exist)');
    }

    const connection = await databaseConnectionService.createConnection({
      project_id: finalProjectId,
      name,
      type: type || 'mysql',
      host,
      port: port || (type === 'mysql' ? 3306 : 1433),
      database_name: finalDatabaseName,
      username,
      password,
      ssl_enabled: finalSsl,
      connection_timeout: finalTimeout,
    });

    res.status(201).json({ success: true, connection });
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
    const { dbType } = req.query;
    const type = (dbType as string) || 'mysql';
    
    const result = await databaseConnectionService.testConnection(req.params.id, type as 'mysql' | 'sqlserver');
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
