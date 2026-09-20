# SQL API Builder

A production-ready platform for creating REST APIs from SQL queries with enterprise-grade security, encryption, and monitoring.

## 🎯 Overview

SQL API Builder allows you to:
- Connect to SQL Server databases
- Write and test SQL queries
- Automatically generate REST API endpoints
- Manage API keys with encryption
- Monitor API usage and performance
- Enforce security policies (parameterized queries, rate limiting, etc.)

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  React + TypeScript + Vite
│   (Port 3000)   │  Tailwind CSS, Zustand
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│   Backend       │  Node.js + Express + TypeScript
│   (Port 3001)   │  mssql, bcrypt, JWT
└────────┬────────┘
         │
         │ TDS (SQL Server protocol)
         │
┌────────▼────────┐
│  SQL Server     │  Your databases
│  Databases      │  + Application DB
└─────────────────┘
```

## 📦 Project Structure

```
.
├── src/                    # Frontend (React)
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript types
│   └── data/             # Mock data
│
├── server/               # Backend (Express)
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, rate limiting
│   │   └── utils/        # Encryption, validation
│   ├── migrations/       # SQL schema
│   └── .env.example      # Environment template
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

**Option 1: MySQL (Recommended for local development)**
- Node.js 18+ and npm
- MySQL 8.0+ (or 5.7+)
- MySQL client (MySQL Workbench, phpMyAdmin, or command line)

**Option 2: SQL Server**
- Node.js 18+ and npm
- SQL Server (2019+ recommended)
- SQL Server authentication enabled

### MySQL Quick Setup (Recommended)

**Linux/macOS:**
```bash
chmod +x setup-mysql.sh
./setup-mysql.sh
```

**Windows:**
```bash
setup-mysql.bat
```

The setup script will:
1. Ask for your MySQL credentials
2. Create the database
3. Run migrations
4. Install dependencies
5. Generate secure encryption keys

Then start the application:
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

Visit http://localhost:3000

📚 **Detailed MySQL setup guide**: See [MYSQL_SETUP_GUIDE.md](./MYSQL_SETUP_GUIDE.md)

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Setup Application Database

Create the application database in SQL Server:

```sql
-- Connect to SQL Server and run:
CREATE DATABASE SQLAPIBuilder;
```

Then run the migration:

```bash
cd server
# Copy .env.example to .env and configure
cp .env.example .env

# Edit .env with your SQL Server credentials
nano .env

# Run migrations (you can use SSMS, Azure Data Studio, or sqlcmd)
sqlcmd -S localhost -U sa -P YourPassword -d SQLAPIBuilder -i migrations/001_initial_schema.sql
```

### 3. Configure Environment

Edit `server/.env`:

```env
# Application Database
APP_DB_SERVER=localhost
APP_DB_PORT=1433
APP_DB_NAME=SQLAPIBuilder
APP_DB_USER=sa
APP_DB_PASSWORD=YourStrong@Passw0rd

# Encryption (CHANGE THIS!)
ENCRYPTION_KEY=your-super-secret-32-char-key-here-change-this!

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-jwt-secret-change-this
```

### 4. Start the Application

```bash
# Start backend (in one terminal)
cd server
npm run dev

# Start frontend (in another terminal)
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 🔐 Security Features

### 1. Credential Encryption

All database passwords are encrypted using **AES-256-GCM** before storage:

```typescript
// Encryption flow:
Password → AES-256-GCM → iv:authTag:encrypted (stored in DB)
```

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key derivation**: SCrypt (from ENCRYPTION_KEY)
- **IV**: Random 16 bytes per encryption
- **Auth Tag**: Prevents tampering

### 2. SQL Injection Prevention

All queries use **parameterized statements**:

```typescript
// ✅ SAFE - Parameterized
const result = await request
  .input('country', 'India')
  .query('SELECT * FROM Customers WHERE Country = @country');

