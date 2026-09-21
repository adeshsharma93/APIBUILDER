"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const apiExecutionService_1 = require("../services/apiExecutionService");
const mysqlDatabase_1 = require("../config/mysqlDatabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * Dynamic API execution endpoint
 * This handles all published APIs: GET /api/execute/:apiId
 */
router.get('/execute/:apiId', auth_1.authenticateApiKey, async (req, res) => {
    const startTime = Date.now();
    const apiId = req.params.apiId;
    try {
        // Check API access
        if (req.apiKey.allowed_apis.length > 0 && !req.apiKey.allowed_apis.includes(apiId)) {
            return res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'This API key does not have access to this endpoint' },
            });
        }
        // Get API details for rate limiting
        const pool = await (0, mysqlDatabase_1.getMysqlPool)();
        const [rows] = await pool.execute('SELECT * FROM apis WHERE id = ? AND status = ?', [apiId, 'published']);
        const apiResult = rows;
        if (apiResult.length === 0) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'API not found or not published' },
            });
        }
        const api = apiResult[0];
        // Extract parameters from query string
        const parameters = {};
        for (const [key, value] of Object.entries(req.query)) {
            if (key !== 'page' && key !== 'pageSize') {
                parameters[key] = value;
            }
        }
        // Parse pagination params
        const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
        // Execute the API
        const result = await apiExecutionService_1.apiExecutionService.executeApi(apiId, parameters, page, pageSize);
        const responseTime = Date.now() - startTime;
        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination,
        });
    }
    catch (error) {
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
router.post('/execute/:apiId', auth_1.authenticateApiKey, async (req, res) => {
    const startTime = Date.now();
    const apiId = req.params.apiId;
    try {
        // Check API access
        if (req.apiKey.allowed_apis.length > 0 && !req.apiKey.allowed_apis.includes(apiId)) {
            return res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'This API key does not have access to this endpoint' },
            });
        }
        // Get API details
        const pool = await (0, mysqlDatabase_1.getMysqlPool)();
        const [rows] = await pool.execute('SELECT * FROM apis WHERE id = ? AND status = ?', [apiId, 'published']);
        const apiResult = rows;
        if (apiResult.length === 0) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'API not found or not published' },
            });
        }
        const api = apiResult[0];
        // Extract parameters from body
        const parameters = req.body || {};
        // Execute the API
        const result = await apiExecutionService_1.apiExecutionService.executeApi(apiId, parameters);
        const responseTime = Date.now() - startTime;
        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination,
        });
    }
    catch (error) {
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
router.get('/apis', async (req, res) => {
    try {
        const projectId = req.query.project_id;
        if (!projectId) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_PARAMETER', message: 'project_id is required' },
            });
        }
        const pool = await (0, mysqlDatabase_1.getMysqlPool)();
        const [rows] = await pool.execute(`SELECT a.*, q.sql_text, q.parameters as query_parameters
       FROM apis a
       JOIN sql_queries q ON a.query_id = q.id
       WHERE a.project_id = ? AND a.status = ?
       ORDER BY a.created_at DESC`, [projectId, 'published']);
        const result = rows;
        const apis = result.map((api) => ({
            ...api,
            parameters: JSON.parse(api.query_parameters || '[]'),
        }));
        res.json({ success: true, data: apis });
    }
    catch (error) {
        console.error('Get APIs error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch APIs' },
        });
    }
});
exports.default = router;
//# sourceMappingURL=apiExecution.js.map