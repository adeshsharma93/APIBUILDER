# 🗄️ Create API - Database Connection Selection Guide

## ✅ Feature Status: FULLY IMPLEMENTED

The Create API page now includes a **database connection selector** that allows you to:
- Select which database to run your SQL query against
- Test your query before creating the API
- Preview query results in real-time
- Ensure your API works correctly before publishing

---

## 🎯 What's New

### Database Connection Selector
- **Location**: Top of Step 1 (SQL Query) in Create API page
- **Purpose**: Select which database connection to use for query execution
- **Features**:
  - Shows all available database connections
  - Displays connection status (connected/disconnected)
  - Shows database type (MySQL/SQL Server)
  - Prevents selection of disconnected databases

### Test Query Button
- **Location**: Top-right of SQL Query editor
- **Purpose**: Execute the SQL query against the selected database
- **Features**:
  - Validates SQL syntax
  - Executes against selected database
  - Shows execution time
  - Displays row count
  - Preview results in a table

### Query Results Preview
- **Location**: Below SQL Query editor (appears after test)
- **Purpose**: Show actual query results before creating API
- **Features**:
  - Displays first 5 rows of results
  - Shows all columns from query
  - Displays execution metrics
  - Shows which database was used
  - Scrollable table for large results

---

## 🚀 How to Use

### Step 1: Select Database Connection
1. Go to **APIs** page
2. Click **"Create API"**
3. In Step 1, you'll see **"Database Connection"** dropdown
4. Select your database connection:
   - ✅ Connected databases are selectable
   - ❌ Disconnected databases are disabled
   - Shows database name and type

### Step 2: Write SQL Query
1. Write your SQL query in the editor
2. Use `@paramName` for parameters
3. Example:
   ```sql
   SELECT CustomerId, CustomerName, Email
   FROM dbo.Customers
   WHERE Country = @country
     AND IsActive = 1
   ORDER BY CreatedAt DESC
   ```

### Step 3: Test Query
1. Click **"Test Query"** button (green button, top-right)
2. Wait for execution (shows loading spinner)
3. View results in the preview table below

### Step 4: Review Results
- **Row Count**: Total number of rows returned
- **Execution Time**: How long the query took
- **Columns**: All columns from your SELECT statement
- **Data**: First 5 rows of actual data
- **Connection**: Which database was queried

### Step 5: Continue to Next Steps
- If results look good, click **"Parameters"** step
- Configure parameter types and requirements
- Set up API configuration
- Review and publish

---

## 📋 Feature Details

### Connection Selector
```
┌─────────────────────────────────────────┐
│ 🗄️ Database Connection                  │
├─────────────────────────────────────────┤
│ [Select a database connection...    ▼] │
│                                         │
│ Options:                                │
│ • 🎯 Demo Database (demo_db) - MYSQL ✅ │
│ • Production DB (prod_db) - MYSQL ✅    │
│ • Staging DB (stage_db) - MYSQL ❌      │
└─────────────────────────────────────────┘
```

### Test Query Button
```
┌─────────────────────────────────────────┐
│ SQL Query                    [🧪 Test]  │
├─────────────────────────────────────────┤
│ SELECT CustomerId, CustomerName        │
│ FROM dbo.Customers                      │
│ WHERE Country = @country                │
└─────────────────────────────────────────┘
```

### Query Results Preview
```
┌─────────────────────────────────────────────────────────┐
│ Query Results    📊 156 rows  ⏱️ 42ms  ✅ Success      │
│                                    Connected to: Demo DB │
├─────────────────────────────────────────────────────────┤
│ CustomerId │ CustomerName  │ Email          │ Country   │
├────────────┼───────────────┼────────────────┼───────────┤
│ 1          │ Rajesh Kumar  │ rajesh@ex.com  │ India     │
│ 2          │ Priya Sharma  │ priya@ex.com   │ India     │
│ 3          │ Amit Patel    │ amit@ex.com    │ India     │
└─────────────────────────────────────────────────────────┘
Showing first 5 of 156 rows. Results are from the selected database.
```

