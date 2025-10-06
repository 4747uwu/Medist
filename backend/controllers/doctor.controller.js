import Patient, { Visit } from '../modals/Patient.js';
import User from '../modals/User.js';
import Lab from '../modals/Lab.js';
import Appointment from '../modals/Appointment.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

// @desc    Get all patients assigned to doctor (via appointments)
// @route   GET /api/doctor/patients
// @access  Private (Doctor only)
export const getAssignedPatients = async (req, res) => {
  console.log('=== GET DOCTOR ASSIGNED PATIENTS REQUEST START ===');
  console.log('Doctor ID:', req.user?.id);

  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      status = 'all',
      workflowStatus = 'all',
      dateFilter = 'all'
    } = req.query;

    console.log('Query parameters:', { page, limit, search, status, workflowStatus, dateFilter });

    // ✅ NEW: Build query for appointments assigned to this doctor
    const appointmentQuery = {
      doctorId: req.user.id
    };

    // Add status filter to appointments
    if (status !== 'all') {
      appointmentQuery.status = status;
    }

    // Add date filter to appointments
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          appointmentQuery.scheduledDate = { $gte: startDate };
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          appointmentQuery.scheduledDate = { $gte: startDate, $lt: endDate };
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          appointmentQuery.scheduledDate = { $gte: startDate };
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          appointmentQuery.scheduledDate = { $gte: startDate };
          break;
      }
    }

    console.log('Appointment query:', JSON.stringify(appointmentQuery, null, 2));

    // ✅ Fetch appointments assigned to doctor
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [appointments, totalAppointments] = await Promise.all([
      Appointment.find(appointmentQuery)
        .populate('assignedBy', 'profile.firstName profile.lastName')
        .populate('createdBy', 'profile.firstName profile.lastName')
        .populate('documents.uploadedBy', 'profile.firstName profile.lastName')
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Appointment.countDocuments(appointmentQuery)
    ]);

    console.log(`Found ${appointments.length} appointments assigned to doctor`);

    // ✅ Get unique patient IDs from appointments
    const patientIds = [...new Set(appointments.map(apt => apt.patientId))];
    console.log(`Unique patients: ${patientIds.length}`);

    // ✅ Fetch patient data for those IDs (with search filter if provided)
    const patientQuery = { patientId: { $in: patientIds } };
    
    if (search) {
      patientQuery.$or = [
        { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { 'contactInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(patientQuery).lean();
    console.log(`Fetched ${patients.length} patient records`);

    // ✅ Create patient map for quick lookup
    const patientMap = {};
    patients.forEach(patient => {
      patientMap[patient.patientId] = patient;
    });

    // ✅ Fetch labs for unique labIds
    const labIds = [...new Set(appointments.map(apt => apt.labId))];
    const labs = await Lab.find({ labId: { $in: labIds } }).lean();
    const labMap = {};
    labs.forEach(lab => {
      labMap[lab.labId] = lab;
    });

    // ✅ Group appointments by patient and enrich with patient + lab data
    const patientAppointmentMap = {};
    
    appointments.forEach(appointment => {
      const patientId = appointment.patientId;
      const patient = patientMap[patientId];
      
      if (!patient) return; // Skip if patient not found
      
      if (!patientAppointmentMap[patientId]) {
        patientAppointmentMap[patientId] = {
          ...patient,
          lab: labMap[appointment.labId] || null,
          labName: labMap[appointment.labId]?.labName || appointment.labId,
          // ✅ Store latest appointment as "current appointment"
          latestAppointment: appointment,
          // ✅ Store all appointments for this patient
          doctorAppointments: [],
          // ✅ Use appointment status as workflow status
          workflowStatus: appointment.status,
          lastActivity: appointment.scheduledDate
        };
      }
      
      patientAppointmentMap[patientId].doctorAppointments.push(appointment);
    });

    // ✅ Convert map to array
    const patientsWithAppointments = Object.values(patientAppointmentMap);

    console.log(`Final patients with appointments: ${patientsWithAppointments.length}`);

    // ✅ Apply workflow status filter AFTER grouping (filter on appointment status)
    let filteredPatients = patientsWithAppointments;
    
    if (workflowStatus !== 'all') {
      console.log('Filtering by appointment status:', workflowStatus);
      
      if (workflowStatus === 'pending') {
        filteredPatients = patientsWithAppointments.filter(p => 
          ['Scheduled', 'Confirmed'].includes(p.latestAppointment.status)
        );
      } else if (workflowStatus === 'inprogress') {
        filteredPatients = patientsWithAppointments.filter(p => 
          ['In-Progress'].includes(p.latestAppointment.status)
        );
      } else if (workflowStatus === 'completed') {
        filteredPatients = patientsWithAppointments.filter(p => 
          ['Completed'].includes(p.latestAppointment.status)
        );
      } else {
        // Specific status filter
        filteredPatients = patientsWithAppointments.filter(p => 
          p.latestAppointment.status === workflowStatus
        );
      }
    }

    // ✅ Calculate stats based on ALL appointments assigned to doctor
    const statusCounts = await Appointment.aggregate([
      { $match: { doctorId: req.user.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Appointment status counts:', statusCounts);

    const stats = {
      total: patientIds.length, // Unique patients
      totalAppointments: totalAppointments,
      all: patientIds.length,
      pending: 0,
      inprogress: 0,
      completed: 0,
      scheduled: 0,
      confirmed: 0
    };

    statusCounts.forEach(item => {
      const status = item._id;
      const count = item.count;
      
      if (status) {
        const statusKey = status.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
        stats[statusKey] = count;
      }
      
      // Group statuses
      if (['Scheduled', 'Confirmed'].includes(status)) {
        stats.pending += count;
      } else if (['In-Progress'].includes(status)) {
        stats.inprogress += count;
      } else if (['Completed'].includes(status)) {
        stats.completed += count;
      }
    });

    console.log('Processed stats:', stats);

    const response = {
      data: filteredPatients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredPatients.length / parseInt(limit)),
        totalCount: filteredPatients.length,
        limit: parseInt(limit)
      },
      stats
    };

    console.log('=== GET DOCTOR ASSIGNED PATIENTS REQUEST END ===');
    sendSuccess(res, response, 'Assigned patients retrieved successfully');

  } catch (error) {
    console.error('=== GET DOCTOR ASSIGNED PATIENTS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching assigned patients', 500, error.message);
  }
};

// @desc    Update appointment status by doctor
// @route   PUT /api/doctor/appointments/:appointmentId/status
// @access  Private (Doctor only)
export const updateAppointmentStatus = async (req, res) => {
  console.log('=== UPDATE APPOINTMENT STATUS REQUEST START ===');
  console.log('Doctor ID:', req.user?.id);
  console.log('Appointment ID:', req.params.appointmentId);
  console.log('New status:', req.body.status);

  try {
    const { status, notes } = req.body;
    const { appointmentId } = req.params;

    // Validate appointment status
    const validStatuses = ['Confirmed', 'In-Progress', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 'Invalid appointment status', 400);
    }

    // Check if appointment is assigned to this doctor
    const appointment = await Appointment.findOne({
      appointmentId,
      doctorId: req.user.id
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found or not assigned to you', 404);
    }

    // Update appointment status
    appointment.status = status;
    appointment.lastModifiedBy = req.user.id;
    appointment.updatedAt = new Date();
    
    if (status === 'Completed') {
      appointment.completedAt = new Date();
    }
    
    if (notes) {
      appointment.assignmentNotes = notes;
    }

    await appointment.save();

    console.log('Appointment status updated successfully');

    // Populate the response
    const updatedAppointment = await Appointment.findOne({ appointmentId })
      .populate('doctorId', 'profile doctorDetails')
      .populate('assignedBy', 'profile')
      .populate('createdBy', 'profile')
      .populate('lastModifiedBy', 'profile');

    sendSuccess(res, updatedAppointment, 'Appointment status updated successfully');

  } catch (error) {
    console.error('=== UPDATE APPOINTMENT STATUS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error updating appointment status', 500, error.message);
  }
};

// @desc    Get patient details for doctor (via appointments)
// @route   GET /api/doctor/patients/:patientId
// @access  Private (Doctor only)
export const getPatientDetails = async (req, res) => {
  console.log('=== GET PATIENT DETAILS REQUEST START ===');
  console.log('Doctor ID:', req.user?.id);
  console.log('Patient ID:', req.params.patientId);

  try {
    const { patientId } = req.params;

    // ✅ Check if this doctor has any appointments with this patient
    const appointments = await Appointment.find({
      patientId,
      doctorId: req.user.id
    })
    .populate('assignedBy', 'profile.firstName profile.lastName')
    .populate('createdBy', 'profile.firstName profile.lastName')
    .populate('documents.uploadedBy', 'profile.firstName profile.lastName')
    .populate({
      path: 'prescriptions.prescriptionId',
      model: 'Prescription',
      populate: [
        { path: 'doctorId', select: 'profile' },
        { path: 'medicines.medicineId', select: 'name companyName' }
      ]
    })
    .sort({ scheduledDate: -1 })
    .lean();

    if (!appointments || appointments.length === 0) {
      return sendError(res, 'Patient not found or you have no appointments with this patient', 404);
    }

    // ✅ Fetch patient data
    const patient = await Patient.findOne({ patientId }).lean();

    if (!patient) {
      return sendError(res, 'Patient record not found', 404);
    }

    // Get lab information
    const lab = await Lab.findOne({ labId: patient.labId }).lean();

    // ✅ Prepare response with patient data + appointments
    const patientWithDetails = {
      ...patient,
      lab: lab,
      labName: lab?.labName || patient.labId,
      // ✅ Include all appointments with this doctor
      doctorAppointments: appointments,
      latestAppointment: appointments[0], // Most recent
      // ✅ Stats based on doctor's appointments only
      appointmentStats: {
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'Completed').length,
        scheduled: appointments.filter(a => a.status === 'Scheduled').length,
        inProgress: appointments.filter(a => a.status === 'In-Progress').length
      }
    };

    console.log('Patient details retrieved successfully');
    console.log(`Found ${appointments.length} appointments with this patient`);

    sendSuccess(res, patientWithDetails, 'Patient details retrieved successfully');

  } catch (error) {
    console.error('=== GET PATIENT DETAILS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching patient details', 500, error.message);
  }
};

// @desc    Get doctor dashboard statistics
// @route   GET /api/doctor/stats
// @access  Private (Doctor only)
export const getDoctorStats = async (req, res) => {
  console.log('=== GET DOCTOR STATS REQUEST START ===');
  console.log('Doctor ID:', req.user?.id);

  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const doctorId = req.user.id;

    // ✅ Get stats based on appointments, not patient assignments
    const [
      totalAppointments,
      todayAppointments,
      weekAppointments,
      monthAppointments,
      statusStats,
      recentAppointments
    ] = await Promise.all([
      Appointment.countDocuments({ doctorId }),
      Appointment.countDocuments({ 
        doctorId, 
        scheduledDate: { $gte: startOfDay } 
      }),
      Appointment.countDocuments({ 
        doctorId, 
        scheduledDate: { $gte: startOfWeek } 
      }),
      Appointment.countDocuments({ 
        doctorId, 
        scheduledDate: { $gte: startOfMonth } 
      }),
      Appointment.aggregate([
        { $match: { doctorId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Appointment.find({ doctorId })
        .select('appointmentId patientId status scheduledDate chiefComplaints')
        .sort({ scheduledDate: -1 })
        .limit(10)
        .lean()
    ]);

    // Get unique patient count
    const uniquePatients = await Appointment.distinct('patientId', { doctorId });

    const stats = {
      appointments: {
        total: totalAppointments,
        today: todayAppointments,
        week: weekAppointments,
        month: monthAppointments
      },
      patients: {
        total: uniquePatients.length
      },
      status: statusStats.reduce((acc, item) => {
        const key = item._id.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
        acc[key] = item.count;
        return acc;
      }, {}),
      recentActivity: recentAppointments
    };

    console.log('Doctor statistics generated:', stats);

    sendSuccess(res, stats, 'Doctor statistics retrieved successfully');

  } catch (error) {
    console.error('=== GET DOCTOR STATS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching doctor statistics', 500, error.message);
  }
};