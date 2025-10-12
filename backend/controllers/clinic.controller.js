import Patient, { Visit } from '../modals/Patient.js';
import User from '../modals/User.js';
import Appointment from '../modals/Appointment.js';
import Lab from '../modals/Lab.js';
import Prescription from '../modals/Prescription.js';
import { sendSuccess, sendError } from '../utils/helpers.js';
import mongoose from 'mongoose';

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

// @desc    Get all patients for clinic (OPTIMIZED)
// @route   GET /api/clinic/patients
// @access  Private (Clinic only)
export const getAllPatients = async (req, res) => {
  console.log('=== GET CLINIC PATIENTS REQUEST START (OPTIMIZED) ===');
  console.log('User ID:', req.user?.id);
  console.log('Lab ID:', req.user?.clinicDetails?.labId);
  console.log('Query params:', req.query);

  try {
    const startTime = Date.now();
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const labId = req.user.clinicDetails?.labId;
    if (!labId) {
      return sendError(res, 'Lab ID not found for clinic', 400);
    }

    // 🔧 STEP 1: Build lean query filters with optimized date handling
    const queryFilters = { labId };
    let filterStartDate = null;
    let filterEndDate = null;
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;

    const {
      search = '',
      status = 'all',
      workflowStatus = 'all',
      dateFilter = 'all'
    } = req.query;

    // ✅ OPTIMIZED: Date filtering with IST handling (same as studies function)
    if (dateFilter !== 'all') {
      const preset = dateFilter;
      
      switch (preset) {
        case 'today':
          const currentTimeIST = new Date(Date.now() + IST_OFFSET);
          const todayStartIST = new Date(
            currentTimeIST.getFullYear(),
            currentTimeIST.getMonth(),
            currentTimeIST.getDate(),
            0, 0, 0, 0
          );
          const todayEndIST = new Date(
            currentTimeIST.getFullYear(),
            currentTimeIST.getMonth(),
            currentTimeIST.getDate(),
            23, 59, 59, 999
          );
          filterStartDate = new Date(todayStartIST.getTime() - IST_OFFSET);
          filterEndDate = new Date(todayEndIST.getTime() - IST_OFFSET);
          break;

        case 'yesterday':
          const currentTimeISTYesterday = new Date(Date.now() + IST_OFFSET);
          const yesterdayIST = new Date(currentTimeISTYesterday.getTime() - 86400000);
          const yesterdayStartIST = new Date(
            yesterdayIST.getFullYear(),
            yesterdayIST.getMonth(),
            yesterdayIST.getDate(),
            0, 0, 0, 0
          );
          const yesterdayEndIST = new Date(
            yesterdayIST.getFullYear(),
            yesterdayIST.getMonth(),
            yesterdayIST.getDate(),
            23, 59, 59, 999
          );
          filterStartDate = new Date(yesterdayStartIST.getTime() - IST_OFFSET);
          filterEndDate = new Date(yesterdayEndIST.getTime() - IST_OFFSET);
          break;

        case 'week':
          const currentTimeISTWeek = new Date(Date.now() + IST_OFFSET);
          const dayOfWeek = currentTimeISTWeek.getDay();
          const weekStartIST = new Date(
            currentTimeISTWeek.getFullYear(),
            currentTimeISTWeek.getMonth(),
            currentTimeISTWeek.getDate() - dayOfWeek,
            0, 0, 0, 0
          );
          const weekEndIST = new Date(currentTimeISTWeek.getTime());
          filterStartDate = new Date(weekStartIST.getTime() - IST_OFFSET);
          filterEndDate = new Date(weekEndIST.getTime() - IST_OFFSET);
          break;

        case 'month':
          const currentTimeISTMonth = new Date(Date.now() + IST_OFFSET);
          const monthStartIST = new Date(
            currentTimeISTMonth.getFullYear(),
            currentTimeISTMonth.getMonth(),
            1,
            0, 0, 0, 0
          );
          const monthEndIST = new Date(currentTimeISTMonth.getTime());
          filterStartDate = new Date(monthStartIST.getTime() - IST_OFFSET);
          filterEndDate = new Date(monthEndIST.getTime() - IST_OFFSET);
          break;

        default:
          // Default to today
          const defaultCurrentTimeIST = new Date(Date.now() + IST_OFFSET);
          const defaultTodayStartIST = new Date(
            defaultCurrentTimeIST.getFullYear(),
            defaultCurrentTimeIST.getMonth(),
            defaultCurrentTimeIST.getDate(),
            0, 0, 0, 0
          );
          const defaultTodayEndIST = new Date(
            defaultCurrentTimeIST.getFullYear(),
            defaultCurrentTimeIST.getMonth(),
            defaultCurrentTimeIST.getDate(),
            23, 59, 59, 999
          );
          filterStartDate = new Date(defaultTodayStartIST.getTime() - IST_OFFSET);
          filterEndDate = new Date(defaultTodayEndIST.getTime() - IST_OFFSET);
      }

      // Apply date filter to registrationDate
      if (filterStartDate || filterEndDate) {
        queryFilters.registrationDate = {};
        if (filterStartDate) queryFilters.registrationDate.$gte = filterStartDate;
        if (filterEndDate) queryFilters.registrationDate.$lte = filterEndDate;
      }
    }

    // ✅ OPTIMIZED: Search filter with $or array
    if (search) {
      queryFilters.$or = [
        { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { 'contactInfo.phone': { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    // ✅ OPTIMIZED: Status filtering with pre-defined arrays
    if (status !== 'all') {
      queryFilters.status = status;
    }

    if (workflowStatus !== 'all') {
      const statusMap = {
        'pending': ['New', 'Assigned', 'Revisited'],
        'inprogress': ['Doctor Opened', 'In Progress', 'Reported'],
        'completed': ['Completed']
      };
      
      const statuses = statusMap[workflowStatus];
      if (statuses) {
        queryFilters.workflowStatus = statuses.length === 1 ? statuses[0] : { $in: statuses };
      } else {
        queryFilters.workflowStatus = workflowStatus;
      }
    }

    console.log(`🔍 Query filters:`, JSON.stringify(queryFilters, null, 2));

    // 🔥 STEP 2: Ultra-optimized aggregation pipeline
    const pipeline = [
      // 🔥 CRITICAL: Start with most selective match first
      { $match: queryFilters },
      
      // 🔥 PERFORMANCE: Sort before project to use index efficiently
      { $sort: { registrationDate: -1 } },
      
      // 🔥 CRITICAL: Apply pagination early
      { $skip: skip },
      { $limit: Math.min(limit, 1000) },
      
      // 🔥 PERFORMANCE: Project only essential fields
      {
        $project: {
          _id: 1,
          patientId: 1,
          labId: 1,
          registrationDate: 1,
          status: 1,
          workflowStatus: 1,
          assignedBy: 1,
          photo: 1,
          personalInfo: 1,
          contactInfo: 1,
          emergencyContact: 1,
          medicalHistory: 1,
          'prescriptions.list': 1,
          'prescriptions.stats': 1,
          'appointments.list': 1,
          'appointments.stats': 1,
          assignment: 1,
          lastActivity: 1,
          documents: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    // 🔥 STEP 3: Execute optimized parallel queries
    console.log(`🚀 Executing optimized patient query...`);
    const queryStart = Date.now();

    const [patientsResult, totalCountResult] = await Promise.allSettled([
      Patient.aggregate(pipeline).allowDiskUse(false),
      Patient.countDocuments(queryFilters)
    ]);

    // Handle potential errors
    if (patientsResult.status === 'rejected') {
      throw new Error(`Patients query failed: ${patientsResult.reason.message}`);
    }
    if (totalCountResult.status === 'rejected') {
      console.warn('Count query failed, using patients length:', totalCountResult.reason.message);
    }

    const patients = patientsResult.value;
    const totalPatients = totalCountResult.status === 'fulfilled' ? totalCountResult.value : patients.length;
    
    const queryTime = Date.now() - queryStart;
    console.log(`⚡ Core query completed in ${queryTime}ms - found ${patients.length} patients`);

    // 🔥 STEP 4: Optimized batch lookups
    const lookupMaps = {
      labs: new Map(),
      users: new Map(),
      appointments: new Map(),
      prescriptions: new Map()
    };

    if (patients.length > 0) {
      const lookupStart = Date.now();
      
      // Extract unique IDs with Set for deduplication
      const uniqueIds = {
        labs: [...new Set([labId])],
        users: [...new Set([
          ...patients.map(p => p.assignedBy?.toString()).filter(Boolean),
          ...patients.flatMap(p => p.assignment?.doctorId?.toString()).filter(Boolean)
        ])],
        appointments: [...new Set(patients.flatMap(p => 
          (p.appointments?.list || []).map(apt => apt.appointmentObjectId?.toString()).filter(Boolean)
        ))],
        prescriptions: [...new Set(patients.flatMap(p => 
          (p.prescriptions?.list || []).map(presc => presc.prescriptionId?.toString()).filter(Boolean)
        ))]
      };

      // 🔥 PARALLEL: Optimized batch lookups
      const lookupPromises = [];

      // Lab lookup
      if (uniqueIds.labs.length > 0) {
        lookupPromises.push(
          Lab.find({ labId: { $in: uniqueIds.labs } })
            .select('labId labName contactInfo')
            .lean()
            .then(results => ({ type: 'labs', data: results }))
        );
      }

      // User lookup (for assignedBy and doctors)
      if (uniqueIds.users.length > 0) {
        lookupPromises.push(
          User.find({ _id: { $in: uniqueIds.users.map(id => new mongoose.Types.ObjectId(id)) } })
            .select('profile doctorDetails email role') // ✅ ADD: Include email and role
            .lean()
            .then(results => ({ type: 'users', data: results }))
        );
      }

      // ✅ FIXED: Appointment lookup - doctorId should be populated with User
      if (uniqueIds.appointments.length > 0) {
        lookupPromises.push(
          Appointment.find({ _id: { $in: uniqueIds.appointments.map(id => new mongoose.Types.ObjectId(id)) } })
            .select('appointmentId scheduledDate scheduledTime status vitals chiefComplaints examination doctorId createdAt')
            .populate('doctorId', 'profile doctorDetails email role') // ✅ FIXED: Populate User directly
            .lean()
            .then(results => ({ type: 'appointments', data: results }))
        );
      }

      // Execute all lookups in parallel
      const lookupResults = await Promise.allSettled(lookupPromises);
      
      // Process results and build maps
      lookupResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const { type, data } = result.value;
          data.forEach(item => {
            if (type === 'labs') {
              lookupMaps[type].set(item.labId, item);
            } else {
              lookupMaps[type].set(item._id.toString(), item);
            }
          });
        } else {
          console.warn(`Lookup failed for ${result.reason}`);
        }
      });
      
      const lookupTime = Date.now() - lookupStart;
      console.log(`🔍 Batch lookups completed in ${lookupTime}ms`);
    }

    // 🔥 STEP 5: Optimized formatting with comprehensive appointment data
    const formatStart = Date.now();

    const formattedPatients = patients.map(patient => {
      // Get related data from maps
      const lab = lookupMaps.labs.get(patient.labId);
      const assignedByUser = lookupMaps.users.get(patient.assignedBy?.toString());

      // ✅ FIXED: Process appointments with proper doctor name extraction
      const appointmentsWithDetails = (patient.appointments?.list || []).map(aptRef => {
        const appointment = lookupMaps.appointments.get(aptRef.appointmentObjectId?.toString());
        if (!appointment) return { ...aptRef, appointmentDetails: null, _scheduleTs: 0 };

        // ✅ Extract vitals description
        const vitalsDescription = appointment.vitals ? [
          appointment.vitals.weight?.value ? `Weight: ${appointment.vitals.weight.value}${appointment.vitals.weight.unit || ''}` : null,
          appointment.vitals.bloodPressure?.systolic && appointment.vitals.bloodPressure?.diastolic ? 
            `BP: ${appointment.vitals.bloodPressure.systolic}/${appointment.vitals.bloodPressure.diastolic}` : null,
          appointment.vitals.temperature?.value ? `Temp: ${appointment.vitals.temperature.value}${appointment.vitals.temperature.unit || ''}` : null,
          appointment.vitals.heartRate?.value ? `HR: ${appointment.vitals.heartRate.value}${appointment.vitals.heartRate.unit || ''}` : null
        ].filter(Boolean).join(', ') : '';

        // ✅ Extract chief complaints as description
        const description = appointment.chiefComplaints?.primary ||
                           (Array.isArray(appointment.chiefComplaints?.secondary) ? appointment.chiefComplaints.secondary.join(', ') : null) ||
                           appointment.examination?.provisionalDiagnosis ||
                           aptRef.description || 'No description available';

        // ✅ FIXED: Compute scheduled timestamp for proper sorting
        let scheduledTimestamp = 0;
        try {
          if (appointment.scheduledDate) {
            const d = new Date(appointment.scheduledDate);
            if (appointment.scheduledTime && typeof appointment.scheduledTime === 'string') {
              const [hh, mm] = appointment.scheduledTime.split(':').map(v => parseInt(v, 10));
              if (!Number.isNaN(hh)) {
                d.setHours(hh, Number.isNaN(mm) ? 0 : mm, 0, 0);
              }
            }
            scheduledTimestamp = d.getTime();
          } else if (appointment.createdAt) {
            scheduledTimestamp = new Date(appointment.createdAt).getTime();
          } else if (aptRef.createdAt) {
            scheduledTimestamp = new Date(aptRef.createdAt).getTime();
          }
        } catch (e) {
          console.warn('Error parsing appointment date:', e);
          scheduledTimestamp = 0;
        }

        // ✅ FIXED: Simplified doctor name extraction from User model
        let doctorName = 'Unknown Doctor';
        
        if (appointment.doctorId) {
          // appointment.doctorId is populated User object directly
          const user = appointment.doctorId;
          
          console.log('🔍 Doctor User object:', {
            _id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            doctorDetails: user.doctorDetails
          });
          
          // Extract doctor name from User profile
          if (user.profile?.firstName && user.profile?.lastName) {
            doctorName = `Dr. ${user.profile.firstName} ${user.profile.lastName}`;
          } else if (user.doctorDetails?.firstName && user.doctorDetails?.lastName) {
            doctorName = `Dr. ${user.doctorDetails.firstName} ${user.doctorDetails.lastName}`;
          } else if (user.email) {
            // Fallback to email if no name available
            doctorName = `Dr. ${user.email.split('@')[0]}`;
          }
        }
        
        // ✅ Fallback to aptRef.doctorName if available
        if (doctorName === 'Unknown Doctor' && aptRef.doctorName) {
          doctorName = aptRef.doctorName.startsWith('Dr.') ? aptRef.doctorName : `Dr. ${aptRef.doctorName}`;
        }

        // ✅ Format scheduled date and time
        const scheduledDateTime = appointment.scheduledDate && appointment.scheduledTime ? 
          `${new Date(appointment.scheduledDate).toLocaleDateString('en-IN')} ${appointment.scheduledTime}` : 
          appointment.scheduledDate ? new Date(appointment.scheduledDate).toLocaleDateString('en-IN') : null;

        console.log(`🔍 Appointment ${appointment.appointmentId}: Doctor ID = ${appointment.doctorId?._id}, Doctor Name = ${doctorName}, Scheduled: ${scheduledDateTime}`);

        return {
          ...aptRef,
          _scheduleTs: scheduledTimestamp || 0, // ✅ Used for sorting
          appointmentDetails: {
            scheduledDate: appointment.scheduledDate,
            scheduledTime: appointment.scheduledTime,
            scheduledDateTime,
            status: appointment.status,
            description,
            vitalsDescription,
            vitals: appointment.vitals,
            chiefComplaints: appointment.chiefComplaints,
            examination: appointment.examination,
            doctorName, // ✅ FIXED: Should now show correct doctor name
            doctorId: appointment.doctorId?._id // ✅ ADD: Include doctor ID for reference
          }
        };
      })
      // ✅ FIXED: Sort by scheduled timestamp (descending) - latest appointment first
      .sort((a, b) => (b._scheduleTs || 0) - (a._scheduleTs || 0));

      // Enhanced appointment stats
      const enhancedAppointmentStats = {
        ...patient.appointments?.stats,
        totalAppointments: appointmentsWithDetails.length,
        scheduledAppointments: appointmentsWithDetails.filter(apt => 
          apt.appointmentDetails?.status === 'Scheduled' || apt.status === 'Scheduled'
        ).length,
        completedAppointments: appointmentsWithDetails.filter(apt => 
          apt.appointmentDetails?.status === 'Completed' || apt.status === 'Completed'
        ).length,
        // Latest appointment with full details
        latestAppointment: appointmentsWithDetails.length > 0 ? appointmentsWithDetails[0] : null
      };

      return {
        ...patient,
        // Lab information
        lab,
        labName: lab?.labName || patient.labId,
        
        // Assignment information
        assignedByUser,
        assignedByName: assignedByUser ? 
          `${assignedByUser.profile?.firstName || ''} ${assignedByUser.profile?.lastName || ''}`.trim() : 
          null,

        // ✅ Enhanced appointments with vitals and descriptions
        appointments: {
          list: appointmentsWithDetails,
          stats: enhancedAppointmentStats
        },

        // ✅ Direct access fields for easier frontend consumption
        latestAppointment: {
          date: enhancedAppointmentStats.latestAppointment?.appointmentDetails?.scheduledDate,
          time: enhancedAppointmentStats.latestAppointment?.appointmentDetails?.scheduledTime,
          dateTime: enhancedAppointmentStats.latestAppointment?.appointmentDetails?.scheduledDateTime,
          doctor: enhancedAppointmentStats.latestAppointment?.appointmentDetails?.doctorName,
          status: enhancedAppointmentStats.latestAppointment?.appointmentDetails?.status,
          description: enhancedAppointmentStats.latestAppointment?.appointmentDetails?.description,
          vitalsDescription: enhancedAppointmentStats.latestAppointment?.appointmentDetails?.vitalsDescription
        },

        // Enhanced prescription information
        prescriptions: patient.prescriptions?.list || [],
        prescriptionStats: patient.prescriptions?.stats || {},

        // Formatted dates for display
        registrationDateFormatted: patient.registrationDate ? 
          new Date(patient.registrationDate).toLocaleString('en-GB', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(',', '') : 'N/A',

        lastActivityFormatted: patient.lastActivity ? 
          new Date(patient.lastActivity).toLocaleString('en-GB', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(',', '') : 'N/A'
      };
    });

    const formatTime = Date.now() - formatStart;

    // 🔥 STEP 6: Calculate optimized stats with aggregation
    const statsStart = Date.now();
    
    const statusMatch = { labId };
    if (filterStartDate || filterEndDate) {
      const dateRange = {};
      if (filterStartDate) dateRange.$gte = filterStartDate;
      if (filterEndDate) dateRange.$lte = filterEndDate;
      statusMatch.registrationDate = dateRange;
    }

    // Parallel stats calculation
    const [statusStats, timeStats] = await Promise.allSettled([
      Patient.aggregate([
        { $match: statusMatch },
        { $group: { _id: '$workflowStatus', count: { $sum: 1 } } }
      ]),
      Patient.aggregate([
        { $match: { labId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            today: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$registrationDate', filterStartDate] },
                      { $lte: ['$registrationDate', filterEndDate] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ])
    ]);

    const stats = {
      total: totalPatients,
      today: timeStats.status === 'fulfilled' && timeStats.value[0] ? timeStats.value[0].today : 0,
      pending: 0,
      inprogress: 0,
      completed: 0,
      // Add IST timestamp for frontend reference
      istTimestamp: new Date(Date.now() + IST_OFFSET).toISOString(),
      istTime: new Date(Date.now() + IST_OFFSET).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    if (statusStats.status === 'fulfilled') {
      statusStats.value.forEach(item => {
        const status = item._id;
        const count = item.count;
        if (!status) return;

        if (['New', 'Assigned', 'Revisited'].includes(status)) {
          stats.pending += count;
        } else if (['Doctor Opened', 'In Progress', 'Reported'].includes(status)) {
          stats.inprogress += count;
        } else if (['Completed'].includes(status)) {
          stats.completed += count;
        }
      });
    }

    const statsTime = Date.now() - statsStart;
    const processingTime = Date.now() - startTime;

    console.log(`✅ Formatting completed in ${formatTime}ms`);
    console.log(`📊 Stats calculated in ${statsTime}ms`);
    console.log(`🎯 Total processing time: ${processingTime}ms for ${formattedPatients.length} patients`);

    // Enhanced response format
    const responseData = {
      success: true,
      data: {
        data: formattedPatients,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPatients / limit),
          totalCount: totalPatients,
          limit: limit,
          hasNextPage: (page * limit) < totalPatients,
          hasPrevPage: page > 1,
          recordRange: {
            start: skip + 1,
            end: skip + formattedPatients.length
          }
        },
        stats,
        filters: {
          dateFilter,
          workflowStatus,
          search,
          status
        }
      },
      performance: {
        queryTime: processingTime,
        fromCache: false,
        recordsReturned: formattedPatients.length,
        requestedLimit: limit,
        actualReturned: formattedPatients.length,
        breakdown: {
          coreQuery: queryTime,
          lookups: `${Date.now() - formatStart}ms`,
          formatting: formatTime,
          stats: statsTime
        }
      },
      metadata: {
        dateRange: {
          from: filterStartDate,
          to: filterEndDate
        },
        labId,
        istOffset: IST_OFFSET
      }
    };

    console.log('=== GET CLINIC PATIENTS REQUEST END ===');
    sendSuccess(res, responseData.data, 'Patients retrieved successfully');

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