# 🗄️ Default Database Functionality Guide

## ✅ Overview

SQL API Builder comes with **built-in demo database functionality** that allows you to explore all features immediately without setting up a real database!

---

## 🎯 What is Default Database?

The application includes a **pre-configured demo database** with:

### ✅ Demo Database Connection
- **Name**: 🎯 Demo Database (Sample Data)
- **Type**: MySQL
- **Status**: Connected (simulated)
- **Purpose**: Provides sample data for testing and learning

### ✅ Sample Data Included
- **5 Tables**: Customers, Orders, Products, OrderItems, Categories
- **Sample Queries**: 3 pre-built SQL queries
- **Sample APIs**: 3 ready-to-use API endpoints
- **Sample API Keys**: 4 pre-generated API keys
- **Sample Logs**: Request history and audit logs

---

## 🚀 Getting Started (3 Options)

### Option 1: Setup Wizard (First-Time Users)

When you first log in, you'll see a **Setup Wizard** that helps you choose:

1. **Try Demo Mode** (Recommended)
   - Uses the default demo database
   - No setup required
   - Full feature access
   - Perfect for learning

2. **Connect Real Database**
   - Connect to your MySQL/SQL Server
   - Production-ready setup
   - Use your own data

### Option 2: Use Demo Database Directly

1. Login to the application
2. Go to **Database Connections** page
3. You'll see "🎯 Demo Database (Sample Data)" already connected
4. Start exploring features immediately!

### Option 3: Reset to Demo Data

If you've made changes and want to start fresh:

1. Go to **Database Connections** page
2. Click **"Reset to Demo"** button (top-right)
3. Application reloads with default demo data
4. All sample data is restored

---

## 📊 Demo Database Contents

### Tables

#### 1. Customers (15,420 rows)
```sql
Columns:
- CustomerId (int, PK)
- CustomerName (nvarchar)
- Email (nvarchar)
- Phone (nvarchar)
- Country (nvarchar)
- City (nvarchar)
- IsActive (bit)
- CreatedAt (datetime2)
- UpdatedAt (datetime2)

Indexes:
- PK_Customers (Clustered)
- IX_Customers_Email (Unique)
- IX_Customers_Country
```

#### 2. Orders (89,234 rows)
```sql
Columns:
- OrderId (int, PK)
- CustomerId (int, FK → Customers)
- OrderDate (datetime2)
- TotalAmount (decimal)
- Status (nvarchar)
- ShippingAddress (nvarchar)
- CreatedAt (datetime2)

Indexes:
- PK_Orders (Clustered)
- IX_Orders_CustomerId
- IX_Orders_Status
- IX_Orders_OrderDate
```

#### 3. Products (3,420 rows)
```sql
Columns:
- ProductId (int, PK)
- ProductName (nvarchar)
- Description (nvarchar)
- Price (decimal)
- CategoryId (int, FK → Categories)
- StockQuantity (int)
- IsActive (bit)
- CreatedAt (datetime2)

Indexes:
- PK_Products (Clustered)
- IX_Products_CategoryId
```

#### 4. OrderItems (245,678 rows)
```sql
Columns:
- OrderItemId (int, PK)
- OrderId (int, FK → Orders)
- ProductId (int, FK → Products)
- Quantity (int)
- UnitPrice (decimal)
- Subtotal (decimal)

Indexes:
- PK_OrderItems (Clustered)
- IX_OrderItems_OrderId
```

#### 5. Categories (45 rows)
```sql
Columns:
- CategoryId (int, PK)
- CategoryName (nvarchar)
- Description (nvarchar)
- ParentCategoryId (int, FK → Categories)

Indexes:
- PK_Categories (Clustered)
```

---

## 🔍 Sample Queries

### 1. Get Customers by Country
```sql
SELECT
    CustomerId,
    CustomerName,
    Email,
    Phone,
    City,
    CreatedAt
FROM dbo.Customers
WHERE Country = @country
  AND IsActive = 1
ORDER BY CreatedAt DESC;
```

**Parameters:**
- `@country` (string, required) - Country name filter

**Sample Result:**
```
CustomerId | CustomerName  | Email              | Phone          | City     | CreatedAt
-----------|---------------|--------------------| ---------------|----------|----------------
1          | Rajesh Kumar  | rajesh@example.com | +91-9876543210 | Mumbai   | 2024-01-15
2          | Priya Sharma  | priya@example.com  | +91-9876543211 | Delhi    | 2024-01-20
```

### 2. Get Orders by Status
```sql
SELECT
    o.OrderId,
    o.OrderDate,
    o.TotalAmount,
    o.Status,
    c.CustomerName,
    c.Email
FROM dbo.Orders o
INNER JOIN dbo.Customers c ON o.CustomerId = c.CustomerId
WHERE o.Status = @status
ORDER BY o.OrderDate DESC;
```

