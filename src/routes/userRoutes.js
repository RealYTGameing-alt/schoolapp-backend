const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createUser, getAllUsers, deleteUser, resetPassword, updateProfile, changePassword } = require('../controllers/userController');

router.post('/create', authenticate, authorize('admin', 'principal'), createUser);
router.get('/all', authenticate, authorize('admin', 'principal'), getAllUsers);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);
router.put('/:id/reset-password', authenticate, authorize('admin'), resetPassword);
router.put('/:id/profile', authenticate, updateProfile);
router.put('/:id/change-password', authenticate, changePassword);

module.exports = router;