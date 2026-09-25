const { sql, poolPromise } = require('../config/db');

async function getAllTests(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT l.*, p.full_name AS patient_name, p.phone AS patient_phone,
             u.full_name AS doctor_name
      FROM laboratory_tests l
      JOIN patients p ON l.patient_id = p.id
      LEFT JOIN doctors d ON l.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY l.requested_at DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getAllTests error:', err);
    res.status(500).json({ message: 'Server error fetching lab tests' });
  }
}

async function requestTest(req, res) {
  try {
    const { patientId, doctorId, testName, category, cost } = req.body;
    if (!patientId || !testName) {
      return res.status(400).json({ message: 'Patient and Test Name are required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('patient_id', sql.Int, patientId)
      .input('doctor_id', sql.Int, doctorId || null)
      .input('test_name', sql.VarChar, testName)
      .input('category', sql.VarChar, category || 'General Lab')
      .input('cost', sql.Decimal(10, 2), cost || 1500.00)
      .query(`
        INSERT INTO laboratory_tests (patient_id, doctor_id, test_name, category, cost, sample_status, status)
        OUTPUT INSERTED.id
        VALUES (@patient_id, @doctor_id, @test_name, @category, @cost, 'Pending', 'Requested')
      `);

    res.status(201).json({ message: 'Laboratory test requested', id: result.recordset[0].id });
  } catch (err) {
    console.error('requestTest error:', err);
    res.status(500).json({ message: 'Server error requesting lab test' });
  }
}

async function updateSampleStatus(req, res) {
  try {
    const { sampleStatus } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.VarChar, sampleStatus)
      .query(`
        UPDATE laboratory_tests 
        SET sample_status = @status, 
            status = CASE WHEN @status = 'Completed' THEN 'Completed' ELSE 'In Progress' END
        WHERE id = @id
      `);

    res.json({ message: 'Sample status updated' });
  } catch (err) {
    console.error('updateSampleStatus error:', err);
    res.status(500).json({ message: 'Server error updating sample status' });
  }
}

async function submitTestResult(req, res) {
  try {
    const { result, status } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('result', sql.VarChar, result)
      .input('status', sql.VarChar, status || 'Completed')
      .query(`
        UPDATE laboratory_tests 
        SET result = @result, status = @status, sample_status = 'Processed', completed_at = GETDATE()
        WHERE id = @id
      `);

    res.json({ message: 'Test result entered successfully' });
  } catch (err) {
    console.error('submitTestResult error:', err);
    res.status(500).json({ message: 'Server error saving test result' });
  }
}

module.exports = { getAllTests, requestTest, updateSampleStatus, submitTestResult };
