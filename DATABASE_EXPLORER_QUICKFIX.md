# 🔧 Database Explorer Error - Quick Fix

## ❌ Error in Database Explorer?

Here's how to fix it in 3 steps:

---

## 🚀 Quick Fix (3 Steps)

### Step 1: Start Backend Server
```bash
cd server
npm run dev
```

**You should see:**
```
✅ MySQL application database connected
🚀 SQL API Builder Server running on port 3001
```

### Step 2: Test Your Connection
1. Go to **Database Connections** page
2. Find your connection
3. Click **Test** button
4. Wait for status to change to **"connected"** (green badge)

### Step 3: Refresh Database Explorer
1. Go to **Database Explorer** page
2. Select your connection from dropdown
3. Tables should load automatically

---

## 🎯 Most Common Issues

| Error | Solution |
|-------|----------|
| **Backend server is not running** | Run `cd server && npm run dev` |
| **Connection status: disconnected** | Click "Test" button in Database Connections |
| **Connection not found** | Delete and recreate the connection |
| **Failed to fetch tables** | Check MySQL is running and credentials are correct |

---

## 🧪 Verify Everything Works

### Test Backend
```bash
curl http://localhost:3001/health
```
**Expected:** `{"status":"ok",...}`

### Test MySQL
```bash
mysql -u root -p
# Enter password
SELECT 1;
EXIT;
```
**Expected:** Returns `1`

### Test in UI
1. ✅ Backend running
2. ✅ Connection tested and "connected"
3. ✅ Database Explorer shows tables

---

## 📁 What Was Fixed

✅ **Better error messages** - Shows exactly what's wrong  
✅ **Backend health check** - Verifies backend is running  
✅ **Connection status check** - Ensures connection is tested  
✅ **Detailed troubleshooting** - Step-by-step fix instructions  
✅ **Console logging** - Helps debug issues  

---

## 📚 Full Guide

See `DATABASE_EXPLORER_ERROR_FIX.md` for complete troubleshooting.

---

**Status**: ✅ Enhanced error handling  
**Build**: ✅ Successful  
**Ready**: ✅ Yes
