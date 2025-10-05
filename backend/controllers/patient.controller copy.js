import Patient, { Visit } from '../modals/Patient.js';
import Appointment from '../modals/Appointment.js';
import User from '../modals/User.js';
import { sendSuccess, sendError } from '../utils/helpers.js';
import { validateRequired } from '../utils/helpers.js';

// @desc    Check if patient exists by phone number
// @route   GET /api/patients/check/:phone
// @access  Private (Assigner, Clinic)
export const checkPatientExists = async (req, res) => {
  console.log('=== CHECK PATIENT EXISTS REQUEST START ===');
  console.log('Phone number:', req.params.phone);

  try {
    const { phone } = req.params;

    // Validate phone number
    if (!/^\d{10}$/.test(phone)) {
      return sendError(res, 'Invalid phone number format', 400);
    }

    const patient = await Patient.findOne({ patientId: phone }).lean();

    // If patient has currentVisitId, fetch the visit details separately
    if (patient?.currentVisitId) {
      const visit = await Visit.findOne({ visitId: patient.currentVisitId }).lean();
      patient.currentVisit = visit;
    }

    console.log('Patient found:', !!patient);

    if (patient) {
      sendSuccess(res, {
        exists: true,
        patient: patient
      }, 'Patient exists');
    } else {
      sendSuccess(res, {
        exists: false,
        patient: null
      }, 'Patient not found');
    }

  } catch (error) {
    console.error('=== CHECK PATIENT ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error checking patient', 500, error.message);
  }
};

// @desc    Create new patient or update existing
// @route   POST /api/patients
// @access  Private (Assigner, Clinic)
export const createOrUpdatePatient = async (req, res) => {
  console.log('=== CREATE/UPDATE PATIENT REQUEST START ===');
  console.log('User ID:', req.user?.id);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const {
      patientId,
      personalInfo,
      contactInfo,
      emergencyContact,
      medicalHistory,
      photo,
      documents // NEW: Add documents field
    } = req.body;

    // Validate required fields
    const missing = validateRequired(['patientId'], req.body);
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    // Get user's lab ID
    let labId;
    if (req.user.role === 'clinic') {
      labId = req.user.clinicDetails?.labId;
    } else if (req.user.role === 'assigner') {
      labId = 'DEFAULT';
    }

    if (!labId) {
      return sendError(res, 'Lab ID not found', 400);
    }

    // Process documents if provided
    let processedDocuments = [];
    if (documents && Array.isArray(documents)) {
      processedDocuments = documents.map(doc => ({
        ...doc,
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      }));
    }

    // Check if patient exists
    const existingPatient = await Patient.findOne({ patientId });

    if (existingPatient) {
      console.log('Patient exists, updating with new registration date');
      
      const currentDate = new Date();
      
      // Update existing patient
      await Patient.collection.updateOne(
        { patientId },
        {
          $set: {
            'personalInfo.fullName': personalInfo.fullName || existingPatient.personalInfo.fullName,
            'personalInfo.dateOfBirth': personalInfo.dateOfBirth || existingPatient.personalInfo.dateOfBirth,
            'personalInfo.age': personalInfo?.dateOfBirth ? calculateAge(personalInfo.dateOfBirth) : existingPatient.personalInfo?.age,
            'personalInfo.gender': personalInfo.gender || existingPatient.personalInfo.gender,
            'personalInfo.bloodGroup': personalInfo.bloodGroup || existingPatient.personalInfo.bloodGroup,
            'personalInfo.height': personalInfo.height || existingPatient.personalInfo.height,
            
            'contactInfo.phone': contactInfo.phone || existingPatient.contactInfo.phone,
            'contactInfo.email': contactInfo.email || existingPatient.contactInfo.email,
            'contactInfo.address': contactInfo.address || existingPatient.contactInfo.address,
            
            'emergencyContact.name': emergencyContact.name || existingPatient.emergencyContact.name,
            'emergencyContact.relationship': emergencyContact.relationship || existingPatient.emergencyContact.relationship,
            'emergencyContact.phone': emergencyContact.phone || existingPatient.emergencyContact.phone,
            
            'medicalHistory.chronicConditions': medicalHistory.chronicConditions || existingPatient.medicalHistory.chronicConditions,
            'medicalHistory.allergies': medicalHistory.allergies || existingPatient.medicalHistory.allergies,
            'medicalHistory.pastSurgeries': medicalHistory.pastSurgeries || existingPatient.medicalHistory.pastSurgeries,
            'medicalHistory.familyHistory': medicalHistory.familyHistory || existingPatient.medicalHistory.familyHistory,
            
            ...(photo && { photo }),
            ...(processedDocuments.length > 0 && { 
              documents: [...(existingPatient.documents || []), ...processedDocuments]
            }),
            
            labId,
            lastActivity: currentDate,
            updatedAt: currentDate,
            workflowStatus: 'New',
            currentVisitId: null,
            registrationDate: currentDate
          }
        }
      );

      const patient = await Patient.findOne({ patientId });
      console.log('Patient updated with new registration date:', patient.registrationDate);
      
      sendSuccess(res, patient, 'Patient updated with new visit', 201);
    } else {
      console.log('Creating new patient');
      
      // Create new patient
      const patientData = {
        patientId,
        personalInfo: {
          ...personalInfo,
          age: personalInfo?.dateOfBirth ? calculateAge(personalInfo.dateOfBirth) : personalInfo?.age || ''
        },
        contactInfo,
        emergencyContact,
        medicalHistory,
        photo,
        documents: processedDocuments, // NEW: Include documents
        labId,
        workflowStatus: 'New',
        lastActivity: new Date(),
        registrationDate: new Date(),
        onboarding: {
          onboardedBy: req.user.id,
          onboardedAt: new Date()
        }
      };

      const patient = await Patient.create(patientData);
      console.log('New patient created with registration date:', patient.registrationDate);
      
      sendSuccess(res, patient, 'Patient created successfully', 201);
    }

    console.log('=== CREATE/UPDATE PATIENT REQUEST END ===');

  } catch (error) {
    console.error('=== CREATE/UPDATE PATIENT ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error creating/updating patient', 500, error.message);
  }
};

