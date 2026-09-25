const { sql, poolPromise } = require('../config/db');

async function getAllDoctors() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT d.id, d.specialization, d.schedule, u.full_name, u.email, dept.name AS department
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN departments dept ON d.department_id = dept.id
    ORDER BY d.id DESC
  `);
  return result.recordset;
}

async function getDoctorById(id) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT d.id, d.specialization, d.schedule, u.full_name, u.email, dept.name AS department
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = @id
    `);
  return result.recordset[0];
}

async function createDoctor(userId, departmentId, specialization, schedule) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('user_id', sql.Int, userId)
    .input('department_id', sql.Int, departmentId)
    .input('specialization', sql.VarChar, specialization)
    .input('schedule', sql.VarChar, schedule)
    .query(`INSERT INTO doctors (user_id, department_id, specialization, schedule)
            OUTPUT INSERTED.id
            VALUES (@user_id, @department_id, @specialization, @schedule)`);
  return result.recordset[0].id;
}

async function updateDoctor(id, departmentId, specialization, schedule) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('department_id', sql.Int, departmentId)
    .input('specialization', sql.VarChar, specialization)
    .input('schedule', sql.VarChar, schedule)
    .query(`UPDATE doctors SET department_id=@department_id, specialization=@specialization,
            schedule=@schedule WHERE id=@id`);
}

async function deleteDoctor(id) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM doctors WHERE id = @id');
}

async function getDepartments() {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT * FROM departments ORDER BY name ASC');
  return result.recordset;
}

async function createDoctorWithUser(fullName, email, password, departmentId, specialization, schedule) {
  const pool = await poolPromise;
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash(password || 'admin123', 10);

  // Check if user exists or create
  let userRes = await pool.request()
    .input('email', sql.VarChar, email)
    .query('SELECT id FROM users WHERE email = @email');

  let userId;
  if (userRes.recordset[0]) {
    userId = userRes.recordset[0].id;
  } else {
    const insertUser = await pool.request()
      .input('full_name', sql.VarChar, fullName)
      .input('email', sql.VarChar, email)
      .input('password_hash', sql.VarChar, passwordHash)
      .input('role_id', sql.Int, 2) // Doctor role
      .query(`INSERT INTO users (full_name, email, password_hash, role_id)
              OUTPUT INSERTED.id
              VALUES (@full_name, @email, @password_hash, @role_id)`);
    userId = insertUser.recordset[0].id;
  }

  const result = await pool.request()
    .input('user_id', sql.Int, userId)
    .input('department_id', sql.Int, departmentId)
    .input('specialization', sql.VarChar, specialization)
    .input('schedule', sql.VarChar, schedule)
    .query(`INSERT INTO doctors (user_id, department_id, specialization, schedule)
            OUTPUT INSERTED.id
            VALUES (@user_id, @department_id, @specialization, @schedule)`);
  return result.recordset[0].id;
}

module.exports = { getAllDoctors, getDoctorById, createDoctor, createDoctorWithUser, updateDoctor, deleteDoctor, getDepartments };