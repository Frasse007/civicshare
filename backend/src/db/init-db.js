import pkg from 'pg';
const { Client } = pkg;

async function ensureDatabaseAndUser() {
  // Connect using a superuser connection string (default postgres superuser)
  // You can adjust this URL if your local superuser has a different password or port.
  const adminUrl = process.env.POSTGRES_ADMIN_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
  
  const client = new Client({ connectionString: adminUrl });

  try {
    await client.connect();

    // Check if user 'civic' exists, create if not
    const userCheck = await client.query("SELECT 1 FROM pg_roles WHERE rolname='civic'");
    if (userCheck.rowCount === 0) {
      console.log("Creating database user 'civic'...");
      await client.query("CREATE USER civic WITH PASSWORD 'civic';");
    }

    // Check if database 'civicshare_test' exists, create if not
    const dbName = process.env.NODE_ENV === 'test' ? 'civicshare_test' : 'civicshare';
    const dbCheck = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
    if (dbCheck.rowCount === 0) {
      console.log(`Creating database '${dbName}'...`);
      await client.query(`CREATE DATABASE ${dbName} OWNER civic;`);
    }

    // Ensure privileges are granted
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO civic;`);
    
    console.log('Database and user verification complete.');
  } catch (err) {
    console.error('Error auto-creating database/user:', err.message);
  } finally {
    await client.end();
  }
}

await ensureDatabaseAndUser();