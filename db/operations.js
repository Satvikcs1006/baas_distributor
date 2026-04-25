const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.OPERATIONS_DB_HOST,
  port: Number(process.env.OPERATIONS_DB_PORT),
  database: process.env.OPERATIONS_DB_NAME,
  user: process.env.OPERATIONS_DB_USER,
  password: process.env.OPERATIONS_DB_PASSWORD,
  ssl: process.env.OPERATIONS_DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function executeOperationsQuery(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

module.exports = { executeOperationsQuery };