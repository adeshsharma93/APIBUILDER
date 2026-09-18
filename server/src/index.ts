import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectionsRouter from './routes/connections';
import apiExecutionRouter from './routes/apiExecution';
import schemaRouter from './routes/schema';
import { getAppDbPool } from './config/database';
import { getMysqlPool } from './config/mysqlDatabase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/connections', connectionsRouter);
app.use('/api', apiExecutionRouter);
app.use('/api/schema', schemaRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
app.use((req: express.Request, res: express.Response) => {
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
      await getMysqlPool();
      console.log('✅ MySQL database connection established');
    } else {
      await getAppDbPool();
      console.log('✅ SQL Server database connection established');
    }

    app.listen(PORT, () => {
      console.log(`🚀 SQL API Builder Server running on port ${PORT}`);
      console.log(`📝 API Documentation: http://localhost:${PORT}/api/apis`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️  Database type: ${dbType.toUpperCase()}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
