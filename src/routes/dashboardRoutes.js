const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAdminStats, getTeacherStats, getStudentStats } = require('../controllers/dashboardController');

router.get('/admin', authenticate, authorize('admin', 'principal'), getAdminStats);
router.get('/teacher', authenticate, authorize('teacher'), getTeacherStats);
router.get('/student', authenticate, authorize('student'), getStudentStats);

module.exports = router;