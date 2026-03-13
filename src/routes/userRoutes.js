const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createUser, getAllUsers, deleteUser, resetPassword } = require('../controllers/userController');

router.post('/create', authenticate, authorize('admin', 'principal'), createUser);
router.get('/all', authenticate, authorize('admin', 'principal'), getAllUsers);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);
router.put('/:id/reset-password', authenticate, authorize('admin'), resetPassword);

module.exports = router;