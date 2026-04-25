const { Trino, BasicAuth } = require("trino-client");

const host = process.env.TRINO_HOST;
const user = process.env.TRINO_USER;
const password = process.env.TRINO_PWD;
const catalog = process.env.DB_CATALOG || "iceberg";
const schema = process.env.DB_SCHEMA || "bronze";

const client = Trino.create({
  server: `https://${host}:443`,
  catalog,
  schema,
  auth: new BasicAuth(user, password),
});

async function executeQuery(sql) {
  const iterator = await client.query(sql);
  const rows = [];

  for await (const result of iterator) {
    if (!result || !result.data || !result.columns) continue;

    for (const row of result.data) {
      const obj = {};
      result.columns.forEach((col, index) => {
        obj[col.name] = row[index];
      });
      rows.push(obj);
    }
  }

  return rows;
}

module.exports = { executeQuery };