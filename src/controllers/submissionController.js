const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

// Student submits assignment
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, textContent } = req.body;
    const studentId = req.user.id;
    const file = req.file;

    if (!assignmentId) {
      return res.status(400).json({ error: 'Assignment ID is required' });
    }

    // Check assignment exists and deadline
    const assignmentResult = await pool.query(
      'SELECT * FROM assignments WHERE id = $1',
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentResult.rows[0];
    const now = new Date();
    const deadline = new Date(assignment.due_date);
    const isLate = now > deadline;

    // Check if already submitted
    const existingSubmission = await pool.query(
      'SELECT * FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignmentId, studentId]
    );

    if (existingSubmission.rows.length > 0) {
      return res.status(400).json({ error: 'You have already submitted this assignment' });
    }

    const filePath = file ? file.path : null;
    const originalName = file ? file.originalname : null;

    const result = await pool.query(
      `INSERT INTO assignment_submissions 
       (assignment_id, student_id, file_path, original_filename, text_content, submitted_at, is_late, status)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, 'submitted')
       RETURNING *`,
      [assignmentId, studentId, filePath, originalName, textContent || null, isLate]
    );

    res.status(201).json({
      message: isLate ? 'Assignment submitted (late)' : 'Assignment submitted successfully!',
      submission: result.rows[0],
      isLate
    });

  } catch (err) {
    console.error('Submit assignment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Teacher gets all submissions for an assignment
const getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const result = await pool.query(
      `SELECT s.*, 
        u.first_name || ' ' || u.last_name as student_name,
        u.email as student_email
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

// Download a submitted file
const downloadFile = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const result = await pool.query(
      'SELECT * FROM assignment_submissions WHERE id = $1',
      [submissionId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    // Return the Cloudinary URL for direct download
    res.json({ url: result.rows[0].file_path, filename: result.rows[0].original_filename });
  } catch (err) {
    console.error('Download file error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// Teacher grades a submission
const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    const result = await pool.query(
      `UPDATE assignment_submissions 
       SET grade = $1, feedback = $2, status = 'graded', graded_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [grade, feedback, submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ message: 'Submission graded!', submission: result.rows[0] });
  } catch (err) {
    console.error('Grade submission error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Student gets their own submissions
const getMySubmissions = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(
      `SELECT s.*, a.title as assignment_title, a.due_date, a.max_marks
       FROM assignment_submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.student_id = $1
       ORDER BY s.submitted_at DESC`,
      [studentId]
    );

    res.json({ submissions: result.rows });
  } catch (err) {
    console.error('Get my submissions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  submitAssignment,
  getSubmissions,
  downloadFile,
  gradeSubmission,
  getMySubmissions
};