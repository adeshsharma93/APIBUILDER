"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apiExecutionService_1 = require("../services/apiExecutionService");
const databaseConnectionService_1 = require("../services/databaseConnectionService");
const router = express_1.default.Router();
/**
 * POST /api/query/test
 * Test execute a SQL query against a database connection
 */
router.post('/test', async (req, res) => {
    try {
        const { connectionId, sql, parameters, dbType } = req.body;
        if (!connectionId || !sql) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'connectionId and sql are required',
                },
            });
        }
        // Determine if this is a write operation
        const sqlUpper = sql.trim().toUpperCase();
        const isWriteOperation = sqlUpper.startsWith('INSERT') ||
            sqlUpper.startsWith('UPDATE') ||
            sqlUpper.startsWith('DELETE');
        // Execute the query
        const result = await apiExecutionService_1.apiExecutionService.executeQuery({
            connectionId,
            dbType: dbType || 'mysql',
            sql,
            parameters: parameters || {},
            page: 1,
            pageSize: 100, // Limit for testing
            timeout: 30,
            allowDangerous: isWriteOperation, // Allow INSERT/UPDATE/DELETE for testing
        });
        // Get connection name for display
        const connection = await databaseConnectionService_1.databaseConnectionService.getConnection(connectionId, dbType || 'mysql');
        const responseData = {
            success: result.success,
            error: result.error,
        };
        if (result.success && result.data) {
            responseData.data = {
                columns: result.data.length > 0 ? Object.keys(result.data[0]) : [],
                rows: result.data,
                rowCount: result.rowCount || 0,
                rowsAffected: result.rowsAffected,
                executionTime: result.executionTime || 0,
                connectionName: connection?.name || 'Unknown',
                pagination: result.pagination,
                message: result.message,
            };
        }
        res.json(responseData);
    }
    catch (error) {
        console.error('Error testing query:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'QUERY_TEST_ERROR',
                message: error.message || 'Failed to test query',
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=query.js.map