# 🔧 MySQL Access Denied Error - FIX

## ❌ Error
```
Access denied for user 'root'@'localhost' (using password: NO)
```

## 🔍 Root Cause
The application is trying to connect to MySQL **without a password**, but your MySQL root user requires a password.

---

## ✅ Solution

### Step 1: Find Your MySQL Password

You need to know the password you set when you installed MySQL.

**If you remember it:**
- Use that password in the next step

**If you forgot it:**

#### Option A: Reset MySQL Root Password (Windows)

1. **Stop MySQL Service**
   ```cmd
   net stop mysql
   ```

2. **Start MySQL in Safe Mode**
   ```cmd
   cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
   mysqld --skip-grant-tables --shared-memory
   ```

3. **Open another Command Prompt and connect**
   ```cmd
   mysql -u root
   ```

4. **Reset password**
   ```sql
   USE mysql;
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'NewPassword123!';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **Restart MySQL normally**
   ```cmd
   net start mysql
   ```

#### Option B: Reset MySQL Root Password (Linux/Mac)

1. **Stop MySQL**
   ```bash
   sudo systemctl stop mysql
   ```

2. **Start MySQL in safe mode**
   ```bash
   sudo mysqld_safe --skip-grant-tables &
   ```

3. **Connect to MySQL**
   ```bash
   mysql -u root
   ```

4. **Reset password**
   ```sql
   USE mysql;
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'NewPassword123!';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **Restart MySQL**
   ```bash
   sudo systemctl start mysql
   ```

---

### Step 2: Update .env File

Open `server/.env` and replace `your_mysql_password_here` with your actual MySQL password:

```env
# BEFORE (wrong)
MYSQL_DB_PASSWORD=your_mysql_password_here

# AFTER (correct - use YOUR actual password)
MYSQL_DB_PASSWORD=YourActualPassword123!
```

**Example:**
```env
MYSQL_DB_HOST=localhost
MYSQL_DB_PORT=3306
MYSQL_DB_USER=root
MYSQL_DB_PASSWORD=MySecretPassword123!
MYSQL_DB_NAME=sql_api_builder
```

---

### Step 3: Verify MySQL is Running

**Windows:**
```cmd
net start mysql
```

**Linux:**
```bash
sudo systemctl status mysql
```

**Test connection:**
```bash
mysql -u root -p
# Enter your password when prompted
```

If you can connect, your password is correct!

---

### Step 4: Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS sql_api_builder;
SHOW DATABASES;
EXIT;
```

---

### Step 5: Run Migrations

```bash
cd server
mysql -u root -p sql_api_builder < migrations/mysql/001_initial_schema.sql
```

Enter your password when prompted.

---

### Step 6: Start Backend

```bash
cd server
npm run dev
```

**Expected output:**
```
✅ MySQL application database connected
   Host: localhost
   Database: sql_api_builder
   User: root
🚀 SQL API Builder Server running on port 3001
```

---

## 🧪 Quick Test

### Test 1: Verify .env file
```bash
cd server
cat .env | grep MYSQL_DB_PASSWORD
```

Should show:
```
MYSQL_DB_PASSWORD=YourActualPassword
```

NOT:
```
MYSQL_DB_PASSWORD=your_mysql_password_here
```

### Test 2: Test MySQL connection manually
```bash
mysql -u root -p
# Enter password
SELECT 1;
EXIT;
```

Should work without errors.

### Test 3: Start backend
```bash
cd server
npm run dev
```

Should connect successfully.

---

## 🔒 Security Note

**Never commit your .env file to Git!**

The `.env` file contains sensitive credentials. It's already in `.gitignore`.

For production:
- Use strong, unique passwords
- Don't use root user (create dedicated user)
- Enable SSL/TLS
- Restrict network access

---

## 🐛 Still Getting Errors?

### Error: "Access denied for user 'root'@'localhost'"

**Cause:** Wrong password in .env

**Fix:**
1. Double-check your MySQL password
2. Update `server/.env` with correct password
3. Restart backend: `npm run dev`

### Error: "Unknown database 'sql_api_builder'"

**Cause:** Database doesn't exist

**Fix:**
```bash
mysql -u root -p
CREATE DATABASE sql_api_builder;
EXIT;
```

### Error: "ECONNREFUSED"

**Cause:** MySQL is not running

**Fix:**
```bash
# Windows
net start mysql

# Linux
sudo systemctl start mysql

# Mac
brew services start mysql
```

### Error: "Can't connect to MySQL server on 'localhost'"

**Cause:** MySQL not installed or not in PATH

**Fix:**
1. Install MySQL from https://dev.mysql.com/downloads/
2. Or use XAMPP/WAMP which includes MySQL
3. Make sure MySQL service is running

---

## 📋 Complete Setup Checklist

- [ ] MySQL installed and running
- [ ] Know your MySQL root password
- [ ] Created `server/.env` file
- [ ] Set `MYSQL_DB_PASSWORD` in .env
- [ ] Created database: `sql_api_builder`
- [ ] Ran migrations
- [ ] Backend starts without errors
- [ ] Can connect from frontend

---

## 🎯 Example .env File

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MySQL Configuration
DB_TYPE=mysql
MYSQL_DB_HOST=localhost
MYSQL_DB_PORT=3306
MYSQL_DB_USER=root
MYSQL_DB_PASSWORD=MyStrongPassword123!
MYSQL_DB_NAME=sql_api_builder

# Security
ENCRYPTION_KEY=my-super-secret-encryption-key-32-chars-long!
JWT_SECRET=my-super-secret-jwt-secret-key

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## ✅ Success Indicators

When everything is working, you should see:

```
✅ MySQL application database connected
   Host: localhost
   Database: sql_api_builder
   User: root
🚀 SQL API Builder Server running on port 3001
💚 Health check: http://localhost:3001/health
🗄️  Database type: MYSQL
```

---

## 📚 Related Documentation

- `MYSQL_SETUP_GUIDE.md` - Complete MySQL setup
- `MYSQL_QUICK_START.md` - Quick start guide
- `TROUBLESHOOTING_DATABASE_ISSUES.md` - Troubleshooting

---

**Status**: ✅ Fixed  
**Action Required**: Update `server/.env` with your MySQL password
