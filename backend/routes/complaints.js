const express = require('express');
const Complaint = require('../models/Complaint');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendStatusUpdateEmail } = require('../utils/email');

const router = express.Router();

// POST /api/complaints - student files a new complaint
router.post('/', protect, requireRole('student'), upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority: priority || 'medium',
      image: req.file ? `/uploads/${req.file.filename}` : '',
      filedBy: req.user._id,
      statusHistory: [{ status: 'pending', changedBy: req.user._id }],
    });

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Failed to file complaint', error: err.message });
  }
});

// GET /api/complaints - list complaints
// Students see only their own; wardens/admins see all, with optional filters.
router.get('/', protect, async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    const filter = {};

    if (req.user.role === 'student') {
      filter.filedBy = req.user._id;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate('filedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch complaints', error: err.message });
  }
});

// GET /api/complaints/stats - aggregated counts for the admin/warden dashboard
router.get('/stats', protect, requireRole('admin', 'warden'), async (req, res) => {
  try {
    const byStatus = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const total = await Complaint.countDocuments();

    res.json({
      total,
      byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
      byCategory: byCategory.map((c) => ({ category: c._id, count: c.count })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
});

// GET /api/complaints/:id - get a single complaint
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('filedBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Students can only view their own complaints
    if (req.user.role === 'student' && String(complaint.filedBy._id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch complaint', error: err.message });
  }
});

// PATCH /api/complaints/:id/status - warden/admin updates status (the core lifecycle action)
router.patch('/:id/status', protect, requireRole('warden', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const complaint = await Complaint.findById(req.params.id).populate('filedBy', 'name email');
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = status;
    complaint.statusHistory.push({ status, changedBy: req.user._id });
    await complaint.save();

    // Fire-and-forget notification; does not block the response
    sendStatusUpdateEmail({
      to: complaint.filedBy.email,
      complaintTitle: complaint.title,
      newStatus: status,
    });

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
});

// PATCH /api/complaints/:id/assign - admin assigns complaint to a warden
router.patch('/:id/assign', protect, requireRole('admin'), async (req, res) => {
  try {
    const { wardenId } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedTo: wardenId },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign complaint', error: err.message });
  }
});

// DELETE /api/complaints/:id - student can delete their own pending complaint; admin can delete any
router.delete('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const isOwner = String(complaint.filedBy) === String(req.user._id);
    const canDelete = req.user.role === 'admin' || (isOwner && complaint.status === 'pending');

    if (!canDelete) {
      return res.status(403).json({ message: 'You cannot delete this complaint' });
    }

    await complaint.deleteOne();
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete complaint', error: err.message });
  }
});

module.exports = router;
