# 🔧 Database Explorer Error - Complete Troubleshooting Guide

## ❌ Common Errors

### Error 1: "Backend server is not running"
```
Backend server is not running. Please start it with: cd server && npm run dev
```

### Error 2: "Connection status: disconnected"
```
Connection status: disconnected. Please test the connection first.
```

### Error 3: "Connection not found"
```
Connection not found in database
```

### Error 4: "Failed to fetch tables"
```
Failed to fetch tables from database
```

---

## ✅ Solutions

### Solution 1: Backend Server Not Running

**Problem**: The backend server is not started.

**Solution**:
```bash
# Open a new terminal
cd server
npm run dev
```

**Expected Output**:
```
✅ MySQL application database connected
   Host: localhost
   Database: sql_api_builder
   User: root
🚀 SQL API Builder Server running on port 3001
```

**Verify**:
```bash
# Check if backend is running
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-..."}
```

---

### Solution 2: Connection Not Tested

**Problem**: The connection exists but hasn't been tested yet.

**Solution**:
1. Go to **Database Connections** page
2. Find your connection in the list
3. Click the **Test** button
4. Wait for the test to complete
5. Status should change to "connected" (green badge)
6. Return to **Database Explorer**
7. Select your connection from the dropdown
8. Tables should load automatically

---

### Solution 3: Connection Not in Backend Database

**Problem**: The connection was created before the backend integration was added.

**Solution**:
1. Go to **Database Connections** page
2. **Delete** the old connection
3. **Create a new connection** with the same details:
   - Connection Name
   - Project Name
   - Database Type (MySQL/SQL Server)
   - Host, Port, Database
   - Username, Password
4. Click **Save Connection**
5. Click **Test Connection**
6. Return to **Database Explorer**

---

### Solution 4: MySQL Connection Issues

**Problem**: Cannot connect to MySQL database.

**Checklist**:

#### 1. MySQL is Running
```bash
# Windows
net start mysql

# Linux
sudo systemctl status mysql

# Mac
brew services list | grep mysql
```

#### 2. Credentials are Correct
```bash
# Test connection manually
mysql -u root -p
# Enter your password
```

If you can't connect, the password is wrong.

#### 3. Database Exists
```bash
mysql -u root -p
```
```sql
SHOW DATABASES;
-- Your database should be in the list
EXIT;
```

If not, create it:
```sql
CREATE DATABASE your_database_name;
```

#### 4. User Has Permissions
```bash
mysql -u root -p
```
```sql
GRANT ALL PRIVILEGES ON your_database_name.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 5. Port is Correct
- Default MySQL port: **3306**
- Default SQL Server port: **1433**

Check your connection settings in Database Connections page.

---

### Solution 5: CORS Errors

**Problem**: Browser console shows CORS errors.

**Solution**:
1. Check backend is running on port 3001
2. Check frontend is running on port 3000
3. Verify CORS settings in `server/.env`:
   ```env
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```
4. Restart backend after changing CORS settings

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Look for error messages
4. Check the **Network** tab for failed requests

### Step 2: Check Backend Logs
Look at the terminal where you ran `npm run dev` in the server directory.

Common log messages:
```
✅ MySQL application database connected
🔍 Fetching connection details for: <uuid>
✅ Found connection: <name>
✅ Got MySQL pool for connection: <uuid>
✅ Found X tables
```

Error messages:
```
❌ Connection not found in database: <uuid>
❌ Failed to decrypt credentials
❌ Failed to connect to user database
❌ Error fetching MySQL tables
```

### Step 3: Test Backend API Directly

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test schema endpoint (replace <connection-id> with actual UUID)
curl http://localhost:3001/api/schema/tables/<connection-id>?dbType=mysql
```

### Step 4: Check Database

```bash
# List all connections
mysql -u root -p sql_api_builder -e "SELECT id, name, host, database_name, status FROM database_connections;"

# Check if your connection exists
mysql -u root -p sql_api_builder -e "SELECT * FROM database_connections WHERE name = 'Your Connection Name';"
```

---

## 🎯 Quick Fix Checklist

Use this checklist to quickly identify and fix the issue:

- [ ] Backend server is running (`cd server && npm run dev`)
- [ ] Frontend server is running (`npm run dev`)
- [ ] MySQL/SQL Server is running
- [ ] Connection exists in Database Connections page
- [ ] Connection status is "connected" (green badge)
- [ ] Connection was tested successfully
- [ ] Database credentials are correct
- [ ] Database exists and is accessible
- [ ] User has SELECT permissions on the database
- [ ] Port is correct (3306 for MySQL, 1433 for SQL Server)
- [ ] No CORS errors in browser console
- [ ] Backend logs show successful connection

---

## 📊 Common Scenarios

### Scenario 1: First Time Setup

