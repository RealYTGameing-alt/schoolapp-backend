const pool = require('../config/database');

const getTimetable = async (req, res) => {
  try {
    const { classId, className } = req.query;

    // If student is requesting, use their class
    let targetClass = className;
    if (!targetClass && req.user.role_name === 'student') {
      const userResult = await pool.query(
        'SELECT class_name FROM users WHERE id = $1', [req.user.id]
      );
      targetClass = userResult.rows[0]?.class_name;
    }

    const result = await pool.query(
      `SELECT * FROM timetable_entries 
       WHERE class_name = $1 
       ORDER BY day_order, start_time`,
      [targetClass || '10A']
    );

    res.json({ timetable: result.rows, className: targetClass });
  } catch (err) {
    console.error('Get timetable error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const saveTimetable = async (req, res) => {
  try {
    const { entries, className } = req.body;

    // Delete existing entries for this class
    await pool.query('DELETE FROM timetable_entries WHERE class_name = $1', [className]);

    // Insert new entries
    for (const entry of entries) {
      await pool.query(
        `INSERT INTO timetable_entries 
         (class_name, day, day_order, period, start_time, end_time, subject, teacher, room)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [className, entry.day, entry.dayOrder, entry.period,
         entry.startTime, entry.endTime, entry.subject, entry.teacher, entry.room]
      );
    }

    res.json({ message: 'Timetable saved successfully!' });
  } catch (err) {
    console.error('Save timetable error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllClasses = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT class_name FROM users WHERE class_name IS NOT NULL ORDER BY class_name'
    );
    res.json({ classes: result.rows.map(r => r.class_name) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getTimetable, saveTimetable, getAllClasses };