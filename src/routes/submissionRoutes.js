const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { submitAssignment, getSubmissions } = require('../controllers/submissionController');

router.post('/submit', authenticate, authorize('student'), upload.single('file'), submitAssignment);
router.get('/:assignmentId', authenticate, getSubmissions);

module.exports = router;