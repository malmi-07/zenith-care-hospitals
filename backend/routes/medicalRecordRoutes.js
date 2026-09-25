const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getAllRecords, getRecordsByPatient, createRecord, deleteRecord
} = require('../controllers/medicalRecordController');

router.get('/', verifyToken, getAllRecords);
router.get('/patient/:patientId', verifyToken, getRecordsByPatient);
router.post('/', verifyToken, createRecord);
router.delete('/:id', verifyToken, deleteRecord);

module.exports = router;
