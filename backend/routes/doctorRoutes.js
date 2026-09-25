const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getDoctors, getDoctor, getDepartments, addDoctor, editDoctor, removeDoctor
} = require('../controllers/doctorController');

router.get('/departments', verifyToken, getDepartments);
router.get('/', verifyToken, getDoctors);
router.get('/:id', verifyToken, getDoctor);
router.post('/', verifyToken, addDoctor);
router.put('/:id', verifyToken, editDoctor);
router.delete('/:id', verifyToken, removeDoctor);

module.exports = router;