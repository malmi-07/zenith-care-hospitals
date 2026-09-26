const { Pool } = require('pg');
require('dotenv').config();

const connectionString =
  process.env.DATABASE_PRIVATE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

let pool;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: process.env.DB_ENCRYPT === 'true' || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  });
} else {
  pool = new Pool({
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
    host: process.env.DB_SERVER || process.env.PGHOST || 'localhost',
    database: process.env.DB_DATABASE || process.env.PGDATABASE || 'hms_db',
    port: process.env.DB_PORT || process.env.PGPORT || 5432,
    ssl: process.env.DB_ENCRYPT === 'true' ? { rejectUnauthorized: false } : false,
  });
}

pool.on('connect', () => {
  console.log('Connected to PostgreSQL Database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Helper for queries
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  return res;
}

module.exports = {
  pool,
  query,
  poolPromise: Promise.resolve(pool)
};