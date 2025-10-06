import Appointment from '../modals/Appointment.js';
import { Patient } from '../modals/Patient.js';
import User from '../modals/User.js';
import Lab from '../modals/Lab.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

// @desc    Get appointments assigned to current doctor
// @route   GET /api/doctor/appointments
// @access  Private (Doctor only)
export const getDoctorAppointments = async (req, res) => {
  console.log('=== GET DOCTOR APPOINTMENTS REQUEST START ===');
  console.log('Doctor ID:', req.user?.id);
  console.log('Include history:', req.query.includeHistory);

  try {
    const { includeHistory = 'false' } = req.query;
    const doctorId = req.user.id;

    let query;
    
    if (includeHistory === 'true') {
      // ✅ History mode: Show ALL completed appointments regardless of assignment
      console.log('Fetching HISTORY: All completed appointments');
      query = {
        status: 'Completed'
      };
    } else {
      // ✅ Active mode: Show ONLY appointments assigned to this doctor with status Scheduled
      console.log('Fetching ACTIVE: Appointments assigned to doctor with Scheduled status');
      query = {
        doctorId: doctorId,
        status: { $ne: 'Completed' } // Not completed
      };
    }

    console.log('Query:', JSON.stringify(query, null, 2));

    // Fetch appointments
    const appointments = await Appointment.find(query)
      .populate('doctorId', 'profile doctorDetails')
      .populate('assignedBy', 'profile.firstName profile.lastName')
      .populate('createdBy', 'profile.firstName profile.lastName')
      .populate('documents.uploadedBy', 'profile.firstName profile.lastName')
      .populate({
        path: 'prescriptions.prescriptionId',
        model: 'Prescription',
        populate: {
          path: 'doctorId',
          select: 'profile'
        }
      })
      .sort(includeHistory === 'true' ? { completedAt: -1 } : { scheduledDate: 1, createdAt: -1 })
      .lean();

    console.log(`Found ${appointments.length} appointments`);

    // Get unique patient IDs
    const patientIds = [...new Set(appointments.map(apt => apt.patientId))];
    
    // Fetch patient data
    const patients = await Patient.find({ patientId: { $in: patientIds } }).lean();
    const patientMap = {};
    patients.forEach(patient => {
      patientMap[patient.patientId] = patient;
    });

    // Fetch labs
    const labIds = [...new Set(appointments.map(apt => apt.labId))];
    const labs = await Lab.find({ labId: { $in: labIds } }).lean();
    const labMap = {};
    labs.forEach(lab => {
      labMap[lab.labId] = lab;
    });

    // Enrich appointments with patient and lab data
    const enrichedAppointments = appointments.map(appointment => ({
      ...appointment,
      patient: patientMap[appointment.patientId] || null,
      lab: labMap[appointment.labId] || null,
      labName: labMap[appointment.labId]?.labName || appointment.labId
    }));

    // ✅ Sort: Scheduled status first, then by date
    if (includeHistory === 'false') {
      enrichedAppointments.sort((a, b) => {
        // First priority: Scheduled status
        if (a.status === 'Scheduled' && b.status !== 'Scheduled') return -1;
        if (a.status !== 'Scheduled' && b.status === 'Scheduled') return 1;
        
        // Second priority: Scheduled date (earliest first)
        const dateA = new Date(a.scheduledDate);
        const dateB = new Date(b.scheduledDate);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        
        // Third priority: Created date (most recent first)
        const createdA = new Date(a.createdAt);
        const createdB = new Date(b.createdAt);
        return createdB - createdA;
      });
    }

    console.log('Enriched appointments:', enrichedAppointments.length);

    // Calculate stats
    const stats = {
      total: enrichedAppointments.length,
      scheduled: enrichedAppointments.filter(a => a.status === 'Scheduled').length,
      confirmed: enrichedAppointments.filter(a => a.status === 'Confirmed').length,
      inProgress: enrichedAppointments.filter(a => a.status === 'In-Progress').length,
      completed: enrichedAppointments.filter(a => a.status === 'Completed').length
    };

    console.log('Stats:', stats);

    sendSuccess(res, {
      appointments: enrichedAppointments,
      stats
    }, 'Appointments retrieved successfully');

  } catch (error) {
    console.error('=== GET DOCTOR APPOINTMENTS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching appointments', 500, error.message);
  }
};

