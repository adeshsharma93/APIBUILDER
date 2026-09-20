"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const connections_1 = __importDefault(require("./routes/connections"));
const apiExecution_1 = __importDefault(require("./routes/apiExecution"));
const schema_1 = __importDefault(require("./routes/schema"));
const query_1 = __importDefault(require("./routes/query"));
const database_1 = require("./config/database");
const mysqlDatabase_1 = require("./config/mysqlDatabase");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)()); // Enable CORS
app.use((0, morgan_1.default)('combined')); // Request logging
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/connections', connections_1.default);
app.use('/api', apiExecution_1.default);
app.use('/api/schema', schema_1.default);
app.use('/api/query', query_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
        },
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
        },
    });
});
// Start server
async function startServer() {
    try {
        // Determine database type from environment
        const dbType = process.env.DB_TYPE || 'mysql';
        if (dbType === 'mysql') {
            await (0, mysqlDatabase_1.getMysqlPool)();
            console.log('✅ MySQL database connection established');
        }
        else {
            await (0, database_1.getAppDbPool)();
            console.log('✅ SQL Server database connection established');
        }
        app.listen(PORT, () => {
            console.log(`🚀 SQL API Builder Server running on port ${PORT}`);
            console.log(`📝 API Documentation: http://localhost:${PORT}/api/apis`);
            console.log(`💚 Health check: http://localhost:${PORT}/health`);
            console.log(`🗄️  Database type: ${dbType.toUpperCase()}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map