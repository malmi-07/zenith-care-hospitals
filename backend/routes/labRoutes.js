const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getAllTests, requestTest, updateSampleStatus, submitTestResult
} = require('../controllers/labController');

router.get('/', verifyToken, getAllTests);
router.post('/', verifyToken, requestTest);
router.put('/:id/sample', verifyToken, updateSampleStatus);
router.put('/:id/result', verifyToken, submitTestResult);

module.exports = router;
