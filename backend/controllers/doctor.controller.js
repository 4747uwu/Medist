import Patient, { Visit } from '../modals/Patient.js';
import User from '../modals/User.js';
import Lab from '../modals/Lab.js';
import Appointment from '../modals/Appointment.js';
import { sendSuccess, sendError } from '../utils/helpers.js';
import mongoose from 'mongoose';

// @desc    Get all patients assigned to doctor (via appointments) - OPTIMIZED
// @route   GET /api/doctor/patients
// @access  Private (Doctor only)
export const getAssignedPatients = async (req, res) => {
  console.log('=== GET DOCTOR ASSIGNED PATIENTS REQUEST START (OPTIMIZED) ===');
  console.log('Doctor ID:', req.user?.id);
  console.log('Query params:', req.query);

  try {
    const startTime = Date.now();
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const doctorId = req.user.id;

    // 🔧 STEP 1: Build lean query filters with optimized date handling
    const appointmentFilters = { doctorId: new mongoose.Types.ObjectId(doctorId) };
    let filterStartDate = null;
    let filterEndDate = null;
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;

    const {
      search = '',
      status = 'all',
      workflowStatus = 'all',
      dateFilter = 'all'
    } = req.query;

    // ✅ OPTIMIZED: Date filtering with IST handling
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
          // Default to last 7 days for doctor view
          filterEndDate = new Date();
          filterStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      // Apply date filter to createdAt (when appointment was created/assigned)
      if (filterStartDate || filterEndDate) {
        appointmentFilters.createdAt = {};
        if (filterStartDate) appointmentFilters.createdAt.$gte = filterStartDate;
        if (filterEndDate) appointmentFilters.createdAt.$lte = filterEndDate;
      }
    }

    // ✅ OPTIMIZED: Appointment status filtering
    if (status !== 'all') {
      appointmentFilters.status = status;
    }

    console.log(`🔍 Appointment filters:`, JSON.stringify(appointmentFilters, null, 2));

    // 🔥 STEP 2: Ultra-optimized aggregation pipeline for appointments
    const appointmentPipeline = [
      // 🔥 CRITICAL: Start with doctor filter
      { $match: appointmentFilters },
      
      // 🔥 PERFORMANCE: Sort by creation date (latest first) - when assigned to doctor
      { $sort: { createdAt: -1 } },
      
      // 🔥 CRITICAL: Apply pagination early
      { $skip: skip },
      { $limit: Math.min(limit, 1000) },
      
      // 🔥 PERFORMANCE: Project only essential appointment fields
      {
        $project: {
          _id: 1,
          appointmentId: 1,
          patientId: 1,
          doctorId: 1,
          labId: 1,
          scheduledDate: 1,
          scheduledTime: 1,
          duration: 1,
          appointmentType: 1,
          mode: 1,
          status: 1,
          chiefComplaints: 1,
          vitals: 1,
          examination: 1,
          investigations: 1,
          treatment: 1,
          followUp: 1,
          prescriptions: 1,
          assignedAt: 1,
          assignedBy: 1,
          assignmentNotes: 1,
          completedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          workflowPhase: 1,
          completionStatus: 1
        }
      }
    ];

    // 🔥 STEP 3: Execute optimized parallel queries
    console.log(`🚀 Executing optimized appointment query...`);
    const queryStart = Date.now();

    const [appointmentsResult, totalAppointmentsResult] = await Promise.allSettled([
      Appointment.aggregate(appointmentPipeline).allowDiskUse(false),
      Appointment.countDocuments(appointmentFilters)
    ]);

    // Handle potential errors
    if (appointmentsResult.status === 'rejected') {
      throw new Error(`Appointments query failed: ${appointmentsResult.reason.message}`);
    }
    if (totalAppointmentsResult.status === 'rejected') {
      console.warn('Count query failed, using appointments length:', totalAppointmentsResult.reason.message);
    }

    const appointments = appointmentsResult.value;
    const totalAppointments = totalAppointmentsResult.status === 'fulfilled' ? totalAppointmentsResult.value : appointments.length;
    
    const queryTime = Date.now() - queryStart;
    console.log(`⚡ Core appointment query completed in ${queryTime}ms - found ${appointments.length} appointments`);

    // 🔥 STEP 4: Optimized batch lookups
    const lookupMaps = {
      patients: new Map(),
      labs: new Map(),
      users: new Map()
    };

    if (appointments.length > 0) {
      const lookupStart = Date.now();
      
      // Extract unique IDs with Set for deduplication
      const uniqueIds = {
        patients: [...new Set(appointments.map(apt => apt.patientId).filter(Boolean))],
        labs: [...new Set(appointments.map(apt => apt.labId).filter(Boolean))],
        users: [...new Set([
          ...appointments.map(apt => apt.assignedBy?.toString()).filter(Boolean),
          doctorId // Include current doctor
        ])]
      };

      // 🔥 PARALLEL: Optimized batch lookups
      const lookupPromises = [];

      // Patient lookup
      if (uniqueIds.patients.length > 0) {
        lookupPromises.push(
          Patient.find({ patientId: { $in: uniqueIds.patients } })
            .select('patientId personalInfo contactInfo emergencyContact medicalHistory registrationDate status workflowStatus assignment')
            .lean()
            .then(results => ({ type: 'patients', data: results }))
        );
      }

      // Lab lookup
      if (uniqueIds.labs.length > 0) {
        lookupPromises.push(
          Lab.find({ labId: { $in: uniqueIds.labs } })
            .select('labId labName contactInfo')
            .lean()
            .then(results => ({ type: 'labs', data: results }))
        );
      }

      // User lookup (for assignedBy and doctor details)
      if (uniqueIds.users.length > 0) {
        lookupPromises.push(
          User.find({ _id: { $in: uniqueIds.users.map(id => new mongoose.Types.ObjectId(id)) } })
            .select('profile doctorDetails email role')
            .lean()
            .then(results => ({ type: 'users', data: results }))
        );
      }

      // Execute all lookups in parallel
      const lookupResults = await Promise.allSettled(lookupPromises);
      
      // Process results and build maps
      lookupResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const { type, data } = result.value;
          data.forEach(item => {
            if (type === 'patients') {
              lookupMaps[type].set(item.patientId, item);
            } else if (type === 'labs') {
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

    const patientsWithAppointments = appointments.map(appointment => {
      // Get related data from maps
      const patient = lookupMaps.patients.get(appointment.patientId);
      const lab = lookupMaps.labs.get(appointment.labId);
      const assignedByUser = lookupMaps.users.get(appointment.assignedBy?.toString());
      const doctorUser = lookupMaps.users.get(doctorId);

      if (!patient) {
        console.warn(`Patient not found for appointment ${appointment.appointmentId}: ${appointment.patientId}`);
        return null; // Skip if patient not found
      }

      // ✅ Extract vitals description from appointment
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
                         'No description available';

      // ✅ Format scheduled date and time
      const scheduledDateTime = appointment.scheduledDate && appointment.scheduledTime ? 
        `${new Date(appointment.scheduledDate).toLocaleDateString('en-IN')} ${appointment.scheduledTime}` : 
        appointment.scheduledDate ? new Date(appointment.scheduledDate).toLocaleDateString('en-IN') : null;

      // ✅ Doctor name from User model
      const doctorName = doctorUser ? 
        (doctorUser.profile?.firstName && doctorUser.profile?.lastName ? 
          `Dr. ${doctorUser.profile.firstName} ${doctorUser.profile.lastName}` :
          `Dr. ${doctorUser.email?.split('@')[0] || 'Doctor'}`) : 
        'Unknown Doctor';

      // ✅ Apply search filter at formatting level if patient data doesn't match
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = (
          patient.personalInfo?.fullName?.toLowerCase().includes(searchLower) ||
          patient.patientId?.toLowerCase().includes(searchLower) ||
          patient.contactInfo?.phone?.toLowerCase().includes(searchLower) ||
          patient.contactInfo?.email?.toLowerCase().includes(searchLower) ||
          description?.toLowerCase().includes(searchLower)
        );
        
        if (!matchesSearch) {
          return null; // Skip this patient if doesn't match search
        }
      }

      // ✅ Apply workflow status filter based on appointment status
      if (workflowStatus !== 'all') {
        let matchesWorkflow = false;
        
        if (workflowStatus === 'pending') {
          matchesWorkflow = ['Scheduled', 'Confirmed'].includes(appointment.status);
        } else if (workflowStatus === 'inprogress') {
          matchesWorkflow = ['In-Progress'].includes(appointment.status);
        } else if (workflowStatus === 'completed') {
          matchesWorkflow = ['Completed'].includes(appointment.status);
        } else {
          // Specific status filter
          matchesWorkflow = appointment.status === workflowStatus;
        }
        
        if (!matchesWorkflow) {
          return null; // Skip if doesn't match workflow filter
        }
      }

      return {
        // ✅ Patient information (base)
        ...patient,
        
        // ✅ Lab information
        lab,
        labName: lab?.labName || appointment.labId,
        
        // ✅ Assignment information
        assignedByUser,
        assignedByName: assignedByUser ? 
          `${assignedByUser.profile?.firstName || ''} ${assignedByUser.profile?.lastName || ''}`.trim() : 
          null,

        // ✅ Current appointment (the one doctor is assigned to)
        currentAppointment: {
          _id: appointment._id,
          appointmentId: appointment.appointmentId,
          scheduledDate: appointment.scheduledDate,
          scheduledTime: appointment.scheduledTime,
          scheduledDateTime,
          duration: appointment.duration,
          appointmentType: appointment.appointmentType,
          mode: appointment.mode,
          status: appointment.status,
          description,
          vitalsDescription,
          vitals: appointment.vitals,
          chiefComplaints: appointment.chiefComplaints,
          examination: appointment.examination,
          investigations: appointment.investigations,
          treatment: appointment.treatment,
          followUp: appointment.followUp,
          prescriptions: appointment.prescriptions || [],
          assignedAt: appointment.assignedAt,
          assignedBy: appointment.assignedBy,
          assignmentNotes: appointment.assignmentNotes,
          completedAt: appointment.completedAt,
          workflowPhase: appointment.workflowPhase,
          completionStatus: appointment.completionStatus,
          doctorName
        },

        // ✅ Direct access fields for easier frontend consumption
        latestAppointment: {
          date: appointment.scheduledDate,
          time: appointment.scheduledTime,
          dateTime: scheduledDateTime,
          doctor: doctorName,
          status: appointment.status,
          description,
          vitalsDescription,
          appointmentId: appointment.appointmentId
        },

        // ✅ Use appointment status as workflow status for doctor view
        workflowStatus: appointment.status,
        lastActivity: appointment.updatedAt || appointment.createdAt,

        // ✅ Appointment stats (single appointment since this is doctor's view)
        appointmentStats: {
          totalAppointments: 1,
          currentStatus: appointment.status,
          assignedAt: appointment.assignedAt,
          createdAt: appointment.createdAt
        },

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

        assignedAtFormatted: appointment.assignedAt ? 
          new Date(appointment.assignedAt).toLocaleString('en-GB', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(',', '') : 'N/A'
      };
    }).filter(Boolean); // Remove null entries from search/workflow filtering

    const formatTime = Date.now() - formatStart;

    // 🔥 STEP 6: Calculate optimized stats based on doctor's appointments
    const statsStart = Date.now();
    
    const statsMatch = { doctorId: new mongoose.Types.ObjectId(doctorId) };
    if (filterStartDate || filterEndDate) {
      const dateRange = {};
      if (filterStartDate) dateRange.$gte = filterStartDate;
      if (filterEndDate) dateRange.$lte = filterEndDate;
      statsMatch.createdAt = dateRange;
    }

    // Parallel stats calculation
    const [statusStats, timeStats] = await Promise.allSettled([
      Appointment.aggregate([
        { $match: statsMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Appointment.aggregate([
        { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            uniquePatients: { $addToSet: '$patientId' }
          }
        }
      ])
    ]);

    const stats = {
      totalAppointments: totalAppointments,
      uniquePatients: timeStats.status === 'fulfilled' && timeStats.value[0] ? timeStats.value[0].uniquePatients.length : 0,
      all: totalAppointments,
      pending: 0,
      inprogress: 0,
      completed: 0,
      scheduled: 0,
      confirmed: 0,
      // Add IST timestamp for frontend reference
      istTimestamp: new Date(Date.now() + IST_OFFSET).toISOString(),
      istTime: new Date(Date.now() + IST_OFFSET).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    if (statusStats.status === 'fulfilled') {
      statusStats.value.forEach(item => {
        const status = item._id;
        const count = item.count;
        if (!status) return;

        // Group statuses
        if (['Scheduled', 'Confirmed'].includes(status)) {
          stats.pending += count;
          if (status === 'Scheduled') stats.scheduled = count;
          if (status === 'Confirmed') stats.confirmed = count;
        } else if (['In-Progress'].includes(status)) {
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
    console.log(`🎯 Total processing time: ${processingTime}ms for ${patientsWithAppointments.length} patients`);

    // Enhanced response format
    const responseData = {
      data: patientsWithAppointments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalAppointments / limit),
        totalCount: totalAppointments,
        limit: limit,
        hasNextPage: (page * limit) < totalAppointments,
        hasPrevPage: page > 1,
        recordRange: {
          start: skip + 1,
          end: skip + patientsWithAppointments.length
        }
      },
      stats,
      filters: {
        dateFilter,
        workflowStatus,
        search,
        status
      },
      performance: {
        queryTime: processingTime,
        fromCache: false,
        recordsReturned: patientsWithAppointments.length,
        requestedLimit: limit,
        actualReturned: patientsWithAppointments.length,
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
        doctorId,
        istOffset: IST_OFFSET
      }
    };

    console.log('=== GET DOCTOR ASSIGNED PATIENTS REQUEST END ===');
    sendSuccess(res, responseData, 'Assigned patients retrieved successfully');

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

// @desc    Get comprehensive appointment details for doctor
// @route   GET /api/doctor/appointments/:appointmentId/details
// @access  Private (Doctor only)
export const getAppointmentDetails = async (req, res) => {
  console.log('=== GET APPOINTMENT DETAILS REQUEST START ===');
  console.log('Doctor ID:', req.user?.id);
  console.log('Appointment ID:', req.params.appointmentId);

  try {
    const startTime = Date.now();
    const { appointmentId } = req.params;
    const doctorId = req.user.id;

    // 🔥 STEP 1: Fetch appointment with essential fields
    const appointment = await Appointment.findOne({ 
      appointmentId,
      doctorId // Ensure this appointment is assigned to the requesting doctor
    })
    .select('appointmentId patientId doctorId labId scheduledDate scheduledTime duration appointmentType mode status chiefComplaints vitals examination investigations treatment followUp prescriptions documents assignedAt assignedBy completedAt createdAt updatedAt workflowPhase completionStatus')
    .lean();

    if (!appointment) {
      return sendError(res, 'Appointment not found or not assigned to you', 404);
    }

    console.log(`⚡ Appointment found: ${appointment.appointmentId}`);

    // 🔥 STEP 2: Optimized batch lookups
    const lookupMaps = {
      patient: null,
      lab: null,
      prescriptions: new Map(),
      previousAppointments: []
    };

    const lookupStart = Date.now();

    // Parallel lookups
    const lookupPromises = [];

    // Patient lookup with full details
    lookupPromises.push(
      Patient.findOne({ patientId: appointment.patientId })
        .select('patientId personalInfo contactInfo emergencyContact medicalHistory registrationDate documents')
        .lean()
        .then(result => ({ type: 'patient', data: result }))
    );

    // Lab lookup
    if (appointment.labId) {
      lookupPromises.push(
        Lab.findOne({ labId: appointment.labId })
          .select('labId labName contactInfo')
          .lean()
          .then(result => ({ type: 'lab', data: result }))
      );
    }

    // Prescriptions lookup (if any)
    if (appointment.prescriptions && appointment.prescriptions.length > 0) {
      const prescriptionIds = appointment.prescriptions
        .map(p => p.prescriptionId)
        .filter(Boolean);

      if (prescriptionIds.length > 0) {
        lookupPromises.push(
          mongoose.model('Prescription').find({ 
            _id: { $in: prescriptionIds } 
          })
          .populate('medicines.medicineId', 'name companyName strength')
          .populate('tests.testId', 'testName testCode')
          .lean()
          .then(results => ({ type: 'prescriptions', data: results }))
        );
      }
    }

    // Previous appointments for history (limit to last 10)
    lookupPromises.push(
      Appointment.find({ 
        patientId: appointment.patientId,
        appointmentId: { $ne: appointmentId }, // Exclude current
        status: 'Completed'
      })
      .select('appointmentId scheduledDate scheduledTime chiefComplaints examination prescriptions status')
      .sort({ scheduledDate: -1 })
      .limit(10)
      .lean()
      .then(results => ({ type: 'previousAppointments', data: results }))
    );

    // Execute all lookups in parallel
    const lookupResults = await Promise.allSettled(lookupPromises);

    // Process results and build maps
    lookupResults.forEach(result => {
      if (result.status === 'fulfilled') {
        const { type, data } = result.value;
        
        if (type === 'patient') {
          lookupMaps.patient = data;
        } else if (type === 'lab') {
          lookupMaps.lab = data;
        } else if (type === 'prescriptions') {
          data.forEach(item => {
            lookupMaps.prescriptions.set(item._id.toString(), item);
          });
        } else if (type === 'previousAppointments') {
          lookupMaps.previousAppointments = data;
        }
      }
    });

    const lookupTime = Date.now() - lookupStart;
    console.log(`🔍 Batch lookups completed in ${lookupTime}ms`);

    // 🔥 STEP 3: Format comprehensive response
    const formatStart = Date.now();

    const patient = lookupMaps.patient;
    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    // Format patient info
    const patientInfo = {
      patientId: patient.patientId,
      personalInfo: patient.personalInfo,
      contactInfo: patient.contactInfo,
      emergencyContact: patient.emergencyContact,
      age: patient.personalInfo?.age,
      formattedDOB: patient.personalInfo?.dateOfBirth ? 
        new Date(patient.personalInfo.dateOfBirth).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) : null
    };

    // Format vitals
    const vitals = appointment.vitals ? {
      weight: appointment.vitals.weight?.value ? 
        `${appointment.vitals.weight.value} ${appointment.vitals.weight.unit || 'kg'}` : 'Not recorded',
      height: appointment.vitals.height?.value ? 
        `${appointment.vitals.height.value} ${appointment.vitals.height.unit || 'cm'}` : 'Not recorded',
      bmi: appointment.vitals.weight?.value && appointment.vitals.height?.value ? 
        (appointment.vitals.weight.value / Math.pow(appointment.vitals.height.value / 100, 2)).toFixed(1) : 'Not recorded',
      temperature: appointment.vitals.temperature?.value ? 
        `${appointment.vitals.temperature.value}${appointment.vitals.temperature.unit || '°F'}` : 'Not recorded',
      bloodPressure: appointment.vitals.bloodPressure?.systolic && appointment.vitals.bloodPressure?.diastolic ? 
        `${appointment.vitals.bloodPressure.systolic}/${appointment.vitals.bloodPressure.diastolic} mmHg` : 'Not recorded',
      heartRate: appointment.vitals.heartRate?.value ? 
        `${appointment.vitals.heartRate.value} ${appointment.vitals.heartRate.unit || 'bpm'}` : 'Not recorded',
      oxygenSaturation: appointment.vitals.oxygenSaturation?.value ? 
        `${appointment.vitals.oxygenSaturation.value}${appointment.vitals.oxygenSaturation.unit || '%'}` : 'Not recorded',
      bloodSugar: appointment.vitals.bloodSugar?.value ? 
        `${appointment.vitals.bloodSugar.value} ${appointment.vitals.bloodSugar.unit || 'mg/dL'} (${appointment.vitals.bloodSugar.type || 'Random'})` : 'Not recorded'
    } : null;

    // Format clinical data
    const clinical = {
      chiefComplaints: appointment.chiefComplaints,
      examination: appointment.examination,
      hasFindings: !!(appointment.chiefComplaints?.primary || appointment.examination?.physicalFindings || appointment.examination?.provisionalDiagnosis)
    };

    // Format medical history
    const history = {
      chronicConditions: patient.medicalHistory?.chronicConditions || [],
      allergies: patient.medicalHistory?.allergies || [],
      pastSurgeries: patient.medicalHistory?.pastSurgeries || [],
      familyHistory: patient.medicalHistory?.familyHistory || [],
      previousAppointments: lookupMaps.previousAppointments
    };

    // Format prescriptions with populated data
    const prescriptions = {
      count: appointment.prescriptions?.length || 0,
      list: appointment.prescriptions?.map(p => {
        const prescriptionData = lookupMaps.prescriptions.get(p.prescriptionId?.toString());
        return {
          ...p,
          prescriptionId: prescriptionData
        };
      }) || [],
      totalMedicines: appointment.prescriptions?.reduce((sum, p) => {
        const prescriptionData = lookupMaps.prescriptions.get(p.prescriptionId?.toString());
        return sum + (prescriptionData?.medicines?.length || 0);
      }, 0) || 0,
      totalTests: appointment.prescriptions?.reduce((sum, p) => {
        const prescriptionData = lookupMaps.prescriptions.get(p.prescriptionId?.toString());
        return sum + (prescriptionData?.tests?.length || 0);
      }, 0) || 0
    };

    // Format appointment info
    const appointmentInfo = {
      appointmentId: appointment.appointmentId,
      scheduledDate: appointment.scheduledDate,
      scheduledTime: appointment.scheduledTime,
      formattedDateTime: appointment.scheduledDate && appointment.scheduledTime ? 
        `${new Date(appointment.scheduledDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })} at ${appointment.scheduledTime}` : null,
      duration: appointment.duration,
      appointmentType: appointment.appointmentType,
      mode: appointment.mode,
      status: appointment.status,
      workflowPhase: appointment.workflowPhase,
      assignedAt: appointment.assignedAt,
      completedAt: appointment.completedAt,
      documents: appointment.documents || []
    };

    const formatTime = Date.now() - formatStart;
    const processingTime = Date.now() - startTime;

    console.log(`✅ Formatting completed in ${formatTime}ms`);
    console.log(`🎯 Total processing time: ${processingTime}ms`);

    // Comprehensive response
    const responseData = {
      appointment: appointmentInfo,
      patient: patientInfo,
      vitals,
      clinical,
      history,
      prescriptions,
      lab: lookupMaps.lab,
      performance: {
        queryTime: processingTime,
        breakdown: {
          lookup: lookupTime,
          formatting: formatTime
        }
      }
    };

    console.log('=== GET APPOINTMENT DETAILS REQUEST END ===');
    sendSuccess(res, responseData, 'Appointment details retrieved successfully');

  } catch (error) {
    console.error('=== GET APPOINTMENT DETAILS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching appointment details', 500, error.message);
  }
};