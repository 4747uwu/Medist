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

    // Find the appointment with populated fields
    const appointment = await Appointment.findOne({ appointmentId })
      .populate('doctorId', 'profile doctorDetails')
      .populate('assignedBy', 'profile')
      .populate('createdBy', 'profile')
      .populate('lastModifiedBy', 'profile')
      .populate('treatment.prescriptionId');

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