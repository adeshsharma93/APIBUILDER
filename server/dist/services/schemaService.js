"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaService = exports.SchemaService = void 0;
const mssql_1 = __importDefault(require("mssql"));
const mysqlDatabase_1 = require("../config/mysqlDatabase");
const database_1 = require("../config/database");
class SchemaService {
    /**
     * Fetch all tables from a database
     */
    async getTables(connectionId, dbType = 'mysql') {
        if (dbType === 'mysql') {
            return this.getMysqlTables(connectionId);
        }
        else {
            return this.getSqlServerTables(connectionId);
        }
    }
    /**
     * Fetch tables from MySQL database
     */
    async getMysqlTables(connectionId) {
        console.log(`🔍 Fetching MySQL tables for connection: ${connectionId}`);
        let pool;
        try {
            pool = await (0, mysqlDatabase_1.getUserMysqlPool)(connectionId);
            console.log(`✅ Got MySQL pool for connection: ${connectionId}`);
        }
        catch (error) {
            console.error(`❌ Failed to get MySQL pool:`, error.message);
            console.error(`Error details:`, error);
            throw new Error(`Failed to connect to database: ${error.message}`);
        }
        // Get all tables
        try {
            console.log(`📊 Executing query to fetch tables...`);
            const [tables] = await pool.execute(`
        SELECT 
          TABLE_NAME as name,
          TABLE_SCHEMA as \`schema\`,
          TABLE_ROWS as rowCount
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `);
            const tableCount = tables.length;
            console.log(`✅ Found ${tableCount} tables`);
            if (tableCount === 0) {
                console.log(`⚠️ No tables found in database. Returning empty array.`);
                return [];
            }
            const tableList = tables;
            const tablesWithDetails = [];
            for (const table of tableList) {
                try {
                    console.log(`📋 Fetching details for table: ${table.name}`);
                    // Get columns for this table
                    const [columns] = await pool.execute(`
          SELECT 
            COLUMN_NAME as name,
            DATA_TYPE as dataType,
            IS_NULLABLE as nullable,
            COLUMN_KEY as columnKey,
            CHARACTER_MAXIMUM_LENGTH as maxLength,
            COLUMN_DEFAULT as defaultValue
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [table.name]);
                    // Get primary keys
                    const [primaryKeys] = await pool.execute(`
          SELECT COLUMN_NAME
          FROM information_schema.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND CONSTRAINT_NAME = 'PRIMARY'
        `, [table.name]);
                    // Get foreign keys
                    const [foreignKeys] = await pool.execute(`
          SELECT 
            COLUMN_NAME as columnName,
            REFERENCED_TABLE_NAME as referencedTable,
            REFERENCED_COLUMN_NAME as referencedColumn
          FROM information_schema.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [table.name]);
                    // Get indexes
                    const [indexes] = await pool.execute(`
          SELECT 
            INDEX_NAME as name,
            COLUMN_NAME as columnName,
            NON_UNIQUE as nonUnique,
            SEQ_IN_INDEX as seqInIndex
          FROM information_schema.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
          ORDER BY INDEX_NAME, SEQ_IN_INDEX
        `, [table.name]);
                    // Process columns
                    const pkColumns = primaryKeys.map(pk => pk.COLUMN_NAME);
                    const fkMap = new Map(foreignKeys.map(fk => [fk.columnName, fk]));
                    const columnInfos = columns.map(col => ({
                        name: col.name,
                        dataType: col.dataType,
                        nullable: col.nullable === 'YES',
                        isPrimaryKey: pkColumns.includes(col.name),
                        isForeignKey: fkMap.has(col.name),
                        foreignKeyTable: fkMap.get(col.name)?.referencedTable,
                        foreignKeyColumn: fkMap.get(col.name)?.referencedColumn,
                        maxLength: col.maxLength,
                        defaultValue: col.defaultValue,
                    }));
                    // Process indexes
                    const indexMap = new Map();
                    indexes.forEach(idx => {
                        if (!indexMap.has(idx.name)) {
                            indexMap.set(idx.name, {
                                name: idx.name,
                                columns: [],
                                isUnique: idx.nonUnique === 0,
                                isClustered: idx.name === 'PRIMARY',
                            });
                        }
                        indexMap.get(idx.name).columns.push(idx.columnName);
                    });
                    tablesWithDetails.push({
                        name: table.name,
                        schema: table.schema,
                        rowCount: table.rowCount || 0,
                        columns: columnInfos,
                        indexes: Array.from(indexMap.values()),
                    });
                    console.log(`✅ Successfully processed table: ${table.name}`);
                }
                catch (tableError) {
                    console.error(`❌ Error processing table ${table.name}:`, tableError.message);
                    // Continue with other tables even if one fails
                    console.log(`⚠️ Skipping table ${table.name} due to error`);
                }
            }
            console.log(`✅ Successfully fetched ${tablesWithDetails.length} tables with details`);
            return tablesWithDetails;
        }
        catch (error) {
            console.error('❌ Error fetching MySQL tables:', error.message);
            console.error('Error stack:', error.stack);
            throw new Error(`Failed to fetch tables: ${error.message}`);
        }
    }
    /**
     * Fetch tables from SQL Server database
     */
    async getSqlServerTables(connectionId) {
        const pool = await (0, database_1.getUserDbPool)(connectionId);
        // Get all tables
        const tablesResult = await pool.request().query(`
      SELECT 
        t.name as name,
        s.name as schema,
        p.rows as rowCount
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      LEFT JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
      ORDER BY s.name, t.name
    `);
        const tableList = tablesResult.recordset;
        const tablesWithDetails = [];
        for (const table of tableList) {
            // Get columns
            const columnsResult = await pool.request()
                .input('tableName', mssql_1.default.NVarChar, table.name)
                .input('schemaName', mssql_1.default.NVarChar, table.schema)
                .query(`
          SELECT 
            c.name as name,
            t.name as dataType,
            c.is_nullable as nullable,
            c.max_length as maxLength,
            c.is_identity as isIdentity,
            dc.definition as defaultValue
          FROM sys.columns c
          INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
          INNER JOIN sys.tables tbl ON c.object_id = tbl.object_id
          INNER JOIN sys.schemas s ON tbl.schema_id = s.schema_id
          LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
          WHERE tbl.name = @tableName
            AND s.name = @schemaName
          ORDER BY c.column_id
        `);
            // Get primary keys
            const pkResult = await pool.request()
                .input('tableName', mssql_1.default.NVarChar, table.name)
                .input('schemaName', mssql_1.default.NVarChar, table.schema)
                .query(`
          SELECT c.name as columnName
          FROM sys.indexes i
          INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
          INNER JOIN sys.tables t ON i.object_id = t.object_id
          INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
          WHERE i.is_primary_key = 1
            AND t.name = @tableName
            AND s.name = @schemaName
        `);
            // Get foreign keys
            const fkResult = await pool.request()
                .input('tableName', mssql_1.default.NVarChar, table.name)
                .input('schemaName', mssql_1.default.NVarChar, table.schema)
                .query(`
          SELECT 
            c.name as columnName,
            pt.name as referencedTable,
            pc.name as referencedColumn
          FROM sys.foreign_key_columns fkc
          INNER JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
          INNER JOIN sys.tables t ON fkc.parent_object_id = t.object_id
          INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
          INNER JOIN sys.tables pt ON fkc.referenced_object_id = pt.object_id
          INNER JOIN sys.columns pc ON fkc.referenced_object_id = pc.object_id AND fkc.referenced_column_id = pc.column_id
          WHERE t.name = @tableName
            AND s.name = @schemaName
        `);
            // Get indexes
            const indexResult = await pool.request()
                .input('tableName', mssql_1.default.NVarChar, table.name)
                .input('schemaName', mssql_1.default.NVarChar, table.schema)
                .query(`
          SELECT 
            i.name as indexName,
            c.name as columnName,
            i.is_unique as isUnique,
            i.type_desc as typeDesc
          FROM sys.indexes i
          INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
          INNER JOIN sys.tables t ON i.object_id = t.object_id
          INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
          WHERE t.name = @tableName
            AND s.name = @schemaName
            AND i.name IS NOT NULL
          ORDER BY i.name, ic.key_ordinal
        `);
            // Process columns
            const pkColumns = pkResult.recordset.map((pk) => pk.columnName);
            const fkMap = new Map(fkResult.recordset.map((fk) => [fk.columnName, fk]));
            const columnInfos = columnsResult.recordset.map((col) => ({
                name: col.name,
                dataType: col.dataType,
                nullable: col.nullable === 1,
                isPrimaryKey: pkColumns.includes(col.name),
                isForeignKey: fkMap.has(col.name),
                foreignKeyTable: fkMap.get(col.name)?.referencedTable,
                foreignKeyColumn: fkMap.get(col.name)?.referencedColumn,
                maxLength: col.maxLength,
                defaultValue: col.defaultValue,
            }));
            // Process indexes
            const indexMap = new Map();
            indexResult.recordset.forEach((idx) => {
                if (!indexMap.has(idx.indexName)) {
                    indexMap.set(idx.indexName, {
                        name: idx.indexName,
                        columns: [],
                        isUnique: idx.isUnique === 1,
                        isClustered: idx.typeDesc === 'CLUSTERED',
                    });
                }
                indexMap.get(idx.indexName).columns.push(idx.columnName);
            });
            tablesWithDetails.push({
                name: table.name,
                schema: table.schema,
                rowCount: table.rowCount || 0,
                columns: columnInfos,
                indexes: Array.from(indexMap.values()),
            });
        }
        return tablesWithDetails;
    }
}
exports.SchemaService = SchemaService;
exports.schemaService = new SchemaService();
//# sourceMappingURL=schemaService.js.map