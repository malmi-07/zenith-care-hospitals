const { sql, poolPromise } = require('../config/db');

async function getAllAppointments() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT a.id, a.appointment_date, a.status, a.notes,
           p.id AS patient_id, p.full_name AS patient_name, p.phone AS patient_phone,
           d.id AS doctor_id, u.full_name AS doctor_name, d.specialization
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users u ON d.user_id = u.id
    ORDER BY a.appointment_date DESC
  `);
  return result.recordset;
}

async function getAppointmentById(id) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT a.id, a.appointment_date, a.status, a.notes,
             p.id AS patient_id, p.full_name AS patient_name, p.phone AS patient_phone,
             d.id AS doctor_id, u.full_name AS doctor_name, d.specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.id = @id
    `);
  return result.recordset[0];
}

async function createAppointment(patientId, doctorId, appointmentDate, notes = '') {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('patient_id', sql.Int, patientId)
    .input('doctor_id', sql.Int, doctorId)
    .input('appointment_date', sql.DateTime, appointmentDate)
    .input('notes', sql.VarChar, notes || '')
    .query(`INSERT INTO appointments (patient_id, doctor_id, appointment_date, notes)
            OUTPUT INSERTED.id
            VALUES (@patient_id, @doctor_id, @appointment_date, @notes)`);
  return result.recordset[0].id;
}

async function updateAppointmentStatus(id, status) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('status', sql.VarChar, status)
    .query('UPDATE appointments SET status = @status WHERE id = @id');
}

async function rescheduleAppointment(id, appointmentDate) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('appointment_date', sql.DateTime, appointmentDate)
    .query('UPDATE appointments SET appointment_date = @appointment_date, status = \'Rescheduled\' WHERE id = @id');
}

async function deleteAppointment(id) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM appointments WHERE id = @id');
}

module.exports = {
  getAllAppointments, getAppointmentById, createAppointment,
  updateAppointmentStatus, rescheduleAppointment, deleteAppointment
};