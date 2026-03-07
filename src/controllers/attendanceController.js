const pool = require('../config/database');

const markAttendance = async (req, res) => {
  try {
    const { records, date, classId, subject } = req.body;
    const teacherId = req.user.id;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array is required' });
    }

    const results = [];
    for (const record of records) {
      const result = await pool.query(
        `INSERT INTO attendance (student_id, teacher_id, date, status, class_id, subject)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (student_id, date, subject)
         DO UPDATE SET status = $4
         RETURNING *`,
        [record.studentId, teacherId, date || new Date().toISOString().split('T')[0], record.status, classId || null, subject || 'General']
      );
      results.push(result.rows[0]);
    }

    res.json({ message: 'Attendance saved successfully!', records: results });
  } catch (err) {
    console.error('Mark attendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { date, classId } = req.query;

    let query = `
      SELECT a.*, u.first_name || ' ' || u.last_name as student_name
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      params.push(date);
      query += ` AND a.date = $${params.length}`;
    }

    query += ' ORDER BY a.date DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ attendance: result.rows });
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM attendance WHERE student_id = $1 ORDER BY date DESC LIMIT 30`,
      [studentId]
    );

    res.json({ attendance: result.rows });
  } catch (err) {
    console.error('Get student attendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { markAttendance, getAttendance, getStudentAttendance };