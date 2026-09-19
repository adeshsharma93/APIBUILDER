# Database Connection Encryption Error - Complete Fix Guide

## Error Message
```
Failed to connect to database: Failed to decrypt database credentials: Failed to decrypt credential
```

## Root Cause

This error occurs when the application cannot decrypt the database password stored in the `database_connections` table. This typically happens when:

1. **ENCRYPTION_KEY changed** - The key used to encrypt the password is different from the current key
2. **Corrupted data** - The encrypted password in the database is malformed
3. **Missing key** - The ENCRYPTION_KEY environment variable was not set when the connection was created

## Understanding the Encryption

### How It Works

1. **When creating a connection:**
   ```
   User enters password → Encrypt with ENCRYPTION_KEY → Store in database
   ```

2. **When using a connection:**
   ```
   Read from database → Decrypt with ENCRYPTION_KEY → Connect to MySQL
   ```

3. **Encryption format:**
   ```
   iv:authTag:encrypted (all base64 encoded)
   ```

### Why It Fails

If the `ENCRYPTION_KEY` in `.env` is different from when the connection was created, decryption will fail because:
- AES-256-GCM requires the exact same key for decryption
- Even a single character change makes decryption impossible
- The authentication tag will not match

## Diagnostic Steps

### Step 1: Run the Diagnostic Script

```bash
cd server
node check-encryption.js
```

This will show:
- ✅ Which connections can be decrypted
- ❌ Which connections cannot be decrypted
- 💡 Specific error messages for each connection

**Example output:**
```
🔍 Database Connection Encryption Diagnostic Tool

============================================================
ENCRYPTION_KEY: change-this...
Key length: 32 bytes
============================================================

Found 2 database connection(s)

Connection: Production DB
  ID: abc-123-def
  Host: localhost:3306
  Database: production_db
  User: root
  Status: connected
  ✅ Password can be decrypted (12 chars)

Connection: Old DB
  ID: xyz-789-uvw
  Host: localhost:3306
  Database: old_db
  User: admin
  Status: connected
  ❌ Password CANNOT be decrypted
     Error: Unsupported state or unable to authenticate data

============================================================
Summary:
  ✅ Can decrypt: 1
  ❌ Cannot decrypt: 1
============================================================

💡 Solutions:
   1. Delete connections that cannot be decrypted
   2. Recreate them with the current ENCRYPTION_KEY
```

### Step 2: Check Your ENCRYPTION_KEY

Open `server/.env` and check:

```env
ENCRYPTION_KEY=change-this-to-a-secure-32-character-key-in-production!
```

**Important:** This key must be at least 32 characters and should be kept secret.

### Step 3: Check Database Records

```bash
mysql -u root -p sql_api_builder
```

```sql
SELECT 
  id, 
  name, 
  host, 
  database_name,
  LENGTH(encrypted_password) as password_length,
  encrypted_password LIKE '%:%:%' as valid_format
FROM database_connections;
```

**Expected result:**
- `password_length` should be > 50 characters
- `valid_format` should be 1 (true)

If `valid_format` is 0, the encrypted data is corrupted.

## Solutions

### Solution 1: Delete and Recreate Connection (Recommended)

This is the simplest and most reliable solution.

**Step 1: Delete the problematic connection**

```bash
# Option A: Using the diagnostic script output
mysql -u root -p sql_api_builder
DELETE FROM database_connections WHERE id = '<connection-id-from-diagnostic>';
```

**Step 2: Recreate the connection in the UI**

1. Go to Database Connections page
2. Click "New Connection"
3. Fill in the details:
   - Connection Name
   - Project Name
   - Database Type: MySQL
   - Host: localhost
   - Port: 3306
   - Database Name
   - Username
   - Password (enter the actual password)
4. Click "Test Connection"
5. Click "Save Connection"

**Why this works:**
- The new connection will be encrypted with the current ENCRYPTION_KEY
- Decryption will work because the key matches

### Solution 2: Update ENCRYPTION_KEY to Match

If you know the original ENCRYPTION_KEY that was used when creating the connections:

**Step 1: Find the original key**

Check your:
- Old `.env` files
- Git history
- Backup files
- Documentation

**Step 2: Update `.env`**

```env
# Change this to the original key
ENCRYPTION_KEY=original-key-that-was-used
```

**Step 3: Restart the backend**

```bash
cd server
# Stop the server (Ctrl+C)
npm run dev
```

**Step 4: Test the connection**

Go to Database Explorer and try loading the schema.

**⚠️ Warning:** If you change the ENCRYPTION_KEY, any connections created with the new key will fail to decrypt!

### Solution 3: Re-encrypt All Connections

If you have many connections and want to keep them:

**Step 1: Export connection details**

```bash
mysql -u root -p sql_api_builder -e "
  SELECT id, name, host, port, database_name, username 
  FROM database_connections
" > connections_backup.txt
```

**Step 2: Manually decrypt passwords (if possible)**

If you have the old ENCRYPTION_KEY, you can decrypt the passwords:

