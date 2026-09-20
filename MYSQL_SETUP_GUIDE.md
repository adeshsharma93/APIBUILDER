# MySQL Setup Guide

Complete guide to connect SQL API Builder with your local MySQL database.

## 📋 Prerequisites

Before starting, ensure you have:

1. **MySQL Server** installed and running
   - MySQL 8.0+ recommended
   - MySQL 5.7+ also supported
   
2. **MySQL Client** (one of the following):
   - MySQL Workbench
   - phpMyAdmin
   - Command line mysql client
   - DBeaver
   - Any MySQL GUI tool

3. **Node.js** 18+ and npm installed

4. **Git** (if cloning the repository)

## 🔍 Step 1: Verify MySQL Installation

Open a terminal and check if MySQL is running:

```bash
# Check MySQL version
mysql --version

# Expected output: mysql  Ver 8.0.xx or similar
```

If MySQL is not installed:
- **Windows**: Download from https://dev.mysql.com/downloads/installer/
- **macOS**: `brew install mysql`
- **Linux**: `sudo apt-get install mysql-server` (Ubuntu/Debian)

## 🔐 Step 2: Access MySQL

### Option A: Command Line

```bash
# Login as root user
mysql -u root -p

# Enter your MySQL root password when prompted
```

### Option B: MySQL Workbench

1. Open MySQL Workbench
2. Click on your local MySQL connection
3. Enter your password
4. Click "OK"

## 🗄️ Step 3: Create Application Database

Once logged into MySQL, create the application database:

```sql
-- Create the database
CREATE DATABASE sql_api_builder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify it was created
SHOW DATABASES;

-- Use the database
USE sql_api_builder;
```

## 📝 Step 4: Configure Environment Variables

Navigate to the server directory and create your `.env` file:

```bash
cd server
cp .env.example .env
```

Edit the `.env` file with your MySQL credentials:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MySQL Configuration
DB_TYPE=mysql
MYSQL_DB_HOST=localhost
MYSQL_DB_PORT=3306
MYSQL_DB_USER=root
MYSQL_DB_PASSWORD=your_actual_mysql_password
MYSQL_DB_NAME=sql_api_builder

# Security Configuration (IMPORTANT: Change these!)
ENCRYPTION_KEY=generate-a-secure-32-character-key-here-change-this!
JWT_SECRET=generate-another-secure-secret-here-change-this!

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Generate Secure Keys

Generate secure encryption and JWT keys:

```bash
# Generate ENCRYPTION_KEY (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste into your `.env` file.

## 🏗️ Step 5: Run Database Migrations

Run the MySQL migration script to create all required tables:

### Option A: Using MySQL Command Line

```bash
# From the server directory
mysql -u root -p sql_api_builder < migrations/mysql/001_initial_schema.sql

# Enter your MySQL password when prompted
```

### Option B: Using MySQL Workbench

1. Open MySQL Workbench
2. Select the `sql_api_builder` database
3. Open the file `server/migrations/mysql/001_initial_schema.sql`
4. Click the "Execute" button (lightning icon)
5. Verify all tables were created

### Option C: Using Any MySQL Client

1. Open your MySQL client
2. Connect to your local MySQL server
3. Select the `sql_api_builder` database
4. Execute the SQL in `server/migrations/mysql/001_initial_schema.sql`

## ✅ Step 6: Verify Tables Were Created

Check that all tables were created successfully:

```sql
USE sql_api_builder;
SHOW TABLES;
```

You should see these tables:
- `users`
- `projects`
- `database_connections`
- `sql_queries`
- `apis`
- `api_keys`
- `api_request_logs`
- `audit_logs`
- `rate_limit_configs`

## 📦 Step 7: Install Dependencies

Install backend dependencies:

```bash
# From the server directory
npm install
```

Install frontend dependencies (from project root):

```bash
# From the project root directory
npm install
```

## 🚀 Step 8: Start the Application

### Start Backend Server

```bash
# From the server directory
npm run dev
```

You should see:
```
✅ MySQL application database connected
🚀 SQL API Builder Server running on port 3001
💚 Health check: http://localhost:3001/health
```

### Start Frontend (New Terminal)

```bash
# From the project root directory
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

## 🧪 Step 9: Test the Connection

### Test Backend Health

Open your browser or use curl:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-xxTxx:xx:xx.xxxZ"
}
```

### Test Frontend

Open your browser and go to:
```
http://localhost:3000
```

You should see the SQL API Builder dashboard.

## 🔌 Step 10: Connect to Your Own MySQL Database

Now you can connect the application to your own MySQL databases:

### In the Frontend UI:

1. Go to **Database Connections** page
2. Click **New Connection**
3. Fill in the form:
   - **Connection Name**: My Local Database
   - **Database Type**: MySQL
   - **Host**: localhost
   - **Port**: 3306
   - **Database Name**: your_database_name
   - **Username**: root (or your MySQL user)
   - **Password**: your_mysql_password
   - **SSL**: Disable (for local development)
   - **Timeout**: 30

4. Click **Test Connection**
5. If successful, click **Save Connection**

### Example: Connect to a Sample Database

If you want to test with sample data, create a sample database:

```sql
-- Create sample database
CREATE DATABASE sample_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sample_shop;

