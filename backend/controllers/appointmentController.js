const Appointment = require('../models/Appointment');

async function getAppointments(req, res) {
  try {
    const appointments = await Appointment.getAllAppointments();
    res.json(appointments);
  } catch (err) {
    console.error('getAppointments error:', err);
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
}

async function getAppointment(req, res) {
  try {
    const appointment = await Appointment.getAppointmentById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    console.error('getAppointment error:', err);
    res.status(500).json({ message: 'Server error fetching appointment' });
  }
}

async function bookAppointment(req, res) {
  try {
    const { patientId, doctorId, appointmentDate, notes } = req.body;
    if (!patientId || !doctorId || !appointmentDate) {
      return res.status(400).json({ message: 'Patient, Doctor, and Date/Time are required' });
    }
    const id = await Appointment.createAppointment(patientId, doctorId, appointmentDate, notes);
    res.status(201).json({ message: 'Appointment booked successfully', id });
  } catch (err) {
    console.error('bookAppointment error:', err);
    res.status(500).json({ message: 'Server error booking appointment' });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    await Appointment.updateAppointmentStatus(req.params.id, status);
    res.json({ message: `Appointment status changed to ${status}` });
  } catch (err) {
    console.error('updateStatus error:', err);
    res.status(500).json({ message: 'Server error updating status' });
  }
}

async function cancelAppointment(req, res) {
  try {
    await Appointment.updateAppointmentStatus(req.params.id, 'Cancelled');
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    console.error('cancelAppointment error:', err);
    res.status(500).json({ message: 'Server error cancelling appointment' });
  }
}

async function completeAppointment(req, res) {
  try {
    await Appointment.updateAppointmentStatus(req.params.id, 'Completed');
    res.json({ message: 'Appointment marked completed' });
  } catch (err) {
    console.error('completeAppointment error:', err);
    res.status(500).json({ message: 'Server error marking appointment completed' });
  }
}

async function rescheduleAppointmentHandler(req, res) {
  try {
    const { appointmentDate } = req.body;
    if (!appointmentDate) return res.status(400).json({ message: 'New appointment date is required' });
    await Appointment.rescheduleAppointment(req.params.id, appointmentDate);
    res.json({ message: 'Appointment rescheduled successfully' });
  } catch (err) {
    console.error('reschedule error:', err);
    res.status(500).json({ message: 'Server error rescheduling appointment' });
  }
}

async function removeAppointment(req, res) {
  try {
    await Appointment.deleteAppointment(req.params.id);
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    console.error('removeAppointment error:', err);
    res.status(500).json({ message: 'Server error deleting appointment' });
  }
}

module.exports = {
  getAppointments, getAppointment, bookAppointment,
  updateStatus, cancelAppointment, completeAppointment,
  rescheduleAppointmentHandler, removeAppointment
};