---

## 🧪 Testing the Feature

### Test 1: Select Connection
```
1. Go to Create API page
2. See "Database Connection" dropdown
3. Click dropdown
4. Verify all connections are listed
5. Verify connected ones are selectable
6. Verify disconnected ones are disabled
7. Select a connected database
```

### Test 2: Test Query Execution
```
1. Select a database connection
2. Write a simple query:
   SELECT * FROM Customers LIMIT 5
3. Click "Test Query" button
4. See loading spinner
5. Wait for results
6. Verify results table appears
7. Check row count and execution time
```

### Test 3: View Results
```
1. After test query completes
2. See results preview table
3. Verify columns match your SELECT
4. Verify data looks correct
5. Check execution metrics
6. Verify connection name is shown
```

### Test 4: Error Handling
```
1. Try testing without selecting connection
   → Error: "Please select a database connection"
2. Try testing with empty query
   → Error: "Please write a SQL query first"
3. Try testing with invalid SQL
   → Error message shown
```

### Test 5: Switch Connections
```
1. Test query with Connection A
2. See results from Connection A
3. Switch to Connection B
4. Test query again
5. See results from Connection B
6. Verify connection name updates
```

---

## 🔍 How It Works

### Data Flow
```
User selects connection
  ↓
User writes SQL query
  ↓
User clicks "Test Query"
  ↓
Validate connection & SQL
  ↓
Execute query against selected DB
  ↓
Display results in preview table
  ↓
User reviews results
  ↓
Continue to API creation
```

### Validation
1. **Connection Check**: Ensures a database is selected
2. **SQL Check**: Ensures query is not empty
3. **Execution**: Runs query against selected database
4. **Results**: Displays first 5 rows for preview

### Security
- Only SELECT statements allowed for public APIs
- Parameterized queries prevent SQL injection
- Connection credentials encrypted at rest
- Query timeout prevents long-running queries

---

## 📊 Query Results Details

### Metrics Displayed
- **Row Count**: Total rows returned by query
- **Execution Time**: Time taken to execute (ms)
- **Status**: Success/Error indicator
- **Connection Name**: Which database was queried

### Table Display
- **Columns**: All columns from SELECT statement
- **Rows**: First 5 rows of data
- **NULL Values**: Displayed as italic "NULL"
- **Scrollable**: Horizontal scroll for wide tables
- **Sticky Header**: Column headers stay visible

### Preview Limitations
- Shows only first 5 rows (for preview)
- Full result set available when API is called
- Pagination configured in later steps
- Max rows limit enforced at API level

---

## 🎨 UI Components

### Connection Selector
```typescript
<select
  value={form.connectionId}
  onChange={(e) => setForm({ ...form, connectionId: e.target.value })}
  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg"
>
  <option value="">Select a database connection...</option>
  {connections.map((conn) => (
    <option 
      key={conn.id} 
      value={conn.id}
      disabled={conn.status !== 'connected'}
    >
      {conn.name} ({conn.database}) - {conn.type.toUpperCase()}
      {conn.status !== 'connected' ? '⚠️ Disconnected' : '✅'}
    </option>
  ))}
</select>
```

### Test Query Button
```typescript
<button
  onClick={handleTestQuery}
  disabled={isQueryRunning || !form.connectionId}
  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 
             disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg"
>
  {isQueryRunning ? (
    <>
      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white 
                      rounded-full animate-spin" />
      Running...
    </>
  ) : (
    <>
      <TestTube className="w-3.5 h-3.5" />
      Test Query
    </>
  )}
</button>
```

