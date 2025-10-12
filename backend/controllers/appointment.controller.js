import Appointment from '../modals/Appointment.js';
import { Patient } from '../modals/Patient.js';
import User from '../modals/User.js';
import Prescription from '../modals/Prescription.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

// @desc    Assign doctor to appointment
// @route   PUT /api/appointments/:appointmentId/assign-doctor
// @access  Private (Assigner, Clinic)
export const assignDoctorToAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { doctorId, notes, updatePatientAssignment = true } = req.body;

    console.log('Assigning doctor to appointment:', { appointmentId, doctorId, notes, updatePatientAssignment });

    // Find the appointment
    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // If doctorId is provided, verify the doctor exists
    let doctor = null;
    if (doctorId) {
      doctor = await User.findById(doctorId).populate('profile doctorDetails');
      if (!doctor || doctor.role !== 'doctor') {
        return sendError(res, 'Invalid doctor ID', 400);
      }
    }

    // Update appointment with NEW FIELDS
    appointment.doctorId = doctorId || null;
    appointment.assignmentNotes = notes || '';
    appointment.assignedAt = doctorId ? new Date() : null;
    appointment.assignedBy = req.user.id;
    appointment.lastModifiedBy = req.user.id;
    appointment.updatedAt = new Date();

    await appointment.save();

    // Also update the patient's overall assignment if requested and this is a recent appointment
    if (updatePatientAssignment) {
      const patient = await Patient.findOne({ patientId: appointment.patientId });
      
      if (patient && doctorId) {
        // Update patient's overall assignment
        await Patient.findOneAndUpdate(
          { patientId: appointment.patientId },
          {
            assignment: {
              doctorId: doctorId,
              doctorName: `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}`,
              assignedBy: req.user.id,
              assignedAt: new Date(),
              notes: `Assigned via appointment ${appointmentId}. ${notes || ''}`
            },
            workflowStatus: 'Assigned',
            lastActivity: new Date()
          }
        );
        
        console.log('Updated patient overall assignment');
      } else if (patient && !doctorId) {
        // Check if this was the patient's primary assignment before unassigning
        // Only unassign patient if no other recent appointments have doctors
        const recentAppointments = await Appointment.find({
          patientId: appointment.patientId,
          doctorId: { $ne: null },
          _id: { $ne: appointment._id },
          scheduledDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }).limit(1);

        if (recentAppointments.length === 0) {
          // No other recent appointments with doctors, unassign patient
          await Patient.findOneAndUpdate(
            { patientId: appointment.patientId },
            {
              $unset: {
                'assignment.doctorId': '',
                'assignment.doctorName': '',
                'assignment.assignedBy': '',
                'assignment.assignedAt': '',
                'assignment.notes': ''
              },
              workflowStatus: 'New',
              lastActivity: new Date()
            }
          );
          
          console.log('Unassigned patient overall assignment');
        }
      }
    }

    // Populate the response with correct field names
    const updatedAppointment = await Appointment.findOne({ appointmentId })
      .populate('doctorId', 'profile doctorDetails')
      .populate('assignedBy', 'profile') // NOW this field exists
      .populate('createdBy', 'profile')
      .populate('lastModifiedBy', 'profile');

    console.log('Doctor assignment updated successfully');
    sendSuccess(res, updatedAppointment, doctorId ? 'Doctor assigned to appointment successfully' : 'Doctor unassigned from appointment successfully');

  } catch (error) {
    console.error('Error assigning doctor to appointment:', error);
    sendError(res, 'Error assigning doctor to appointment', 500, error.message);
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:appointmentId/status
// @access  Private (Doctor, Assigner, Clinic)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    console.log('Updating appointment status:', { appointmentId, status });

    // Validate status
    const validStatuses = ['Scheduled', 'Confirmed', 'In-Progress', 'Completed', 'Cancelled', 'No-Show', 'Rescheduled'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }

    // Find and update appointment
    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    appointment.status = status;
    appointment.lastModifiedBy = req.user.id;
    appointment.updatedAt = new Date();

    // Set completion date if completed
    if (status === 'Completed') {
      appointment.completedAt = new Date(); // NOW this field exists
    }

    await appointment.save();

    // Update patient workflow status based on appointment status
    const patient = await Patient.findOne({ patientId: appointment.patientId });
    if (patient) {
      let newWorkflowStatus = patient.workflowStatus;
      
      if (status === 'Completed') {
        newWorkflowStatus = 'Completed';
      } else if (status === 'In-Progress') {
        newWorkflowStatus = 'In Progress';
      }

      await Patient.findOneAndUpdate(
        { patientId: appointment.patientId },
        {
          workflowStatus: newWorkflowStatus,
          lastActivity: new Date()
        }
      );
    }

    const updatedAppointment = await Appointment.findOne({ appointmentId })
      .populate('doctorId', 'profile doctorDetails')
      .populate('assignedBy', 'profile')
      .populate('createdBy', 'profile')
      .populate('lastModifiedBy', 'profile');

    console.log('Appointment status updated successfully');
    sendSuccess(res, updatedAppointment, 'Appointment status updated successfully');

  } catch (error) {
    console.error('Error updating appointment status:', error);
    sendError(res, 'Error updating appointment status', 500, error.message);
  }
};

