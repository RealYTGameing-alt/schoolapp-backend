const pool = require('../config/database');

const getStudentProgress = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user.id;

    // Get attendance stats
    const attendanceStats = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'present') as present,
        COUNT(*) FILTER (WHERE status = 'absent') as absent,
        COUNT(*) FILTER (WHERE status = 'late') as late,
        COUNT(*) as total
       FROM attendance WHERE student_id = $1`,
      [studentId]
    );

    // Get submission stats
    const submissionStats = await pool.query(
      `SELECT 
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE status = 'graded') as graded,
        AVG(grade) FILTER (WHERE grade IS NOT NULL) as avg_grade
       FROM assignment_submissions WHERE student_id = $1`,
      [studentId]
    );

    // Get recent submissions with grades
    const recentSubmissions = await pool.query(
      `SELECT s.*, a.title as assignment_title, a.max_marks, a.due_date
       FROM assignment_submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.student_id = $1
       ORDER BY s.submitted_at DESC LIMIT 10`,
      [studentId]
    );

    // Get attendance by month
    const attendanceByMonth = await pool.query(
      `SELECT 
        TO_CHAR(date, 'Mon') as month,
        EXTRACT(MONTH FROM date) as month_num,
        COUNT(*) FILTER (WHERE status = 'present') as present,
        COUNT(*) as total
       FROM attendance 
       WHERE student_id = $1 AND date >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date)
       ORDER BY month_num`,
      [studentId]
    );

    const stats = attendanceStats.rows[0];
    const subStats = submissionStats.rows[0];
    const attendanceRate = stats.total > 0
      ? Math.round((stats.present / stats.total) * 100) : 0;

    res.json({
      attendanceRate,
      present: parseInt(stats.present) || 0,
      absent: parseInt(stats.absent) || 0,
      late: parseInt(stats.late) || 0,
      totalDays: parseInt(stats.total) || 0,
      totalSubmissions: parseInt(subStats.total_submissions) || 0,
      gradedSubmissions: parseInt(subStats.graded) || 0,
      avgGrade: subStats.avg_grade ? Math.round(subStats.avg_grade) : null,
      recentSubmissions: recentSubmissions.rows,
      attendanceByMonth: attendanceByMonth.rows,
    });
  } catch (err) {
    console.error('Get student progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getStudentProgress };