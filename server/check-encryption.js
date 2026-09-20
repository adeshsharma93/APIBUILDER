#!/usr/bin/env node

/**
 * Diagnostic script to check database connection encryption
 * Run this to identify connections that can't be decrypted
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-prod!';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

// Derive key from ENCRYPTION_KEY
const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

async function testDecryption(encryptedData) {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      return { success: false, error: 'Empty or invalid data' };
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      return { success: false, error: `Invalid format (expected 3 parts, got ${parts.length})` };
    }

    const [ivBase64, authTagBase64, encrypted] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    if (iv.length !== IV_LENGTH) {
      return { success: false, error: `Invalid IV length (${iv.length})` };
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return { success: true, decryptedLength: decrypted.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔍 Database Connection Encryption Diagnostic Tool\n');
  console.log('='.repeat(60));
  console.log(`ENCRYPTION_KEY: ${ENCRYPTION_KEY.substring(0, 10)}...`);
  console.log(`Key length: ${key.length} bytes`);
  console.log('='.repeat(60));
  console.log();

  // Connect to application database
  const pool = mysql.createPool({
    host: process.env.MYSQL_DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_DB_PORT || '3306'),
    user: process.env.MYSQL_DB_USER || 'root',
    password: process.env.MYSQL_DB_PASSWORD,
    database: process.env.MYSQL_DB_NAME || 'sql_api_builder',
    waitForConnections: true,
    connectionLimit: 1,
  });

  try {
    // Get all connections
    const [connections] = await pool.execute(
      'SELECT id, name, host, port, database_name, username, encrypted_password, status FROM database_connections'
    );

    console.log(`Found ${connections.length} database connection(s)\n`);

    if (connections.length === 0) {
      console.log('⚠️  No connections found in database');
      return;
    }

    let canDecrypt = 0;
    let cannotDecrypt = 0;

    for (const conn of connections) {
      console.log(`Connection: ${conn.name}`);
      console.log(`  ID: ${conn.id}`);
      console.log(`  Host: ${conn.host}:${conn.port}`);
      console.log(`  Database: ${conn.database_name}`);
      console.log(`  User: ${conn.username}`);
      console.log(`  Status: ${conn.status}`);

      const result = await testDecryption(conn.encrypted_password);

      if (result.success) {
        console.log(`  ✅ Password can be decrypted (${result.decryptedLength} chars)`);
        canDecrypt++;
      } else {
        console.log(`  ❌ Password CANNOT be decrypted`);
        console.log(`     Error: ${result.error}`);
        cannotDecrypt++;
      }
      console.log();
    }

    console.log('='.repeat(60));
    console.log('Summary:');
    console.log(`  ✅ Can decrypt: ${canDecrypt}`);
    console.log(`  ❌ Cannot decrypt: ${cannotDecrypt}`);
    console.log('='.repeat(60));

    if (cannotDecrypt > 0) {
      console.log('\n💡 Solutions:');
      console.log('   1. Delete connections that cannot be decrypted');
      console.log('   2. Recreate them with the current ENCRYPTION_KEY');
      console.log('   3. Or update ENCRYPTION_KEY to match the one used when creating connections');
      console.log('\n📝 To delete a connection:');
      console.log(`   mysql -u root -p sql_api_builder`);
      console.log(`   DELETE FROM database_connections WHERE id = '<connection-id>';`);
    } else {
      console.log('\n✅ All connections can be decrypted successfully!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. MySQL is running');
    console.error('   2. Database credentials in .env are correct');
    console.error('   3. Database "sql_api_builder" exists');
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