// @desc    Create prescription for appointment
// @route   POST /api/appointments/:appointmentId/prescription
// @access  Private (Doctor)
export const createAppointmentPrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const prescriptionData = req.body;

    console.log('Creating prescription for appointment:', appointmentId);

    // Find the appointment
    const appointment = await Appointment.findOne({ appointmentId })
      .populate('doctorId', 'profile')
      .populate('patientId');

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // Verify the doctor is assigned to this appointment
    if (!appointment.doctorId || appointment.doctorId._id.toString() !== req.user.id) {
      return sendError(res, 'You are not assigned to this appointment', 403);
    }

    // Get patient details
    const patient = await Patient.findOne({ patientId: appointment.patientId });
    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    // Create prescription with appointment context
    const prescription = await Prescription.create({
      ...prescriptionData,
      appointmentId: appointment.appointmentId,
      patientId: appointment.patientId,
      visitId: prescriptionData.visitId || `VISIT-${appointment.patientId}-${Date.now()}`,
      doctorId: req.user.id,
      labId: appointment.labId,
      generatedBy: req.user.id, // FIXED: Add generatedBy field
      // Include appointment data snapshot
      appointmentData: {
        appointmentId: appointment.appointmentId,
        scheduledDate: appointment.scheduledDate,
        scheduledTime: appointment.scheduledTime,
        chiefComplaints: appointment.chiefComplaints,
        vitals: appointment.vitals,
        examination: appointment.examination
      }
    });

    // Update appointment to mark prescription as issued
    appointment.treatment = {
      ...appointment.treatment,
      prescriptionIssued: true,
      prescriptionId: prescription._id,
      prescriptionDate: new Date()
    };
    await appointment.save();

    // Update patient records
    await patient.addPrescription({
      ...prescription.toObject(),
      doctorName: `Dr. ${appointment.doctorId.profile.firstName} ${appointment.doctorId.profile.lastName}`,
      appointmentId: appointment.appointmentId // FIXED: Add appointmentId
    });

    console.log('Prescription created successfully for appointment');
    sendSuccess(res, prescription, 'Prescription created successfully', 201);

  } catch (error) {
    console.error('Error creating prescription for appointment:', error);
    sendError(res, 'Error creating prescription', 500, error.message);
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:appointmentId
// @access  Private
export const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    console.log('Fetching appointment:', appointmentId);

    // ✅ FIXED: Update populate to use new prescriptions array structure
    const appointment = await Appointment.findOne({ appointmentId })
      .populate('doctorId', 'profile doctorDetails')
      .populate('assignedBy', 'profile')
      .populate('createdBy', 'profile')
      .populate('lastModifiedBy', 'profile')
      .populate({
        path: 'prescriptions.prescriptionId',
        model: 'Prescription',
        populate: [
          { path: 'doctorId', select: 'profile' },
          { path: 'medicines.medicineId', select: 'name companyName' },
          { path: 'tests.testId', select: 'testName category' }
        ]
      });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    console.log('Appointment found successfully');
    sendSuccess(res, appointment, 'Appointment retrieved successfully');

  } catch (error) {
    console.error('Error fetching appointment:', error);
    sendError(res, 'Error fetching appointment', 500, error.message);
  }
};

