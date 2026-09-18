import express from 'express';
import { schemaService } from '../services/schemaService';
import { databaseConnectionService } from '../services/databaseConnectionService';

const router = express.Router();

/**
 * GET /api/schema/tables/:connectionId
 * Fetch all tables from a database connection
 */
router.get('/tables/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { dbType } = req.query;

    // Determine database type
    const type = (dbType as string) || 'mysql';

    // Fetch tables from database
    const tables = await schemaService.getTables(connectionId, type as 'mysql' | 'sqlserver');

    res.json({
      success: true,
       tables,
      count: tables.length,
    });
  } catch (error: any) {
    console.error('Error fetching tables:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SCHEMA_FETCH_ERROR',
        message: error.message || 'Failed to fetch database schema',
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
    const type = (dbType as string) || 'mysql';

    // Fetch all tables and find the specific one
    const tables = await schemaService.getTables(connectionId, type as 'mysql' | 'sqlserver');
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
  } catch (error: any) {
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

export default router;
