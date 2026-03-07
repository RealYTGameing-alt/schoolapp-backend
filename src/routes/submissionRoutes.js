const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  submitAssignment,
  getSubmissions,
  downloadFile,
  gradeSubmission,
  getMySubmissions
} = require('../controllers/submissionController');

// Student submits assignment (with optional file)
router.post('/submit', authenticate, authorize('student'), upload.single('file'), submitAssignment);

// Student gets their submissions
router.get('/my', authenticate, authorize('student'), getMySubmissions);

// Teacher gets submissions for an assignment
router.get('/assignment/:assignmentId', authenticate, authorize('teacher', 'admin'), getSubmissions);

// Download a file
router.get('/download/:submissionId', authenticate, downloadFile);

// Teacher grades a submission
router.put('/grade/:submissionId', authenticate, authorize('teacher', 'admin'), gradeSubmission);

module.exports = router;