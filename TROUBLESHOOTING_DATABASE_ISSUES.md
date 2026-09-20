# 🔧 Troubleshooting Guide - Database Connection Issues

## Issues Being Fixed

1. ❌ Database Explorer failing to load schema from MySQL DB
2. ❌ SQL Editor failing to run queries from MySQL DB
3. ❌ Create API not able to run queries from selected DB

## Root Cause

The frontend was storing database connections in **localStorage** instead of saving them to the **backend database**. When the backend tried to execute queries or fetch schemas, it couldn't find the connection details because they only existed in the browser's localStorage.

## ✅ Fixes Applied

### 1. Frontend: Save Connections to Backend
**File**: `src/pages/DatabaseConnections.tsx`

**Changes**:
- ✅ `handleSave()` now calls backend API to save connections
- ✅ `handleTestConnection()` now tests via backend API
- ✅ Connections are stored in both localStorage AND backend database
- ✅ Backend returns UUID which is used for all subsequent operations

### 2. Backend: Better Error Handling & Logging
**File**: `server/src/config/mysqlDatabase.ts`

**Changes**:
- ✅ Added detailed logging for connection pool creation
- ✅ Added connection testing before returning pool
- ✅ Better error messages with connection details
- ✅ Added timeout configuration

### 3. Backend: Schema Service Logging
**File**: `server/src/services/schemaService.ts`

**Changes**:
- ✅ Added logging for schema fetching
- ✅ Better error handling with detailed messages
- ✅ Track which connection is being used

### 4. Backend: Flexible Connection Creation
**File**: `server/src/routes/connections.ts`

**Changes**:
- ✅ Accept both `database` and `database_name` field names
- ✅ Accept both `ssl` and `ssl_enabled` field names
- ✅ Accept both `timeout` and `connection_timeout` field names
- ✅ Auto-create default project if not provided
- ✅ Better error messages

---

## 🧪 How to Test

### Step 1: Start Backend Server
```bash
cd server
npm run dev
```

**Expected Output**:
```
✅ MySQL application database connected
🚀 SQL API Builder Server running on port 3001
```

### Step 2: Start Frontend
```bash
npm run dev
```

### Step 3: Create a MySQL Connection
1. Login: `admin@sqlapi.dev` / `admin123`
2. Go to **Database Connections**
3. Click **New Connection**
4. Fill in your MySQL details:
   ```
   Name: My MySQL DB
   Type: MySQL
   Host: localhost
   Port: 3306
   Database: your_database_name
   Username: root
   Password: your_password
   SSL: Disable (for local)
   Timeout: 30
   ```
5. Click **Save Connection**

**Backend Logs Should Show**:
```
🔍 Fetching connection details for: <uuid>
✅ Found connection: My MySQL DB (localhost:3306/your_database_name)
✅ Decrypted credentials for: My MySQL DB
✅ Successfully connected to user database: My MySQL DB
✅ User MySQL database pool created and cached: My MySQL DB
```

### Step 4: Test the Connection
1. Click **Test** button on your connection
2. Wait for result

**Backend Logs Should Show**:
```
✅ Connection test successful
```

**Frontend Should Show**:
- ✅ Status: "connected" (green badge)
- ✅ Toast: "Connection test successful!"

### Step 5: Test Database Explorer
1. Go to **Database Explorer**
2. Select your MySQL connection from dropdown
3. Wait for tables to load

**Backend Logs Should Show**:
```
🔍 Fetching MySQL tables for connection: <uuid>
✅ Got MySQL pool for connection: <uuid>
✅ Found X tables
```

**Frontend Should Show**:
- ✅ List of tables from your database
- ✅ Click on a table to see columns
- ✅ Toast: "Loaded X tables from My MySQL DB"

### Step 6: Test SQL Editor
1. Go to **SQL Editor**
2. Select your MySQL connection
3. Write a query:
   ```sql
   SELECT * FROM your_table LIMIT 10
   ```
4. Click **Execute**

**Backend Logs Should Show**:
```
🔍 Fetching connection details for: <uuid>
✅ Got MySQL pool for connection: <uuid>
✅ Query executed successfully
```

**Frontend Should Show**:
- ✅ Query results table
- ✅ Row count and execution time
- ✅ Toast: "Query executed successfully — X rows in Yms"

### Step 7: Test Create API
1. Go to **Create API**
2. Select your MySQL connection
3. Write a query:
   ```sql
   SELECT * FROM your_table WHERE id = @id
   ```
4. Click **Test Query**

**Backend Logs Should Show**:
```
🔍 Fetching connection details for: <uuid>
✅ Got MySQL pool for connection: <uuid>
✅ Query executed successfully
```

**Frontend Should Show**:
- ✅ Query results preview
- ✅ Detected parameters
- ✅ Toast: "Query executed successfully - Xms, Y rows"

---

## 🐛 Common Issues & Solutions

### Issue 1: "Database connection not found"
**Cause**: Connection ID doesn't exist in backend database

**Solution**:
1. Check backend logs for the connection ID being requested
2. Verify the connection was saved successfully
3. Check if the connection exists in the database:
   ```sql
   SELECT * FROM database_connections WHERE id = '<uuid>';
   ```

### Issue 2: "Failed to decrypt database credentials"
**Cause**: Encryption key mismatch or corrupted data

**Solution**:
1. Check `ENCRYPTION_KEY` in `server/.env`
2. Verify it's at least 32 characters
3. Try recreating the connection

### Issue 3: "Failed to connect to database"
**Cause**: MySQL server not accessible or wrong credentials

**Solution**:
1. Verify MySQL is running: `mysql -u root -p`
2. Check host, port, username, password
3. Verify database exists: `SHOW DATABASES;`
4. Check firewall rules

