const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Mark attendance
router.post('/', authenticate, authorize('teacher', 'admin'), async (req, res) => {
  const { records, subjectId, date } = req.body;
  try {
    const insertPromises = records.map(({ studentId, status, remarks }) =>
      pool.query(
        `INSERT INTO attendance (student_id, subject_id, date, status, marked_by, remarks)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (student_id, subject_id, date) DO UPDATE SET status=$4, remarks=$6`,
        [studentId, subjectId, date, status, req.user.id, remarks]
      )
    );
    await Promise.all(insertPromises);
    res.json({ message: 'Attendance saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save attendance', details: error.message });
  }
});

// Get attendance by class and date
router.get('/class/:classId', authenticate, async (req, res) => {
  const { classId } = req.params;
  const { date, subjectId } = req.query;
  try {
    const result = await pool.query(
      `SELECT a.*, u.first_name, u.last_name, s.admission_number
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE s.class_id = $1 AND a.date = $2 AND ($3::int IS NULL OR a.subject_id = $3)
       ORDER BY u.first_name`,
      [classId, date, subjectId || null]
    );
    res.json({ attendance: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get student attendance summary
router.get('/student/:studentId/summary', authenticate, async (req, res) => {
  const { studentId } = req.params;
  const { month, year } = req.query;
  try {
    const result = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'present') as present_count,
         COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
         COUNT(*) FILTER (WHERE status = 'late') as late_count,
         COUNT(*) as total_days,
         ROUND(COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0), 2) as percentage
       FROM attendance
       WHERE student_id = $1
         AND ($2::int IS NULL OR EXTRACT(MONTH FROM date) = $2)
         AND ($3::int IS NULL OR EXTRACT(YEAR FROM date) = $3)`,
      [studentId, month || null, year || null]
    );
    res.json({ summary: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

module.exports = router;