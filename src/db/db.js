import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  port: process.env.DB_PORT || 5432,
});

const query = (text, params) => pool.query(text, params);

export { query, pool };