// ❌ DANGEROUS - Never do this
const result = await request.query(`SELECT * FROM Customers WHERE Country = '${userInput}'`);
```

### 3. SQL Validation

The backend validates all SQL queries:

- **Blocks dangerous operations**: DROP, DELETE, UPDATE, INSERT, ALTER, etc.
- **Allows only SELECT** for public APIs
- **Prevents SQL injection patterns**
- **Enforces parameterized queries**

### 4. API Key Security

- **Hashed storage**: API keys are hashed with bcrypt (never stored in plain text)
- **One-time display**: Full key shown only at creation
- **Prefix identification**: First 14 chars stored for identification
- **Expiration support**: Keys can have expiration dates
- **Scope limitation**: Keys can be restricted to specific APIs

### 5. Rate Limiting

Configurable per-API rate limiting:

```typescript
// Example: 100 requests per minute
{
  rate_limit: 100,
  rate_limit_window: '1m'
}
```

Returns `429 Too Many Requests` when exceeded.

### 6. Audit Logging

All actions are logged:

- API requests (with parameters, response time, status)
- Administrative actions (create/delete connections, APIs, keys)
- Failed authentication attempts
- SQL query executions

## 📊 Database Schema

### Core Tables

1. **users** - Platform users (admin, developer, viewer)
2. **projects** - Multi-tenant project isolation
3. **database_connections** - Encrypted connection configs
4. **sql_queries** - Saved SQL queries
5. **apis** - API definitions and metadata
6. **api_keys** - Hashed API keys
7. **api_request_logs** - Request history
8. **audit_logs** - Administrative actions
9. **rate_limit_configs** - Rate limiting rules

### Key Relationships

```
projects
  ├── database_connections (1:N)
  ├── sql_queries (1:N)
  │     └── apis (1:1)
  │           ├── api_request_logs (1:N)
  │           └── rate_limit_configs (1:1)
  └── api_keys (1:N)
