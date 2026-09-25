const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getBills, getBill, getPatientBills, generateBill, payBill, removeBill, revenueSummary
} = require('../controllers/billingController');

router.get('/summary', verifyToken, revenueSummary);
router.get('/', verifyToken, getBills);
router.get('/:id', verifyToken, getBill);
router.get('/patient/:patientId', verifyToken, getPatientBills);
router.post('/', verifyToken, generateBill);
router.put('/:id/pay', verifyToken, payBill);
router.delete('/:id', verifyToken, removeBill);

module.exports = router;