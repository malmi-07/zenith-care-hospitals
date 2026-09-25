const { sql, poolPromise } = require('../config/db');

async function getAllPatients(search = '') {
  const pool = await poolPromise;
  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    const result = await pool.request()
      .input('s', sql.VarChar, s)
      .query(`
        SELECT * FROM patients 
        WHERE full_name LIKE @s OR phone LIKE @s OR address LIKE @s OR CAST(id AS VARCHAR) LIKE @s
        ORDER BY id DESC
      `);
    return result.recordset;
  }
  const result = await pool.request().query('SELECT * FROM patients ORDER BY id DESC');
  return result.recordset;
}

async function getPatientById(id) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM patients WHERE id = @id');
  return result.recordset[0];
}

async function getPatientFullHistory(id) {
  const pool = await poolPromise;
  const patient = await getPatientById(id);
  if (!patient) return null;

  const appointments = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT a.*, d.specialization, u.full_name AS doctor_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = @id
      ORDER BY a.appointment_date DESC
    `);

  const records = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT m.*, u.full_name AS doctor_name, d.specialization
      FROM medical_records m
      LEFT JOIN doctors d ON m.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE m.patient_id = @id
      ORDER BY m.visit_date DESC
    `);

  const labs = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT * FROM laboratory_tests
      WHERE patient_id = @id
      ORDER BY requested_at DESC
    `);

  const bills = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT * FROM billing
      WHERE patient_id = @id
      ORDER BY created_at DESC
    `);

  return {
    patient,
    appointments: appointments.recordset,
    records: records.recordset,
    labs: labs.recordset,
    bills: bills.recordset
  };
}

async function createPatient(fullName, dob, gender, phone, address, bloodGroup, emergencyContact) {
  const pool = await poolPromise;
  const validGender = (gender === 'F' || gender === 'Female') ? 'F' : ((gender === 'Other') ? 'Other' : 'M');
  const result = await pool.request()
    .input('full_name', sql.VarChar, fullName)
    .input('dob', sql.Date, dob || null)
    .input('gender', sql.VarChar, validGender)
    .input('phone', sql.VarChar, phone || '')
    .input('address', sql.VarChar, address || '')
    .input('blood_group', sql.VarChar, bloodGroup || 'O+')
    .input('emergency_contact', sql.VarChar, emergencyContact || '')
    .query(`INSERT INTO patients (full_name, dob, gender, phone, address, blood_group, emergency_contact)
            OUTPUT INSERTED.id
            VALUES (@full_name, @dob, @gender, @phone, @address, @blood_group, @emergency_contact)`);
  return result.recordset[0].id;
}

async function updatePatient(id, fullName, dob, gender, phone, address, bloodGroup, emergencyContact) {
  const pool = await poolPromise;
  const validGender = (gender === 'F' || gender === 'Female') ? 'F' : ((gender === 'Other') ? 'Other' : 'M');
  await pool.request()
    .input('id', sql.Int, id)
    .input('full_name', sql.VarChar, fullName)
    .input('dob', sql.Date, dob || null)
    .input('gender', sql.VarChar, validGender)
    .input('phone', sql.VarChar, phone || '')
    .input('address', sql.VarChar, address || '')
    .input('blood_group', sql.VarChar, bloodGroup || 'O+')
    .input('emergency_contact', sql.VarChar, emergencyContact || '')
    .query(`UPDATE patients 
            SET full_name=@full_name, dob=@dob, gender=@gender,
                phone=@phone, address=@address, blood_group=@blood_group, emergency_contact=@emergency_contact 
            WHERE id=@id`);
}

async function deletePatient(id) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM patients WHERE id = @id');
}

module.exports = { getAllPatients, getPatientById, getPatientFullHistory, createPatient, updatePatient, deletePatient };