```

## 🛠️ API Endpoints

### Backend API (Port 3001)

#### Database Connections

```
GET    /api/connections?project_id={id}     # List connections
POST   /api/connections                     # Create connection
GET    /api/connections/:id                 # Get connection
POST   /api/connections/:id/test            # Test connection
DELETE /api/connections/:id                 # Delete connection
```

#### API Execution (Public Endpoints)

```
GET  /api/execute/:apiId?param1=value1     # Execute API (GET)
POST /api/execute/:apiId                   # Execute API (POST)
GET  /api/apis?project_id={id}             # List published APIs
```

#### Authentication

All `/api/execute/*` endpoints require:

```
Authorization: Bearer sk_live_...
```

### Example API Call

```bash
curl -X GET "http://localhost:3001/api/execute/abc123?country=India" \
  -H "Authorization: Bearer sk_live_x7k9m2p4..." \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "CustomerId": 1,
      "CustomerName": "Rajesh Kumar",
      "Email": "rajesh@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 156,
    "totalPages": 4
  },
  "rowCount": 50,
  "executionTime": 42
}
```

## 🎨 Frontend Features

### Dashboard

- Connected databases count
- Published APIs count
- API requests today
- Failed requests
- Average response time
- Request charts (24h)
- Response time metrics (P50, P95, P99)

### Database Explorer

- Browse schemas, tables, columns
- View indexes and relationships
- Click to copy column names
- Real-time schema inspection

### SQL Editor

- Monaco Editor with SQL syntax highlighting
- Auto-completion
- Query execution with results table
- Parameter detection
- Save queries for reuse

### API Builder

- Visual API creation workflow
- Automatic parameter detection
- Configure pagination, caching, rate limits
- Test API before publishing
- Generate cURL examples

### API Keys Management

- Create API keys with scopes
- View key prefix (never full key after creation)
- Revoke keys
- Track usage statistics

### Monitoring & Logs

- Request logs with filtering
- Error tracking
- Response time metrics
- Rate limit monitoring

## 🔧 Configuration

### API Configuration Options

```typescript
{
  name: "Get Customers by Country",
  endpoint: "/api/v1/customers",
  method: "GET",
  auth_required: true,              // Require API key
  rate_limit: 100,                  // Requests per window
  rate_limit_window: "1m",          // Time window
  cache_duration: 60,               // Cache seconds (0 = disabled)
  max_rows: 1000,                   // Maximum result rows
  timeout: 30,                      // Query timeout (seconds)
  pagination_enabled: true,         // Enable pagination
  page_size: 50                     // Default page size
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `APP_DB_SERVER` | SQL Server host | `localhost` |
| `APP_DB_PORT` | SQL Server port | `1433` |
| `APP_DB_NAME` | Application database name | `SQLAPIBuilder` |
| `APP_DB_USER` | Database username | `sa` |
| `APP_DB_PASSWORD` | Database password | - |
| `ENCRYPTION_KEY` | Encryption key (32+ chars) | - |
| `JWT_SECRET` | JWT signing secret | - |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

## 🧪 Testing

### Test Database Connection

```bash
curl -X POST http://localhost:3001/api/connections/{id}/test
```

### Test API Execution

```bash
curl -X GET "http://localhost:3001/api/execute/{apiId}?country=India" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Frontend Tests

```bash
npm run test
```

## 📝 Development

### Backend Development

```bash
cd server
npm run dev    # Start with hot reload
npm run build  # Build for production
npm start      # Run production build
```

### Frontend Development

```bash
npm run dev    # Start dev server
npm run build  # Build for production
npm run preview # Preview production build
```

## 🚢 Production Deployment

### 1. Build Frontend

```bash
npm run build
# Output: dist/
```

### 2. Build Backend

```bash
cd server
npm run build
# Output: server/dist/
```

### 3. Environment Configuration

Create production `.env`:

```env
NODE_ENV=production
PORT=3001

# Use strong, unique keys
ENCRYPTION_KEY=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Production database
APP_DB_SERVER=your-production-server.database.windows.net
APP_DB_PASSWORD=strong-production-password
```

### 4. Run with PM2

```bash
# Install PM2
npm install -g pm2

# Start backend
cd server
pm2 start dist/index.js --name sql-api-backend

# Serve frontend (or use nginx)
pm2 serve ../dist 3000 --name sql-api-frontend
```

### 5. Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🚀 Complete Deployment Guide

### 📋 Table of Contents
- [Local Development Deployment](#local-development-deployment)
- [Production Server Deployment](#production-server-deployment)
- [MySQL Database Deployment](#mysql-database-deployment)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Database Backup & Recovery](#database-backup--recovery)

---

## 🖥️ Local Development Deployment

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+ or SQL Server 2019+
- Git (optional)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd SQL-API-Builder

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 2: Database Setup

#### For MySQL:

```bash
# Login to MySQL
mysql -u root -p

# Create application database
CREATE DATABASE sql_api_builder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit MySQL
EXIT;

# Run migrations
cd server
mysql -u root -p sql_api_builder < migrations/mysql/001_initial_schema.sql
```

#### For SQL Server:

```bash
# Login to SQL Server
sqlcmd -S localhost -U sa

# Create application database
1> CREATE DATABASE SQLAPIBuilder;
2> GO
3> EXIT

# Run migrations
cd server
sqlcmd -S localhost -U sa -P YourPassword -d SQLAPIBuilder -i migrations/001_initial_schema.sql
```

### Step 3: Configure Environment

```bash
cd server

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use any text editor
```

**Example `.env` for MySQL:**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MySQL Configuration
DB_TYPE=mysql
MYSQL_DB_HOST=localhost
MYSQL_DB_PORT=3306
MYSQL_DB_USER=root
MYSQL_DB_PASSWORD=your_mysql_password
MYSQL_DB_NAME=sql_api_builder

# Security Configuration
ENCRYPTION_KEY=your-super-secret-encryption-key-min-32-chars
JWT_SECRET=your-jwt-secret-key-change-this

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Generate secure keys:**
```bash
# Generate ENCRYPTION_KEY (Linux/macOS)
openssl rand -base64 32

# Generate ENCRYPTION_KEY (Windows PowerShell)
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Generate JWT_SECRET (Linux/macOS)
openssl rand -base64 64
```

### Step 4: Start Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Step 5: Verify Deployment

```bash
# Test backend health
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-xxTxx:xx:xx.xxxZ"}

# Open frontend
# Visit: http://localhost:3000
```

---

## 🌐 Production Server Deployment

### Option 1: Linux Server (Ubuntu/Debian)

#### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### Step 2: Setup MySQL Database

```bash
# Login to MySQL as root
sudo mysql

# Create application database
CREATE DATABASE sql_api_builder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create dedicated user for the application
CREATE USER 'sqlapi_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON sql_api_builder.* TO 'sqlapi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
mysql -u sqlapi_user -p sql_api_builder < server/migrations/mysql/001_initial_schema.sql
```

#### Step 3: Deploy Application

```bash
# Create application directory
sudo mkdir -p /var/www/sql-api-builder
cd /var/www/sql-api-builder

# Clone your repository
sudo git clone <your-repo-url> .

# Install dependencies
sudo npm install
cd server
sudo npm install
cd ..

# Configure environment
cd server
sudo cp .env.example .env
sudo nano .env
```

**Production `.env` example:**
```env
PORT=3001
NODE_ENV=production

# MySQL Configuration
DB_TYPE=mysql
MYSQL_DB_HOST=localhost
MYSQL_DB_PORT=3306
MYSQL_DB_USER=sqlapi_user
MYSQL_DB_PASSWORD=StrongPassword123!
MYSQL_DB_NAME=sql_api_builder

# Security (USE STRONG KEYS!)
ENCRYPTION_KEY=<generate-with-openssl-rand-base64-32>
JWT_SECRET=<generate-with-openssl-rand-base64-64>

# CORS (restrict to your domain)
CORS_ORIGINS=https://yourdomain.com
```

#### Step 4: Build Application

```bash
# Build frontend
npm run build

# Build backend
cd server
npm run build
cd ..
```

#### Step 5: Start with PM2

```bash
# Start backend
cd server
pm2 start dist/index.js --name sql-api-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### Step 6: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/sql-api-builder
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    location / {
        root /var/www/sql-api-builder/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    location /api/execute {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Enable the site:**
```bash
# Enable configuration
sudo ln -s /etc/nginx/sites-available/sql-api-builder /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 7: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

---

### Option 2: Windows Server

#### Step 1: Install Prerequisites

1. **Install Node.js**: Download from https://nodejs.org/
2. **Install MySQL**: Download from https://dev.mysql.com/downloads/installer/
3. **Install IIS**: Enable Internet Information Services in Windows Features
4. **Install URL Rewrite**: https://www.iis.net/downloads/microsoft/url-rewrite

#### Step 2: Setup MySQL Database

```powershell
# Open MySQL Command Line
mysql -u root -p

# Create database
CREATE DATABASE sql_api_builder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user
CREATE USER 'sqlapi_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON sql_api_builder.* TO 'sqlapi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
mysql -u sqlapi_user -p sql_api_builder < server\migrations\mysql\001_initial_schema.sql
```

#### Step 3: Deploy Application

```powershell
# Create application directory
mkdir C:\inetpub\wwwroot\sql-api-builder
cd C:\inetpub\wwwroot\sql-api-builder

# Clone or copy your application
git clone <your-repo-url> .

# Install dependencies
npm install
cd server
npm install
cd ..

# Configure environment
cd server
copy .env.example .env
notepad .env
```

#### Step 4: Build and Start

```powershell
# Build application
npm run build
cd server
npm run build
cd ..

# Install PM2 for Windows
npm install -g pm2-windows-startup
pm2-startup install

# Start backend
cd server
pm2 start dist\index.js --name sql-api-backend
pm2 save
```

#### Step 5: Configure IIS

1. Open IIS Manager
2. Create a new website:
   - Site name: SQL API Builder
   - Physical path: `C:\inetpub\wwwroot\sql-api-builder\dist`
   - Port: 80 (or 443 for HTTPS)

3. Create `web.config` in the dist folder:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
        </rule>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <httpProtocol>
      <customHeaders>
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-XSS-Protection" value="1; mode=block" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

---

## 🗄️ MySQL Database Deployment

### Local MySQL Setup

#### Step 1: Install MySQL

**Windows:**
1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Run installer and choose "Developer Default"
3. Set root password during installation
4. Complete installation

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server

# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Set root password
sudo mysql_secure_installation
```

**macOS:**
```bash
# Using Homebrew
brew install mysql

# Start MySQL
brew services start mysql

# Set root password
mysql_secure_installation
```

#### Step 2: Create Application Database

```bash
# Login to MySQL
mysql -u root -p

# Create database with proper character set
CREATE DATABASE sql_api_builder 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

# Verify database creation
SHOW DATABASES;

# Use the database
USE sql_api_builder;
```

#### Step 3: Create Dedicated User (Recommended)

```sql
-- Create application user
CREATE USER 'sqlapi_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';

-- Grant necessary privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON sql_api_builder.* TO 'sqlapi_user'@'localhost';
GRANT CREATE, ALTER, DROP ON sql_api_builder.* TO 'sqlapi_user'@'localhost';
GRANT INDEX, REFERENCES ON sql_api_builder.* TO 'sqlapi_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify user creation
SELECT User, Host FROM mysql.user;
```

#### Step 4: Run Migrations

```bash
# Navigate to server directory
cd server

# Run migration script
mysql -u sqlapi_user -p sql_api_builder < migrations/mysql/001_initial_schema.sql

# Verify tables were created
mysql -u sqlapi_user -p -e "USE sql_api_builder; SHOW TABLES;"
```

**Expected tables:**
- `users`
- `projects`
- `database_connections`
- `sql_queries`
- `apis`
- `api_keys`
- `api_request_logs`
- `audit_logs`
- `rate_limit_configs`

#### Step 5: Configure Application

Edit `server/.env`:

```env
# MySQL Configuration
DB_TYPE=mysql
MYSQL_DB_HOST=localhost
MYSQL_DB_PORT=3306
MYSQL_DB_USER=sqlapi_user
MYSQL_DB_PASSWORD=YourStrongPassword123!
MYSQL_DB_NAME=sql_api_builder
```

#### Step 6: Test Connection

```bash
cd server
npx ts-node test-mysql-connection.ts
```

**Expected output:**
```
🧪 Testing MySQL Connection...
✅ Successfully connected to MySQL!
✅ Database 'sql_api_builder' exists
✅ Found 9 tables
✅ Query test successful: 2
🎉 All tests passed! MySQL is ready to use.
```

---

### Production MySQL Setup

#### Step 1: Secure MySQL Installation

```bash
# Run MySQL secure installation
sudo mysql_secure_installation

# Answer prompts:
# - Set root password: YES
# - Remove anonymous users: YES
# - Disallow root login remotely: YES
# - Remove test database: YES
# - Reload privilege tables: YES
```

#### Step 2: Configure MySQL for Production

Edit MySQL configuration:

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

**Add/modify these settings:**
```ini
[mysqld]
# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Connection settings
max_connections = 200
wait_timeout = 600
interactive_timeout = 600

# InnoDB settings
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 1

# Logging
log_error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Security
bind-address = 127.0.0.1
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

#### Step 3: Create Production Database and User

```bash
sudo mysql
```

```sql
-- Create database
CREATE DATABASE sql_api_builder_prod 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Create production user with strong password
CREATE USER 'sqlapi_prod'@'localhost' 
  IDENTIFIED BY 'VeryStrongPassword!@#123';

-- Grant only necessary privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON sql_api_builder_prod.* TO 'sqlapi_prod'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

#### Step 4: Run Migrations

```bash
mysql -u sqlapi_prod -p sql_api_builder_prod < server/migrations/mysql/001_initial_schema.sql
```

#### Step 5: Configure Firewall

```bash
# Allow MySQL only from localhost (default)
sudo ufw deny 3306

# If you need remote access, allow specific IPs
sudo ufw allow from 192.168.1.100 to any port 3306
```

#### Step 6: Enable SSL/TLS (Optional but Recommended)

```bash
# Generate SSL certificates
sudo mkdir -p /etc/mysql/ssl
cd /etc/mysql/ssl

# Generate CA key and certificate
sudo openssl genrsa 2048 > ca-key.pem
sudo openssl req -new -x509 -nodes -days 3650 -key ca-key.pem -out ca-cert.pem

# Generate server key and certificate
sudo openssl req -newkey rsa:2048 -days 3650 -nodes -keyout server-key.pem -out server-req.pem
sudo openssl rsa -in server-key.pem -out server-key.pem
sudo openssl x509 -req -in server-req.pem -days 3650 -CA ca-cert.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# Set permissions
sudo chown mysql:mysql /etc/mysql/ssl/*.pem
sudo chmod 600 /etc/mysql/ssl/*.pem
```

Add to MySQL config:
```ini
[mysqld]
ssl-ca=/etc/mysql/ssl/ca-cert.pem
ssl-cert=/etc/mysql/ssl/server-cert.pem
ssl-key=/etc/mysql/ssl/server-key.pem
```

---

## 🐳 Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Step 1: Create Dockerfile for Backend

Create `server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/index.js"]
```

### Step 2: Create Dockerfile for Frontend

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 3: Create Nginx Configuration

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 4: Create docker-compose.yml

Create `docker-compose.yml` in root directory:

```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: sql-api-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DB_NAME}
      MYSQL_USER: ${MYSQL_DB_USER}
      MYSQL_PASSWORD: ${MYSQL_DB_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/migrations/mysql:/docker-entrypoint-initdb.d
    networks:
      - sql-api-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  # Backend API
  backend:
    build: ./server
    container_name: sql-api-backend
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_TYPE: mysql
      MYSQL_DB_HOST: mysql
      MYSQL_DB_PORT: 3306
      MYSQL_DB_USER: ${MYSQL_DB_USER}
      MYSQL_DB_PASSWORD: ${MYSQL_DB_PASSWORD}
      MYSQL_DB_NAME: ${MYSQL_DB_NAME}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGINS: ${CORS_ORIGINS}
    ports:
      - "3001:3001"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - sql-api-network
    restart: unless-stopped

  # Frontend
  frontend:
    build: .
    container_name: sql-api-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - sql-api-network
    restart: unless-stopped

volumes:
  mysql_data:

networks:
  sql-api-network:
    driver: bridge
```

### Step 5: Create .env for Docker

Create `.env` in root directory:

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=RootPassword123!
MYSQL_DB_USER=sqlapi_user
MYSQL_DB_PASSWORD=UserPassword123!
MYSQL_DB_NAME=sql_api_builder

# Application Security
ENCRYPTION_KEY=your-32-char-encryption-key-here
JWT_SECRET=your-64-char-jwt-secret-here

# CORS
CORS_ORIGINS=http://localhost,http://localhost:3000
```

### Step 6: Build and Run

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Step 7: Verify Deployment

```bash
# Check container status
docker-compose ps

# Test backend health
curl http://localhost:3001/health

# Open frontend
# Visit: http://localhost
```

---

## ☁️ Cloud Deployment

### AWS Deployment

#### Using EC2 + RDS

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium (2 vCPU, 4 GB RAM)
   - Security group: Allow SSH (22), HTTP (80), HTTPS (443)

2. **Setup RDS MySQL**
   - Create RDS instance (MySQL 8.0)
   - db.t3.medium (2 vCPU, 4 GB RAM)
   - Multi-AZ deployment for high availability
   - Enable encryption at rest

3. **Deploy Application**
   ```bash
   # SSH into EC2
   ssh -i your-key.pem ubuntu@your-ec2-ip
   
   # Follow Linux Server deployment steps
   # Use RDS endpoint in .env
   MYSQL_DB_HOST=your-rds-endpoint.rds.amazonaws.com
   ```

#### Using ECS (Elastic Container Service)

1. Push Docker images to ECR
2. Create ECS cluster
3. Create task definition
4. Create service with load balancer

### Azure Deployment

#### Using VM + Azure Database for MySQL

1. **Create Virtual Machine**
   - Ubuntu 22.04 LTS
   - Standard_D2s_v3 (2 vCPU, 8 GB RAM)

2. **Create Azure Database for MySQL**
   - MySQL 8.0
   - Burstable B1ms (1 vCPU, 2 GB RAM)
   - Enable SSL enforcement

3. **Deploy Application**
   ```bash
   # SSH into VM
   ssh azureuser@your-vm-ip
   
   # Use Azure MySQL endpoint
   MYSQL_DB_HOST=your-server.mysql.database.azure.com
   ```

#### Using Azure Container Instances

```bash
# Deploy with Azure CLI
az container create \
  --resource-group myResourceGroup \
  --name sql-api-backend \
  --image yourregistry.azurecr.io/sql-api-backend:latest \
  --ports 3001 \
  --environment-variables \
    MYSQL_DB_HOST=your-mysql-server.mysql.database.azure.com \
    MYSQL_DB_USER=sqlapi_user \
    MYSQL_DB_PASSWORD=YourPassword123!
```

### Google Cloud Deployment

#### Using Compute Engine + Cloud SQL

1. **Create Compute Engine Instance**
   - Ubuntu 22.04 LTS
   - e2-medium (2 vCPU, 4 GB RAM)

2. **Create Cloud SQL Instance**
   - MySQL 8.0
   - db-custom-2-7680 (2 vCPU, 7.5 GB RAM)

3. **Deploy Application**
   ```bash
   # Use Cloud SQL endpoint
   MYSQL_DB_HOST=your-instance:your-region:your-database
   ```

---

## 💾 Database Backup & Recovery

### MySQL Backup

#### Automated Daily Backup

Create backup script `backup-mysql.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/mysql"
DB_NAME="sql_api_builder"
DB_USER="backup_user"
DB_PASS="BackupPassword123!"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup created: $BACKUP_FILE"
else
    echo "Backup failed!"
    exit 1
fi

# Delete old backups
find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully"
```

Make it executable:
```bash
chmod +x backup-mysql.sh
```

Add to crontab for daily backup at 2 AM:
```bash
crontab -e

# Add this line:
0 2 * * * /path/to/backup-mysql.sh >> /var/log/mysql-backup.log 2>&1
```

#### Manual Backup

```bash
# Full backup
mysqldump -u sqlapi_user -p sql_api_builder > backup_$(date +%Y%m%d).sql

# Compressed backup
mysqldump -u sqlapi_user -p sql_api_builder | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup specific tables
mysqldump -u sqlapi_user -p sql_api_builder apis api_keys > apis_backup.sql
```

#### Restore from Backup

```bash
# Restore from SQL file
mysql -u sqlapi_user -p sql_api_builder < backup_20240115.sql

# Restore from compressed file
gunzip < backup_20240115.sql.gz | mysql -u sqlapi_user -p sql_api_builder
```

### SQL Server Backup

#### Using SQLCMD

```bash
# Full backup
sqlcmd -S localhost -U sa -P YourPassword -Q "BACKUP DATABASE SQLAPIBuilder TO DISK = 'C:\Backups\SQLAPIBuilder_$(Get-Date -Format yyyyMMdd).bak'"

# Compressed backup
sqlcmd -S localhost -U sa -P YourPassword -Q "BACKUP DATABASE SQLAPIBuilder TO DISK = 'C:\Backups\SQLAPIBuilder.bak' WITH COMPRESSION"
```

#### Using T-SQL

```sql
-- Full backup
BACKUP DATABASE SQLAPIBuilder 
TO DISK = 'C:\Backups\SQLAPIBuilder.bak'
WITH COMPRESSION, STATS = 10;

-- Differential backup
BACKUP DATABASE SQLAPIBuilder 
TO DISK = 'C:\Backups\SQLAPIBuilder_Diff.bak'
WITH DIFFERENTIAL, COMPRESSION;

-- Transaction log backup
BACKUP LOG SQLAPIBuilder 
TO DISK = 'C:\Backups\SQLAPIBuilder_Log.trn'
WITH COMPRESSION;
```

#### Restore

```sql
-- Restore database
RESTORE DATABASE SQLAPIBuilder 
FROM DISK = 'C:\Backups\SQLAPIBuilder.bak'
WITH REPLACE, RECOVERY;
```

---

## 🔒 Security Checklist

- [ ] Change `ENCRYPTION_KEY` to a strong, unique value
- [ ] Change `JWT_SECRET` to a strong, unique value
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS for database connections
- [ ] Enable HTTPS for API endpoints
- [ ] Restrict CORS origins in production
- [ ] Use environment variables (never commit secrets)
- [ ] Enable SQL Server audit logging
- [ ] Regular security updates
- [ ] Monitor API usage and anomalies
- [ ] Implement IP whitelisting for sensitive APIs
- [ ] Use parameterized queries only
- [ ] Review SQL validation rules
- [ ] Set appropriate rate limits
- [ ] Enable query timeouts
- [ ] Regular backups

## 🐛 Troubleshooting

### Connection Issues

**Problem**: Cannot connect to SQL Server

**Solutions**:
1. Verify SQL Server is running
2. Check TCP/IP is enabled in SQL Server Configuration Manager
3. Verify firewall allows port 1433
4. Check credentials in `.env`
5. Test with SQL Server Management Studio

### Encryption Errors

**Problem**: "Failed to decrypt credential"

**Solutions**:
1. Verify `ENCRYPTION_KEY` hasn't changed
2. Check key is at least 32 characters
3. Ensure database wasn't restored from backup with different key

### API Execution Errors

**Problem**: "Invalid SQL" or "Dangerous SQL operation detected"

**Solutions**:
1. Verify query is a SELECT statement
2. Remove any DROP, DELETE, UPDATE, INSERT operations
3. Use parameterized queries (@paramName)
4. Check SQL syntax

### Rate Limiting

**Problem**: "Too many requests" (429)

**Solutions**:
1. Increase `rate_limit` in API configuration
2. Implement client-side caching
3. Use API with higher limits
4. Contact administrator for quota increase

## 📚 Additional Resources

- [SQL Server Documentation](https://docs.microsoft.com/sql/sql-server/)
- [Node.js mssql Package](https://www.npmjs.com/package/mssql)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Zustand State Management](https://github.com/pmndrs/zustand)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/sql-api-builder/issues)
- Email: support@yourdomain.com

---

**Built with ❤️ for developers who need secure, fast API creation from SQL databases.**
