const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAdminReports } = require('../controllers/reportsController');

router.get('/admin', authenticate, authorize('admin', 'principal'), getAdminReports);

module.exports = router;