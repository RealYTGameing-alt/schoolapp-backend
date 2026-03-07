const pool = require('../config/database');

const getAdminStats = async (req, res) => {
  try {
    const studentCount = await pool.query(
      "SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'student'"
    );
    const staffCount = await pool.query(
      "SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name IN ('teacher', 'admin', 'principal')"
    );
    const todayAttendance = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'present') as present,
        COUNT(*) as total
       FROM attendance 
       WHERE date = CURRENT_DATE`
    );

    const attendanceRate = todayAttendance.rows[0].total > 0
      ? Math.round((todayAttendance.rows[0].present / todayAttendance.rows[0].total) * 100)
      : 0;

    res.json({
      totalStudents: parseInt(studentCount.rows[0].count),
      totalStaff: parseInt(staffCount.rows[0].count),
      attendanceRate: attendanceRate + '%',
      feeCollected: '₹12.4L',
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const assignmentCount = await pool.query(
      'SELECT COUNT(*) FROM assignments WHERE teacher_id = $1',
      [teacherId]
    );

    const recentAttendance = await pool.query(
      `SELECT date, 
        COUNT(*) FILTER (WHERE status = 'present') as present,
        COUNT(*) as total
       FROM attendance 
       WHERE teacher_id = $1
       GROUP BY date 
       ORDER BY date DESC 
       LIMIT 7`,
      [teacherId]
    );

    res.json({
      totalAssignments: parseInt(assignmentCount.rows[0].count),
      recentAttendance: recentAttendance.rows,
    });
  } catch (err) {
    console.error('Teacher stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getStudentStats = async (req, res) => {
  try {
    const studentId = req.user.id;

    const attendanceStats = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'present') as present,
        COUNT(*) FILTER (WHERE status = 'absent') as absent,
        COUNT(*) as total
       FROM attendance 
       WHERE student_id = $1`,
      [studentId]
    );

    const submissionCount = await pool.query(
      'SELECT COUNT(*) FROM assignment_submissions WHERE student_id = $1',
      [studentId]
    );

    const stats = attendanceStats.rows[0];
    const attendanceRate = stats.total > 0
      ? Math.round((stats.present / stats.total) * 100)
      : 0;

    res.json({
      attendanceRate,
      present: parseInt(stats.present),
      absent: parseInt(stats.absent),
      totalSubmissions: parseInt(submissionCount.rows[0].count),
    });
  } catch (err) {
    console.error('Student stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAdminStats, getTeacherStats, getStudentStats };