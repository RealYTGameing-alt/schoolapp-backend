const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getNotifications, markAsRead,
  markAllAsRead, sendAnnouncementNotification
} = require('../controllers/notificationController');

router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markAsRead);
router.put('/read-all/all', authenticate, markAllAsRead);
router.post('/announce', authenticate, sendAnnouncementNotification);

module.exports = router;