// Helper function to calculate age
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// @desc    Create appointment with full patient and medical data
// @route   POST /api/patients/:patientId/appointments
// @access  Private (Assigner, Clinic, Doctor)
export const createAppointment = async (req, res) => {
  console.log('=== CREATE APPOINTMENT REQUEST START ===');
  console.log('Patient ID:', req.params.patientId);
  console.log('User ID:', req.user?.id);
  console.log('Appointment data:', JSON.stringify(req.body, null, 2));

  try {
    const { patientId } = req.params;
    const appointmentData = req.body;

    // Check if patient exists
    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    // Get user's lab ID
    let labId = patient.labId;

    // FIXED: Properly extract date and time from the request
    const scheduledDate = appointmentData.scheduledDate || appointmentData.appointment?.date;
    const scheduledTime = appointmentData.scheduledTime || appointmentData.appointment?.time;

    // Validate required fields
    if (!scheduledDate) {
      return sendError(res, 'Scheduled date is required', 400);
    }
    if (!scheduledTime) {
      return sendError(res, 'Scheduled time is required', 400);
    }

    // Parse the date properly
    let appointmentDate;
    if (typeof scheduledDate === 'string' && scheduledDate.includes('-')) {
      // Handle YYYY-MM-DD format
      appointmentDate = new Date(scheduledDate + 'T00:00:00.000Z');
    } else {
      appointmentDate = new Date(scheduledDate);
    }

    // Ensure the date is valid
    if (isNaN(appointmentDate.getTime())) {
      return sendError(res, 'Invalid scheduled date format', 400);
    }

    console.log('Parsed appointment date:', appointmentDate);
    console.log('Scheduled time:', scheduledTime);

    // Prepare complete appointment data
    const completeAppointmentData = {
      patientId,
      labId,
      createdBy: req.user.id,
      
      // FIXED: Use properly parsed date and time
      scheduledDate: appointmentDate,
      scheduledTime: scheduledTime,
      mode: appointmentData.mode || 'In-person',
      appointmentType: appointmentData.appointmentType || 'Consultation',
      duration: appointmentData.duration || 30,
      
      // Doctor assignment (if provided)
      doctorId: appointmentData.doctorId || null,
      
      // Chief complaints - FIXED: Use correct path
      chiefComplaints: {
        primary: appointmentData.chiefComplaints?.primary || '',
        duration: appointmentData.chiefComplaints?.duration || '',
        severity: appointmentData.chiefComplaints?.severity || 'Moderate'
      },
      
      // Vitals - FIXED: Use correct path
      vitals: {
        weight: {
          value: appointmentData.vitals?.weight?.value || null,
          unit: 'kg'
        },
        temperature: {
          value: appointmentData.vitals?.temperature?.value || null,
          unit: '°F'
        },
        bloodPressure: {
          systolic: appointmentData.vitals?.bloodPressure?.systolic || null,
          diastolic: appointmentData.vitals?.bloodPressure?.diastolic || null
        },
        heartRate: {
          value: appointmentData.vitals?.heartRate?.value || null,
          unit: 'bpm'
        },
        oxygenSaturation: {
          value: appointmentData.vitals?.oxygenSaturation?.value || null,
          unit: '%'
        },
        bloodSugar: {
          value: appointmentData.vitals?.bloodSugar?.value || null,
          type: appointmentData.vitals?.bloodSugar?.type || 'Random',
          unit: 'mg/dL'
        }
      },
      
      // Examination findings - FIXED: Use correct path
      examination: {
        physicalFindings: appointmentData.examination?.physicalFindings || '',
        provisionalDiagnosis: appointmentData.examination?.provisionalDiagnosis || '',
        differentialDiagnosis: appointmentData.examination?.differentialDiagnosis || []
      },
      
      // Follow-up - FIXED: Use correct path
      followUp: {
        required: !!(appointmentData.followUp?.nextAppointmentDate),
        nextAppointmentDate: appointmentData.followUp?.nextAppointmentDate ? new Date(appointmentData.followUp.nextAppointmentDate) : null,
        instructions: appointmentData.followUp?.instructions || '',
        notes: appointmentData.followUp?.notes || ''
      },
      
      status: 'Scheduled'
    };

    console.log('Complete appointment data to save:', JSON.stringify(completeAppointmentData, null, 2));

    // Create appointment
    const appointment = await Appointment.create(completeAppointmentData);

    // Update patient's appointment tracking
    await patient.addAppointment({
      appointmentId: appointment.appointmentId,
      _id: appointment._id,
      doctorId: appointment.doctorId,
      doctorName: appointmentData.doctorName || 'Unknown Doctor',
      scheduledDate: appointment.scheduledDate,
      scheduledTime: appointment.scheduledTime,
      status: appointment.status,
      appointmentType: appointment.appointmentType
    });

    // Update patient workflow status
    await Patient.findOneAndUpdate(
      { patientId },
      {
        workflowStatus: appointment.doctorId ? 'Assigned' : 'New',
        lastActivity: new Date(),
        registrationDate: new Date() // ✅ ADD: Update registration date
      }
    );

    console.log('Appointment created successfully:', appointment.appointmentId);
    sendSuccess(res, appointment, 'Appointment created successfully', 201);

  } catch (error) {
    console.error('=== CREATE APPOINTMENT ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error creating appointment', 500, error.message);
  }
};

