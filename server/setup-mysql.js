#!/usr/bin/env node

/**
 * MySQL Setup Helper
 * This script helps you configure your MySQL connection
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log('\n🔧 SQL API Builder - MySQL Setup Helper\n');
  console.log('This will help you configure your MySQL connection.\n');

  // Check if .env exists
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    console.log('✅ Found existing .env file');
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    console.log('📝 Creating new .env file from template...');
    const templatePath = path.join(__dirname, '.env.example');
    if (fs.existsSync(templatePath)) {
      envContent = fs.readFileSync(templatePath, 'utf8');
    } else {
      envContent = `# Server Configuration
PORT=3001
NODE_ENV=development

# MySQL Configuration
DB_TYPE=mysql
MYSQL_DB_HOST=localhost
MYSQL_DB_PORT=3306
MYSQL_DB_USER=root
MYSQL_DB_PASSWORD=
MYSQL_DB_NAME=sql_api_builder

# Security
ENCRYPTION_KEY=change-this-to-a-secure-32-character-key-in-production!
JWT_SECRET=change-this-to-a-secure-jwt-secret-in-production

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
`;
    }
  }

  console.log('\n📋 Current MySQL Configuration:\n');
  
  const hostMatch = envContent.match(/MYSQL_DB_HOST=(.*)/);
  const portMatch = envContent.match(/MYSQL_DB_PORT=(.*)/);
  const userMatch = envContent.match(/MYSQL_DB_USER=(.*)/);
  const passMatch = envContent.match(/MYSQL_DB_PASSWORD=(.*)/);
  const dbMatch = envContent.match(/MYSQL_DB_NAME=(.*)/);

  console.log(`  Host: ${hostMatch ? hostMatch[1] : 'localhost'}`);
  console.log(`  Port: ${portMatch ? portMatch[1] : '3306'}`);
  console.log(`  User: ${userMatch ? userMatch[1] : 'root'}`);
  console.log(`  Password: ${passMatch && passMatch[1] ? '*** (set)' : '❌ NOT SET'}`);
  console.log(`  Database: ${dbMatch ? dbMatch[1] : 'sql_api_builder'}`);

  console.log('\n');

  // Ask for password
  const password = await question('🔑 Enter your MySQL root password: ');
  
  if (!password) {
    console.log('\n❌ Error: Password cannot be empty!');
    console.log('💡 If you don\'t know your password, see MYSQL_ACCESS_DENIED_FIX.md');
    rl.close();
    process.exit(1);
  }

  // Update .env file
  envContent = envContent.replace(
    /MYSQL_DB_PASSWORD=.*/,
    `MYSQL_DB_PASSWORD=${password}`
  );

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ .env file updated successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Make sure MySQL is running');
  console.log('   2. Create database: mysql -u root -p -e "CREATE DATABASE sql_api_builder"');
  console.log('   3. Run migrations: mysql -u root -p sql_api_builder < migrations/mysql/001_initial_schema.sql');
  console.log('   4. Start backend: npm run dev');
  console.log('\n🚀 You\'re all set!\n');

  rl.close();
}

setup().catch((error) => {
  console.error('\n❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
