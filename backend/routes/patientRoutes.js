const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getPatients, getPatient, getPatientHistory, addPatient, editPatient, removePatient
} = require('../controllers/patientController');

router.get('/', verifyToken, getPatients);
router.get('/:id', verifyToken, getPatient);
router.get('/:id/history', verifyToken, getPatientHistory);
router.post('/', verifyToken, addPatient);
router.put('/:id', verifyToken, editPatient);
router.delete('/:id', verifyToken, removePatient);

module.exports = router;