// @desc    Get single appointment by patient ID (for doctor)
// @route   GET /api/doctor/appointments/patient/:patientId
// @access  Private (Doctor only)
export const getDoctorAppointmentsByPatient = async (req, res) => {
  console.log('=== GET DOCTOR APPOINTMENTS BY PATIENT REQUEST START ===');
  console.log('Doctor ID:', req.user?.id);
  console.log('Patient ID:', req.params.patientId);

  try {
    const { patientId } = req.params;
    const doctorId = req.user.id;

    // ✅ Fetch assigned (active) appointments
    const assignedAppointments = await Appointment.find({
      patientId,
      doctorId,
      status: { $ne: 'Completed' }
    })
    .populate('doctorId', 'profile doctorDetails')
    .populate('assignedBy', 'profile.firstName profile.lastName')
    .populate('createdBy', 'profile.firstName profile.lastName')
    .populate('documents.uploadedBy', 'profile.firstName profile.lastName')
    .populate({
      path: 'prescriptions.prescriptionId',
      model: 'Prescription'
    })
    .sort({ scheduledDate: 1, createdAt: -1 })
    .lean();

    // ✅ Fetch completed appointments (history)
    const completedAppointments = await Appointment.find({
      patientId,
      status: 'Completed'
    })
    .populate('doctorId', 'profile doctorDetails')
    .populate('documents.uploadedBy', 'profile.firstName profile.lastName')
    .populate({
      path: 'prescriptions.prescriptionId',
      model: 'Prescription'
    })
    .sort({ completedAt: -1 })
    .lean();

    // Get patient data
    const patient = await Patient.findOne({ patientId }).lean();
    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    // Get lab data
    const lab = await Lab.findOne({ labId: patient.labId }).lean();

    // ✅ Sort assigned appointments: Scheduled first
    assignedAppointments.sort((a, b) => {
      if (a.status === 'Scheduled' && b.status !== 'Scheduled') return -1;
      if (a.status !== 'Scheduled' && b.status === 'Scheduled') return 1;
      
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      return dateA - dateB;
    });

    console.log(`Found ${assignedAppointments.length} assigned appointments and ${completedAppointments.length} completed appointments`);

    sendSuccess(res, {
      patient: {
        ...patient,
        lab,
        labName: lab?.labName || patient.labId
      },
      assignedAppointments,
      completedAppointments,
      latestAssigned: assignedAppointments[0] || null,
      stats: {
        totalAssigned: assignedAppointments.length,
        totalCompleted: completedAppointments.length,
        scheduled: assignedAppointments.filter(a => a.status === 'Scheduled').length
      }
    }, 'Patient appointments retrieved successfully');

  } catch (error) {
    console.error('=== GET DOCTOR APPOINTMENTS BY PATIENT ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching patient appointments', 500, error.message);
  }
};

// @desc    Update appointment status (doctor can mark as completed)
// @route   PUT /api/doctor/appointments/:appointmentId/status
// @access  Private (Doctor only)
export const updateDoctorAppointmentStatus = async (req, res) => {
  console.log('=== UPDATE DOCTOR APPOINTMENT STATUS REQUEST START ===');
  console.log('Doctor ID:', req.user?.id);
  console.log('Appointment ID:', req.params.appointmentId);
  console.log('New status:', req.body.status);

  try {
    const { status, notes } = req.body;
    const { appointmentId } = req.params;
    const doctorId = req.user.id;

    // Validate status
    const validStatuses = ['Confirmed', 'In-Progress', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }

    // Find appointment assigned to this doctor
    const appointment = await Appointment.findOne({
      appointmentId,
      doctorId
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found or not assigned to you', 404);
    }

    // Update status
    appointment.status = status;
    appointment.lastModifiedBy = doctorId;
    appointment.updatedAt = new Date();

    if (status === 'Completed') {
      appointment.completedAt = new Date();
    }

    if (notes) {
      appointment.assignmentNotes = notes;
    }

    await appointment.save();

    // ✅ Update patient's appointment record
    await Patient.findOneAndUpdate(
      {
        patientId: appointment.patientId,
        'appointments.list.appointmentId': appointmentId
      },
      {
        $set: {
          'appointments.list.$.status': status
        }
      }
    );

    console.log('Appointment status updated successfully');

    sendSuccess(res, appointment, 'Appointment status updated successfully');

  } catch (error) {
    console.error('=== UPDATE DOCTOR APPOINTMENT STATUS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error updating appointment status', 500, error.message);
  }
};