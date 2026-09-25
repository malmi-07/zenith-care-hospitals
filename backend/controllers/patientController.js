const Patient = require('../models/Patient');

async function getPatients(req, res) {
  try {
    const search = req.query.search || '';
    const patients = await Patient.getAllPatients(search);
    res.json(patients);
  } catch (err) {
    console.error('getPatients error:', err);
    res.status(500).json({ message: 'Server error fetching patients' });
  }
}

async function getPatient(req, res) {
  try {
    const patient = await Patient.getPatientById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    console.error('getPatient error:', err);
    res.status(500).json({ message: 'Server error fetching patient' });
  }
}

async function getPatientHistory(req, res) {
  try {
    const history = await Patient.getPatientFullHistory(req.params.id);
    if (!history) return res.status(404).json({ message: 'Patient not found' });
    res.json(history);
  } catch (err) {
    console.error('getPatientHistory error:', err);
    res.status(500).json({ message: 'Server error fetching patient history' });
  }
}

async function addPatient(req, res) {
  try {
    const { fullName, dob, gender, phone, address, bloodGroup, emergencyContact } = req.body;
    if (!fullName) return res.status(400).json({ message: 'Patient full name is required' });

    const id = await Patient.createPatient(fullName, dob, gender, phone, address, bloodGroup, emergencyContact);
    res.status(201).json({ message: 'Patient registered successfully', id });
  } catch (err) {
    console.error('addPatient error:', err);
    res.status(500).json({ message: 'Server error adding patient' });
  }
}

async function editPatient(req, res) {
  try {
    const { fullName, dob, gender, phone, address, bloodGroup, emergencyContact } = req.body;
    await Patient.updatePatient(req.params.id, fullName, dob, gender, phone, address, bloodGroup, emergencyContact);
    res.json({ message: 'Patient profile updated successfully' });
  } catch (err) {
    console.error('editPatient error:', err);
    res.status(500).json({ message: 'Server error updating patient' });
  }
}

async function removePatient(req, res) {
  try {
    await Patient.deletePatient(req.params.id);
    res.json({ message: 'Patient record removed' });
  } catch (err) {
    console.error('removePatient error:', err);
    res.status(500).json({ message: 'Server error deleting patient' });
  }
}

module.exports = { getPatients, getPatient, getPatientHistory, addPatient, editPatient, removePatient };