**Steps**:
1. Start backend: `cd server && npm run dev`
2. Start frontend: `npm run dev`
3. Login: `admin@sqlapi.dev` / `admin123`
4. Go to **Database Connections**
5. Click **New Connection**
6. Fill in your MySQL details
7. Click **Save Connection**
8. Click **Test Connection**
9. Wait for "connected" status
10. Go to **Database Explorer**
11. Select your connection
12. Tables should load

### Scenario 2: Connection Was Working, Now Broken

**Possible Causes**:
- Backend server stopped
- MySQL server stopped
- Password changed
- Database deleted
- Network issues

**Solution**:
1. Check backend is running
2. Check MySQL is running
3. Test connection manually: `mysql -u root -p`
4. Re-test connection in Database Connections page
5. If still failing, delete and recreate the connection

### Scenario 3: Demo Mode Works, Real Database Doesn't

**This means**:
- Frontend is working correctly
- Backend might not be running
- Connection might not be saved to backend
- MySQL credentials might be wrong

**Solution**:
1. Start backend: `cd server && npm run dev`
2. Check backend logs for errors
3. Verify connection exists in backend database
4. Test MySQL connection manually
5. Recreate the connection if needed

---

## 🐛 Error Messages Explained

### "Backend server is not running"
**Meaning**: The frontend can't reach the backend API.

**Fix**: Start the backend server with `cd server && npm run dev`

### "Connection status: disconnected"
**Meaning**: The connection exists but hasn't been tested or the test failed.

**Fix**: Go to Database Connections and click "Test" button

### "Connection not found"
**Meaning**: The connection ID doesn't exist in the backend database.

**Fix**: Delete the connection and recreate it

### "Failed to fetch tables"
**Meaning**: The backend couldn't retrieve the schema from your database.

**Fix**: Check MySQL is running, credentials are correct, and database exists

### "Access denied for user"
**Meaning**: MySQL rejected the connection due to wrong credentials.

**Fix**: Verify username and password in the connection settings

### "Unknown database"
**Meaning**: The database name doesn't exist in MySQL.

**Fix**: Create the database or check the spelling

### "ECONNREFUSED"
**Meaning**: Can't connect to MySQL server.

**Fix**: Start MySQL service and verify host/port

---

## 🔒 Security Checklist

- [ ] MySQL password is strong and unique
- [ ] Don't use root user in production (create dedicated user)
- [ ] Enable SSL/TLS for remote connections
- [ ] Restrict MySQL to localhost only (if not needed remotely)
- [ ] Regular backups of your databases
- [ ] Monitor connection attempts

---

## 📚 Related Documentation

- `MYSQL_SETUP_GUIDE.md` - Complete MySQL setup
- `MYSQL_ACCESS_DENIED_FIX.md` - Password issues
- `TROUBLESHOOTING_DATABASE_ISSUES.md` - General troubleshooting
- `DATABASE_CONNECTION_FIX.md` - Connection saving issues

---

## 🎉 Success Indicators

When everything works, you should see:

### Backend Logs
```
✅ MySQL application database connected
🔍 Fetching connection details for: <uuid>
✅ Found connection: My Database (localhost:3306/mydb)
✅ Got MySQL pool for connection: <uuid>
✅ Found 5 tables
```

### Frontend
- ✅ Connection dropdown shows your connection
- ✅ Status shows "connected" (green badge)
- ✅ Tables load automatically
- ✅ Can expand tables to see columns
- ✅ Can search tables
- ✅ No errors in browser console

---

## 🆘 Still Having Issues?

### Step 1: Check Everything
Run through the Quick Fix Checklist above.

### Step 2: Check Logs
- Backend terminal logs
- Browser console (F12)
- Browser network tab (F12)

### Step 3: Test Manually
```bash
# Test backend
curl http://localhost:3001/health

# Test MySQL
mysql -u root -p

# Test connection in database
mysql -u root -p sql_api_builder -e "SELECT * FROM database_connections;"
```

### Step 4: Restart Everything
```bash
# Stop all services
# Ctrl+C in all terminals

# Start backend
cd server
npm run dev

# Start frontend (new terminal)
npm run dev
```

### Step 5: Recreate Connection
1. Delete the problematic connection
2. Create a new one with the same details
3. Test the connection
4. Try Database Explorer again

---

## ✅ Summary

**Most Common Issues**:
1. Backend not running → Start with `cd server && npm run dev`
2. Connection not tested → Click "Test" button
3. Wrong credentials → Verify MySQL username/password
4. Database doesn't exist → Create it first

**Quick Fix**:
```bash
# 1. Start backend
cd server && npm run dev

# 2. In another terminal, start frontend
npm run dev

# 3. In the UI:
#    - Go to Database Connections
#    - Test your connection
#    - Go to Database Explorer
#    - Select your connection
```

---

**Status**: ✅ Enhanced error handling  
**Build**: ✅ Successful (747 KB)  
**Ready**: ✅ Yes

**The Database Explorer now provides detailed error messages and troubleshooting steps!** 🚀
