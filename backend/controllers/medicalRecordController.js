const { sql, poolPromise } = require('../config/db');

async function getAllRecords(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT m.id, m.diagnosis, m.prescription, m.treatment_history, m.visit_date,
             p.id AS patient_id, p.full_name AS patient_name, p.gender, p.blood_group,
             d.id AS doctor_id, u.full_name AS doctor_name, d.specialization
      FROM medical_records m
      JOIN patients p ON m.patient_id = p.id
      LEFT JOIN doctors d ON m.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY m.visit_date DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getAllRecords error:', err);
    res.status(500).json({ message: 'Server error fetching medical records' });
  }
}

async function getRecordsByPatient(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('patientId', sql.Int, req.params.patientId)
      .query(`
        SELECT m.id, m.diagnosis, m.prescription, m.treatment_history, m.visit_date,
               p.id AS patient_id, p.full_name AS patient_name,
               d.id AS doctor_id, u.full_name AS doctor_name, d.specialization
        FROM medical_records m
        JOIN patients p ON m.patient_id = p.id
        LEFT JOIN doctors d ON m.doctor_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE m.patient_id = @patientId
        ORDER BY m.visit_date DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getRecordsByPatient error:', err);
    res.status(500).json({ message: 'Server error fetching patient records' });
  }
}

async function createRecord(req, res) {
  try {
    const { patientId, doctorId, diagnosis, prescription, treatmentHistory } = req.body;
    if (!patientId || !diagnosis) {
      return res.status(400).json({ message: 'Patient and Diagnosis are required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('patient_id', sql.Int, patientId)
      .input('doctor_id', sql.Int, doctorId || null)
      .input('diagnosis', sql.VarChar, diagnosis)
      .input('prescription', sql.VarChar, prescription || '')
      .input('treatment_history', sql.VarChar, treatmentHistory || '')
      .query(`
        INSERT INTO medical_records (patient_id, doctor_id, diagnosis, prescription, treatment_history)
        OUTPUT INSERTED.id
        VALUES (@patient_id, @doctor_id, @diagnosis, @prescription, @treatment_history)
      `);

    res.status(201).json({ message: 'Medical record added successfully', id: result.recordset[0].id });
  } catch (err) {
    console.error('createRecord error:', err);
    res.status(500).json({ message: 'Server error adding medical record' });
  }
}

async function deleteRecord(req, res) {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM medical_records WHERE id = @id');
    res.json({ message: 'Record deleted' });
  } catch (err) {
    console.error('deleteRecord error:', err);
    res.status(500).json({ message: 'Server error deleting record' });
  }
}

module.exports = { getAllRecords, getRecordsByPatient, createRecord, deleteRecord };
