const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Create assignment
router.post('/', authenticate, authorize('teacher', 'admin'), upload.single('file'), async (req, res) => {
  const { title, description, subjectId, classId, dueDate, maxMarks } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO assignments (title, description, subject_id, class_id, created_by, due_date, max_marks, attachment_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, subjectId, classId, req.user.id, dueDate, maxMarks || 100, req.file?.path || null]
    );
    res.status(201).json({ assignment: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create assignment', details: error.message });
  }
});

// Get assignments for a class
router.get('/class/:classId', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, s.name as subject_name, u.first_name || ' ' || u.last_name as teacher_name
       FROM assignments a
       JOIN subjects s ON a.subject_id = s.id
       JOIN users u ON a.created_by = u.id
       WHERE a.class_id = $1 ORDER BY a.due_date ASC`,
      [req.params.classId]
    );
    res.json({ assignments: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Submit assignment (student)
router.post('/:id/submit', authenticate, authorize('student'), upload.single('file'), async (req, res) => {
  const { submissionText } = req.body;
  try {
    const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    const result = await pool.query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, file_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, studentRes.rows[0].id, submissionText, req.file?.path || null]
    );
    res.status(201).json({ submission: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit assignment', details: error.message });
  }
});

// Grade submission
router.put('/submissions/:submissionId/grade', authenticate, authorize('teacher', 'admin'), async (req, res) => {
  const { marksObtained, feedback } = req.body;
  try {
    const result = await pool.query(
      `UPDATE assignment_submissions SET marks_obtained=$1, feedback=$2, graded_by=$3, graded_at=NOW(), status='graded'
       WHERE id=$4 RETURNING *`,
      [marksObtained, feedback, req.user.id, req.params.submissionId]
    );
    res.json({ submission: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

module.exports = router;