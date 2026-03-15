const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getStudentProgress } = require('../controllers/progressController');

router.get('/student', authenticate, getStudentProgress);
router.get('/student/:studentId', authenticate, authorize('admin', 'principal', 'teacher', 'parent'), getStudentProgress);

module.exports = router;