**Parameters:**
- `@status` (string, required) - Order status (Pending, Shipped, Delivered, Cancelled)

### 3. Product Inventory Report
```sql
SELECT
    p.ProductId,
    p.ProductName,
    p.Price,
    p.StockQuantity,
    c.CategoryName
FROM dbo.Products p
INNER JOIN dbo.Categories c ON p.CategoryId = c.CategoryId
WHERE p.IsActive = 1
  AND p.StockQuantity <= @maxStock
ORDER BY p.StockQuantity ASC;
```

**Parameters:**
- `@maxStock` (integer, optional, default: 10) - Maximum stock threshold

---

## 🌐 Sample APIs

### 1. Get Customers by Country
```
Endpoint: GET /api/v1/customers
Status: Published
Auth: Required
Rate Limit: 100 req/min
Cache: 60 seconds

Parameters:
- country (string, required)

Example Request:
GET /api/v1/customers?country=India

Example Response:
{
  "success": true,
  "data": [
    {
      "CustomerId": 1,
      "CustomerName": "Rajesh Kumar",
      "Email": "rajesh@example.com",
      "Phone": "+91-9876543210",
      "City": "Mumbai",
      "CreatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 156,
    "totalPages": 4
  }
}
```

### 2. Get Orders by Status
```
Endpoint: GET /api/v1/orders
Status: Published
Auth: Required
Rate Limit: 200 req/min
Cache: 30 seconds

Parameters:
- status (string, required)

Example Request:
GET /api/v1/orders?status=Pending
```

### 3. Product Inventory Report
```
Endpoint: GET /api/v1/products/inventory
Status: Published
Auth: Required
Rate Limit: 50 req/min
Cache: 120 seconds

Parameters:
- maxStock (integer, optional, default: 10)

Example Request:
GET /api/v1/products/inventory?maxStock=5
```

---

## 🔑 Sample API Keys

### 1. Production Frontend
```
Key Prefix: sk_live_7x3k••••••••••••
Status: Active
Expires: 2025-01-20
Last Used: 2024-03-20
Allowed APIs: All published APIs
Request Count: 24,800
```

### 2. Mobile App
```
Key Prefix: sk_live_9m2p••••••••••••
Status: Active
Expires: 2025-02-15
Last Used: 2024-03-20
Allowed APIs: Get Customers, Get Orders
Request Count: 15,230
```

### 3. Staging Environment
```
Key Prefix: sk_test_4a8n••••••••••••
Status: Active
Expires: Never
Last Used: 2024-03-19
Allowed APIs: All APIs
Request Count: 5,670
```

### 4. Deprecated Integration
```
Key Prefix: sk_live_2b5q••••••••••••
Status: Revoked
Expires: 2024-06-01
Last Used: 2024-03-01
Allowed APIs: Get Customers
Request Count: 89,200
```

---

## 🧪 Testing the Demo Database

### Test 1: View Database Explorer
1. Go to **Database Explorer** page
2. You'll see the demo database structure
3. Browse tables: Customers, Orders, Products, etc.
4. Click on a table to see columns and indexes

### Test 2: Execute Sample Query
1. Go to **SQL Editor** page
2. Select "Get Customers by Country" from saved queries
3. Click **Execute**
4. See sample results in the data table

### Test 3: Test Sample API
1. Go to **APIs** page
2. Click on "Get Customers by Country"
3. Go to **Test API** tab
4. Enter parameter: `country = India`
5. Click **Send Request**
6. See sample JSON response

### Test 4: View API Documentation
1. Go to **Documentation** page
2. Select "Get Customers by Country"
3. View auto-generated OpenAPI documentation
4. See example requests and responses

### Test 5: Check Logs
1. Go to **Logs** page
2. See sample API request logs
3. Filter by API, status, date range
4. View request details

---

## 🔄 Reset to Demo Data

If you want to start fresh with demo data:

### Method 1: Reset Button
1. Go to **Database Connections** page
2. Click **"Reset to Demo"** button (top-right)
3. Confirm the action
4. Application reloads with default data

### Method 2: Clear Browser Storage
```javascript
// Open browser console (F12)
localStorage.removeItem('sql-api-builder-storage');
location.reload();
```

### What Gets Reset
✅ Database connections (restored to demo)  
✅ APIs (restored to 3 sample APIs)  
✅ API Keys (restored to 4 sample keys)  
✅ Queries (restored to 3 sample queries)  
✅ Logs (restored to sample logs)  
✅ User session (stays logged in)  

### What Doesn't Get Reset
❌ User account (you stay logged in)  
❌ Theme preferences (dark/light mode)  
❌ Sidebar state (collapsed/expanded)  

