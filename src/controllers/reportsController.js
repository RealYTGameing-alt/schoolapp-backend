const pool = require('../config/database');

const getAdminReports = async (req, res) => {
  try {
    // Attendance by day of week
    const attendanceByDay = await pool.query(`
      SELECT 
        TO_CHAR(date, 'Dy') as day,
        EXTRACT(DOW FROM date) as day_num,
        COUNT(*) FILTER (WHERE status = 'present') as present,
        COUNT(*) as total
      FROM attendance
      WHERE date >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(date, 'Dy'), EXTRACT(DOW FROM date)
      ORDER BY day_num
    `);

    // Attendance by month
    const attendanceByMonth = await pool.query(`
      SELECT 
        TO_CHAR(date, 'Mon') as month,
        EXTRACT(MONTH FROM date) as month_num,
        ROUND(COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0)) as rate
      FROM attendance
      WHERE date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date)
      ORDER BY month_num
    `);

    // User counts by role
    const usersByRole = await pool.query(`
      SELECT r.name as role, COUNT(u.id) as count
      FROM users u
      JOIN roles r ON u.role_id = r.id
      GROUP BY r.name
    `);

    // Submission stats
    const submissionStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'graded') as graded,
        COUNT(*) FILTER (WHERE is_late = true) as late,
        ROUND(AVG(grade) FILTER (WHERE grade IS NOT NULL), 1) as avg_grade
      FROM assignment_submissions
    `);

    // Lesson plan stats
    const lessonStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
        COUNT(*) FILTER (WHERE status = 'draft') as draft
      FROM lesson_plans
    `);

    res.json({
      attendanceByDay: attendanceByDay.rows,
      attendanceByMonth: attendanceByMonth.rows,
      usersByRole: usersByRole.rows,
      submissionStats: submissionStats.rows[0],
      lessonStats: lessonStats.rows[0],
    });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAdminReports };