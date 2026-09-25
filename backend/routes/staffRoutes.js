const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getAllStaff, addStaff, getAttendance, recordAttendance,
  getLeaves, requestLeave, updateLeaveStatus
} = require('../controllers/staffController');

router.get('/', verifyToken, getAllStaff);
router.post('/', verifyToken, addStaff);
router.get('/attendance', verifyToken, getAttendance);
router.post('/attendance', verifyToken, recordAttendance);
router.get('/leaves', verifyToken, getLeaves);
router.post('/leaves', verifyToken, requestLeave);
router.put('/leaves/:id', verifyToken, updateLeaveStatus);

module.exports = router;