// ✅ FIXED: Get appointment documents with proper selection
export const getAppointmentDocuments = async (req, res) => {
  console.log('=== GET APPOINTMENT DOCUMENTS REQUEST START ===');
  console.log('Appointment ID:', req.params.appointmentId);
  console.log('User ID:', req.user?.id);
  console.log('User Role:', req.user?.role);

  try {
    const { appointmentId } = req.params;
    
    // ✅ FIXED: Don't use .select() - get the full appointment first
    const appointment = await Appointment.findOne({ appointmentId })
      .populate('documents.uploadedBy', 'profile.firstName profile.lastName');

    if (!appointment) {
      console.log('Appointment not found:', appointmentId);
      return sendError(res, 'Appointment not found', 404);
    }

    // ✅ FIXED: Log the actual documents array
    console.log('Raw documents array:', JSON.stringify(appointment.documents, null, 2));
    console.log(`Found ${appointment.documents?.length || 0} documents for appointment ${appointmentId}`);
    
    // ✅ FIXED: Return the documents array directly
    const documents = appointment.documents || [];
    sendSuccess(res, documents, 'Appointment documents retrieved successfully');
    
  } catch (error) {
    console.error('Error fetching appointment documents:', error);
    console.error('Error stack:', error.stack);
    sendError(res, 'Error fetching appointment documents', 500, error.message);
  }
};

// ✅ NEW: @desc    Add document to appointment
// @route   POST /api/appointments/:appointmentId/documents
// @access  Private (Assigner, Clinic, Doctor)
export const addAppointmentDocument = async (req, res) => {
  console.log('=== ADD APPOINTMENT DOCUMENT REQUEST START ===');
  console.log('Appointment ID:', req.params.appointmentId);
  console.log('User ID:', req.user?.id);
  console.log('User Role:', req.user?.role);

  try {
    const { appointmentId } = req.params;
    const documentData = req.body;

    // Check permissions - assigners, clinics, and doctors can upload
    if (!['assigner', 'clinic', 'jrdoctor'].includes(req.user.role)) {
      console.log('Permission denied for role:', req.user.role);
      return sendError(res, 'You do not have permission to upload documents', 403);
    }

    // Validate required fields
    if (!documentData.fileName || !documentData.fileUrl || !documentData.fileSize || !documentData.mimeType) {
      return sendError(res, 'Missing required document fields', 400);
    }

    // Find appointment
    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      console.log('Appointment not found:', appointmentId);
      return sendError(res, 'Appointment not found', 404);
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (documentData.fileSize > maxSize) {
      return sendError(res, 'File size exceeds 50MB limit', 400);
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'image/gif',
      'image/webp'
    ];
    
    if (!allowedTypes.includes(documentData.mimeType)) {
      return sendError(res, 'Invalid file type. Only images and PDFs are allowed', 400);
    }

    // Add document to appointment using the schema method
    await appointment.addDocument({
      ...documentData,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    });

    console.log('Document added successfully to appointment:', appointmentId);
    
    // Return updated appointment with documents populated
    const updatedAppointment = await Appointment.findOne({ appointmentId })
      .populate('documents.uploadedBy', 'profile.firstName profile.lastName')
      .select('documents appointmentId patientId');

    sendSuccess(res, updatedAppointment.documents, 'Document added successfully', 201);

  } catch (error) {
    console.error('Error adding appointment document:', error);
    sendError(res, 'Error adding document', 500, error.message);
  }
};

// ✅ NEW: @desc    Update appointment document
// @route   PUT /api/appointments/:appointmentId/documents/:documentId
// @access  Private (Assigner, Clinic, Doctor)
export const updateAppointmentDocument = async (req, res) => {
  console.log('=== UPDATE APPOINTMENT DOCUMENT REQUEST START ===');
  console.log('Appointment ID:', req.params.appointmentId);
  console.log('Document ID:', req.params.documentId);
  console.log('User ID:', req.user?.id);

  try {
    const { appointmentId, documentId } = req.params;
    const updateData = req.body;

    // Check permissions
    if (!['assigner', 'clinic', 'doctor'].includes(req.user.role)) {
      return sendError(res, 'You do not have permission to update documents', 403);
    }

    // Find appointment
    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // Find document in appointment
    const docIndex = appointment.documents.findIndex(
      doc => doc._id.toString() === documentId
    );

    if (docIndex === -1) {
      return sendError(res, 'Document not found', 404);
    }

    // Update document fields (only allow updating certain fields)
    if (updateData.documentType) {
      appointment.documents[docIndex].documentType = updateData.documentType;
    }
    if (updateData.description !== undefined) {
      appointment.documents[docIndex].description = updateData.description;
    }

    await appointment.save();

    console.log('Document updated successfully');
    
    // Return updated documents
    const updatedAppointment = await Appointment.findOne({ appointmentId })
      .populate('documents.uploadedBy', 'profile.firstName profile.lastName')
      .select('documents appointmentId patientId');

    sendSuccess(res, updatedAppointment.documents, 'Document updated successfully');

  } catch (error) {
    console.error('Error updating appointment document:', error);
    sendError(res, 'Error updating document', 500, error.message);
  }
};

