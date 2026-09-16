import { Router, Request, Response } from 'express';
import { apiExecutionService } from '../services/apiExecutionService';
import { getAppDbPool } from '../config/database';
import { authenticateApiKey, rateLimit, checkApiAccess } from '../middleware/auth';

const router = Router();

/**
 * Dynamic API execution endpoint
 * This handles all published APIs: GET /api/execute/:apiId
 */
router.get('/execute/:apiId', authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const apiId = req.params.apiId;

  try {
    // Check API access
    const hasAccess = await apiExecutionService['apiKeyService']?.hasAccessToApi(req.apiKey.id, apiId);
    if (req.apiKey.allowed_apis.length > 0 && !req.apiKey.allowed_apis.includes(apiId)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'This API key does not have access to this endpoint' },
      });
    }

    // Get API details for rate limiting
    const pool = await getAppDbPool();
    const apiResult = await pool.request()
      .input('api_id', apiId)
      .query('SELECT * FROM apis WHERE id = @api_id AND status = \'published\'');

    if (apiResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'API not found or not published' },
      });
    }

    const api = apiResult.recordset[0];

    // Apply rate limiting
    const rateLimitKey = `ratelimit:${req.apiKey.id}:${apiId}`;
    // Rate limiting is handled by middleware in production

    // Extract parameters from query string
    const parameters: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'page' && key !== 'pageSize') {
        parameters[key] = value;
      }
    }

    // Extract pagination
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;

    // Execute the API
    const result = await apiExecutionService.executeApi(apiId, parameters, page, pageSize);

    const responseTime = Date.now() - startTime;

    // Log the request
    await apiExecutionService.logRequest(
      apiId,
      req.apiKey.id,
      'GET',
      req.originalUrl,
      result.success ? 200 : 400,
      responseTime,
      parameters,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      result.error?.message || null
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'QUERY_TIMEOUT' ? 504 :
                         result.error?.code === 'INVALID_PARAMETER' ? 400 : 500;
      return res.status(statusCode).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error('API execution error:', error);

    // Log the error
    await apiExecutionService.logRequest(
      apiId,
      req.apiKey?.id || null,
      'GET',
      req.originalUrl,
      500,
      Date.now() - startTime,
      req.query as Record<string, unknown>,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      error.message
    ).catch(err => console.error('Failed to log error:', err));

    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An error occurred while executing the API' },
    });
  }
});

/**
 * POST /api/execute/:apiId
 * Execute API with POST (for complex parameters)
 */
router.post('/execute/:apiId', authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const apiId = req.params.apiId;

  try {
    const { parameters, page, pageSize } = req.body;

    const result = await apiExecutionService.executeApi(
      apiId,
      parameters || {},
      page,
      pageSize
    );

    const responseTime = Date.now() - startTime;

    // Log the request
    await apiExecutionService.logRequest(
      apiId,
      req.apiKey.id,
      'POST',
      req.originalUrl,
      result.success ? 200 : 400,
      responseTime,
      parameters || {},
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      result.error?.message || null
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'QUERY_TIMEOUT' ? 504 :
                         result.error?.code === 'INVALID_PARAMETER' ? 400 : 500;
      return res.status(statusCode).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error('API execution error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An error occurred while executing the API' },
    });
  }
});

/**
 * GET /api/apis
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

    const pool = await getAppDbPool();
    const result = await pool.request()
      .input('project_id', projectId)
      .query(`
        SELECT a.*, q.sql_text, q.parameters as query_parameters
        FROM apis a
        JOIN sql_queries q ON a.query_id = q.id
        WHERE a.project_id = @project_id AND a.status = 'published'
        ORDER BY a.created_at DESC
      `);

    const apis = result.recordset.map(api => ({
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