// @desc    Get patient appointments
// @route   GET /api/patients/:patientId/appointments
// @access  Private
export const getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'profile')
      .populate('treatment.prescriptionId')
      .sort({ scheduledDate: -1 });

    sendSuccess(res, appointments, 'Appointments retrieved successfully');
  } catch (error) {
    console.error('Error fetching appointments:', error);
    sendError(res, 'Error fetching appointments', 500, error.message);
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:appointmentId
// @access  Private (Doctor, Assigner)
export const updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const updateData = req.body;

    const appointment = await Appointment.findOneAndUpdate(
      { appointmentId },
      { 
        ...updateData, 
        lastModifiedBy: req.user.id,
        updatedAt: new Date() 
      },
      { new: true }
    );

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // Update patient's appointment status
    if (updateData.status) {
      const patient = await Patient.findOne({ patientId: appointment.patientId });
      if (patient) {
        await patient.updateAppointmentStatus(
          appointmentId, 
          updateData.status, 
          updateData.treatment?.prescriptionId
        );
        
        // ✅ ADD: Update registration date when appointment is updated
        await Patient.findOneAndUpdate(
          { patientId: appointment.patientId },
          {
            registrationDate: new Date(),
            lastActivity: new Date()
          }
        );
      }
    }

    sendSuccess(res, appointment, 'Appointment updated successfully');
  } catch (error) {
    console.error('Error updating appointment:', error);
    sendError(res, 'Error updating appointment', 500, error.message);
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:appointmentId
// @access  Private
export const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findOne({ appointmentId })
      .populate('doctorId', 'profile')
      .populate('patientId')
      .populate('treatment.prescriptionId');

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    sendSuccess(res, appointment, 'Appointment retrieved successfully');
  } catch (error) {
    console.error('Error fetching appointment:', error);
    sendError(res, 'Error fetching appointment', 500, error.message);
  }
};

