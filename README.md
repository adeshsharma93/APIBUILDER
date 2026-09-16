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
