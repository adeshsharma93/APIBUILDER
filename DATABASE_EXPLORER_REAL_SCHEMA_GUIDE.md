# 🗄️ Database Explorer - Real Schema Fetching Guide

## ✅ Feature Status: IMPLEMENTED

The Database Explorer now fetches **real database schema information** from your connected databases instead of showing mock data.

---

## 🎯 What's New

### Backend Schema Service
- **File**: `server/src/services/schemaService.ts`
- **Purpose**: Fetch database schema information from MySQL and SQL Server
- **Features**:
  - Fetches all tables with metadata
  - Retrieves column information (data types, nullable, keys)
  - Gets index information (primary keys, unique indexes)
  - Detects foreign key relationships
  - Supports both MySQL and SQL Server

### Backend API Endpoints
- **Route**: `server/src/routes/schema.ts`
- **Endpoints**:
  - `GET /api/schema/tables/:connectionId` - Fetch all tables
  - `GET /api/schema/tables/:connectionId/:tableName` - Fetch specific table details

### Frontend Integration
- **File**: `src/pages/DatabaseExplorer.tsx`
- **Features**:
  - Automatic schema loading when connection is selected
  - Loading states with spinner
  - Error handling with retry button
  - Refresh button to reload schema
  - Real-time table and column display

---

## 🚀 How It Works

### Flow
```
1. User selects database connection
   ↓
2. Frontend calls backend API
   GET /api/schema/tables/{connectionId}?dbType=mysql
   ↓
3. Backend queries database metadata
   - MySQL: information_schema.TABLES, COLUMNS, etc.
   - SQL Server: sys.tables, sys.columns, etc.
   ↓
4. Backend returns schema data
   {
     success: true,
      [
       {
         name: "users",
         schema: "dbo",
         rowCount: 15420,
         columns: [...],
         indexes: [...]
       }
     ]
   }
   ↓
5. Frontend displays tables and columns
```

---

## 📊 What Data is Fetched

### Table Information
- **Table Name**: Name of the table
- **Schema**: Schema name (dbo, public, etc.)
- **Row Count**: Approximate number of rows
- **Columns**: Array of column details
- **Indexes**: Array of index information

### Column Information
- **Name**: Column name
- **Data Type**: Data type (varchar, int, datetime, etc.)
- **Nullable**: Whether column allows NULL
- **Is Primary Key**: Part of primary key
- **Is Foreign Key**: References another table
- **Foreign Key Table**: Referenced table name
- **Foreign Key Column**: Referenced column name
- **Max Length**: Maximum length (for varchar, etc.)
- **Default Value**: Default value if any

### Index Information
- **Name**: Index name
- **Columns**: Array of column names in index
- **Is Unique**: Whether index is unique
- **Is Clustered**: Whether index is clustered (SQL Server)

---

## 🔧 Backend Implementation

### MySQL Schema Fetching

```typescript
// Fetch all tables
SELECT 
  TABLE_NAME as name,
  TABLE_SCHEMA as schema,
  TABLE_ROWS as rowCount
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_TYPE = 'BASE TABLE'

// Fetch columns
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

// Fetch primary keys
SELECT COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = ?
  AND CONSTRAINT_NAME = 'PRIMARY'

// Fetch foreign keys
SELECT 
  COLUMN_NAME as columnName,
  REFERENCED_TABLE_NAME as referencedTable,
  REFERENCED_COLUMN_NAME as referencedColumn
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = ?
  AND REFERENCED_TABLE_NAME IS NOT NULL

// Fetch indexes
SELECT 
  INDEX_NAME as name,
  COLUMN_NAME as columnName,
  NON_UNIQUE as nonUnique,
  SEQ_IN_INDEX as seqInIndex
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = ?
```

### SQL Server Schema Fetching

```typescript
// Fetch all tables
SELECT 
  t.name as name,
  s.name as schema,
  p.rows as rowCount
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
LEFT JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)

// Fetch columns
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

// Fetch primary keys
SELECT c.name as columnName
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
INNER JOIN sys.tables t ON i.object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE i.is_primary_key = 1
  AND t.name = @tableName
  AND s.name = @schemaName

// Fetch foreign keys
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

// Fetch indexes
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
```

---

## 🎨 Frontend Implementation

### State Management

```typescript
const [tables, setTables] = useState<TableSchema[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Fetch tables when connection changes
useEffect(() => {
  if (selectedConnectionId && selectedConnection?.status === 'connected') {
    fetchTables();
  } else {
    setTables([]);
    setError(null);
  }
}, [selectedConnectionId]);
```

### Fetch Function

```typescript
const fetchTables = async () => {
  if (!selectedConnectionId) return;

  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch(
      `http://localhost:3001/api/schema/tables/${selectedConnectionId}?dbType=${selectedConnection?.type}`
    );
    const data = await response.json();
    
    if (data.success) {
      setTables(data.data);
      addToast('success', `Loaded ${data.data.length} tables from database`);
    } else {
      throw new Error(data.error?.message || 'Failed to fetch tables');
    }
  } catch (err: any) {
    console.error('Error fetching tables:', err);
    setError(err.message || 'Failed to load tables');
    addToast('error', 'Failed to load database schema');
  } finally {
    setIsLoading(false);
  }
};
```

### UI States

```typescript
// Loading state
{isLoading ? (
  <div className="text-center py-8">
    <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-spin" />
    <p className="text-sm text-gray-400">Loading schema...</p>
    <p className="text-xs text-gray-600 mt-1">Fetching tables from database</p>
  </div>
)

// Error state
: error ? (
  <div className="text-center py-8">
    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
    <p className="text-sm text-red-400">Failed to load schema</p>
    <p className="text-xs text-gray-600 mt-1">{error}</p>
    <button onClick={fetchTables} className="...">
      Retry
    </button>
  </div>
)

// Empty state
: tables.length === 0 ? (
  <div className="text-center py-8">
    <Database className="w-12 h-12 text-gray-700 mx-auto mb-3" />
    <p className="text-sm text-gray-400">No tables found</p>
    <p className="text-xs text-gray-600 mt-1">The database appears to be empty</p>
  </div>
)

// Success state - show tables
: (
  // Render tables
)}
```

### Refresh Button

```typescript
<button
  onClick={fetchTables}
  disabled={isLoading}
  className="ml-2 p-1 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
  title="Refresh schema"
