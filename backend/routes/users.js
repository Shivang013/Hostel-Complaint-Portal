const express = require('express');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - list all users (admin only)
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

// GET /api/users/wardens - list warden accounts (used to populate the "assign to" dropdown, admin only)
router.get('/wardens', protect, requireRole('admin'), async (req, res) => {
  try {
    const wardens = await User.find({ role: 'warden' }).select('-password');
    res.json(wardens);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch wardens', error: err.message });
  }
});

// PATCH /api/users/:id/role - change a user's role (admin only)
router.patch('/:id/role', protect, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'warden', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
});

module.exports = router;
