const pool = require('../config/database');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    const unreadCount = result.rows.filter(n => !n.is_read).length;

    res.json({ notifications: result.rows, unreadCount });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [userId]
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createNotification = async (userId, title, body, type, link = null) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, body, type, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, body, type, link]
    );
  } catch (err) {
    console.error('Create notification error:', err);
  }
};

const createBulkNotifications = async (userIds, title, body, type, link = null) => {
  try {
    for (const userId of userIds) {
      await createNotification(userId, title, body, type, link);
    }
  } catch (err) {
    console.error('Bulk notification error:', err);
  }
};

const sendAnnouncementNotification = async (req, res) => {
  try {
    const { title, body, target } = req.body;

    let query = `SELECT id FROM users u JOIN roles r ON u.role_id = r.id WHERE 1=1`;
    const params = [];

    if (target === 'teachers') query += ` AND r.name = 'teacher'`;
    else if (target === 'students') query += ` AND r.name = 'student'`;
    else if (target === 'parents') query += ` AND r.name = 'parent'`;

    const users = await pool.query(query, params);
    const userIds = users.rows.map(u => u.id);

    await createBulkNotifications(userIds, title, body, 'announcement', '/announcements');

    res.json({ message: `Notification sent to ${userIds.length} users!` });
  } catch (err) {
    console.error('Send announcement notification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getNotifications, markAsRead, markAllAsRead,
  createNotification, createBulkNotifications,
  sendAnnouncementNotification
};