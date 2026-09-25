const Doctor = require('../models/Doctor');

async function getDoctors(req, res) {
  try {
    const doctors = await Doctor.getAllDoctors();
    res.json(doctors);
  } catch (err) {
    console.error('getDoctors error:', err);
    res.status(500).json({ message: 'Server error fetching doctors' });
  }
}

async function getDoctor(req, res) {
  try {
    const doctor = await Doctor.getDoctorById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    console.error('getDoctor error:', err);
    res.status(500).json({ message: 'Server error fetching doctor' });
  }
}

async function getDepartments(req, res) {
  try {
    const departments = await Doctor.getDepartments();
    res.json(departments);
  } catch (err) {
    console.error('getDepartments error:', err);
    res.status(500).json({ message: 'Server error fetching departments' });
  }
}

async function addDoctor(req, res) {
  try {
    const { userId, fullName, email, password, departmentId, specialization, schedule } = req.body;

    if (userId) {
      const id = await Doctor.createDoctor(userId, departmentId, specialization, schedule);
      return res.status(201).json({ message: 'Doctor profile created', id });
    }

    if (!fullName || !departmentId) {
      return res.status(400).json({ message: 'Doctor full name and department are required' });
    }

    const docEmail = email || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@hms.com`;
    const id = await Doctor.createDoctorWithUser(fullName, docEmail, password || 'admin123', departmentId, specialization, schedule);
    res.status(201).json({ message: 'Doctor added successfully', id });
  } catch (err) {
    console.error('addDoctor error:', err);
    res.status(500).json({ message: 'Server error adding doctor' });
  }
}

async function editDoctor(req, res) {
  try {
    const { departmentId, specialization, schedule } = req.body;
    await Doctor.updateDoctor(req.params.id, departmentId, specialization, schedule);
    res.json({ message: 'Doctor profile updated' });
  } catch (err) {
    console.error('editDoctor error:', err);
    res.status(500).json({ message: 'Server error updating doctor' });
  }
}

async function removeDoctor(req, res) {
  try {
    await Doctor.deleteDoctor(req.params.id);
    res.json({ message: 'Doctor removed' });
  } catch (err) {
    console.error('removeDoctor error:', err);
    res.status(500).json({ message: 'Server error removing doctor' });
  }
}

module.exports = { getDoctors, getDoctor, getDepartments, addDoctor, editDoctor, removeDoctor };