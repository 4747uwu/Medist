import Patient, { Visit } from '../modals/Patient.js';
import Lab from '../modals/Lab.js';
import Prescription from '../modals/Prescription.js';
import User from '../modals/User.js';
import { sendSuccess, sendError } from '../utils/helpers.js';
import Appointment from '../modals/Appointment.js';

// Helper function to get IST dates
const getISTDate = (utcDate = new Date()) => {
  // IST is UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  return new Date(utcDate.getTime() + istOffset);
};

const getISTDateRange = (dateType) => {
    const nowUTC = new Date();
    const nowIST = new Date(nowUTC.getTime() + (5.5 * 60 * 60 * 1000));

    const istYear = nowIST.getUTCFullYear();
    const istMonth = nowIST.getUTCMonth();
    const istDate = nowIST.getUTCDate();

    let startIST, endIST;

    switch (dateType) {
        case 'today':
            startIST = new Date(Date.UTC(istYear, istMonth, istDate, 0, 0, 0));
            endIST = new Date(Date.UTC(istYear, istMonth, istDate, 23, 59, 59, 999));
            break;
        case 'yesterday':
            startIST = new Date(Date.UTC(istYear, istMonth, istDate - 1, 0, 0, 0));
            endIST = new Date(Date.UTC(istYear, istMonth, istDate - 1, 23, 59, 59, 999));
            break;
        case 'week':
            startIST = new Date(Date.UTC(istYear, istMonth, istDate - 6, 0, 0, 0));
            endIST = new Date(Date.UTC(istYear, istMonth, istDate, 23, 59, 59, 999));
            break;
        case 'month':
            startIST = new Date(Date.UTC(istYear, istMonth, 1, 0, 0, 0));
            endIST = new Date(Date.UTC(istYear, istMonth, istDate, 23, 59, 59, 999));
            break;
        default:
            return { start: null, end: null };
    }

    // Convert IST date boundaries back to UTC for the query
    const istOffset = 5.5 * 60 * 60 * 1000;
    const startUTC = new Date(startIST.getTime() - istOffset);
    const endUTC = new Date(endIST.getTime() - istOffset);

    return { start: startUTC, end: endUTC };
};