// @desc    Create new visit for patient
// @route   POST /api/patients/:patientId/visits
// @access  Private (Assigner, Clinic, Doctor)
export const createVisit = async (req, res) => {
  console.log('=== CREATE VISIT REQUEST START ===');
  console.log('Patient ID:', req.params.patientId);
  console.log('User ID:', req.user?.id);
  console.log('Visit data:', JSON.stringify(req.body, null, 2));

  try {
    const { patientId } = req.params;
    const visitData = req.body;

    // Check if patient exists
    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    // Get user's lab ID
    let labId = patient.labId; // Use patient's lab ID

    // Generate visit ID
    const visitId = await Visit.generateVisitId(patientId);

    // Prepare complete visit data
    const completeVisitData = {
      visitId,
      patientId,
      labId,
      // Appointment details
      appointment: {
        date: visitData.appointment?.date || new Date().toISOString().split('T')[0],
        time: visitData.appointment?.time || new Date().toTimeString().slice(0, 5),
        mode: visitData.appointment?.mode || 'In-person',
        doctorName: visitData.appointment?.doctorName || '',
        specialization: visitData.appointment?.specialization || ''
      },
      // Vitals
      vitals: {
        weight: visitData.vitals?.weight || { value: '', unit: 'kg' },
        temperature: visitData.vitals?.temperature || { value: '', unit: '°F' },
        bloodPressure: visitData.vitals?.bloodPressure || { systolic: '', diastolic: '' },
        heartRate: visitData.vitals?.heartRate || { value: '', unit: 'bpm' },
        oxygenSaturation: visitData.vitals?.oxygenSaturation || { value: '', unit: '%' },
        bloodSugar: visitData.vitals?.bloodSugar || { value: '', type: 'Random', unit: 'mg/dL' }
      },
      // Complaints
      complaints: {
        chief: visitData.complaints?.chief || '',
        duration: visitData.complaints?.duration || '',
        pastHistoryRelevant: visitData.complaints?.pastHistoryRelevant || ''
      },
      // Examination
      examination: {
        physicalFindings: visitData.examination?.physicalFindings || '',
        provisionalDiagnosis: visitData.examination?.provisionalDiagnosis || '',
        differentialDiagnosis: visitData.examination?.differentialDiagnosis || []
      },
      // Investigations
      investigations: {
        testsRecommended: visitData.investigations?.testsRecommended || [],
        pastReportsReviewed: visitData.investigations?.pastReportsReviewed || []
      },
      // Treatment
      treatment: {
        medicines: visitData.treatment?.medicines || [],
        lifestyleAdvice: visitData.treatment?.lifestyleAdvice || '',
        dietSuggestions: visitData.treatment?.dietSuggestions || ''
      },
      // Follow up
      followUp: {
        nextAppointmentDate: visitData.followUp?.nextAppointmentDate || '',
        instructions: visitData.followUp?.instructions || '',
        notes: visitData.followUp?.notes || ''
      },
      doctorNotes: visitData.doctorNotes || '',
      workflowStatus: 'Assigned',
      createdBy: req.user.id
    };

    console.log('Complete visit data to save:', JSON.stringify(completeVisitData, null, 2));

    // Create visit
    const visit = await Visit.create(completeVisitData);

    // Update patient's current visit and add to visits list
    await Patient.findOneAndUpdate(
      { patientId },
      {
        currentVisitId: visitId,
        workflowStatus: 'Assigned',
        lastActivity: new Date(),
        $push: {
          'visits.list': {
            visitId: visitId,
            visitObjectId: visit._id,
            visitDate: new Date(),
            status: 'Scheduled',
            diagnosis: completeVisitData.examination.provisionalDiagnosis,
            prescriptionIssued: false
          }
        },
        $inc: {
          'visits.stats.totalVisits': 1
        },
        $set: {
          'visits.stats.lastVisitDate': new Date()
        }
      }
    );

    console.log('Visit created successfully:', visitId);
    sendSuccess(res, visit, 'Visit created successfully', 201);

  } catch (error) {
    console.error('=== CREATE VISIT ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error creating visit', 500, error.message);
  }
};

