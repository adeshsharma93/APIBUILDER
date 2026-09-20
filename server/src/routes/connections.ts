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
      projectName,  // Project name from frontend
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

    const finalDatabaseName = database_name || database;
    const finalSsl = ssl_enabled !== undefined ? ssl_enabled : (ssl !== undefined ? ssl : true);
    const finalTimeout = connection_timeout || timeout || 30;

    if (!name || !host || !finalDatabaseName || !username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETER', message: 'Missing required fields: name, host, database, username, password' },
      });
    }

    // Get or create project
    let finalProjectId = project_id;
    
    // First, ensure default system user exists
    const { getMysqlPool } = await import('../config/mysqlDatabase');
    const pool = await getMysqlPool();
    const { v4: uuidv4 } = await import('uuid');
    const { hashPassword } = await import('../utils/encryption');
    
    const defaultUserId = '00000000-0000-0000-0000-000000000000';
    
    // Check if default user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [defaultUserId]
    );
    
    if ((existingUsers as any[]).length === 0) {
      // Create default system user
      const defaultPasswordHash = await hashPassword('system-default-password');
      await pool.execute(
        'INSERT INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [defaultUserId, 'system@sqlapi.dev', defaultPasswordHash, 'System User', 'admin', true]
      );
      console.log(`✅ Created default system user: ${defaultUserId}`);
    }
    
    if (!finalProjectId && projectName) {
      // Try to find existing project by name
      const [existingProjects] = await pool.execute(
        'SELECT id FROM projects WHERE name = ?',
        [projectName]
      );
      
      if ((existingProjects as any[]).length > 0) {
        // Use existing project
        finalProjectId = (existingProjects as any[])[0].id;
        console.log(`✅ Using existing project: ${projectName} (${finalProjectId})`);
      } else {
        // Create new project
        finalProjectId = uuidv4();
        
        await pool.execute(
          'INSERT INTO projects (id, name, owner_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [finalProjectId, projectName, defaultUserId]
        );
        
        console.log(`✅ Created new project: ${projectName} (${finalProjectId})`);
      }
    } else if (!finalProjectId) {
      // Use default project if no projectName provided
      finalProjectId = 'default-project';
      
      // Ensure default project exists
      try {
        const [existingProjects] = await pool.execute(
          'SELECT id FROM projects WHERE id = ?',
          [finalProjectId]
        );
        
        if ((existingProjects as any[]).length === 0) {
          await pool.execute(
            'INSERT INTO projects (id, name, owner_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [finalProjectId, 'Default Project', defaultUserId]
          );
          console.log(`✅ Created default project`);
        }
      } catch (err) {
        console.log('Note: Could not create default project (may already exist)');
      }
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
