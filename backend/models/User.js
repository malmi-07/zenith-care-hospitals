const { sql, poolPromise } = require('../config/db');

async function findUserByEmail(email) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('email', sql.VarChar, email)
    .query(`
      SELECT u.id, u.full_name, u.email, u.password_hash, u.role_id, r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = @email
    `);
  return result.recordset[0];
}

async function createUser(fullName, email, passwordHash, roleId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('full_name', sql.VarChar, fullName)
    .input('email', sql.VarChar, email)
    .input('password_hash', sql.VarChar, passwordHash)
    .input('role_id', sql.Int, roleId || 4)
    .query(`INSERT INTO users (full_name, email, password_hash, role_id)
            OUTPUT INSERTED.id
            VALUES (@full_name, @email, @password_hash, @role_id)`);
  return result.recordset[0].id;
}

async function getAllRoles() {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT * FROM roles ORDER BY id ASC');
  return result.recordset;
}

async function getDemoUsers() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT u.id, u.full_name, u.email, u.role_id, r.name AS role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.email IN ('admin@hms.com', 'sarah@hms.com', 'emily@hms.com', 'reception@hms.com', 'pharmacy@hms.com', 'billing@hms.com', 'lab@hms.com')
    ORDER BY u.role_id ASC
  `);
  return result.recordset;
}

module.exports = { findUserByEmail, createUser, getAllRoles, getDemoUsers };