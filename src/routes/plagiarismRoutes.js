const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { analyzeSubmission, analyzeAllSubmissions } = require('../controllers/plagiarismController');

router.get('/analyze/:submissionId', authenticate, authorize('teacher', 'admin', 'principal'), analyzeSubmission);
router.get('/analyze-all/:assignmentId', authenticate, authorize('teacher', 'admin', 'principal'), analyzeAllSubmissions);

module.exports = router;