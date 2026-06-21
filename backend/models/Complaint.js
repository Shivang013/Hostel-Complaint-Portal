const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ['electrical', 'plumbing', 'wifi', 'mess', 'cleanliness', 'furniture', 'other'],
      required: true,
    },
    image: {
      type: String, // stored filename / path, served via /uploads
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'closed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    filedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'resolved', 'closed'],
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
