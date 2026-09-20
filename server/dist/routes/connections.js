"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connectionService_1 = __importDefault(require("../services/connectionService"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication to all routes
router.use(auth_1.authenticateToken);
/**
 * GET /api/connections
 * Get all database connections for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
            });
        }
        const connections = await connectionService_1.default.getAllConnections(userId);
        res.json({ success: true, data: connections });
    }
    catch (error) {
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
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.id;
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
        const connection = await connectionService_1.default.createConnection({
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
    }
    catch (error) {
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
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
            });
        }
        const connection = await connectionService_1.default.getConnectionById(parseInt(req.params.id), userId);
        if (!connection) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Connection not found' },
            });
        }
        res.json({ success: true, data: connection });
    }
    catch (error) {
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
router.post('/:id/test', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
            });
        }
        const connection = await connectionService_1.default.getConnectionById(parseInt(req.params.id), userId);
        if (!connection) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Connection not found' },
            });
        }
        // Import testConnection from database config
        const { testConnection } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        const result = await testConnection({
            host: connection.host || 'localhost',
            port: connection.port || 1433,
            database: connection.database_name || 'master',
            username: connection.username || '',
            password: connection.password_encrypted,
            ssl: false,
        });
        if (!result) {
            return res.status(400).json({
                success: false,
                error: { code: 'CONNECTION_FAILED', message: 'Connection test failed' },
            });
        }
        res.json({ success: true, message: 'Connection test successful' });
    }
    catch (error) {
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
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
            });
        }
        const updates = req.body;
        const connection = await connectionService_1.default.updateConnection(parseInt(req.params.id), userId, updates);
        if (!connection) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Connection not found' },
            });
        }
        res.json({ success: true, data: connection });
    }
    catch (error) {
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
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
            });
        }
        const deleted = await connectionService_1.default.deleteConnection(parseInt(req.params.id), userId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Connection not found' },
            });
        }
        res.json({ success: true, message: 'Connection deleted' });
    }
    catch (error) {
        console.error('Delete connection error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to delete connection' },
        });
    }
});
exports.default = router;
//# sourceMappingURL=connections.js.map