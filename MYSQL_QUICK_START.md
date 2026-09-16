# 🎯 MySQL Connection - Step by Step Guide

This guide will help you connect SQL API Builder to your local MySQL database in **5 minutes**.

---

## 📋 What You'll Need

✅ MySQL installed on your computer  
✅ MySQL username and password (usually `root`)  
✅ Node.js installed  
✅ This project cloned/downloaded  

---

## 🚀 Step-by-Step Instructions

### Step 1: Verify MySQL is Running

**Open a terminal/command prompt and run:**

```bash
mysql --version
```

**Expected output:**
```
mysql  Ver 8.0.35 for Linux on x86_64 (MySQL Community Server - GPL)
```

❌ **If MySQL is not installed:**
- **Windows**: Download from https://dev.mysql.com/downloads/installer/
- **macOS**: `brew install mysql`
- **Linux**: `sudo apt-get install mysql-server`

---

### Step 2: Test MySQL Login

**Try to login to MySQL:**

```bash
mysql -u root -p
```

**Enter your password when prompted.**

✅ **If you can login:** Continue to Step 3  
❌ **If you get "Access denied":** 
- Reset your MySQL root password
- Or use a different MySQL user

---

### Step 3: Run the Quick Setup Script

**Linux/macOS:**
```bash
chmod +x setup-mysql.sh
./setup-mysql.sh
```

**Windows:**
```bash
setup-mysql.bat
```

**The script will ask you:**
```
MySQL Host (default: localhost): [press Enter]
MySQL Port (default: 3306): [press Enter]
MySQL Username (default: root): [press Enter]
MySQL Password: [type your password]
Database Name (default: sql_api_builder): [press Enter]
```

**What the script does:**
1. ✅ Creates `.env` file with your credentials
2. ✅ Creates the database
3. ✅ Runs migrations (creates all tables)
4. ✅ Installs dependencies
5. ✅ Generates secure encryption keys

---

### Step 4: Start the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```

**You should see:**
```
✅ MySQL application database connected
🚀 SQL API Builder Server running on port 3001
🗄️  Database type: MYSQL
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

**You should see:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

---

### Step 5: Open the Application

**Open your browser and go to:**
```
http://localhost:3000
```

**You should see the SQL API Builder dashboard!** 🎉

---

### Step 6: Connect to Your Own Database

Now let's connect to your own MySQL database (the one you want to create APIs from).

**In the web interface:**

1. **Click "Database Connections"** in the left sidebar

2. **Click "New Connection"** button

3. **Fill in the form:**
   ```
   Connection Name: My Local Database
   Database Type: MySQL
   Host: localhost
   Port: 3306
   Database Name: [your database name]
   Username: root
   Password: [your password]
   SSL: Disable (for local development)
   Timeout: 30
   ```

4. **Click "Test Connection"**
   
   ✅ **If successful:** You'll see "Connection test successful"
   
   ❌ **If failed:** Check the troubleshooting section below

5. **Click "Save Connection"**

---

### Step 7: Create Your First API

**Now let's create an API from your database:**

1. **Click "Database Explorer"** in the left sidebar
2. **Browse your tables** - you should see your database structure
3. **Click "SQL Editor"** in the left sidebar
4. **Write a query:**
   ```sql
   SELECT * FROM your_table LIMIT 10
   ```
5. **Click "Execute"** to test the query
6. **Click "Create API"** button
7. **Configure your API:**
   - API Name: Get Users
   - Endpoint: /api/v1/users
   - Method: GET
8. **Click "Publish API"**

**Your API is now live!** 🚀

---

## 🔍 Manual Setup (Alternative)

If the setup script doesn't work, you can set up manually:

### 1. Create the database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE sql_api_builder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sql_api_builder;
```

### 2. Run migrations

```bash
mysql -u root -p sql_api_builder < server/migrations/mysql/001_initial_schema.sql
```

### 3. Create .env file

```bash
cd server
cp .env.example .env
```

**Edit `.env` and fill in:**
```env
DB_TYPE=mysql
MYSQL_DB_HOST=localhost
MYSQL_DB_PORT=3306
MYSQL_DB_USER=root
MYSQL_DB_PASSWORD=your_password_here
MYSQL_DB_NAME=sql_api_builder
ENCRYPTION_KEY=generate-a-32-char-key
JWT_SECRET=generate-a-secure-secret
```

**Generate secure keys:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Install dependencies

```bash
cd server
npm install
cd ..
npm install
```

### 5. Start the application

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
npm run dev
```

---

## 🧪 Test Your Connection

**Run the test script:**

```bash
cd server
npx ts-node test-mysql-connection.ts
```

**Expected output:**
```
🧪 Testing MySQL Connection...

