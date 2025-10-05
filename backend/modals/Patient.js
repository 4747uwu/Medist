import mongoose from 'mongoose';

// ==================================================================
//                        VISIT SCHEMA
// ==================================================================
// Defined first as it's referenced in Patient methods indirectly.

const visitSchema = new mongoose.Schema({
    visitId: { type: String, unique: true, required: true },
    patientId: { type: String, required: true, index: true }, // Corresponds to Patient's phone number
    labId: { type: String, required: true, index: true },
    appointment: {
        appointmentId: String,
        date: { type: Date, required: true },
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        doctorName: String,
    },
    vitals: {
        weight: { value: Number, unit: { type: String, default: 'kg' } },
        bloodPressure: { systolic: Number, diastolic: Number },
        pulse: { value: Number, unit: { type: String, default: 'bpm' } },
        temperature: { value: Number, unit: { type: String, default: '°F' } },
        oxygenSaturation: { value: Number, unit: { type: String, default: '%' } },
        bloodSugar: {
            value: Number,
            type: { type: String, enum: ['Random', 'Fasting', 'PP'], default: 'Random' },
            unit: { type: String, default: 'mg/dL' }
        }
    },
    complaints: {
        chief: { type: String, required: [true, 'Chief complaints are required'] },
        duration: String,
        pastHistoryRelevant: String
    },
    examination: {
        physicalFindings: String,
        provisionalDiagnosis: { type: String, required: [true, 'Provisional diagnosis is required'] },
        differentialDiagnosis: [String]
    },
    investigations: {
        testsRecommended: [{
            testName: String,
            testCode: String,
            urgency: { type: String, enum: ['Routine', 'Urgent', 'Stat'], default: 'Routine' },
            notes: String
        }],
        pastReportsReviewed: [String]
    },
    treatment: {
        medicines: [{
            medicineName: String,
            medicineCode: String,
            dosage: String,
            frequency: String,
            duration: String,
            timing: String,
            instructions: String
        }],
        lifestyleAdvice: String,
        dietSuggestions: String
    },
    followUp: {
        nextAppointmentDate: Date,
        instructions: String,
        notes: String
    },
    doctorNotes: String,
    status: {
        type: String,
        enum: ['Scheduled', 'In-Progress', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    },
    workflowStatus: {
        type: String,
        enum: ['New', 'Assigned', 'Doctor Opened', 'In Progress', 'Reported', 'Completed'],
        default: 'New'
    },
    prescription: {
        prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
        prescriptionCode: String,
        issued: { type: Boolean, default: false },
        issuedAt: Date
    }
}, { timestamps: true });

// --- Visit Indexes ---
visitSchema.index({ visitId: 1 });
visitSchema.index({ 'appointment.date': -1 });
visitSchema.index({ 'appointment.doctorId': 1 });
visitSchema.index({ 'prescription.prescriptionId': 1 });

// --- Visit Statics ---
visitSchema.statics.generateVisitId = async function(patientId) {
    const count = await this.model('Patient').countDocuments({ patientId });
    return `${patientId}-V${String(count + 1).padStart(4, '0')}`;
};

// --- Visit Hooks ---
visitSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified()) {
        await mongoose.model('Patient').findOneAndUpdate(
            { patientId: this.patientId },
            {
                lastActivity: new Date(),
                currentVisitId: this.visitId,
                workflowStatus: this.workflowStatus
            }
        );
    }
    next();
});

const Visit = mongoose.model('Visit', visitSchema);


// ==================================================================
//                        PATIENT SCHEMA
// ==================================================================

const patientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        unique: true,
        required: true,
        validate: {
            validator: (v) => /^\d{10}$/.test(v),
            message: 'Patient ID (phone) must be 10 digits'
        }
    },
    
    // ADD: registrationDate field
    registrationDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    labId: { type: String, required: true },
    
    // ADD: status field
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Suspended'],
        default: 'Active'
    },
    
    // ADD: assignedBy field
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // ADD: photo field
    photo: {
        type: String, // URL or base64 string
        default: null
    },
    
    // ADD: onboarding field
    onboarding: {
        onboardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        onboardedAt: { type: Date, default: Date.now }
    },
    
    // ADD: documents field for storing patient documents
    documents: [{
        documentType: {
            type: String,
            enum: ['Aadhar Card', 'PAN Card', 'Insurance Card', 'Medical Report', 'Lab Report', 'Prescription', 'Other'],
            required: true
        },
        fileName: {
            type: String,
            required: true
        },
        fileUrl: {
            type: String, // Base64 string or file path
            required: true
        },
        fileSize: {
            type: Number, // File size in bytes
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
    personalInfo: {
        fullName: { type: String, required: [true, 'Full name is required'], trim: true },
        dateOfBirth: { type: Date, required: [true, 'Date of birth is required'] },
        age: { type: Number },
        gender: { type: String, enum: ['Male', 'Female', 'Other'], required: [true, 'Gender is required'] },
        bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
        height: { value: Number, unit: { type: String, default: 'cm' }, lastUpdated: Date }
    },
    contactInfo: {
        phone: { type: String, required: [true, 'Phone number is required'], trim: true },
        email: { type: String, lowercase: true, trim: true },
        address: { street: String, city: String, state: String, pincode: String, country: { type: String, default: 'India' } }
    },
    emergencyContact: {
        name: { type: String, required: [true, 'Emergency contact name is required'] },
        relationship: { type: String, required: [true, 'Emergency contact relationship is required'] },
        phone: { type: String, required: [true, 'Emergency contact phone is required'] }
    },
    medicalHistory: {
        chronicConditions: [{ condition: String, diagnosedDate: Date, severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'] }, notes: String }],
        allergies: [{ allergen: String, reaction: String, severity: { type: String, enum: ['Mild', 'Moderate', 'Severe', 'Life-threatening'] } }],
        pastSurgeries: [{ surgery: String, date: Date, hospital: String, surgeon: String, notes: String }],
        familyHistory: [{ condition: String, relation: String, notes: String }]
    },
    prescriptions: {
        list: [{
            prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
            prescriptionCode: String,
            doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            doctorName: String,
            visitId: String,
            prescribedDate: Date,
            status: { type: String, enum: ['Active', 'Completed', 'Cancelled', 'Expired'], default: 'Active' },
            medicineCount: Number,
            testCount: Number
        }],
        stats: {
            totalPrescriptions: { type: Number, default: 0 },
            activePrescriptions: { type: Number, default: 0 },
            lastPrescriptionDate: Date,
            lastPrescribedBy: { doctorId: mongoose.Schema.Types.ObjectId, doctorName: String }
        }
    },
    visits: {
        list: [{
            visitId: String,
            visitObjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' },
            doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            doctorName: String,
            visitDate: Date,
            status: { type: String, enum: ['Scheduled', 'In-Progress', 'Completed', 'Cancelled'], default: 'Scheduled' },
            diagnosis: String,
            prescriptionIssued: Boolean
        }],
        stats: {
            totalVisits: { type: Number, default: 0 },
            lastVisitDate: Date,
            lastVisitBy: { doctorId: mongoose.Schema.Types.ObjectId, doctorName: String }
        }
    },
    appointments: {
        list: [{
            appointmentId: String,
            appointmentObjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
            doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            doctorName: String,
            scheduledDate: Date,
            scheduledTime: String,
            status: String,
            appointmentType: String,
            prescriptionIssued: { type: Boolean, default: false },
            prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
            prescriptionCode: String,
        }],
        stats: {
            totalAppointments: { type: Number, default: 0 },
            completedAppointments: { type: Number, default: 0 },
            cancelledAppointments: { type: Number, default: 0 },
            lastAppointmentDate: Date,
            lastSeenBy: { doctorId: mongoose.Schema.Types.ObjectId, doctorName: String }
        }
    },
    assignment: {
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        doctorName: String,
        assignedAt: Date,
        assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // ADD: assignedBy in assignment
    },
    lastActivity: { type: Date, default: Date.now, index: -1 },
    currentVisitId: String,
    workflowStatus: { 
        type: String, 
        enum: ['New', 'Assigned', 'Doctor Opened', 'In Progress', 'Reported', 'Completed', 'Revisited'], 
        default: 'New' 
    }
}, { timestamps: true });

// --- Patient Indexes ---
patientSchema.index({ patientId: 1 });
patientSchema.index({ 'personalInfo.fullName': 'text' });
patientSchema.index({ labId: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ workflowStatus: 1 });
patientSchema.index({ lastActivity: -1 });
patientSchema.index({ registrationDate: -1 }); // Index for registrationDate
patientSchema.index({ assignedBy: 1 }); // ADD: Index for assignedBy
patientSchema.index({ 'prescriptions.list.prescriptionId': 1 });
patientSchema.index({ 'visits.list.visitId': 1 });

// --- Patient Virtuals ---
patientSchema.virtual('formattedAge').get(function() {
    if (this.personalInfo && this.personalInfo.age) {
        return `${this.personalInfo.age} years`;
    }
    return 'N/A';
});

// --- Patient Methods ---
patientSchema.methods.calculateAge = function() {
    const today = new Date();
    const birthDate = new Date(this.personalInfo.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

patientSchema.methods.addPrescription = function(prescriptionData) {
    const list = this.prescriptions.list;
    list.push({
        prescriptionId: prescriptionData._id,
        prescriptionCode: prescriptionData.prescriptionId,
        doctorId: prescriptionData.doctorId,
        doctorName: prescriptionData.doctorName,
        visitId: prescriptionData.visitId,
        prescribedDate: prescriptionData.createdAt || new Date(),
        medicineCount: prescriptionData.medicines?.length || 0,
        testCount: prescriptionData.tests?.length || 0,
    });

    const stats = this.prescriptions.stats;
    stats.totalPrescriptions = list.length;
    stats.activePrescriptions = list.filter(p => p.status === 'Active').length;
    stats.lastPrescriptionDate = new Date();
    stats.lastPrescribedBy = { doctorId: prescriptionData.doctorId, doctorName: prescriptionData.doctorName };

    return this.save();
};

patientSchema.methods.addVisit = function(visitData) {
    const list = this.visits.list;
    list.push({
        visitId: visitData.visitId,
        visitObjectId: visitData._id,
        doctorId: visitData.appointment.doctorId,
        doctorName: visitData.appointment.doctorName,
        visitDate: visitData.appointment.date,
        status: visitData.status,
        diagnosis: visitData.examination?.provisionalDiagnosis
    });

    const stats = this.visits.stats;
    stats.totalVisits = list.length;
    stats.lastVisitDate = visitData.appointment.date;
    stats.lastVisitBy = { doctorId: visitData.appointment.doctorId, doctorName: visitData.appointment.doctorName };

    return this.save();
};

patientSchema.methods.addAppointment = function(appointmentData) {
    this.appointments.list.push({
        appointmentId: appointmentData.appointmentId,
        appointmentObjectId: appointmentData._id,
        doctorId: appointmentData.doctorId,
        doctorName: appointmentData.doctorName,
        scheduledDate: appointmentData.scheduledDate,
        scheduledTime: appointmentData.scheduledTime,
        status: appointmentData.status,
        appointmentType: appointmentData.appointmentType
    });

    const stats = this.appointments.stats;
    stats.totalAppointments = this.appointments.list.length;
    stats.lastAppointmentDate = appointmentData.scheduledDate;
    stats.lastSeenBy = { doctorId: appointmentData.doctorId, doctorName: appointmentData.doctorName };

    return this.save();
};

patientSchema.methods.updateAppointmentStatus = function(appointmentId, status) {
    const appointment = this.appointments.list.find(apt => apt.appointmentId === appointmentId);
    if (appointment) {
        appointment.status = status;
        if (status === 'Completed') {
            this.appointments.stats.completedAppointments = (this.appointments.stats.completedAppointments || 0) + 1;
        } else if (status === 'Cancelled') {
            this.appointments.stats.cancelledAppointments = (this.appointments.stats.cancelledAppointments || 0) + 1;
        }
        return this.save();
    }
    return Promise.resolve(this);
};

patientSchema.methods.updateAppointmentPrescription = function(appointmentId, prescriptionId, prescriptionCode) {
    const appointment = this.appointments.list.find(apt => apt.appointmentId === appointmentId);
    if (appointment) {
        appointment.prescriptionIssued = true;
        appointment.prescriptionId = prescriptionId;
        appointment.prescriptionCode = prescriptionCode;
        return this.save();
    }
    return Promise.resolve(this);
};


// --- Patient Hooks ---
patientSchema.pre('save', function(next) {
    if (this.personalInfo.dateOfBirth && this.isModified('personalInfo.dateOfBirth')) {
        this.personalInfo.age = this.calculateAge();
    }

    if (this.isModified('assignment.doctorId')) {
        this.workflowStatus = this.assignment.doctorId ? 'Assigned' : 'New';
        this.lastActivity = new Date();
    }
    next();
});

patientSchema.set('toJSON', { virtuals: true });
const Patient = mongoose.model('Patient', patientSchema);

export { Patient, Visit };
export default Patient;