```javascript
// decrypt-passwords.js
const crypto = require('crypto');

const OLD_KEY = 'old-encryption-key';
const NEW_KEY = 'new-encryption-key';

async function reencrypt(oldEncrypted, oldKey, newKey) {
  // Decrypt with old key
  const oldKeyBuffer = crypto.scryptSync(oldKey, 'salt', 32);
  const parts = oldEncrypted.split(':');
  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', oldKeyBuffer, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  // Encrypt with new key
  const newKeyBuffer = crypto.scryptSync(newKey, 'salt', 32);
  const newIv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', newKeyBuffer, newIv);
  
  let newEncrypted = cipher.update(decrypted, 'utf8', 'base64');
  newEncrypted += cipher.final('base64');
  const newAuthTag = cipher.getAuthTag();
  
  return `${newIv.toString('base64')}:${newAuthTag.toString('base64')}:${newEncrypted}`;
}
```

**Step 3: Update database**

```sql
UPDATE database_connections 
SET encrypted_password = '<new-encrypted-password>'
WHERE id = '<connection-id>';
```

**⚠️ This is complex and error-prone. Solution 1 (delete and recreate) is much simpler.**

## Prevention

### 1. Set ENCRYPTION_KEY Before Creating Connections

Always set a strong ENCRYPTION_KEY in `.env` before creating any database connections:

```env
# Generate a strong key
ENCRYPTION_KEY=$(openssl rand -base64 32)
```

Or use a password manager to generate a 32+ character random string.

### 2. Document Your ENCRYPTION_KEY

Store your ENCRYPTION_KEY in a secure location:
- Password manager (1Password, LastPass, etc.)
- Encrypted file
- Secure notes

**Never commit `.env` to Git!**

### 3. Backup Your Database

Regularly backup the `sql_api_builder` database:

```bash
mysqldump -u root -p sql_api_builder > backup_$(date +%Y%m%d).sql
```

### 4. Test Connections After Key Changes

After changing ENCRYPTION_KEY:

```bash
cd server
node check-encryption.js
```

Verify all connections can be decrypted.

## Common Scenarios

### Scenario 1: Fresh Installation

**Problem:** Created connections, then changed ENCRYPTION_KEY

**Solution:** Delete all connections and recreate them

```bash
mysql -u root -p sql_api_builder
DELETE FROM database_connections;
```

Then recreate in the UI.

### Scenario 2: Development to Production

**Problem:** Connections work in dev but not in production

**Solution:** Ensure ENCRYPTION_KEY is the same in both environments, or recreate connections in production

### Scenario 3: Restored Database Backup

**Problem:** Restored database backup, connections don't work

**Solution:** The backup was created with a different ENCRYPTION_KEY. Either:
- Use the original ENCRYPTION_KEY
- Or delete and recreate connections

### Scenario 4: Multiple Developers

**Problem:** Each developer has different ENCRYPTION_KEY

**Solution:** Share the same ENCRYPTION_KEY via secure channel (password manager, encrypted file)

## Troubleshooting

### Issue: "Invalid encrypted data format"

**Cause:** The encrypted_password in database doesn't have the format `iv:authTag:encrypted`

**Solution:**
```sql
-- Check the format
SELECT id, name, encrypted_password, 
       encrypted_password LIKE '%:%:%' as valid_format
FROM database_connections;

-- Delete invalid records
DELETE FROM database_connections 
WHERE encrypted_password NOT LIKE '%:%:%';
```

Then recreate the connections.

### Issue: "Unsupported state or unable to authenticate data"

**Cause:** The authentication tag doesn't match, meaning the key is wrong

**Solution:** Use the correct ENCRYPTION_KEY or delete and recreate the connection

### Issue: "Invalid IV length"

**Cause:** The IV (Initialization Vector) is corrupted

**Solution:** Delete and recreate the connection

### Issue: "Cannot decrypt empty or invalid data"

**Cause:** The encrypted_password field is empty or NULL

**Solution:**
```sql
-- Find empty passwords
SELECT id, name FROM database_connections 
WHERE encrypted_password IS NULL OR encrypted_password = '';

-- Delete them
DELETE FROM database_connections 
WHERE encrypted_password IS NULL OR encrypted_password = '';
```

Then recreate the connections.

## Security Best Practices

### 1. Use Strong ENCRYPTION_KEY

```bash
# Generate a strong key (Linux/Mac)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Never Commit .env

Add to `.gitignore`:
```
.env
.env.local
.env.production
```

### 3. Rotate Keys Periodically

Every 6-12 months:
1. Generate new ENCRYPTION_KEY
2. Update `.env`
3. Run diagnostic script
4. Recreate connections that fail
5. Restart backend

### 4. Monitor Decryption Failures

Check backend logs for:
```
❌ Decryption failed: ...
```

Address issues immediately.

## Quick Fix Checklist

- [ ] Run `node check-encryption.js` to identify problematic connections
- [ ] Note the connection IDs that cannot be decrypted
- [ ] Delete problematic connections from database
- [ ] Verify ENCRYPTION_KEY in `.env` is set and strong
- [ ] Recreate connections in the UI
- [ ] Test each connection
- [ ] Verify Database Explorer works

## Summary

The "Failed to decrypt credential" error means the database password cannot be decrypted with the current ENCRYPTION_KEY. The simplest solution is to:

1. **Run diagnostic:** `node check-encryption.js`
2. **Delete problematic connections**
3. **Recreate them** with the current ENCRYPTION_KEY

This ensures all credentials are encrypted with the same key and can be decrypted successfully.

---

**Status:** ✅ Diagnostic tools created  
**Solution:** Delete and recreate connections  
**Prevention:** Set ENCRYPTION_KEY before creating connections