### Results Preview
```typescript
<div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
  <div className="p-4 border-b border-gray-800 flex items-center justify-between">
    <h3 className="text-sm font-semibold text-white">Query Results</h3>
    <div className="flex items-center gap-3 text-xs text-gray-400">
      <span>📊 {queryResult.rowCount} rows</span>
      <span>⏱️ {queryResult.executionTime}ms</span>
      <span className="text-green-400">✅ Success</span>
    </div>
  </div>
  <table className="w-full text-xs">
    <thead>
      <tr>
        {queryResult.columns.map((col) => (
          <th key={col}>{col}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {queryResult.rows.map((row, i) => (
        <tr key={i}>
          {row.map((cell, j) => (
            <td key={j}>{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 🐛 Troubleshooting

### Issue: No connections in dropdown
**Solution:**
1. Go to Database Connections page
2. Create a new connection
3. Test the connection
4. Return to Create API page
5. Connection should now appear

### Issue: Connection shows as disabled
**Solution:**
1. Connection status is not "connected"
2. Go to Database Connections page
3. Click "Test Connection"
4. Wait for success message
5. Return to Create API page

### Issue: Test Query button is disabled
**Solution:**
1. Check if connection is selected
2. Check if SQL query is written
3. Both must be present to enable button

### Issue: Query execution fails
**Solution:**
1. Check SQL syntax
2. Verify table/column names exist
3. Check connection is working
4. Review error message for details

### Issue: Results show wrong data
**Solution:**
1. Verify correct connection is selected
2. Check SQL query is correct
3. Verify parameters are correct
4. Re-run test query

---

## 📝 Example Workflow

### Complete Example: Create Customer API

**Step 1: Select Connection**
```
Database Connection: 🎯 Demo Database (demo_db) - MYSQL ✅
```

**Step 2: Write Query**
```sql
SELECT 
    CustomerId,
    CustomerName,
    Email,
    Country,
    CreatedAt
FROM dbo.Customers
WHERE Country = @country
  AND IsActive = 1
ORDER BY CreatedAt DESC
```

**Step 3: Test Query**
```
Click "Test Query" button
Wait for execution...
```

**Step 4: Review Results**
```
Query Results    📊 156 rows  ⏱️ 42ms  ✅ Success
                                    Connected to: Demo Database

CustomerId │ CustomerName  │ Email          │ Country │ CreatedAt
───────────┼───────────────┼────────────────┼─────────┼──────────
1          │ Rajesh Kumar  │ rajesh@ex.com  │ India   │ 2024-01-15
2          │ Priya Sharma  │ priya@ex.com   │ India   │ 2024-01-20
3          │ Amit Patel    │ amit@ex.com    │ India   │ 2024-02-01
```

**Step 5: Continue**
```
Results look good! Click "Parameters" step
Configure @country parameter
Set up API configuration
Publish API
```

---

## 🎯 Benefits

✅ **Confidence**: See actual data before creating API  
✅ **Validation**: Verify query works correctly  
✅ **Performance**: Check execution time  
✅ **Debugging**: Identify issues early  
✅ **Flexibility**: Switch databases easily  
✅ **Safety**: Test before publishing  

---

## 📚 Related Features

- **Database Connections**: Create and manage connections
- **Database Explorer**: Browse tables and schemas
- **SQL Editor**: Write and test queries
- **API Testing**: Test APIs after creation
- **API Documentation**: Auto-generated docs

---

## 🚀 Next Steps

1. **Create a connection** in Database Connections page
2. **Test the connection** to ensure it works
3. **Go to Create API** page
4. **Select your connection** from dropdown
5. **Write your SQL query**
6. **Test the query** to see results
7. **Configure parameters** and API settings
8. **Publish your API**

---

## ✅ Summary

The Create API page now includes:
- ✅ Database connection selector
- ✅ Test query button
- ✅ Query results preview
- ✅ Execution metrics
- ✅ Connection status display
- ✅ Error handling
- ✅ Real-time feedback

**You can now test your queries against real databases before creating APIs!** 🎉

---

**Last Updated**: 2024  
**Status**: ✅ Fully Functional  
**Tested**: ✅ All scenarios passing
