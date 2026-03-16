const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getExams, createExam, enterResults, getResults, getStudentResults } = require('../controllers/examController');

router.get('/', authenticate, getExams);
router.post('/create', authenticate, authorize('teacher', 'admin', 'principal'), createExam);
router.post('/results', authenticate, authorize('teacher', 'admin'), enterResults);
router.get('/results/:examId', authenticate, getResults);
router.get('/my-results', authenticate, authorize('student'), getStudentResults);

module.exports = router;