import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    ref: 'Patient'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  notes: String,
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
assignmentSchema.index({ patientId: 1 });
assignmentSchema.index({ doctorId: 1 });
assignmentSchema.index({ assignedBy: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ assignedAt: -1 });

// Compound index for efficient queries
assignmentSchema.index({ patientId: 1, status: 1 });
assignmentSchema.index({ doctorId: 1, status: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;