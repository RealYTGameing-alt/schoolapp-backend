const pool = require('../config/database');

const getEvents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM events ORDER BY start_date ASC`
    );
    res.json({ events: result.rows });
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, eventType, startDate, endDate, isHoliday, audience } = req.body;
    const createdBy = req.user.id;

    const result = await pool.query(
      `INSERT INTO events (title, description, event_type, start_date, end_date, is_holiday, audience, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, eventType || 'event', startDate, endDate || startDate, isHoliday || false, audience || 'all', createdBy]
    );

    res.status(201).json({ message: 'Event created!', event: result.rows[0] });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ message: 'Event deleted!' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getEvents, createEvent, deleteEvent };