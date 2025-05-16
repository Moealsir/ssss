import postgres from 'postgres';

// Get the DATABASE_URL from environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  try {
    console.log('Connecting to database...');
    
    // Create a PostgreSQL connection with SSL enabled
    const sql = postgres(DATABASE_URL, {
      ssl: true,
      max: 1, // Use a single connection for this test
    });
    
    // Create a simple query to test the connection
    const result = await sql`SELECT current_database()`;
    console.log('Connected to database:', result[0].current_database);
    
    // List tables in the public schema
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
    console.log('Tables found:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // End the connection pool
    await sql.end();
    
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

main();