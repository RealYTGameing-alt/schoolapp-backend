const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getMaterials, createMaterial, deleteMaterial } = require('../controllers/materialsController');

router.get('/', authenticate, getMaterials);
router.post('/', authenticate, authorize('teacher', 'admin', 'principal'), createMaterial);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), deleteMaterial);

module.exports = router;