// ✅ NEW: @desc    Delete appointment document
// @route   DELETE /api/appointments/:appointmentId/documents/:documentId
// @access  Private (Assigner, Clinic, Doctor)
export const deleteAppointmentDocument = async (req, res) => {
  console.log('=== DELETE APPOINTMENT DOCUMENT REQUEST START ===');
  console.log('Appointment ID:', req.params.appointmentId);
  console.log('Document ID:', req.params.documentId);
  console.log('User ID:', req.user?.id);

  try {
    const { appointmentId, documentId } = req.params;

    // Check permissions
    if (!['assigner', 'clinic', 'doctor'].includes(req.user.role)) {
      return sendError(res, 'You do not have permission to delete documents', 403);
    }

    // Find appointment
    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // Check if document exists
    const docExists = appointment.documents.some(
      doc => doc._id.toString() === documentId
    );

    if (!docExists) {
      return sendError(res, 'Document not found', 404);
    }

    // Remove document from array
    appointment.documents = appointment.documents.filter(
      doc => doc._id.toString() !== documentId
    );

    await appointment.save();

    console.log('Document deleted successfully');
    
    sendSuccess(res, null, 'Document deleted successfully');

  } catch (error) {
    console.error('Error deleting appointment document:', error);
    sendError(res, 'Error deleting document', 500, error.message);
  }
};



