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
    if (!['assigner', 'clinic', 'doctor'].includes(req.user.role)) {
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