-- Create customers table
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO customers (name, email, country, city) VALUES
('John Doe', 'john@example.com', 'USA', 'New York'),
('Jane Smith', 'jane@example.com', 'USA', 'Los Angeles'),
('Rajesh Kumar', 'rajesh@example.com', 'India', 'Mumbai'),
('Priya Sharma', 'priya@example.com', 'India', 'Delhi'),
('Carlos Rodriguez', 'carlos@example.com', 'Spain', 'Madrid');

-- Create orders table
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Insert sample orders
INSERT INTO orders (customer_id, total_amount, status) VALUES
(1, 150.00, 'delivered'),
(2, 89.99, 'shipped'),
(3, 250.50, 'pending'),
(4, 175.25, 'delivered'),
(5, 320.00, 'shipped');
```

Now connect to this database in the UI and create APIs!

## 🛠️ Troubleshooting

### Issue: "ECONNREFUSED" Error

**Problem**: Cannot connect to MySQL

**Solutions**:
1. Check if MySQL is running:
   ```bash
   # Windows
   net start mysql
   
   # macOS/Linux
   sudo systemctl status mysql
   ```

2. Verify MySQL port (default: 3306):
   ```bash
   mysql -u root -p -e "SHOW VARIABLES LIKE 'port';"
   ```

3. Check `.env` file has correct host and port

### Issue: "Access Denied" Error

**Problem**: MySQL user doesn't have permission

**Solutions**:
1. Login as root and grant permissions:
   ```sql
   -- Grant all privileges to root (for development)
   GRANT ALL PRIVILEGES ON sql_api_builder.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   
   -- Or create a dedicated user
   CREATE USER 'sqlapi'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON sql_api_builder.* TO 'sqlapi'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. Update `.env` with the correct username and password

### Issue: "Database not found" Error

**Problem**: Database doesn't exist

**Solutions**:
1. Create the database:
   ```sql
   CREATE DATABASE sql_api_builder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Verify database name in `.env` matches exactly

### Issue: "Table doesn't exist" Error

**Problem**: Migrations haven't been run

**Solutions**:
1. Run the migration script again:
   ```bash
   mysql -u root -p sql_api_builder < migrations/mysql/001_initial_schema.sql
   ```

2. Verify tables exist:
   ```sql
   USE sql_api_builder;
   SHOW TABLES;
   ```

### Issue: "ER_ACCESS_DENIED_ERROR" for User Database

**Problem**: Application can't connect to your user database

**Solutions**:
1. Ensure the MySQL user has permissions to access the database:
   ```sql
   GRANT ALL PRIVILEGES ON your_database.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. Check the database name is spelled correctly in the connection form

### Issue: Port Already in Use

**Problem**: Port 3001 is already in use

**Solutions**:
1. Change the port in `.env`:
   ```env
   PORT=3002
   ```

2. Or kill the process using port 3001:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:3001 | xargs kill -9
   ```

## 🔒 Security Best Practices

### For Development

- Use `root` user for simplicity
- Disable SSL for local connections
- Use strong passwords even in development

### For Production

1. **Create a dedicated MySQL user**:
   ```sql
   CREATE USER 'sqlapi_prod'@'localhost' IDENTIFIED BY 'strong_password_here';
   GRANT SELECT, INSERT, UPDATE, DELETE ON sql_api_builder.* TO 'sqlapi_prod'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Enable SSL/TLS**:
   - Set `ssl_enabled: true` in connection settings
   - Configure MySQL for SSL
   - Use SSL certificates

3. **Use strong encryption keys**:
   - Generate with `crypto.randomBytes(32)`
   - Store in environment variables
   - Never commit to git

4. **Restrict network access**:
   - Bind MySQL to localhost only
   - Use firewall rules
   - Don't expose MySQL port publicly

5. **Regular backups**:
   ```bash
   mysqldump -u root -p sql_api_builder > backup_$(date +%Y%m%d).sql
   ```

## 📊 Monitoring MySQL

### Check Connection Status

```sql
SHOW STATUS LIKE 'Threads_connected';
SHOW PROCESSLIST;
```

### View Database Size

```sql
SELECT 
  table_name AS 'Table',
  round(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'sql_api_builder'
ORDER BY (data_length + index_length) DESC;
```

### Monitor Slow Queries

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';

-- View slow queries
SHOW GLOBAL VARIABLES LIKE 'slow_query%';
```

## 🎯 Next Steps

After successfully connecting to MySQL:

1. **Create your first connection** in the UI
2. **Explore your database** using the Database Explorer
3. **Write SQL queries** in the SQL Editor
4. **Create APIs** from your queries
5. **Generate API keys** for authentication
6. **Test your APIs** using the built-in tester
7. **View documentation** in the Documentation page

## 📚 Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MySQL Workbench](https://www.mysql.com/products/workbench/)
- [mysql2 npm package](https://www.npmjs.com/package/mysql2)
- [MySQL Security Guide](https://dev.mysql.com/doc/refman/8.0/en/security.html)

## 🆘 Getting Help

If you're still having issues:

1. Check the troubleshooting section above
2. Review the main README.md
3. Check server logs for detailed error messages
4. Verify all environment variables are set correctly
5. Ensure MySQL is running and accessible

---

**Happy coding! 🚀**
