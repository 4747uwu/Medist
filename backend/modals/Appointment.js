import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true,
    // required: true
  },
  
  // Patient reference
  patientId: {
    type: String,
    required: true,
    ref: 'Patient'
  },
  
  // Doctor reference
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Lab reference
  labId: {
    type: String,
    required: true,
    ref: 'Lab'
  },
  
  // Appointment details
  scheduledDate: {
    type: Date,
    required: true
  },
  
  scheduledTime: {
    type: String,
    required: true // Format: "09:30"
  },
  
  duration: {
    type: Number,
    default: 30, // minutes
    min: 15,
    max: 120
  },
  
  appointmentType: {
    type: String,
    enum: ['Consultation', 'Follow-up', 'Check-up', 'Emergency', 'Procedure'],
    default: 'Consultation'
  },
  
  mode: {
    type: String,
    enum: ['In-person', 'Video Call', 'Phone Call'],
    default: 'In-person'
  },
  
  // Appointment status
  status: {
    type: String,
    enum: ['Scheduled', 'Confirmed', 'In-Progress', 'Completed', 'Cancelled', 'No-Show', 'Rescheduled'],
    default: 'Scheduled'
  },
  
  // Chief complaints and reason
  chiefComplaints: {
    primary: String,
    secondary: [String],
    duration: String,
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe', 'Critical'],
      default: 'Moderate'
    }
  },
  
  // Vitals recorded during appointment
  vitals: {
    weight: {
      value: Number,
      unit: { type: String, default: 'kg' }
    },
    height: {
      value: Number,
      unit: { type: String, default: 'cm' }
    },
    temperature: {
      value: Number,
      unit: { type: String, default: '°F' }
    },
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: {
      value: Number,
      unit: { type: String, default: 'bpm' }
    },
    oxygenSaturation: {
      value: Number,
      unit: { type: String, default: '%' }
    },
    bloodSugar: {
      value: Number,
      type: { type: String, enum: ['Fasting', 'Random', 'Post-meal'], default: 'Random' },
      unit: { type: String, default: 'mg/dL' }
    }
  },
  
  // Clinical examination
  examination: {
    physicalFindings: String,
    provisionalDiagnosis: String,
    differentialDiagnosis: [String]
  },
  
  // Treatment and prescription reference
  treatment: {
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    prescriptionIssued: {
      type: Boolean,
      default: false
    },
    prescriptionDate: Date
  },
  
  // Follow-up planning
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    nextAppointmentDate: Date,
    nextAppointmentId: String,
    instructions: String,
    notes: String
  },
  
  // ADDED: Assignment tracking fields
  assignedAt: Date,
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignmentNotes: String,
  
  // ADDED: Completion tracking
  completedAt: Date,
  
  // Created and assigned by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true
});

// Indexes for performance
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ labId: 1 });
appointmentSchema.index({ scheduledDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ 'treatment.prescriptionId': 1 });
appointmentSchema.index({ assignedBy: 1 }); // NEW
appointmentSchema.index({ assignedAt: 1 }); // NEW

// Compound indexes
appointmentSchema.index({ doctorId: 1, scheduledDate: 1 });
appointmentSchema.index({ patientId: 1, scheduledDate: -1 });
appointmentSchema.index({ labId: 1, status: 1 });

// Static method to generate appointment ID
appointmentSchema.statics.generateAppointmentId = async function(labId) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await this.countDocuments({
    appointmentId: { $regex: `^APT-${labId}-${dateStr}` }
  });
  return `APT-${labId}-${dateStr}-${String(count + 1).padStart(3, '0')}`;
};

// Pre-save middleware
appointmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.appointmentId) {
    this.appointmentId = await this.constructor.generateAppointmentId(this.labId);
  }
  next();
});

// Virtual for appointment datetime
appointmentSchema.virtual('scheduledDateTime').get(function() {
  if (this.scheduledDate && this.scheduledTime) {
    const [hours, minutes] = this.scheduledTime.split(':');
    const datetime = new Date(this.scheduledDate);
    datetime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return datetime;
  }
  return null;
});

appointmentSchema.set('toJSON', { virtuals: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;