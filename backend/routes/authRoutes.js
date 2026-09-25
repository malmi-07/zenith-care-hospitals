const express = require('express');
const router = express.Router();
const { register, login, getRoles, getDemoAccounts } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/roles', getRoles);
router.get('/demo-users', getDemoAccounts);

module.exports = router;