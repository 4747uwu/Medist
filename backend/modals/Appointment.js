import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true,
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
    required: true
  },
  
  duration: {
    type: Number,
    default: 30,
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
  
  // ✅ NEW: Documents attached to this specific appointment
  documents: [{
    documentType: {
      type: String,
      enum: ['Lab Report', 'X-Ray', 'Prescription', 'Medical Certificate', 'Referral Letter', 'Scan Report', 'Other'],
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: {
      type: String,
      default: ''
    }
  }],
  
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
  
  // ✅ UPDATED: Multiple prescriptions per appointment
  prescriptions: [{
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    prescriptionCode: String,
    issuedAt: Date,
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Cancelled', 'Expired'],
      default: 'Active'
    }
  }],
  
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
  
  // Assignment tracking
  assignedAt: Date,
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignmentNotes: String,
  
  // Completion tracking
  completedAt: Date,
  
  // Created and modified by
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

// Indexes
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ labId: 1 });
appointmentSchema.index({ scheduledDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ 'prescriptions.prescriptionId': 1 });
appointmentSchema.index({ assignedBy: 1 });
appointmentSchema.index({ assignedAt: 1 });

// Compound indexes
appointmentSchema.index({ doctorId: 1, scheduledDate: 1 });
appointmentSchema.index({ patientId: 1, scheduledDate: -1 });
appointmentSchema.index({ labId: 1, status: 1 });

// ✅ NEW: Method to add prescription to appointment
appointmentSchema.methods.addPrescription = function(prescriptionData) {
  this.prescriptions.push({
    prescriptionId: prescriptionData._id,
    prescriptionCode: prescriptionData.prescriptionId,
    issuedAt: new Date(),
    issuedBy: prescriptionData.doctorId,
    status: 'Active'
  });
  return this.save();
};

// ✅ NEW: Method to add document to appointment
appointmentSchema.methods.addDocument = function(documentData) {
  this.documents.push({
    documentType: documentData.documentType || 'Other',
    fileName: documentData.fileName,
    fileUrl: documentData.fileUrl,
    fileSize: documentData.fileSize,
    mimeType: documentData.mimeType,
    uploadedAt: documentData.uploadedAt || new Date(),
    uploadedBy: documentData.uploadedBy,
    description: documentData.description || ''
  });
  return this.save();
};

// ✅ Method to remove document from appointment
appointmentSchema.methods.removeDocument = function(documentId) {
  this.documents = this.documents.filter(
    doc => doc._id.toString() !== documentId.toString()
  );
  return this.save();
};

// ✅ Method to update document in appointment
appointmentSchema.methods.updateDocument = function(documentId, updateData) {
  const docIndex = this.documents.findIndex(
    doc => doc._id.toString() === documentId.toString()
  );
  
  if (docIndex !== -1) {
    if (updateData.documentType) this.documents[docIndex].documentType = updateData.documentType;
    if (updateData.description !== undefined) this.documents[docIndex].description = updateData.description;
  }
  
  return this.save();
};

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