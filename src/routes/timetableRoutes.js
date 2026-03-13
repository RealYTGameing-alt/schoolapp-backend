const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getTimetable, saveTimetable, getAllClasses } = require('../controllers/timetableController');

router.get('/', authenticate, getTimetable);
router.post('/save', authenticate, authorize('admin', 'principal', 'teacher'), saveTimetable);
router.get('/classes', authenticate, getAllClasses);

module.exports = router;