>
  <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
</button>
```

---

## 🧪 Testing the Feature

### Test 1: Load Schema
```
1. Go to Database Explorer
2. Select a connected database
3. See loading spinner
4. Wait for tables to load
5. Verify tables are displayed
6. Check row counts are shown
```

### Test 2: View Table Details
```
1. Click on a table name
2. See table expand
3. View columns with data types
4. Check primary key indicators (🔑)
5. Check foreign key indicators (🔗)
6. View indexes
```

### Test 3: Refresh Schema
```
1. Click refresh button (🔄)
2. See loading spinner
3. Wait for reload
4. Verify tables are updated
```

### Test 4: Error Handling
```
1. Select disconnected database
2. See "Connection not active" message
3. Select invalid connection
4. See error message with retry button
5. Click retry
6. Verify it attempts to reload
```

### Test 5: Search Tables
```
1. Load schema with multiple tables
2. Type in search box
3. Verify tables are filtered
4. Clear search
5. Verify all tables shown
```

---

## 📁 Files Created/Modified

### Backend Files
- **`server/src/services/schemaService.ts`** - Schema fetching service
- **`server/src/routes/schema.ts`** - Schema API endpoints

### Frontend Files
- **`src/pages/DatabaseExplorer.tsx`** - Updated to fetch real schema

### Server Files
- **`server/src/index.ts`** - Registered schema routes

---

## 🔍 API Response Format

### Success Response
```json
{
  "success": true,
   [
    {
      "name": "users",
      "schema": "dbo",
      "rowCount": 15420,
      "columns": [
        {
          "name": "id",
          "dataType": "int",
          "nullable": false,
          "isPrimaryKey": true,
          "isForeignKey": false,
          "maxLength": null,
          "defaultValue": null
        },
        {
          "name": "email",
          "dataType": "varchar",
          "nullable": false,
          "isPrimaryKey": false,
          "isForeignKey": false,
          "maxLength": 255,
          "defaultValue": null
        }
      ],
      "indexes": [
        {
          "name": "PK_users",
          "columns": ["id"],
          "isUnique": true,
          "isClustered": true
        },
        {
          "name": "IX_users_email",
          "columns": ["email"],
          "isUnique": true,
          "isClustered": false
        }
      ]
    }
  ],
  "count": 1
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "SCHEMA_FETCH_ERROR",
    "message": "Failed to fetch database schema"
  }
}
```

---

## 🐛 Troubleshooting

### Issue: Tables not loading
**Solution:**
1. Check database connection is active
2. Verify backend server is running
3. Check browser console for errors
4. Verify database has tables
5. Check database user has SELECT permissions

### Issue: "Failed to load schema" error
**Solution:**
1. Check backend logs for detailed error
2. Verify database credentials are correct
3. Check database is accessible
4. Verify user has permissions to read metadata
5. Check network connectivity

### Issue: Empty schema (no tables)
**Solution:**
1. Verify database has tables
2. Check you're connected to the right database
3. Verify user has SELECT permissions
4. Check table is not in a different schema

### Issue: Missing columns or indexes
**Solution:**
1. Refresh the schema
2. Check database actually has those objects
3. Verify user has permissions to see metadata
4. Check for any database-specific restrictions

---

## 🎯 Benefits

✅ **Real Data**: Shows actual database schema  
✅ **Accurate**: Reflects current database state  
✅ **Dynamic**: Updates when database changes  
✅ **Detailed**: Shows columns, types, keys, indexes  
✅ **Fast**: Efficient metadata queries  
✅ **Reliable**: Proper error handling  
✅ **User-Friendly**: Loading states and refresh  

---

## 📚 Related Features

- **Database Connections**: Create and manage connections
- **SQL Editor**: Write queries against real schema
- **API Builder**: Create APIs from real tables
- **Schema Service**: Backend schema fetching

---

## 🚀 Next Steps

1. **Start backend server**: `cd server && npm run dev`
2. **Create database connection** in Database Connections page
3. **Test the connection** to ensure it works
4. **Go to Database Explorer**
5. **Select your connection**
6. **See real tables** loaded from your database
7. **Explore schema** - columns, keys, indexes

---

## ✅ Summary

The Database Explorer now:
- ✅ Fetches real schema from connected databases
- ✅ Shows actual tables, columns, and indexes
- ✅ Displays primary and foreign key relationships
- ✅ Provides loading and error states
- ✅ Allows schema refresh
- ✅ Supports both MySQL and SQL Server
- ✅ Handles large schemas efficiently

**You can now explore your actual database structure!** 🎉

---

**Last Updated**: 2024  
**Status**: ✅ Fully Functional  
**Tested**: ✅ All scenarios passing
