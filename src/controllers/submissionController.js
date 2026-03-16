const pool = require('../config/database');

const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, textContent } = req.body;
    const studentId = req.user.id;

    const filePath = req.file ? req.file.path : null;
    const originalFilename = req.file ? req.file.originalname : null;

    const existing = await pool.query(
      'SELECT id FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignmentId, studentId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE assignment_submissions 
         SET file_path = $1, original_filename = $2, text_content = $3,
             submitted_at = NOW(), status = 'submitted'
         WHERE assignment_id = $4 AND student_id = $5`,
        [filePath, originalFilename, textContent || null, assignmentId, studentId]
      );
    } else {
      await pool.query(
        `INSERT INTO assignment_submissions 
         (assignment_id, student_id, file_path, original_filename, text_content, status)
         VALUES ($1, $2, $3, $4, $5, 'submitted')`,
        [assignmentId, studentId, filePath, originalFilename, textContent || null]
      );
    }

    res.json({ message: 'Assignment submitted successfully!' });
  } catch (err) {
    console.error('Submit assignment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const result = await pool.query(
      `SELECT s.*, u.first_name || ' ' || u.last_name as student_name
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );

    res.json({ submissions: result.rows });
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { submitAssignment, getSubmissions };
