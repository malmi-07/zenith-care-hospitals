const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getInventory, addMedicine, updateStock, dispenseMedicine, getPharmacyAlerts
} = require('../controllers/pharmacyController');

router.get('/alerts', verifyToken, getPharmacyAlerts);
router.get('/', verifyToken, getInventory);
router.post('/', verifyToken, addMedicine);
router.put('/:id/stock', verifyToken, updateStock);
router.post('/dispense', verifyToken, dispenseMedicine);

module.exports = router;