Connection details:
  Host: localhost
  Port: 3306
  User: root
  Database: sql_api_builder

✅ Successfully connected to MySQL!
✅ Database 'sql_api_builder' exists
✅ Found 9 tables

Tables:
  - users
  - projects
  - database_connections
  - sql_queries
  - apis
  - api_keys
  - api_request_logs
  - audit_logs
  - rate_limit_configs

✅ Query test successful: 2

🎉 All tests passed! MySQL is ready to use.
```

---

## ❌ Troubleshooting

### Problem: "ECONNREFUSED"

**Meaning:** MySQL is not running or not accessible

**Solutions:**
```bash
# Check if MySQL is running
# Windows:
net start mysql

# macOS:
brew services list | grep mysql

# Linux:
sudo systemctl status mysql

# Start MySQL if not running
# Windows:
net start mysql

# macOS:
brew services start mysql

# Linux:
sudo systemctl start mysql
```

---

### Problem: "Access denied for user 'root'"

**Meaning:** Wrong password or user doesn't have permission

**Solutions:**

1. **Reset MySQL root password:**
   ```bash
   # Stop MySQL
   sudo systemctl stop mysql
   
   # Start MySQL in safe mode
   sudo mysqld_safe --skip-grant-tables &
   
   # Login without password
   mysql -u root
   
   # Reset password
   USE mysql;
   UPDATE user SET authentication_string=PASSWORD('new_password') WHERE User='root';
   FLUSH PRIVILEGES;
   EXIT;
   
   # Restart MySQL normally
   sudo systemctl restart mysql
   ```

2. **Or create a new user:**
   ```sql
   mysql -u root -p
   
   CREATE USER 'sqlapi'@'localhost' IDENTIFIED BY 'password123';
   GRANT ALL PRIVILEGES ON *.* TO 'sqlapi'@'localhost';
   FLUSH PRIVILEGES;
   ```
   
   Then use `sqlapi` as username in `.env`

---

### Problem: "Unknown database 'sql_api_builder'"

**Meaning:** Database doesn't exist

**Solutions:**
```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE sql_api_builder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
mysql -u root -p sql_api_builder < server/migrations/mysql/001_initial_schema.sql
```

---

### Problem: "Table doesn't exist"

**Meaning:** Migrations haven't been run

**Solutions:**
```bash
# Run migrations
mysql -u root -p sql_api_builder < server/migrations/mysql/001_initial_schema.sql

# Verify tables exist
mysql -u root -p -e "USE sql_api_builder; SHOW TABLES;"
```

---

### Problem: Port 3001 already in use

**Meaning:** Another process is using port 3001

**Solutions:**

1. **Change the port in `.env`:**
   ```env
   PORT=3002
   ```

2. **Or kill the process:**
   ```bash
   # Find process using port 3001
   # Windows:
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   
   # macOS/Linux:
   lsof -ti:3001 | xargs kill -9
   ```

---

### Problem: "Cannot find module 'mysql2'"

**Meaning:** Dependencies not installed

**Solutions:**
```bash
cd server
npm install
```

---

## 📊 Verify Everything Works

### 1. Check Backend Health

```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-xxTxx:xx:xx.xxxZ"
}
```

### 2. Check Frontend

Open http://localhost:3000 in your browser

**You should see:**
- Dashboard with metrics
- Sidebar navigation
- No error messages

### 3. Test Database Connection in UI

1. Go to "Database Connections"
2. Click "New Connection"
3. Fill in your MySQL credentials
4. Click "Test Connection"
5. Should show "Connection test successful"

---

## 🎓 Next Steps

Once everything is working:

1. **Explore the Database Explorer** - Browse your tables
2. **Try the SQL Editor** - Write and test queries
3. **Create your first API** - Turn a query into a REST endpoint
4. **Generate API Keys** - Secure your APIs
5. **Test your APIs** - Use the built-in API tester
6. **View Documentation** - Auto-generated API docs

---

## 📚 Additional Resources

- **Full MySQL Setup Guide**: [MYSQL_SETUP_GUIDE.md](./MYSQL_SETUP_GUIDE.md)
- **Backend Implementation**: [BACKEND_IMPLEMENTATION.md](./BACKEND_IMPLEMENTATION.md)
- **Main README**: [README.md](./README.md)

---

## 🆘 Still Having Issues?

1. **Check the logs** - Look at the terminal output for error messages
2. **Verify .env file** - Make sure all values are correct
3. **Test MySQL directly** - Try connecting with MySQL Workbench
4. **Check firewall** - Make sure port 3306 is not blocked
5. **Review troubleshooting section** above

---

**🎉 Congratulations! You've successfully connected SQL API Builder to MySQL!**

Now you can create powerful REST APIs from your MySQL database in minutes! 🚀
