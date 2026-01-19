import dotenv from 'dotenv';
dotenv.config();

const DB_CLIENT = (process.env.DB_CLIENT || 'pg').toLowerCase();

let pool = null;
let _query;

if (DB_CLIENT === 'mysql') {
  // mysql2 promise pool
  import('mysql2/promise').then((mysql) => {
    pool = mysql.createPool({
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      waitForConnections: true,
      connectionLimit: 20,
    });
  });

  _query = async (sql, params = []) => {
    // convert $1, $2.. to ? for MySQL
    const sqlForMysql = sql.replace(/\$\d+/g, '?');
    const poolLocal = pool;
    if (!poolLocal) throw new Error('MySQL pool not initialized');
    const [rows] = await poolLocal.execute(sqlForMysql, params);
    // rows can be array (select) or OkPacket
    return {
      rows: Array.isArray(rows) ? rows : [],
      rowCount: Array.isArray(rows) ? rows.length : rows.affectedRows || 0,
      insertId: rows && rows.insertId ? rows.insertId : null,
    };
  };
} else {
  // default: pg
  const pkg = await import('pg');
  const { Pool } = pkg;
  pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  _query = async (sql, params = []) => {
    const res = await pool.query(sql, params);
    return { rows: res.rows, rowCount: res.rowCount };
  };
}

export default {
  query: async (sql, params = []) => _query(sql, params),
  DB_CLIENT,
};