// @desc    Get patients assigned to the current user
// @route   GET /api/assigner/patients
// @access  Private (Assigner only)
export const getPatients = async (req, res) => {
  console.log('=== GET ASSIGNER PATIENTS REQUEST START ===');
  console.log('User ID:', req.user?.id);

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

    // Build query
    const query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { 'contactInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Add workflow status filter with correct mapping
    if (workflowStatus !== 'all') {
      console.log('Filtering by workflow status:', workflowStatus);
      
      if (workflowStatus === 'pending') {
        query.workflowStatus = { $in: ['New', 'Assigned', 'Revisited'] };
      } else if (workflowStatus === 'inprogress') {
        query.workflowStatus = { $in: ['Doctor Opened', 'In Progress', 'Reported'] };
      } else if (workflowStatus === 'completed') {
        query.workflowStatus = 'Completed';
      } else {
        query.workflowStatus = workflowStatus;
      }
    }

    // Date filtering using registrationDate with IST
    if (dateFilter !== 'all') {
      const currentUTC = new Date();
      const currentIST = new Date(currentUTC.getTime() + (5.5 * 60 * 60 * 1000));
      
      console.log('Current UTC time:', currentUTC.toISOString());
      console.log('Current IST time:', currentIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      
      const dateRange = getISTDateRange(dateFilter);
      if (dateRange.start && dateRange.end) {
        query.registrationDate = { $gte: dateRange.start, $lte: dateRange.end };
        
        // Convert back to IST for logging
        const startIST = new Date(dateRange.start.getTime() + (5.5 * 60 * 60 * 1000));
        const endIST = new Date(dateRange.end.getTime() + (5.5 * 60 * 60 * 1000));
        
        console.log(`IST ${dateFilter} range:`, {
          startUTC: dateRange.start.toISOString(),
          endUTC: dateRange.end.toISOString(),
          startIST: startIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          endIST: endIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        });
      }
    }

    console.log('Final MongoDB query:', JSON.stringify(query, null, 2));

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [patients, total] = await Promise.all([
      Patient.find(query)
        .populate('assignedBy', 'profile.firstName profile.lastName')
        .sort({ registrationDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Patient.countDocuments(query)
    ]);

    console.log(`MongoDB returned ${patients.length} patients out of ${total} total`);

    // Log patient registration dates for debugging
    if (patients.length > 0) {
      console.log('Patient registration dates analysis:');
      patients.forEach(patient => {
        const regDateUTC = new Date(patient.registrationDate);
        const regDateIST = new Date(regDateUTC.getTime() + (5.5 * 60 * 60 * 1000));
        
        // Get IST date components for comparison
        const regISTYear = regDateIST.getFullYear();
        const regISTMonth = regDateIST.getMonth();
        const regISTDate = regDateIST.getDate();
        
        // Get current IST date components
        const nowIST = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
        const nowISTYear = nowIST.getFullYear();
        const nowISTMonth = nowIST.getMonth();
        const nowISTDate = nowIST.getDate();
        
        let dayLabel = 'other';
        if (regISTYear === nowISTYear && regISTMonth === nowISTMonth) {
          if (regISTDate === nowISTDate) dayLabel = 'today';
          else if (regISTDate === nowISTDate - 1) dayLabel = 'yesterday';
          else if (regISTDate > nowISTDate - 7) dayLabel = 'this week';
        }
        
        console.log(`Patient ${patient.patientId}:`, {
          utc: regDateUTC.toISOString(),
          ist: regDateIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          istDate: `${regISTDate}/${regISTMonth + 1}/${regISTYear}`,
          dayLabel
        });
      });
    }

    // Process patients with enhanced appointment data
    const patientsWithVisitsAndLabs = await Promise.all(
      patients.map(async (patient) => {
        const lab = await Lab.findOne({ labId: patient.labId }).lean();

        // Get visit information if available
        let currentVisit = null;
        if (patient.currentVisitId) {
          currentVisit = await Visit.findOne({ visitId: patient.currentVisitId }).lean();
        }

        // Get appointment information with doctor details
        const appointments = await Appointment.find({ patientId: patient.patientId })
          .populate('doctorId', 'profile doctorDetails')
          .sort({ scheduledDate: -1 })
          .limit(10)
          .lean();

        // ✅ Enhanced appointment processing
        const appointmentsWithDoctorNames = appointments.map(apt => ({
          ...apt,
          doctorName: apt.doctorId ? 
            `Dr. ${apt.doctorId.profile?.firstName || ''} ${apt.doctorId.profile?.lastName || ''}`.trim() : 
            'Unknown Doctor'
        }));

        // ✅ Get last appointment details
        const lastAppointment = appointmentsWithDoctorNames.length > 0 ? appointmentsWithDoctorNames[0] : null;
        
        // ✅ Get last completed/reported appointment
        const reportedAppointment = appointmentsWithDoctorNames.find(apt => 
          apt.status === 'Completed' || apt.status === 'Reported'
        );

        // ✅ Calculate comprehensive appointment stats
        const appointmentStats = {
          totalAppointments: appointments.length,
          completedAppointments: appointments.filter(apt => apt.status === 'Completed').length,
          cancelledAppointments: appointments.filter(apt => apt.status === 'Cancelled').length,
          reportedAppointments: appointments.filter(apt => apt.status === 'Reported').length,
          
          // ✅ Last appointment details
          lastAppointmentDate: lastAppointment?.scheduledDate || null,
          lastAppointmentDoctor: lastAppointment?.doctorName || null,
          lastAppointmentStatus: lastAppointment?.status || null,
          
          // ✅ Reported appointment details
          reportedDate: reportedAppointment?.scheduledDate || reportedAppointment?.completedAt || null,
          reportedBy: reportedAppointment?.doctorName || null,
          reportedStatus: reportedAppointment?.status || null,
          
          // Next appointment
          nextAppointmentDate: appointments.find(apt => 
            apt.status === 'Scheduled' && new Date(apt.scheduledDate) > new Date()
          )?.scheduledDate || null,
          
          // Last seen by
          lastSeenBy: lastAppointment && lastAppointment.doctorId ? {
            doctorId: lastAppointment.doctorId._id,
            doctorName: lastAppointment.doctorName
          } : null
        };

        // Build prescriptions array
        let prescriptions = [];
        
        // Get from embedded list if present
        if (patient.prescriptions && Array.isArray(patient.prescriptions.list) && patient.prescriptions.list.length) {
          prescriptions = patient.prescriptions.list.map(p => ({
            _id: p._id || p.prescriptionId,
            prescriptionId: p.prescriptionId,
            prescriptionCode: p.prescriptionCode,
            doctorId: p.doctorId,
            doctorName: p.doctorName || null,
            visitId: p.visitId,
            createdAt: p.prescribedDate || p.createdAt,
            status: p.status,
            medicines: p.medicines || p.medicineList || [],
            tests: p.tests || [],
            advice: p.advice || null,
            source: 'embedded'
          }));
        }
        
        // Get from Prescription collection
        const prescriptionsFromDB = await Prescription.find({ patientId: patient.patientId })
          .sort({ createdAt: -1 })
          .lean();
          
        const dbPrescriptions = prescriptionsFromDB.map(p => ({
          _id: p._id,
          prescriptionId: p.prescriptionId || p._id,
          prescriptionCode: p.prescriptionCode,
          doctorId: p.doctorId || p.doctor || null,
          doctorName: p.doctorName || null,
          visitId: p.visitId || p.currentVisitId,
          createdAt: p.createdAt || p.prescribedDate,
          status: p.status,
          medicines: p.medicines || p.medicineList || [],
          tests: p.tests || [],
          advice: p.advice || null,
          source: 'database'
        }));
        
        // Merge and deduplicate prescriptions
        const allPrescriptions = [...prescriptions, ...dbPrescriptions];
        const uniquePrescriptions = allPrescriptions.reduce((acc, current) => {
          const existing = acc.find(p => p._id?.toString() === current._id?.toString() || p.prescriptionId === current.prescriptionId);
          if (!existing) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        prescriptions = uniquePrescriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Resolve doctor names for prescriptions
        const unresolvedDocIds = Array.from(
          new Set(
            prescriptions
              .filter(p => !p.doctorName && p.doctorId)
              .map(p => String(p.doctorId))
          )
        );

        const doctorNameMap = {};
        if (unresolvedDocIds.length) {
          try {
            const users = await User.find({ _id: { $in: unresolvedDocIds } })
              .select('profile.firstName profile.lastName name doctorDetails')
              .lean();
            users.forEach(u => {
              const id = String(u._id);
              const name = u.profile
                ? `Dr. ${u.profile.firstName || ''} ${u.profile.lastName || ''}`.trim()
                : (u.name || 'Unknown Doctor');
              if (name) doctorNameMap[id] = name;
            });
          } catch (e) {
            console.error('Error resolving doctor names:', e);
          }
        }

        prescriptions = prescriptions.map(p => ({
          ...p,
          doctorName: p.doctorName || (p.doctorId ? (doctorNameMap[String(p.doctorId)] || String(p.doctorId)) : 'Unknown Doctor')
        }));

        return {
          ...patient,
          lab,
          labName: lab?.labName || patient.labId,
          currentVisit,
          appointments: {
            list: appointmentsWithDoctorNames,
            stats: appointmentStats
          },
          prescriptions,
          // ✅ Add direct access to appointment data for easier frontend access
          lastAppointment: {
            date: appointmentStats.lastAppointmentDate,
            doctor: appointmentStats.lastAppointmentDoctor,
            status: appointmentStats.lastAppointmentStatus
          },
          reportedDetails: {
            date: appointmentStats.reportedDate,
            by: appointmentStats.reportedBy,
            status: appointmentStats.reportedStatus
          }
        };
      })
    );

    // Calculate stats using IST dates
    const statusMatch = { ...query };
    delete statusMatch.workflowStatus;

    const statusCounts = await Patient.aggregate([
      { $match: statusMatch },
      {
        $group: {
          _id: '$workflowStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Time-based counts using IST
    const timeBaseMatch = { ...query };
    delete timeBaseMatch.workflowStatus;
    delete timeBaseMatch.registrationDate;

    const todayRange = getISTDateRange('today');
    const yesterdayRange = getISTDateRange('yesterday');
    const weekRange = getISTDateRange('week');
    const monthRange = getISTDateRange('month');

    const [countAllTime, countToday, countYesterday, countWeek, countMonth] = await Promise.all([
      Patient.countDocuments(timeBaseMatch),
      Patient.countDocuments({ ...timeBaseMatch, registrationDate: { $gte: todayRange.start, $lte: todayRange.end } }),
      Patient.countDocuments({ ...timeBaseMatch, registrationDate: { $gte: yesterdayRange.start, $lte: yesterdayRange.end } }),
      Patient.countDocuments({ ...timeBaseMatch, registrationDate: { $gte: weekRange.start, $lte: weekRange.end } }),
      Patient.countDocuments({ ...timeBaseMatch, registrationDate: { $gte: monthRange.start, $lte: monthRange.end } })
    ]);

    const stats = {
      total: total,
      all: countAllTime,
      today: countToday,
      yesterday: countYesterday,
      week: countWeek,
      month: countMonth,
      pending: 0,
      inprogress: 0,
      completed: 0,
      new: 0,
      assigned: 0,
      doctorOpened: 0,
      reported: 0,
      revisited: 0,
      // Add IST timestamp for frontend reference
      istTimestamp: getISTDate().toISOString(),
      istTime: getISTDate().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    statusCounts.forEach(item => {
      const status = item._id;
      const count = item.count;
      if (!status) return;
      const statusKey = status.toLowerCase().replace(/\s+/g, '');
      stats[statusKey] = count;

      if (['New', 'Assigned', 'Revisited'].includes(status)) {
        stats.pending += count;
      } else if (['Doctor Opened', 'In Progress', 'Reported'].includes(status)) {
        stats.inprogress += count;
      } else if (['Completed'].includes(status)) {
        stats.completed += count;
      }
    });

    const response = {
      data: patientsWithVisitsAndLabs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalCount: total,
        limit: parseInt(limit)
      },
      stats
    };

    console.log('=== GET ASSIGNER PATIENTS REQUEST END ===');
    sendSuccess(res, response, 'Patients retrieved successfully');

  } catch (error) {
    console.error('=== GET ASSIGNER PATIENTS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching patients', 500, error.message);
  }
};

// @desc    Get patient by ID
// @route   GET /api/assigner/patients/:id
// @access  Private (Assigner only)
export const getPatientById = async (req, res) => {
  console.log('=== GET PATIENT BY ID REQUEST START ===');
  console.log('Patient ID:', req.params.id);

  try {
    const patient = await Patient.findById(req.params.id)
      .populate('onboarding.onboardedBy', 'profile email')
      .select('-__v');

    if (!patient) {
      console.log('Patient not found');
      return sendError(res, 'Patient not found', 404);
    }

    console.log('Patient found:', patient.patientId);
    console.log('=== GET PATIENT BY ID REQUEST END ===');

    sendSuccess(res, patient, 'Patient retrieved successfully');
  } catch (error) {
    console.error('=== GET PATIENT BY ID ERROR ===');
    console.error('Error:', error);
    console.error('=== GET PATIENT BY ID ERROR END ===');

    sendError(res, 'Error retrieving patient', 500, error.message);
  }
};

// @desc    Get patient statistics
// @route   GET /api/assigner/patients/stats
// @access  Private (Assigner only)
export const getPatientStats = async (req, res) => {
  console.log('=== GET PATIENT STATS REQUEST START ===');

  try {
    const stats = {
      total: await Patient.countDocuments(),
      active: await Patient.countDocuments({ status: 'Active' }),
      inactive: await Patient.countDocuments({ status: 'Inactive' }),
      deceased: await Patient.countDocuments({ status: 'Deceased' }),
      onboarded: await Patient.countDocuments({ 'onboarding.isOnboarded': true }),
      pending: await Patient.countDocuments({ 'onboarding.isOnboarded': false })
    };

    // Get patients by blood group
    const bloodGroupStats = await Patient.aggregate([
      {
        $group: {
          _id: '$personalInfo.bloodGroup',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get patients by gender
    const genderStats = await Patient.aggregate([
      {
        $group: {
          _id: '$personalInfo.gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent registrations using IST (last 30 days)
    const thirtyDaysAgo = getISTDate();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Convert IST back to UTC for database query
    const thirtyDaysAgoUTC = new Date(thirtyDaysAgo.getTime() - (5.5 * 60 * 60 * 1000));

    const recentRegistrations = await Patient.countDocuments({
      registrationDate: { $gte: thirtyDaysAgoUTC }
    });

    const response = {
      ...stats,
      bloodGroupDistribution: bloodGroupStats,
      genderDistribution: genderStats,
      recentRegistrations,
      // Add IST timestamp for frontend reference
      istTimestamp: getISTDate().toISOString(),
      istTime: getISTDate().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    console.log('Statistics generated:', response);
    console.log('=== GET PATIENT STATS REQUEST END ===');

    sendSuccess(res, response, 'Patient statistics retrieved successfully');
  } catch (error) {
    console.error('=== GET PATIENT STATS ERROR ===');
    console.error('Error:', error);
    console.error('=== GET PATIENT STATS ERROR END ===');

    sendError(res, 'Error retrieving patient statistics', 500, error.message);
  }
};

// @desc    Assign patient to doctor
// @route   POST /api/assigner/patients/:id/assign
// @access  Private (Assigner only)
export const assignPatient = async (req, res) => {
  console.log('=== ASSIGN PATIENT REQUEST START ===');
  console.log('Patient ID:', req.params.id);
  console.log('Request body:', req.body);

  try {
    const { doctorId, notes, priority = 'Normal' } = req.body;

    // Validate required fields
    const missing = validateRequired(['doctorId'], req.body);
    if (missing.length > 0) {
      console.log('Missing required fields:', missing);
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      console.log('Patient not found');
      return sendError(res, 'Patient not found', 404);
    }

    console.log('Assigning patient:', patient.patientId, 'to doctor:', doctorId);
    console.log('Priority:', priority);
    console.log('Notes:', notes);

    const assignment = {
      patientId: patient._id,
      doctorId,
      assignedBy: req.user.id,
      assignedAt: getISTDate(), // Use IST time
      priority,
      notes,
      status: 'Pending'
    };

    console.log('Assignment created:', assignment);
    console.log('=== ASSIGN PATIENT REQUEST END ===');

    sendSuccess(res, assignment, 'Patient assigned successfully');
  } catch (error) {
    console.error('=== ASSIGN PATIENT ERROR ===');
    console.error('Error:', error);
    console.error('=== ASSIGN PATIENT ERROR END ===');

    sendError(res, 'Error assigning patient', 500, error.message);
  }
};

// @desc    Update patient status
// @route   PUT /api/assigner/patients/:id/status
// @access  Private (Assigner only)
export const updatePatientStatus = async (req, res) => {
  console.log('=== UPDATE PATIENT STATUS REQUEST START ===');
  console.log('Patient ID:', req.params.id);
  console.log('New status:', req.body.status);

  try {
    const { status } = req.body;

    const validStatuses = ['Active', 'Inactive', 'Deceased'];
    if (!validStatuses.includes(status)) {
      console.log('Invalid status:', status);
      return sendError(res, `Status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        lastActivity: getISTDate() // Use IST time
      },
      { new: true, runValidators: true }
    );

    if (!patient) {
      console.log('Patient not found');
      return sendError(res, 'Patient not found', 404);
    }

    console.log('Patient status updated:', patient.patientId, 'to', status);
    console.log('=== UPDATE PATIENT STATUS REQUEST END ===');

    sendSuccess(res, patient, 'Patient status updated successfully');
  } catch (error) {
    console.error('=== UPDATE PATIENT STATUS ERROR ===');
    console.error('Error:', error);
    console.error('=== UPDATE PATIENT STATUS ERROR END ===');

    sendError(res, 'Error updating patient status', 500, error.message);
  }
};

// @desc    Get all doctors for assignment
// @route   GET /api/assigner/doctors
// @access  Private (Assigner only)
export const getDoctors = async (req, res) => {
  console.log('=== GET DOCTORS REQUEST START ===');

  try {
    const doctors = await User.find({
      role: 'doctor',
      isActive: true
    })
    .select('profile doctorDetails')
    .sort({ 'profile.firstName': 1 })
    .lean();

    console.log('Found doctors:', doctors.length);

    sendSuccess(res, doctors, 'Doctors retrieved successfully');
  } catch (error) {
    console.error('=== GET DOCTORS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching doctors', 500, error.message);
  }
};

// @desc    Assign or reassign patient to doctor
// @route   POST /api/assigner/patients/:patientId/assign
// @access  Private (Assigner only)
export const assignPatientToDoctor = async (req, res) => {
  console.log('=== ASSIGN PATIENT TO DOCTOR REQUEST START ===');
  console.log('Patient ID:', req.params.patientId);
  console.log('Request body:', req.body);

  try {
    const { doctorId, notes = '' } = req.body;
    const patientId = req.params.patientId;

    // Validate patient exists
    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    let updateData = {};

    if (doctorId) {
      // Validate doctor exists
      const doctor = await User.findOne({
        _id: doctorId,
        role: 'doctor',
        isActive: true
      }).select('profile doctorDetails');

      if (!doctor) {
        return sendError(res, 'Doctor not found or inactive', 400);
      }

      // Assign doctor
      updateData = {
        'assignment.doctorId': doctorId,
        'assignment.doctorName': `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}`,
        'assignment.assignedBy': req.user.id,
        'assignment.assignedAt': getISTDate(), // Use IST time
        'assignment.notes': notes,
        workflowStatus: 'Assigned',
        lastActivity: getISTDate() // Use IST time
      };

      console.log('Assigning patient to doctor:', doctor.profile.firstName, doctor.profile.lastName);
    } else {
      // Remove assignment (unassign)
      updateData = {
        $unset: {
          'assignment.doctorId': '',
          'assignment.doctorName': '',
          'assignment.assignedBy': '',
          'assignment.assignedAt': '',
          'assignment.notes': ''
        },
        workflowStatus: 'New',
        lastActivity: getISTDate() // Use IST time
      };

      console.log('Unassigning patient');
    }

    const updatedPatient = await Patient.findOneAndUpdate(
      { patientId },
      updateData,
      { new: true }
    ).populate('assignment.doctorId', 'profile doctorDetails')
    .populate('assignment.assignedBy', 'profile');

    console.log('Assignment operation completed successfully');

    const message = doctorId 
      ? `Patient assigned to ${updatedPatient.assignment.doctorName}` 
      : 'Patient unassigned successfully';

    sendSuccess(res, {
      patient: updatedPatient,
      message
    }, message);

  } catch (error) {
    console.error('=== ASSIGN PATIENT TO DOCTOR ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error assigning patient to doctor', 500, error.message);
  }
};

// Helper function to validate required fields
const validateRequired = (requiredFields, body) => {
  return requiredFields.filter(field => !body[field]);
};