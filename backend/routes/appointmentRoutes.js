const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getAppointments, getAppointment, bookAppointment,
  updateStatus, cancelAppointment, completeAppointment,
  rescheduleAppointmentHandler, removeAppointment
} = require('../controllers/appointmentController');

router.get('/', verifyToken, getAppointments);
router.get('/:id', verifyToken, getAppointment);
router.post('/', verifyToken, bookAppointment);
router.put('/:id/status', verifyToken, updateStatus);
router.put('/:id/cancel', verifyToken, cancelAppointment);
router.put('/:id/complete', verifyToken, completeAppointment);
router.put('/:id/reschedule', verifyToken, rescheduleAppointmentHandler);
router.delete('/:id', verifyToken, removeAppointment);

module.exports = router;