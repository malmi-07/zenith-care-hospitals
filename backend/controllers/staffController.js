const { sql, poolPromise } = require('../config/db');

async function getAllStaff(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT s.*, d.name AS department_name
      FROM staff s
      LEFT JOIN departments d ON s.department_id = d.id
      ORDER BY s.id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getAllStaff error:', err);
    res.status(500).json({ message: 'Server error fetching staff' });
  }
}

async function addStaff(req, res) {
  try {
    const { fullName, role, departmentId, email, phone, joinDate, status } = req.body;
    if (!fullName || !role) {
      return res.status(400).json({ message: 'Full name and role are required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('full_name', sql.VarChar, fullName)
      .input('role', sql.VarChar, role)
      .input('department_id', sql.Int, departmentId || null)
      .input('email', sql.VarChar, email || '')
      .input('phone', sql.VarChar, phone || '')
      .input('join_date', sql.Date, joinDate || null)
      .input('status', sql.VarChar, status || 'Active')
      .query(`
        INSERT INTO staff (full_name, role, department_id, email, phone, join_date, status)
        OUTPUT INSERTED.id
        VALUES (@full_name, @role, @department_id, @email, @phone, ISNULL(@join_date, GETDATE()), @status)
      `);

    res.status(201).json({ message: 'Staff member registered', id: result.recordset[0].id });
  } catch (err) {
    console.error('addStaff error:', err);
    res.status(500).json({ message: 'Server error adding staff' });
  }
}

async function getAttendance(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT a.*, s.full_name, s.role, d.name AS department
      FROM staff_attendance a
      JOIN staff s ON a.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      ORDER BY a.date DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getAttendance error:', err);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
}

async function recordAttendance(req, res) {
  try {
    const { staffId, date, status, checkIn, checkOut } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('staff_id', sql.Int, staffId)
      .input('date', sql.Date, date || new Date())
      .input('status', sql.VarChar, status || 'Present')
      .input('check_in', sql.VarChar, checkIn || '08:30 AM')
      .input('check_out', sql.VarChar, checkOut || '05:00 PM')
      .query(`
        INSERT INTO staff_attendance (staff_id, date, status, check_in, check_out)
        VALUES (@staff_id, @date, @status, @check_in, @check_out)
      `);

    res.status(201).json({ message: 'Attendance recorded' });
  } catch (err) {
    console.error('recordAttendance error:', err);
    res.status(500).json({ message: 'Server error recording attendance' });
  }
}

async function getLeaves(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT l.*, s.full_name, s.role
      FROM staff_leaves l
      JOIN staff s ON l.staff_id = s.id
      ORDER BY l.start_date DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getLeaves error:', err);
    res.status(500).json({ message: 'Server error fetching leaves' });
  }
}

async function requestLeave(req, res) {
  try {
    const { staffId, leaveType, startDate, endDate, reason } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('staff_id', sql.Int, staffId)
      .input('leave_type', sql.VarChar, leaveType || 'Casual')
      .input('start_date', sql.Date, startDate)
      .input('end_date', sql.Date, endDate)
      .input('reason', sql.VarChar, reason || '')
      .query(`
        INSERT INTO staff_leaves (staff_id, leave_type, start_date, end_date, reason, status)
        VALUES (@staff_id, @leave_type, @start_date, @end_date, @reason, 'Pending')
      `);

    res.status(201).json({ message: 'Leave application submitted' });
  } catch (err) {
    console.error('requestLeave error:', err);
    res.status(500).json({ message: 'Server error submitting leave' });
  }
}

async function updateLeaveStatus(req, res) {
  try {
    const { status } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.VarChar, status)
      .query('UPDATE staff_leaves SET status = @status WHERE id = @id');

    res.json({ message: `Leave status updated to ${status}` });
  } catch (err) {
    console.error('updateLeaveStatus error:', err);
    res.status(500).json({ message: 'Server error updating leave status' });
  }
}

module.exports = {
  getAllStaff, addStaff, getAttendance, recordAttendance,
  getLeaves, requestLeave, updateLeaveStatus
};
