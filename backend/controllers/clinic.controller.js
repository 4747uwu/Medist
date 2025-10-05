import Patient, { Visit } from '../modals/Patient.js';
import User from '../modals/User.js';
import Appointment from '../modals/Appointment.js';
import Lab from '../modals/Lab.js';
import Prescription from '../modals/Prescription.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

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

// @desc    Get all patients for clinic
// @route   GET /api/clinic/patients
// @access  Private (Clinic only)
export const getAllPatients = async (req, res) => {
  console.log('=== GET CLINIC PATIENTS REQUEST START ===');
  console.log('User ID:', req.user?.id);
  console.log('Lab ID:', req.user?.clinicDetails?.labId);
  console.log('Query params:', req.query);

  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      status = 'all',
      workflowStatus = 'all',
      dateFilter = 'all'
    } = req.query;

    const labId = req.user.clinicDetails?.labId;
    if (!labId) {
      return sendError(res, 'Lab ID not found for clinic', 400);
    }

    console.log('Query parameters:', { page, limit, search, status, workflowStatus, dateFilter });

    // Build query
    const query = { labId };

    // Add search filter
    if (search) {
      query.$or = [
        { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { 'contactInfo.phone': { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } }
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

        // Enhanced appointment processing
        const appointmentsWithDoctorNames = appointments.map(apt => ({
          ...apt,
          doctorName: apt.doctorId ? 
            `Dr. ${apt.doctorId.profile?.firstName || ''} ${apt.doctorId.profile?.lastName || ''}`.trim() : 
            'Unknown Doctor'
        }));

        // Get last appointment details
        const lastAppointment = appointmentsWithDoctorNames.length > 0 ? appointmentsWithDoctorNames[0] : null;
        
        // Get last completed/reported appointment
        const reportedAppointment = appointmentsWithDoctorNames.find(apt => 
          apt.status === 'Completed' || apt.status === 'Reported'
        );

        // Calculate comprehensive appointment stats
        const appointmentStats = {
          totalAppointments: appointments.length,
          completedAppointments: appointments.filter(apt => apt.status === 'Completed').length,
          cancelledAppointments: appointments.filter(apt => apt.status === 'Cancelled').length,
          reportedAppointments: appointments.filter(apt => apt.status === 'Reported').length,
          
          // Last appointment details
          lastAppointmentDate: lastAppointment?.scheduledDate || null,
          lastAppointmentDoctor: lastAppointment?.doctorName || null,
          lastAppointmentStatus: lastAppointment?.status || null,
          
          // Reported appointment details
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
          // Add direct access to appointment data for easier frontend access
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

    console.log('Found patients:', patientsWithVisitsAndLabs.length);
    console.log('Total count:', total);
    console.log('Date filter applied:', dateFilter);
    console.log('Final stats:', stats);

    const response = {
      data: patientsWithVisitsAndLabs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalCount: total,
        limit: parseInt(limit)
      },
      stats,
      filters: {
        dateFilter,
        workflowStatus,
        search,
        status
      }
    };

    console.log('=== GET CLINIC PATIENTS REQUEST END ===');
    sendSuccess(res, response, 'Patients retrieved successfully');

  } catch (error) {
    console.error('=== GET CLINIC PATIENTS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching patients', 500, error.message);
  }
};

// @desc    Get clinic dashboard stats
// @route   GET /api/clinic/dashboard-stats
// @access  Private (Clinic only)
export const getDashboardStats = async (req, res) => {
  try {
    const labId = req.user.clinicDetails?.labId;
    if (!labId) {
      return sendError(res, 'Lab ID not found for clinic', 400);
    }

    // Use consistent IST date ranges
    const todayRange = getISTDateRange('today');
    const yesterdayRange = getISTDateRange('yesterday');
    const weekRange = getISTDateRange('week');
    const monthRange = getISTDateRange('month');

    // Use registrationDate for time-based stats (consistent with other functions)
    const [
      totalPatients,
      todayPatients,
      yesterdayPatients,
      weekPatients,
      monthPatients,
      workflowStats
    ] = await Promise.all([
      Patient.countDocuments({ labId }),
      Patient.countDocuments({ labId, registrationDate: { $gte: todayRange.start, $lte: todayRange.end } }),
      Patient.countDocuments({ labId, registrationDate: { $gte: yesterdayRange.start, $lte: yesterdayRange.end } }),
      Patient.countDocuments({ labId, registrationDate: { $gte: weekRange.start, $lte: weekRange.end } }),
      Patient.countDocuments({ labId, registrationDate: { $gte: monthRange.start, $lte: monthRange.end } }),
      Patient.aggregate([
        { $match: { labId } },
        { $group: { _id: '$workflowStatus', count: { $sum: 1 } } }
      ])
    ]);

    const stats = {
      patients: {
        total: totalPatients,
        today: todayPatients,
        yesterday: yesterdayPatients,
        week: weekPatients,
        month: monthPatients
      },
      workflow: workflowStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      // Add time-based workflow breakdown
      timeBreakdown: {
        today: {
          total: todayPatients,
          new: 0,
          assigned: 0,
          inProgress: 0,
          completed: 0
        },
        week: {
          total: weekPatients,
          new: 0,
          assigned: 0,
          inProgress: 0,
          completed: 0
        },
        month: {
          total: monthPatients,
          new: 0,
          assigned: 0,
          inProgress: 0,
          completed: 0
        }
      },
      // Add IST timestamp for frontend reference
      istTimestamp: getISTDate().toISOString(),
      istTime: getISTDate().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    sendSuccess(res, stats, 'Dashboard stats retrieved successfully');
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    sendError(res, 'Error fetching dashboard stats', 500, error.message);
  }
};

// @desc    Update patient workflow status
// @route   PUT /api/clinic/patients/:patientId/status
// @access  Private (Clinic only)
export const updatePatientStatus = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { workflowStatus } = req.body;

    const validStatuses = ['New', 'Assigned', 'Doctor Opened', 'In Progress', 'Reported', 'Completed', 'Revisited'];
    if (!validStatuses.includes(workflowStatus)) {
      return sendError(res, 'Invalid workflow status', 400);
    }

    const patient = await Patient.findOneAndUpdate(
      { patientId, labId: req.user.clinicDetails?.labId },
      {
        workflowStatus,
        lastActivity: getISTDate() // Use IST time
        // NOTE: Don't update registrationDate here, only lastActivity
      },
      { new: true }
    );

    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    sendSuccess(res, patient, 'Patient status updated successfully');
  } catch (error) {
    console.error('Error updating patient status:', error);
    sendError(res, 'Error updating patient status', 500, error.message);
  }
};