// @desc    Update comprehensive medical assessment for an appointment
// @route   PUT /api/appointments/:appointmentId/assessment
// @access  Private (doctor, jrdoctor, clinic)
export const updateAppointmentAssessment = async (req, res) => {
  console.log('=== UPDATE APPOINTMENT ASSESSMENT REQUEST START ===');
  console.log('User ID:', req.user?.id);
  console.log('User Role:', req.user?.role);
  console.log('Appointment ID:', req.params.appointmentId);
  console.log('Request body keys:', Object.keys(req.body));
  
  try {
    const { appointmentId } = req.params;
    const user = req.user;

    // Authorization check
    if (!user || !['doctor', 'jrdoctor', 'clinic'].includes(user.role)) {
      return sendError(res, 'Unauthorized - Only doctors and clinics can update medical assessments', 403);
    }

    // Find appointment
    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // ✅ Lab-based authorization - ensure user belongs to same lab
    const userLabId = user.clinicDetails?.labId;
    if (userLabId && appointment.labId !== userLabId) {
      return sendError(res, 'Not authorized to update this appointment', 403);
    }

    const { 
      vitals, 
      chiefComplaints, 
      examination, 
      investigations, 
      treatment, 
      followUp, 
      doctorNotes 
    } = req.body;

    console.log('Updating appointment with assessment data...');

    // ✅ Update vitals if provided
    if (vitals && Object.keys(vitals).length > 0) {
      appointment.vitals = {
        ...appointment.vitals, // Keep existing vitals
        ...vitals, // Override with new vitals
        recordedAt: new Date(),
        recordedBy: user.id
      };
      console.log('Vitals updated');
    }

    // ✅ Update chief complaints if provided
    if (chiefComplaints && Object.keys(chiefComplaints).length > 0) {
      appointment.chiefComplaints = {
        ...appointment.chiefComplaints, // Keep existing complaints
        ...chiefComplaints, // Override with new complaints
        recordedAt: new Date(),
        recordedBy: user.id
      };
      console.log('Chief complaints updated');
    }

    // ✅ Update examination if provided
    if (examination && Object.keys(examination).length > 0) {
      appointment.examination = {
        ...appointment.examination, // Keep existing examination
        ...examination, // Override with new examination
        recordedAt: new Date(),
        recordedBy: user.id
      };
      console.log('Examination updated');
    }

    // ✅ Update investigations if provided
    if (investigations && Object.keys(investigations).length > 0) {
      appointment.investigations = {
        ...appointment.investigations, // Keep existing investigations
        ...investigations, // Override with new investigations
        recordedAt: new Date(),
        recordedBy: user.id
      };
      console.log('Investigations updated');
    }

    // ✅ Update treatment if provided
    if (treatment && Object.keys(treatment).length > 0) {
      appointment.treatment = {
        ...appointment.treatment, // Keep existing treatment
        ...treatment, // Override with new treatment
        recordedAt: new Date(),
        recordedBy: user.id
      };
      console.log('Treatment updated');
    }

    // ✅ Update follow-up if provided
    if (followUp && Object.keys(followUp).length > 0) {
      appointment.followUp = {
        ...appointment.followUp, // Keep existing follow-up
        ...followUp, // Override with new follow-up
        recordedAt: new Date(),
        recordedBy: user.id
      };
      console.log('Follow-up updated');
    }

    // ✅ Update doctor notes if provided
    if (doctorNotes !== undefined) {
      appointment.doctorNotes = doctorNotes;
      console.log('Doctor notes updated');
    }

    // ✅ Update appointment metadata
    appointment.lastModifiedBy = user.id;
    appointment.updatedAt = new Date();
    
    // ✅ Update status progression
    if (appointment.status === 'Scheduled') {
      appointment.status = 'In-Progress';
      console.log('Status updated to In-Progress');
    }
    
    // ✅ Update workflow phase based on what was completed
    if (examination?.provisionalDiagnosis && appointment.workflowPhase === 'in-assessment') {
      appointment.workflowPhase = 'diagnosed';
      console.log('Workflow phase updated to diagnosed');
    } else if ((vitals || chiefComplaints) && appointment.workflowPhase === 'registered') {
      appointment.workflowPhase = 'in-assessment';
      console.log('Workflow phase updated to in-assessment');
    }

    // ✅ Save the updated appointment
    const savedAppointment = await appointment.save();
    console.log('Appointment assessment saved successfully');

    // ✅ Update completion phases based on what was provided
    try {
      if (vitals && appointment.updateCompletionPhase) {
        await appointment.updateCompletionPhase('vitalsRecorded', user.id);
        console.log('Vitals completion phase updated');
      }
      
      if (examination?.provisionalDiagnosis && appointment.updateCompletionPhase) {
        await appointment.updateCompletionPhase('diagnosisCompleted', user.id);
        console.log('Diagnosis completion phase updated');
      }
      
      if ((vitals || chiefComplaints || examination) && appointment.updateCompletionPhase) {
        await appointment.updateCompletionPhase('doctorAssessment', user.id);
        console.log('Doctor assessment completion phase updated');
      }
    } catch (phaseError) {
      console.warn('Could not update completion phases:', phaseError.message);
    }

    // ✅ Update patient workflow status if significant progress was made
    try {
      const patient = await Patient.findOne({ patientId: appointment.patientId });
      if (patient) {
        let newWorkflowStatus = patient.workflowStatus;
        
        if (examination?.provisionalDiagnosis) {
          newWorkflowStatus = 'In Progress';
        } else if (vitals || chiefComplaints) {
          newWorkflowStatus = 'Doctor Opened';
        }
        
        if (newWorkflowStatus !== patient.workflowStatus) {
          await Patient.findOneAndUpdate(
            { patientId: appointment.patientId },
            {
              workflowStatus: newWorkflowStatus,
              lastActivity: new Date()
            }
          );
          console.log(`Patient workflow status updated to: ${newWorkflowStatus}`);
        }
      }
    } catch (patientError) {
      console.warn('Could not update patient workflow status:', patientError.message);
    }

    // ✅ Return populated appointment with comprehensive data
    const populatedAppointment = await Appointment.findOne({ appointmentId })
      .populate('doctorId', 'profile doctorDetails')
      .populate('assignedBy', 'profile')
      .populate('createdBy', 'profile')
      .populate('lastModifiedBy', 'profile');

    console.log('=== UPDATE APPOINTMENT ASSESSMENT REQUEST END ===');
    return sendSuccess(res, populatedAppointment, 'Medical assessment updated successfully');

  } catch (error) {
    console.error('=== UPDATE APPOINTMENT ASSESSMENT ERROR ===');
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    return sendError(res, 'Error updating medical assessment', 500, error.message);
  }
};

// ✅ Keep the original vitals-only endpoint for backward compatibility
export const updateAppointmentVitals = async (req, res) => {
  console.log('=== UPDATE APPOINTMENT VITALS (LEGACY) REQUEST START ===');
  console.log('Redirecting to comprehensive assessment endpoint...');
  
  // Transform vitals-only request to assessment format
  const assessmentData = {
    vitals: req.body.vitals || req.body
  };
  
  // Update request body and delegate to comprehensive assessment handler
  req.body = assessmentData;
  return updateAppointmentAssessment(req, res);
};

// export { 
//   assignDoctorToAppointment, 
//   updateAppointmentStatus,
//   createAppointmentPrescription,
//   getAppointmentById,
//   getAppointmentDocuments,
//   addAppointmentDocument,
//   updateAppointmentDocument,
//   deleteAppointmentDocument,
//   updateAppointmentVitals, // ✅ Legacy endpoint
//   updateAppointmentAssessment // ✅ NEW: Comprehensive assessment endpoint
// };