// @desc    Get patient visits
// @route   GET /api/patients/:patientId/visits
// @access  Private
export const getPatientVisits = async (req, res) => {
  try {
    const { patientId } = req.params;
    const visits = await Visit.find({ patientId })
      .populate('appointment.doctorId', 'profile')
      .sort({ 'appointment.date': -1 });

    sendSuccess(res, visits, 'Visits retrieved successfully');
  } catch (error) {
    console.error('Error fetching visits:', error);
    sendError(res, 'Error fetching visits', 500, error.message);
  }
};

// @desc    Update visit
// @route   PUT /api/patients/visits/:visitId
// @access  Private (Doctor, Assigner)
export const updateVisit = async (req, res) => {
  try {
    const { visitId } = req.params;
    const updateData = req.body;

    const visit = await Visit.findOneAndUpdate(
      { visitId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!visit) {
      return sendError(res, 'Visit not found', 404);
    }

    // Update patient's workflow status if provided
    if (updateData.workflowStatus) {
      await Patient.findOneAndUpdate(
        { patientId: visit.patientId },
        {
          workflowStatus: updateData.workflowStatus,
          lastActivity: new Date()
        }
      );
    }

    sendSuccess(res, visit, 'Visit updated successfully');
  } catch (error) {
    console.error('Error updating visit:', error);
    sendError(res, 'Error updating visit', 500, error.message);
  }
};

// @desc    Get visit by ID
// @route   GET /api/patients/visits/:visitId
// @access  Private
export const getVisitById = async (req, res) => {
  try {
    const { visitId } = req.params;
    const visit = await Visit.findOne({ visitId })
      .populate('appointment.doctorId', 'profile')
      .populate('patientId');

    if (!visit) {
      return sendError(res, 'Visit not found', 404);
    }

    sendSuccess(res, visit, 'Visit retrieved successfully');
  } catch (error) {
    console.error('Error fetching visit:', error);
    sendError(res, 'Error fetching visit', 500, error.message);
  }
};

// Add this method to properly populate appointment data

// @desc    Get patient with appointments and assignments
// @route   GET /api/patients/:patientId/full
// @access  Private
export const getPatientWithAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Get patient
    const patient = await Patient.findOne({ patientId })
      .populate('assignment.doctorId', 'profile doctorDetails')
      .populate('assignment.assignedBy', 'profile');

    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    // Get appointments
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'profile doctorDetails')
      .populate('treatment.prescriptionId')
      .sort({ scheduledDate: -1 });

    // Update patient appointment stats
    const appointmentStats = {
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter(apt => apt.status === 'Completed').length,
      cancelledAppointments: appointments.filter(apt => apt.status === 'Cancelled').length,
      lastAppointmentDate: appointments.length > 0 ? appointments[0].scheduledDate : null,
      nextAppointmentDate: appointments.find(apt => 
        apt.status === 'Scheduled' && new Date(apt.scheduledDate) > new Date()
      )?.scheduledDate || null,
      lastSeenBy: appointments.length > 0 && appointments[0].doctorId ? {
        doctorId: appointments[0].doctorId._id,
        doctorName: `Dr. ${appointments[0].doctorId.profile.firstName} ${appointments[0].doctorId.profile.lastName}`
      } : null
    };

    // Update patient record with appointment stats
    await Patient.findOneAndUpdate(
      { patientId },
      { 'appointments.stats': appointmentStats }
    );

    const responseData = {
      ...patient.toObject(),
      appointments: {
        list: appointments,
        stats: appointmentStats
      }
    };

    sendSuccess(res, responseData, 'Patient data retrieved successfully');
  } catch (error) {
    console.error('Error fetching patient with appointments:', error);
    sendError(res, 'Error fetching patient data', 500, error.message);
  }
};

// Add these new functions to the existing patient.controller.js

