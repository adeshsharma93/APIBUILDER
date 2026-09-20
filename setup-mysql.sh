#!/bin/bash

# SQL API Builder - MySQL Quick Setup Script
# This script helps you set up the application with MySQL

echo "🚀 SQL API Builder - MySQL Quick Setup"
echo "======================================"
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed!"
    echo ""
    echo "Please install MySQL first:"
    echo "  - Windows: Download from https://dev.mysql.com/downloads/installer/"
    echo "  - macOS: brew install mysql"
    echo "  - Linux: sudo apt-get install mysql-server"
    echo ""
    exit 1
fi

echo "✅ MySQL is installed"
echo ""

# Get MySQL credentials
echo "📝 Enter your MySQL credentials:"
read -p "MySQL Host (default: localhost): " MYSQL_HOST
MYSQL_HOST=${MYSQL_HOST:-localhost}

read -p "MySQL Port (default: 3306): " MYSQL_PORT
MYSQL_PORT=${MYSQL_PORT:-3306}

read -p "MySQL Username (default: root): " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -sp "MySQL Password: " MYSQL_PASSWORD
echo ""

read -p "Database Name (default: sql_api_builder): " DB_NAME
DB_NAME=${DB_NAME:-sql_api_builder}

echo ""
echo "🔧 Setting up configuration..."

# Create .env file
cat > server/.env << EOF
# Server Configuration
PORT=3001
NODE_ENV=development

# MySQL Configuration
DB_TYPE=mysql
MYSQL_DB_HOST=${MYSQL_HOST}
MYSQL_DB_PORT=${MYSQL_PORT}
MYSQL_DB_USER=${MYSQL_USER}
MYSQL_DB_PASSWORD=${MYSQL_PASSWORD}
MYSQL_DB_NAME=${DB_NAME}

# Security Configuration
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
EOF

echo "✅ Configuration file created"
echo ""

# Create database
echo "🗄️  Creating database..."
mysql -h ${MYSQL_HOST} -P ${MYSQL_PORT} -u ${MYSQL_USER} -p${MYSQL_PASSWORD} -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "❌ Failed to create database. Please check your MySQL credentials."
    exit 1
fi

# Run migrations
echo "📦 Running database migrations..."
mysql -h ${MYSQL_HOST} -P ${MYSQL_PORT} -u ${MYSQL_USER} -p${MYSQL_PASSWORD} ${DB_NAME} < server/migrations/mysql/001_initial_schema.sql 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Failed to run migrations"
    exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
cd server && npm install --silent
cd .. && npm install --silent

echo "✅ Dependencies installed"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start the backend: cd server && npm run dev"
echo "   2. Start the frontend: npm run dev (in a new terminal)"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For detailed instructions, see MYSQL_SETUP_GUIDE.md"
echo ""
