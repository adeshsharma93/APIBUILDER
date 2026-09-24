import { Router, Request, Response } from 'express';
import { apiExecutionService } from '../services/apiExecutionService';
import { getMysqlPool } from '../config/mysqlDatabase';
import { authenticateApiKey } from '../middleware/auth';

const router = Router();

/**
 * Dynamic API execution endpoint
 * This handles all published APIs: GET /api/execute/:apiId
 */
router.get('/execute/:apiId', authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const apiId = req.params.apiId as string;

  try {
    // Check API access
    if (req.apiKey.allowed_apis.length > 0 && !req.apiKey.allowed_apis.includes(apiId)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'This API key does not have access to this endpoint' },
      });
    }

    // Get API details for rate limiting
    const pool = await getMysqlPool();
    const [rows] = await pool.execute(
      'SELECT * FROM apis WHERE id = ? AND status = ?',
      [apiId, 'published']
    );
    
    const apiResult = rows as any[];

    if (apiResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'API not found or not published' },
      });
    }

    const api = apiResult[0];

    // Extract parameters from query string
    const parameters: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'page' && key !== 'pageSize') {
        parameters[key] = value;
      }
    }

    // Parse pagination params
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined;

    // Execute the API
    const result = await apiExecutionService.executeApi(apiId, parameters, page, pageSize);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('API execution error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXECUTION_ERROR', message: error.message },
    });
  }
});

/**
 * POST version for APIs that require POST
 */
router.post('/execute/:apiId', authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const apiId = req.params.apiId as string;

  try {
    // Check API access
    if (req.apiKey.allowed_apis.length > 0 && !req.apiKey.allowed_apis.includes(apiId)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'This API key does not have access to this endpoint' },
      });
    }

    // Get API details
    const pool = await getMysqlPool();
    const [rows] = await pool.execute(
      'SELECT * FROM apis WHERE id = ? AND status = ?',
      [apiId, 'published']
    );
    
    const apiResult = rows as any[];

    if (apiResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'API not found or not published' },
      });
    }

    const api = apiResult[0];

    // Extract parameters from body
    const parameters: Record<string, unknown> = req.body || {};

    // Execute the API
    const result = await apiExecutionService.executeApi(apiId, parameters);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('API execution error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXECUTION_ERROR', message: error.message },
    });
  }
});

/**
 * Get all published APIs (for documentation)
 */
router.get('/apis', async (req: Request, res: Response) => {
  try {
    const projectId = req.query.project_id as string;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETER', message: 'project_id is required' },
      });
    }

    const pool = await getMysqlPool();
    const [rows] = await pool.execute(
      `SELECT a.*, q.sql_text, q.parameters as query_parameters
       FROM apis a
       JOIN sql_queries q ON a.query_id = q.id
       WHERE a.project_id = ? AND a.status = ?
       ORDER BY a.created_at DESC`,
      [projectId, 'published']
    );
    
    const result = rows as any[];

    const apis = result.map((api: any) => ({
      ...api,
      parameters: JSON.parse(api.query_parameters || '[]'),
    }));

    res.json({ success: true, data: apis });
  } catch (error: any) {
    console.error('Get APIs error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch APIs' },
    });
  }
});

export default router;
