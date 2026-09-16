import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function testConnection() {
  console.log('🧪 Testing MySQL Connection...\n');

  const config = {
    host: process.env.MYSQL_DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_DB_PORT || '3306'),
    user: process.env.MYSQL_DB_USER || 'root',
    password: process.env.MYSQL_DB_PASSWORD || '',
    database: process.env.MYSQL_DB_NAME || 'sql_api_builder',
  };

  console.log('Connection details:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Database: ${config.database}`);
  console.log('');

  try {
    // Test connection
    const connection = await mysql.createConnection(config);
    console.log('✅ Successfully connected to MySQL!');

    // Check database exists
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = (databases as any[]).some(db => db.Database === config.database);
    
    if (dbExists) {
      console.log(`✅ Database '${config.database}' exists`);
    } else {
      console.log(`❌ Database '${config.database}' does not exist`);
      console.log('   Run the migration script to create it');
    }

    // Check tables
    if (dbExists) {
      await connection.execute(`USE ${config.database}`);
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`✅ Found ${(tables as any[]).length} tables`);
      
      if ((tables as any[]).length > 0) {
        console.log('\nTables:');
        (tables as any[]).forEach(table => {
          const tableName = Object.values(table)[0];
          console.log(`  - ${tableName}`);
        });
      } else {
        console.log('\n⚠️  No tables found. Run the migration script.');
      }
    }

    // Test a simple query
    const [result] = await connection.execute('SELECT 1 + 1 AS result');
    console.log(`\n✅ Query test successful: ${(result as any[])[0].result}`);

    await connection.end();
    console.log('\n🎉 All tests passed! MySQL is ready to use.');
    
  } catch (error: any) {
    console.error('\n❌ Connection failed!');
    console.error(`Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tips:');
      console.log('   - Make sure MySQL is running');
      console.log('   - Check the host and port in .env file');
      console.log('   - Verify MySQL is listening on the correct port');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Tips:');
      console.log('   - Check username and password in .env file');
      console.log('   - Verify the user has permission to access the database');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Tips:');
      console.log('   - Database does not exist');
      console.log('   - Run: mysql -u root -p -e "CREATE DATABASE sql_api_builder"');
      console.log('   - Then run the migration script');
    }
    
    process.exit(1);
  }
}

testConnection();