// @desc    Get patient documents
// @route   GET /api/patients/:patientId/documents
// @access  Private
export const getPatientDocuments = async (req, res) => {
  console.log('=== GET PATIENT DOCUMENTS REQUEST START ===');
  console.log('Patient ID:', req.params.patientId);

  try {
    const { patientId } = req.params;

    const patient = await Patient.findOne({ patientId }).select('documents');
    
    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    const documents = patient.documents || [];
    
    console.log(`Found ${documents.length} documents for patient ${patientId}`);
    sendSuccess(res, documents, 'Documents retrieved successfully');

  } catch (error) {
    console.error('=== GET PATIENT DOCUMENTS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching patient documents', 500, error.message);
  }
};

// @desc    Add document to patient
// @route   POST /api/patients/:patientId/documents
// @access  Private (Assigner, Clinic only)
export const addPatientDocument = async (req, res) => {
  console.log('=== ADD PATIENT DOCUMENT REQUEST START ===');
  console.log('Patient ID:', req.params.patientId);
  console.log('User role:', req.user?.role);

  try {
    const { patientId } = req.params;
    const documentData = req.body;

    // Check permissions - only assigners and clinics can upload
    if (req.user.role !== 'assigner' && req.user.role !== 'clinic') {
      return sendError(res, 'You do not have permission to upload documents', 403);
    }

    // Validate required fields
    const missing = validateRequired(['documentType', 'fileName', 'fileUrl', 'fileSize', 'mimeType'], documentData);
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    const patient = await Patient.findOne({ patientId });
    
    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    // Prepare document data with metadata
    const newDocument = {
      ...documentData,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };

    // Add document to patient
    await Patient.findOneAndUpdate(
      { patientId },
      {
        $push: { documents: newDocument },
        lastActivity: new Date()
      }
    );

    console.log('Document added successfully');
    sendSuccess(res, newDocument, 'Document added successfully', 201);

  } catch (error) {
    console.error('=== ADD PATIENT DOCUMENT ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error adding document', 500, error.message);
  }
};

// @desc    Delete patient document
// @route   DELETE /api/patients/:patientId/documents/:documentId
// @access  Private (Assigner, Clinic only)
export const deletePatientDocument = async (req, res) => {
  console.log('=== DELETE PATIENT DOCUMENT REQUEST START ===');
  console.log('Patient ID:', req.params.patientId);
  console.log('Document ID:', req.params.documentId);
  console.log('User role:', req.user?.role);

  try {
    const { patientId, documentId } = req.params;

    // Check permissions - only assigners and clinics can delete
    if (req.user.role !== 'assigner' && req.user.role !== 'clinic') {
      return sendError(res, 'You do not have permission to delete documents', 403);
    }

    const patient = await Patient.findOne({ patientId });
    
    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    // Remove document from patient
    const result = await Patient.findOneAndUpdate(
      { patientId },
      {
        $pull: { documents: { _id: documentId } },
        lastActivity: new Date()
      },
      { new: true }
    );

    if (!result) {
      return sendError(res, 'Document not found', 404);
    }

    console.log('Document deleted successfully');
    sendSuccess(res, { documentId }, 'Document deleted successfully');

  } catch (error) {
    console.error('=== DELETE PATIENT DOCUMENT ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error deleting document', 500, error.message);
  }
};

// @desc    Update patient document
// @route   PUT /api/patients/:patientId/documents/:documentId
// @access  Private (Assigner, Clinic only)
export const updatePatientDocument = async (req, res) => {
  console.log('=== UPDATE PATIENT DOCUMENT REQUEST START ===');
  console.log('Patient ID:', req.params.patientId);
  console.log('Document ID:', req.params.documentId);

  try {
    const { patientId, documentId } = req.params;
    const updateData = req.body;

    // Check permissions - only assigners and clinics can update
    if (req.user.role !== 'assigner' && req.user.role !== 'clinic') {
      return sendError(res, 'You do not have permission to update documents', 403);
    }

    const patient = await Patient.findOne({ patientId });
    
    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    // Update document
    const result = await Patient.findOneAndUpdate(
      { patientId, 'documents._id': documentId },
      {
        $set: {
          'documents.$.description': updateData.description,
          'documents.$.documentType': updateData.documentType,
          lastActivity: new Date()
        }
      },
      { new: true }
    );

    if (!result) {
      return sendError(res, 'Document not found', 404);
    }

    console.log('Document updated successfully');
    sendSuccess(res, updateData, 'Document updated successfully');

  } catch (error) {
    console.error('=== UPDATE PATIENT DOCUMENT ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error updating document', 500, error.message);
  }
};