const { Pool } = require('pg');
require('dotenv').config();

const connectionString =
  process.env.DATABASE_PRIVATE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

let rawPool;

if (connectionString) {
  rawPool = new Pool({
    connectionString,
    ssl: process.env.DB_ENCRYPT === 'true' || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  });
} else {
  rawPool = new Pool({
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
    host: process.env.DB_SERVER || process.env.PGHOST || 'localhost',
    database: process.env.DB_DATABASE || process.env.PGDATABASE || 'hms_db',
    port: process.env.DB_PORT || process.env.PGPORT || 5432,
    ssl: process.env.DB_ENCRYPT === 'true' ? { rejectUnauthorized: false } : false,
  });
}

rawPool.on('connect', () => {
  console.log('Connected to PostgreSQL Database');
});

rawPool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Convert T-SQL query string to Postgres SQL
function convertTsSqlToPostgres(sql, inputs = {}) {
  let pgSql = sql;
  const values = [];
  let paramIndex = 1;

  // Transform OUTPUT INSERTED.id -> RETURNING id
  pgSql = pgSql.replace(/OUTPUT\s+INSERTED\.(\w+)/gi, 'RETURNING $1');

  // Replace @param with $1, $2, ...
  const inputKeys = Object.keys(inputs);
  for (const key of inputKeys) {
    const target = `@${key}`;
    if (pgSql.includes(target)) {
      const regex = new RegExp(`@${key}\\b`, 'g');
      values.push(inputs[key]);
      pgSql = pgSql.replace(regex, `$${paramIndex}`);
      paramIndex++;
    }
  }

  return { text: pgSql, values };
}

class PostgresRequestAdapter {
  constructor(pgPool) {
    this.pgPool = pgPool;
    this.inputs = {};
  }

  input(name, typeOrValue, value) {
    const actualValue = value !== undefined ? value : typeOrValue;
    this.inputs[name] = actualValue;
    return this;
  }

  async query(sqlString) {
    const { text, values } = convertTsSqlToPostgres(sqlString, this.inputs);
    try {
      const res = await this.pgPool.query(text, values);
      return {
        recordset: res.rows,
        rows: res.rows,
        rowsAffected: [res.rowCount],
      };
    } catch (err) {
      console.error('PostgreSQL Query Error:', err.message, 'Query:', text);
      throw err;
    }
  }
}

// Wrapper pool object
const poolWrapper = {
  request() {
    return new PostgresRequestAdapter(rawPool);
  },
  async query(text, params) {
    if (params) {
      const res = await rawPool.query(text, params);
      return { recordset: res.rows, rows: res.rows };
    }
    const { text: pgSql, values } = convertTsSqlToPostgres(text);
    const res = await rawPool.query(pgSql, values);
    return { recordset: res.rows, rows: res.rows };
  }
};

const sqlMock = {
  VarChar: 'VarChar',
  Int: 'Int',
  Decimal: 'Decimal',
  DateTime: 'DateTime',
  Date: 'Date',
  Text: 'Text',
};

module.exports = {
  pool: poolWrapper,
  sql: sqlMock,
  poolPromise: Promise.resolve(poolWrapper),
};