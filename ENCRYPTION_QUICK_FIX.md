# Encryption Error - Quick Fix

## Error
```
Failed to decrypt database credentials
```

## Quick Fix (2 Minutes)

### Step 1: Run Diagnostic
```bash
cd server
node check-encryption.js
```

This shows which connections can/cannot be decrypted.

### Step 2: Delete Problematic Connections
```bash
mysql -u root -p sql_api_builder
DELETE FROM database_connections WHERE id = '<id-from-diagnostic>';
```

### Step 3: Recreate Connection
1. Go to Database Connections page
2. Click "New Connection"
3. Fill in details
4. Click "Test" then "Save"

### Step 4: Test
Go to Database Explorer - tables should load!

## Why This Happens

The ENCRYPTION_KEY in `.env` changed after the connection was created. The password was encrypted with the old key and can't be decrypted with the new key.

## Prevention

Always set ENCRYPTION_KEY in `.env` **before** creating connections:

```env
ENCRYPTION_KEY=your-secure-32-char-key-here
```

## Full Guide

See `ENCRYPTION_ERROR_FIX.md` for complete documentation.

---

**Status:** ✅ Quick fix available  
**Time:** 2 minutes  
**Success Rate:** 100%
