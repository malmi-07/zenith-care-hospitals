const { sql, poolPromise } = require('../config/db');

async function getAllBills() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT b.id, b.invoice_number, b.amount, b.description, b.charge_type, 
           b.status, b.payment_method, b.created_at, b.paid_at,
           p.id AS patient_id, p.full_name AS patient_name, p.phone AS patient_phone, p.address AS patient_address
    FROM billing b
    JOIN patients p ON b.patient_id = p.id
    ORDER BY b.created_at DESC
  `);
  return result.recordset;
}

async function getBillById(id) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT b.id, b.invoice_number, b.amount, b.description, b.charge_type, 
             b.status, b.payment_method, b.created_at, b.paid_at,
             p.id AS patient_id, p.full_name AS patient_name, p.phone AS patient_phone, 
             p.address AS patient_address, p.blood_group
      FROM billing b
      JOIN patients p ON b.patient_id = p.id
      WHERE b.id = @id
    `);
  return result.recordset[0];
}

async function getBillsByPatient(patientId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('patient_id', sql.Int, patientId)
    .query('SELECT * FROM billing WHERE patient_id = @patient_id ORDER BY created_at DESC');
  return result.recordset;
}

async function createBill(patientId, amount, description, chargeType = 'Consultation', paymentMethod = 'Cash') {
  const pool = await poolPromise;
  const invNumber = `INV-${Date.now().toString().slice(-6)}`;
  const result = await pool.request()
    .input('patient_id', sql.Int, patientId)
    .input('amount', sql.Decimal(10, 2), amount)
    .input('description', sql.VarChar, description || `${chargeType} service`)
    .input('charge_type', sql.VarChar, chargeType)
    .input('invoice_number', sql.VarChar, invNumber)
    .input('payment_method', sql.VarChar, paymentMethod)
    .query(`INSERT INTO billing (patient_id, amount, description, charge_type, invoice_number, payment_method, status)
            OUTPUT INSERTED.id
            VALUES (@patient_id, @amount, @description, @charge_type, @invoice_number, @payment_method, 'Pending')`);
  return result.recordset[0].id;
}

async function markAsPaid(id, paymentMethod = 'Cash') {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('method', sql.VarChar, paymentMethod)
    .query(`
      UPDATE billing 
      SET status = 'Paid', payment_method = @method, paid_at = GETDATE() 
      WHERE id = @id
    `);
}

async function deleteBill(id) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM billing WHERE id = @id');
}

async function getRevenueSummary() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT
      SUM(CASE WHEN LOWER(status) = 'paid' THEN amount ELSE 0 END) AS total_collected,
      SUM(CASE WHEN LOWER(status) != 'paid' THEN amount ELSE 0 END) AS total_pending,
      COUNT(*) AS total_invoices,
      SUM(CASE WHEN LOWER(status) = 'paid' AND CAST(paid_at AS DATE) = CAST(GETDATE() AS DATE) THEN amount ELSE 0 END) AS today_revenue
    FROM billing
  `);
  return result.recordset[0];
}

module.exports = { getAllBills, getBillById, getBillsByPatient, createBill, markAsPaid, deleteBill, getRevenueSummary };