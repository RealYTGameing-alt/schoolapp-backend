const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getEvents, createEvent, deleteEvent } = require('../controllers/calendarController');

router.get('/', authenticate, getEvents);
router.post('/', authenticate, authorize('admin', 'principal'), createEvent);
router.delete('/:id', authenticate, authorize('admin', 'principal'), deleteEvent);

module.exports = router;