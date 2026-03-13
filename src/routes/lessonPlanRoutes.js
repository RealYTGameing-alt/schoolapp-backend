const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createLessonPlan, getLessonPlans,
  updateLessonPlan, deleteLessonPlan
} = require('../controllers/lessonPlanController');

router.post('/', authenticate, authorize('teacher'), createLessonPlan);
router.get('/', authenticate, getLessonPlans);
router.put('/:id', authenticate, authorize('teacher'), updateLessonPlan);
router.delete('/:id', authenticate, authorize('teacher'), deleteLessonPlan);

module.exports = router;