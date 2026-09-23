"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const schemaService_1 = require("../services/schemaService");
const databaseConnectionService_1 = require("../services/databaseConnectionService");
const router = express_1.default.Router();
/**
 * GET /api/schema/tables/:connectionId
 * Fetch all tables from a database connection
 */
router.get('/tables/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { dbType } = req.query;
        console.log(`📋 Schema request for connection: ${connectionId}, type: ${dbType || 'mysql'}`);
        // Validate connection ID
        if (!connectionId || connectionId === 'undefined') {
            console.error('❌ Invalid connection ID');
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CONNECTION_ID',
                    message: 'Invalid connection ID provided',
                },
            });
        }
        // Determine database type
        const type = dbType || 'mysql';
        // Check if connection exists
        console.log(`🔍 Checking if connection exists: ${connectionId}`);
        const connection = await databaseConnectionService_1.databaseConnectionService.getConnection(connectionId, type);
        if (!connection) {
            console.error(`❌ Connection not found: ${connectionId}`);
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CONNECTION_NOT_FOUND',
                    message: `Database connection not found with ID: ${connectionId}`,
                },
            });
        }
        console.log(`✅ Connection found: ${connection.name} (${connection.host}:${connection.port}/${connection.database_name})`);
        // Fetch tables from database
        console.log(`🔍 Fetching tables from database...`);
        const tables = await schemaService_1.schemaService.getTables(connectionId, type);
        console.log(`✅ Successfully fetched ${tables.length} tables`);
        res.json({
            success: true,
            tables,
            count: tables.length,
        });
    }
    catch (error) {
        console.error('❌ Error fetching tables:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'SCHEMA_FETCH_ERROR',
                message: error.message || 'Failed to fetch database schema',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
        });
    }
});
/**
 * GET /api/schema/tables/:connectionId/:tableName
 * Fetch detailed information about a specific table
 */
router.get('/tables/:connectionId/:tableName', async (req, res) => {
    try {
        const { connectionId, tableName } = req.params;
        const { dbType } = req.query;
        // Determine database type
        const type = dbType || 'mysql';
        // Fetch all tables and find the specific one
        const tables = await schemaService_1.schemaService.getTables(connectionId, type);
        const table = tables.find(t => t.name === tableName);
        if (!table) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TABLE_NOT_FOUND',
                    message: `Table '${tableName}' not found`,
                },
            });
        }
        res.json({
            success: true,
            table,
        });
    }
    catch (error) {
        console.error('Error fetching table details:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SCHEMA_FETCH_ERROR',
                message: error.message || 'Failed to fetch table details',
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=schema.js.map