---

## 🎓 Learning Path with Demo Database

### Beginner Path (30 minutes)
1. ✅ Login and see Setup Wizard
2. ✅ Choose "Try Demo Mode"
3. ✅ Explore Dashboard metrics
4. ✅ View Database Explorer
5. ✅ Browse sample tables
6. ✅ Check sample APIs
7. ✅ View API documentation

### Intermediate Path (1 hour)
1. ✅ Execute sample SQL queries
2. ✅ Modify queries and test
3. ✅ Create new query from scratch
4. ✅ Save query
5. ✅ Create API from query
6. ✅ Configure API parameters
7. ✅ Test the new API
8. ✅ View API logs

### Advanced Path (2 hours)
1. ✅ Explore all sample data
2. ✅ Create multiple queries
3. ✅ Build complex APIs with joins
4. ✅ Configure rate limiting
5. ✅ Set up caching
6. ✅ Create API keys
7. ✅ Test API authentication
8. ✅ Monitor API performance
9. ✅ Review audit logs
10. ✅ Switch to real database

---

## 🔌 Switching to Real Database

When you're ready to use your real database:

### Step 1: Prepare Your Database
```sql
-- MySQL Example
CREATE DATABASE my_app_db;
USE my_app_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email) VALUES
('John Doe', 'john@example.com'),
('Jane Smith', 'jane@example.com');
```

### Step 2: Start Backend Server
```bash
cd server
npm run dev
```

### Step 3: Add Connection
1. Go to **Database Connections** page
2. Click **"New Connection"**
3. Fill in your database details:
   - Name: My Database
   - Type: MySQL
   - Host: localhost
   - Port: 3306
   - Database: my_app_db
   - Username: root
   - Password: your_password
4. Click **"Test Connection"**
5. Click **"Save Connection"**

### Step 4: Create APIs
1. Go to **SQL Editor**
2. Write queries against your real data
3. Save queries
4. Create APIs
5. Test and publish

---

## 📋 Demo vs Real Database Comparison

| Feature | Demo Database | Real Database |
|---------|--------------|---------------|
| **Setup Required** | ❌ None | ✅ Full setup |
| **Data** | Sample/mock data | Your actual data |
| **Persistence** | Browser localStorage | Database server |
| **Query Execution** | Simulated results | Real SQL execution |
| **Performance** | Instant | Depends on DB |
| **Use Case** | Learning, testing | Production |
| **Scalability** | Limited | Unlimited |
| **Security** | Client-side only | Server-side encryption |

---

## 🎯 When to Use Demo Database

### ✅ Use Demo Database For:
- Learning the application
- Testing features
- Development and prototyping
- Demonstrations
- Training new users
- UI/UX testing

### ❌ Don't Use Demo Database For:
- Production applications
- Real user data
- Performance testing
- Load testing
- Security testing

---

## 🐛 Troubleshooting

### Issue: Demo database not showing
**Solution:**
```javascript
// Clear storage and reload
localStorage.removeItem('sql-api-builder-storage');
location.reload();
```

### Issue: Can't execute queries on demo database
**Solution:**
- Demo queries are simulated
- Real execution requires backend server
- Start backend: `cd server && npm run dev`

### Issue: Want to keep demo data but add real database
**Solution:**
- You can have multiple connections
- Demo database stays as "🎯 Demo Database"
- Add your real database as a new connection
- Switch between them in SQL Editor

---

## 📚 Related Documentation

- **Authentication Guide**: `AUTHENTICATION_GUIDE.md`
- **MySQL Setup**: `MYSQL_SETUP_GUIDE.md`
- **Backend Implementation**: `BACKEND_IMPLEMENTATION.md`
- **Deployment Guide**: `README.md` (Deployment section)

---

## ✅ Summary

The **Default Database Functionality** provides:

✅ **Instant Access**: No setup required  
✅ **Sample Data**: 5 tables with realistic data  
✅ **Sample Queries**: 3 pre-built SQL queries  
✅ **Sample APIs**: 3 ready-to-use endpoints  
✅ **Sample API Keys**: 4 test API keys  
✅ **Sample Logs**: Request history and audit trails  
✅ **Setup Wizard**: Guided onboarding experience  
✅ **Reset Option**: Easy return to demo state  
✅ **Learning Path**: Structured learning progression  

**Perfect for:**
- 🎓 Learning the platform
- 🧪 Testing features
- 📊 Demonstrations
- 👥 Training users
- 🚀 Quick prototyping

**When ready for production:**
1. Set up real database
2. Start backend server
3. Add real connection
4. Create real APIs
5. Deploy to production

---

**🎉 The default database functionality makes SQL API Builder ready to use out of the box!**
