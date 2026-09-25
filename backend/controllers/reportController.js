const { sql, poolPromise } = require('../config/db');

async function getDashboardStats(req, res) {
  try {
    const pool = await poolPromise;

    // 1. Total Patients
    const patRes = await pool.request().query('SELECT COUNT(*) AS total_patients FROM patients');

    // 2. Today's Appointments
    const apptRes = await pool.request().query(`
      SELECT 
        COUNT(*) AS total_appointments,
        SUM(CASE WHEN CAST(appointment_date AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) AS today_appointments,
        SUM(CASE WHEN LOWER(status) = 'scheduled' OR LOWER(status) = 'booked' THEN 1 ELSE 0 END) AS pending_appointments
      FROM appointments
    `);

    // 3. Revenue Summary
    const revRes = await pool.request().query(`
      SELECT
        ISNULL(SUM(CASE WHEN LOWER(status) = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue,
        ISNULL(SUM(CASE WHEN LOWER(status) != 'paid' THEN amount ELSE 0 END), 0) AS pending_revenue
      FROM billing
    `);

    // 4. Laboratory Requests
    const labRes = await pool.request().query(`
      SELECT
        COUNT(*) AS total_requests,
        SUM(CASE WHEN LOWER(status) = 'requested' OR LOWER(sample_status) = 'pending' THEN 1 ELSE 0 END) AS pending_tests
      FROM laboratory_tests
    `);

    // 5. Pharmacy Alerts
    const pharmRes = await pool.request().query(`
      SELECT
        COUNT(*) AS total_medicines,
        SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END) AS low_stock_alerts,
        SUM(CASE WHEN expiry_date <= DATEADD(month, 3, GETDATE()) THEN 1 ELSE 0 END) AS expiry_alerts
      FROM pharmacy_inventory
    `);

    // Recent 5 appointments
    const recentAppts = await pool.request().query(`
      SELECT TOP 5 a.id, a.appointment_date, a.status,
             p.full_name AS patient_name, u.full_name AS doctor_name, d.specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      ORDER BY a.appointment_date DESC
    `);

    // Staff count
    const staffRes = await pool.request().query('SELECT COUNT(*) AS total_staff FROM staff');

    res.json({
      totalPatients: patRes.recordset[0].total_patients || 0,
      todayAppointments: apptRes.recordset[0].today_appointments || 0,
      totalAppointments: apptRes.recordset[0].total_appointments || 0,
      totalRevenue: revRes.recordset[0].total_revenue || 0,
      pendingRevenue: revRes.recordset[0].pending_revenue || 0,
      labRequests: labRes.recordset[0].total_requests || 0,
      pendingLabRequests: labRes.recordset[0].pending_tests || 0,
      pharmacyAlerts: (pharmRes.recordset[0].low_stock_alerts || 0) + (pharmRes.recordset[0].expiry_alerts || 0),
      lowStockAlerts: pharmRes.recordset[0].low_stock_alerts || 0,
      expiryAlerts: pharmRes.recordset[0].expiry_alerts || 0,
      totalMedicines: pharmRes.recordset[0].total_medicines || 0,
      totalStaff: staffRes.recordset[0].total_staff || 0,
      recentAppointments: recentAppts.recordset
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ message: 'Server error calculating dashboard stats' });
  }
}

async function getAnalyticsReport(req, res) {
  try {
    const pool = await poolPromise;

    // Monthly revenue trend (last 6 months)
    const revTrend = await pool.request().query(`
      SELECT 
        DATENAME(month, created_at) AS month_name,
        MONTH(created_at) AS month_num,
        YEAR(created_at) AS year_num,
        SUM(CASE WHEN LOWER(status) = 'paid' THEN amount ELSE 0 END) AS revenue
      FROM billing
      GROUP BY DATENAME(month, created_at), MONTH(created_at), YEAR(created_at)
      ORDER BY year_num, month_num
    `);

    // Department patient breakdown
    const deptBreakdown = await pool.request().query(`
      SELECT dept.name AS department, COUNT(a.id) AS appointment_count
      FROM departments dept
      LEFT JOIN doctors d ON d.department_id = dept.id
      LEFT JOIN appointments a ON a.doctor_id = d.id
      GROUP BY dept.name
    `);

    // Patient Gender distribution
    const genderDist = await pool.request().query(`
      SELECT gender, COUNT(*) AS count
      FROM patients
      GROUP BY gender
    `);

    res.json({
      revenueTrend: revTrend.recordset,
      departmentBreakdown: deptBreakdown.recordset,
      genderDistribution: genderDist.recordset
    });
  } catch (err) {
    console.error('getAnalyticsReport error:', err);
    res.status(500).json({ message: 'Server error generating analytics report' });
  }
}

module.exports = { getDashboardStats, getAnalyticsReport };