### Issue 4: "Failed to fetch tables"
**Cause**: User doesn't have permissions or database is empty

**Solution**:
1. Check user permissions:
   ```sql
   SHOW GRANTS FOR 'your_user'@'localhost';
   ```
2. Grant necessary permissions:
   ```sql
   GRANT SELECT, SHOW VIEW ON your_database.* TO 'your_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. Verify database has tables:
   ```sql
   USE your_database;
   SHOW TABLES;
   ```

### Issue 5: Backend not starting
**Cause**: MySQL application database not set up

**Solution**:
```bash
# Create application database
mysql -u root -p -e "CREATE DATABASE sql_api_builder;"

# Run migrations
mysql -u root -p sql_api_builder < server/migrations/mysql/001_initial_schema.sql

# Verify tables exist
mysql -u root -p -e "USE sql_api_builder; SHOW TABLES;"
```

---

## 📊 Debugging Checklist

### Backend Checks
- [ ] Backend server is running (`npm run dev`)
- [ ] MySQL application database exists
- [ ] All tables created (check with `SHOW TABLES`)
- [ ] `ENCRYPTION_KEY` is set in `.env`
- [ ] Connection saved to `database_connections` table
- [ ] Backend logs show connection being fetched
- [ ] Backend logs show successful pool creation

### Frontend Checks
- [ ] Frontend is running (`npm run dev`)
- [ ] Connection shows "connected" status
- [ ] Connection ID matches backend (check localStorage)
- [ ] API calls are being made to `http://localhost:3001`
- [ ] No CORS errors in browser console
- [ ] Network tab shows successful API responses

### Database Checks
- [ ] MySQL server is running
- [ ] User database is accessible
- [ ] User has SELECT permissions
- [ ] Database has tables
- [ ] Connection credentials are correct

---

## 🔍 Backend Logs to Watch

When testing, watch for these log messages:

### Connection Creation
```
🔍 Fetching connection details for: <uuid>
✅ Found connection: <name> (<host>:<port>/<database>)
✅ Decrypted credentials for: <name>
✅ Successfully connected to user database: <name>
✅ User MySQL database pool created and cached: <name>
```

### Schema Fetching
```
🔍 Fetching MySQL tables for connection: <uuid>
✅ Got MySQL pool for connection: <uuid>
✅ Found X tables
```

### Query Execution
```
🔍 Fetching connection details for: <uuid>
✅ Got MySQL pool for connection: <uuid>
✅ Query executed successfully
```

### Error Logs
```
❌ Connection not found in database: <uuid>
❌ Failed to decrypt credentials for: <name>
❌ Failed to connect to user database: <name>
❌ Error fetching MySQL tables: <error>
```

---

## 🎯 Expected Flow

### 1. Create Connection
```
Frontend → POST /api/connections → Backend → MySQL (app db)
                                        ↓
                                   Save connection
                                        ↓
                                   Return UUID
                                        ↓
Frontend ← Connection with UUID ← Backend
```

### 2. Test Connection
```
Frontend → POST /api/connections/:id/test → Backend
                                                ↓
                                          Fetch connection
                                                ↓
                                          Decrypt password
                                                ↓
                                          Test MySQL connection
                                                ↓
                                          Update status
                                                ↓
Frontend ← Success/Error ← Backend
```

### 3. Fetch Schema
```
Frontend → GET /api/schema/tables/:id → Backend
                                            ↓
                                      Get MySQL pool
                                            ↓
                                      Query information_schema
                                            ↓
                                      Return tables
                                            ↓
Frontend ← Tables ← Backend
```

### 4. Execute Query
```
Frontend → POST /api/query/test → Backend
                                      ↓
                                Get MySQL pool
                                      ↓
                                Execute SQL
                                      ↓
                                Return results
                                      ↓
Frontend ← Results ← Backend
```

---

## 📝 Verification Commands

### Check if connection exists in backend
```bash
mysql -u root -p sql_api_builder -e "SELECT id, name, host, database_name FROM database_connections;"
```

### Check backend logs
```bash
# In the terminal where backend is running
# Look for the log messages mentioned above
```

### Check frontend localStorage
```javascript
// In browser console
JSON.parse(localStorage.getItem('sql-api-builder-storage'))
```

### Test backend API directly
```bash
# List connections
curl http://localhost:3001/api/connections?project_id=default-project

# Test connection
curl -X POST http://localhost:3001/api/connections/<uuid>/test

# Fetch schema
curl http://localhost:3001/api/schema/tables/<uuid>?dbType=mysql

# Test query
curl -X POST http://localhost:3001/api/query/test \
  -H "Content-Type: application/json" \
  -d '{"connectionId":"<uuid>","sql":"SELECT 1","parameters":{},"dbType":"mysql"}'
```

---

## ✅ Success Criteria

After applying the fixes, you should be able to:

1. ✅ Create a MySQL connection in the UI
2. ✅ Connection is saved to backend database
3. ✅ Test connection successfully
4. ✅ View tables in Database Explorer
5. ✅ Execute queries in SQL Editor
6. ✅ Test queries in Create API
7. ✅ See detailed logs in backend console
8. ✅ Get helpful error messages if something fails

---

## 🚀 Next Steps

If everything works:
1. Create more connections to test multi-database support
2. Create APIs from your queries
3. Test API execution
4. Monitor logs for any issues

If something still fails:
1. Check backend logs for error messages
2. Check browser console for errors
3. Check network tab for API responses
4. Use the verification commands above
5. Review the troubleshooting section

---

**Last Updated**: 2024  
**Status**: ✅ Fixes Applied  
**Ready for Testing**: Yes
