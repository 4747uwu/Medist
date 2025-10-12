import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../modals/User.js';
import Patient from '../modals/Patient.js';
import Lab from '../modals/Lab.js';
import Appointment from '../modals/Appointment.js';
import Prescription from '../modals/Prescription.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

// 🔥 OPTIMIZATION: IST Helper Functions (same as getAllStudiesForAdmin)
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

const getOptimizedISTDateRange = (dateType) => {
  const currentTimeIST = new Date(Date.now() + IST_OFFSET);
  
  let startIST, endIST;
  
  switch (dateType) {
    case 'today':
      startIST = new Date(
        currentTimeIST.getFullYear(),
        currentTimeIST.getMonth(),
        currentTimeIST.getDate(),
        0, 0, 0, 0
      );
      endIST = new Date(
        currentTimeIST.getFullYear(),
        currentTimeIST.getMonth(),
        currentTimeIST.getDate(),
        23, 59, 59, 999
      );
      break;
      
    case 'yesterday':
      const yesterdayIST = new Date(currentTimeIST.getTime() - 86400000);
      startIST = new Date(
        yesterdayIST.getFullYear(),
        yesterdayIST.getMonth(),
        yesterdayIST.getDate(),
        0, 0, 0, 0
      );
      endIST = new Date(
        yesterdayIST.getFullYear(),
        yesterdayIST.getMonth(),
        yesterdayIST.getDate(),
        23, 59, 59, 999
      );
      break;
      
    case 'week':
      const dayOfWeek = currentTimeIST.getDay();
      startIST = new Date(
        currentTimeIST.getFullYear(),
        currentTimeIST.getMonth(),
        currentTimeIST.getDate() - dayOfWeek,
        0, 0, 0, 0
      );
      endIST = new Date(currentTimeIST.getTime());
      break;
      
    case 'month':
      startIST = new Date(
        currentTimeIST.getFullYear(),
        currentTimeIST.getMonth(),
        1,
        0, 0, 0, 0
      );
      endIST = new Date(currentTimeIST.getTime());
      break;
      
    default:
      // Default to today
      startIST = new Date(
        currentTimeIST.getFullYear(),
        currentTimeIST.getMonth(),
        currentTimeIST.getDate(),
        0, 0, 0, 0
      );
      endIST = new Date(
        currentTimeIST.getFullYear(),
        currentTimeIST.getMonth(),
        currentTimeIST.getDate(),
        23, 59, 59, 999
      );
  }
  
  // Convert IST back to UTC for MongoDB query
  return {
    start: new Date(startIST.getTime() - IST_OFFSET),
    end: new Date(endIST.getTime() - IST_OFFSET)
  };
};

// Create a Jr Doctor under the clinic (clinic must be authenticated)
export const createJrDoctor = async (req, res) => {
  console.log('=== CREATE JR DOCTOR REQUEST START ===');
  console.log('Creator User ID:', req.user?.id);
  console.log('Creator Role:', req.user?.role);
  
  try {
    // Allow both clinic and jrdoctor to create jr doctors
    if (!req.user || !['clinic', 'jrdoctor'].includes(req.user.role)) {
      return sendError(res, 'Unauthorized - Only clinic or jr doctor can create jr doctors', 403);
    }

    const labId = req.user.clinicDetails?.labId;
    if (!labId) {
      return sendError(res, 'Lab ID not found on creator user', 400);
    }

    const { 
      email, 
      firstName, 
      lastName, 
      phone, 
      specialization, 
      qualification,
      password // ✅ NEW: Accept password from clinic
    } = req.body;
    
    // Validate required fields
    if (!email || !firstName || !lastName) {
      return sendError(res, 'Missing required fields: email, firstName, lastName', 400);
    }

    // ✅ NEW: Validate password if provided, otherwise generate temp password
    let finalPassword;
    if (password && password.trim()) {
      if (password.length < 6) {
        return sendError(res, 'Password must be at least 6 characters long', 400);
      }
      finalPassword = password.trim();
      console.log('Using clinic-provided password');
    } else {
      // Generate secure temporary password as fallback
      finalPassword = crypto.randomBytes(6).toString('hex'); // 12 chars
      console.log('Generated temporary password');
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existingUser) {
      return sendError(res, 'User with this email already exists', 400);
    }

    console.log('Creating jr doctor with labId:', labId);

    // Create jr doctor user
    const jrUser = new User({
      email: email.toLowerCase(),
      password: finalPassword, // ✅ NEW: Use clinic-provided or generated password
      role: 'jrdoctor',
      profile: {
        firstName,
        lastName,
        phone: phone || ''
      },
      clinicDetails: {
        clinicName: req.user.clinicDetails?.clinicName || '',
        labId, // Link jrdoctor to clinic's lab
        parentClinicUserId: req.user.id // Track who created this jr doctor
      },
      doctorDetails: {
        specialization: specialization || 'General Medicine',
        qualification: qualification || 'MBBS',
        experience: 0,
        registrationNumber: `JR${Date.now()}`, // Auto-generate
        isVerified: true, // Auto-verify jr doctors
        registrationDate: new Date()
      },
      isActive: true,
      registrationComplete: password && password.trim() ? true : false // ✅ If clinic provided password, mark as complete
    });

    await jrUser.save();

    console.log('Jr doctor created successfully:', jrUser.email);

    // Return info without password hash
    const response = {
      _id: jrUser._id,
      email: jrUser.email,
      role: jrUser.role,
      profile: jrUser.profile,
      clinicDetails: jrUser.clinicDetails,
      doctorDetails: jrUser.doctorDetails,
      isActive: jrUser.isActive,
      // ✅ NEW: Only return tempPassword if we generated one, not if clinic provided it
      ...(password && password.trim() ? {} : { tempPassword: finalPassword })
    };

    console.log('=== CREATE JR DOCTOR REQUEST END ===');
    return sendSuccess(res, response, 'Jr doctor created successfully', 201);
    
  } catch (error) {
    console.error('=== CREATE JR DOCTOR ERROR ===');
    console.error('Error:', error);
    return sendError(res, 'Error creating jr doctor', 500, error.message);
  }
};

// List jr doctors for the clinic
export const listJrDoctors = async (req, res) => {
  console.log('=== LIST JR DOCTORS REQUEST START ===');
  
  try {
    if (!req.user || !['clinic', 'jrdoctor'].includes(req.user.role)) {
      return sendError(res, 'Unauthorized', 403);
    }

    const labId = req.user.clinicDetails?.labId;
    if (!labId) {
      return sendError(res, 'Lab ID not found on user', 400);
    }

    const { page = 1, limit = 20, search = '', isActive } = req.query;

    // 🔥 OPTIMIZATION: Build lean query filters
    const queryFilters = {
      role: 'jrdoctor',
      'clinicDetails.labId': labId
    };

    // Add search filter
    if (search && search.trim()) {
      queryFilters.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { 'profile.phone': { $regex: search, $options: 'i' } }
      ];
    }

    // Add active status filter
    if (isActive !== undefined) {
      queryFilters.isActive = isActive === 'true';
    }

    console.log('Query filters:', JSON.stringify(queryFilters, null, 2));

    // 🔥 OPTIMIZATION: Use aggregation pipeline for better performance
    const pipeline = [
      { $match: queryFilters },
      { $sort: { createdAt: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
      {
        $project: {
          email: 1,
          role: 1,
          profile: 1,
          clinicDetails: 1,
          doctorDetails: 1,
          isActive: 1,
          lastLogin: 1,
          createdAt: 1,
          loginCount: 1
        }
      }
    ];

    // 🔥 OPTIMIZATION: Execute parallel queries
    const [jrDoctorsResult, totalCountResult] = await Promise.allSettled([
      User.aggregate(pipeline),
      User.countDocuments(queryFilters)
    ]);

    if (jrDoctorsResult.status === 'rejected') {
      throw new Error('Failed to fetch jr doctors');
    }

    const jrDoctors = jrDoctorsResult.value;
    const total = totalCountResult.status === 'fulfilled' ? totalCountResult.value : jrDoctors.length;

    // 🔥 OPTIMIZATION: Get additional stats in parallel
    const [activityStats] = await Promise.allSettled([
      User.aggregate([
        { $match: { role: 'jrdoctor', 'clinicDetails.labId': labId } },
        {
          $group: {
            _id: null,
            totalJrDoctors: { $sum: 1 },
            activeJrDoctors: { $sum: { $cond: ['$isActive', 1, 0] } },
            loggedInToday: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$lastLogin', null] },
                      { $gte: ['$lastLogin', new Date(Date.now() - 86400000)] }
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

    const stats = activityStats.status === 'fulfilled' && activityStats.value.length > 0 
      ? activityStats.value[0] 
      : { totalJrDoctors: total, activeJrDoctors: 0, loggedInToday: 0 };

    const response = {
      data: jrDoctors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalCount: total,
        limit: parseInt(limit)
      },
      stats
    };

    console.log('Jr doctors retrieved:', jrDoctors.length, 'Total:', total);
    console.log('=== LIST JR DOCTORS REQUEST END ===');

    return sendSuccess(res, response, 'Jr doctors fetched successfully');
    
  } catch (error) {
    console.error('=== LIST JR DOCTORS ERROR ===');
    console.error('Error:', error);
    return sendError(res, 'Error fetching jr doctors', 500, error.message);
  }
};

// 🔥 NEW: Ultra-optimized Get All Patients for Jr Doctor (same as clinic but optimized)
export const getAllPatientsForJrDoctor = async (req, res) => {
  console.log('=== GET JR DOCTOR PATIENTS REQUEST START ===');
  console.log('Jr Doctor ID:', req.user?.id);
  console.log('Lab ID:', req.user?.clinicDetails?.labId);
  
  try {
    const startTime = Date.now();
    
    // 🔥 AUTHORIZATION: Ensure jr doctor role
    if (!req.user || req.user.role !== 'jrdoctor') {
      return sendError(res, 'Unauthorized - Jr Doctor access only', 403);
    }

    const labId = req.user.clinicDetails?.labId;
    if (!labId) {
      return sendError(res, 'Lab ID not found for jr doctor', 400);
    }

    // 🔥 STEP 1: Build optimized query filters
    const {
      page = 1,
      limit = 50,
      search = '',
      status = 'all',
      workflowStatus = 'all',
      dateFilter = 'today'
    } = req.query;

    const queryFilters = { labId };
    let filterStartDate = null;
    let filterEndDate = null;

    console.log('Query parameters:', { page, limit, search, status, workflowStatus, dateFilter });

    // 🔥 OPTIMIZATION: Date filtering with IST handling
    if (dateFilter !== 'all') {
      const dateRange = getOptimizedISTDateRange(dateFilter);
      if (dateRange.start && dateRange.end) {
        queryFilters.registrationDate = { $gte: dateRange.start, $lte: dateRange.end };
        filterStartDate = dateRange.start;
        filterEndDate = dateRange.end;
        
        console.log(`IST ${dateFilter} range:`, {
          startUTC: dateRange.start.toISOString(),
          endUTC: dateRange.end.toISOString()
        });
      }
    }

    // 🔥 OPTIMIZATION: Search filter with indexed fields
    if (search && search.trim()) {
      queryFilters.$or = [
        { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { 'contactInfo.phone': { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    // 🔥 OPTIMIZATION: Status filters with pre-mapped values
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

    console.log('Final MongoDB query:', JSON.stringify(queryFilters, null, 2));

    // 🔥 STEP 2: Execute optimized parallel queries
    const queryStart = Date.now();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [patientsResult, totalCountResult] = await Promise.allSettled([
      Patient.find(queryFilters)
        .populate('assignedBy', 'profile.firstName profile.lastName')
        .sort({ registrationDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Patient.countDocuments(queryFilters)
    ]);

    if (patientsResult.status === 'rejected') {
      throw new Error(`Patients query failed: ${patientsResult.reason.message}`);
    }

    const patients = patientsResult.value;
    const total = totalCountResult.status === 'fulfilled' ? totalCountResult.value : patients.length;
    
    const queryTime = Date.now() - queryStart;
    console.log(`⚡ Core query completed in ${queryTime}ms - found ${patients.length} patients`);

    // 🔥 STEP 3: Optimized batch lookups
    const lookupMaps = {
      labs: new Map(),
      appointments: new Map(),
      prescriptions: new Map(),
      visits: new Map()
    };

    if (patients.length > 0) {
      const lookupStart = Date.now();
      
      // Extract unique IDs
      const uniqueIds = {
        labIds: [...new Set(patients.map(p => p.labId).filter(Boolean))],
        patientIds: [...new Set(patients.map(p => p.patientId).filter(Boolean))],
        visitIds: [...new Set(patients.map(p => p.currentVisitId).filter(Boolean))]
      };

      // 🔥 PARALLEL: Batch lookups
      const lookupPromises = [];

      // Lab lookup
      if (uniqueIds.labIds.length > 0) {
        lookupPromises.push(
          Lab.find({ labId: { $in: uniqueIds.labIds } })
            .select('labId labName')
            .lean()
            .then(results => ({ type: 'labs', data: results }))
        );
      }

      // Appointments lookup with doctor details
      if (uniqueIds.patientIds.length > 0) {
        lookupPromises.push(
          Appointment.find({ patientId: { $in: uniqueIds.patientIds } })
            .populate('doctorId', 'profile doctorDetails')
            .sort({ scheduledDate: -1 })
            .lean()
            .then(results => ({ type: 'appointments', data: results }))
        );

        // Prescriptions lookup
        lookupPromises.push(
          Prescription.find({ patientId: { $in: uniqueIds.patientIds } })
            .sort({ createdAt: -1 })
            .lean()
            .then(results => ({ type: 'prescriptions', data: results }))
        );
      }

      // Execute all lookups in parallel
      const lookupResults = await Promise.allSettled(lookupPromises);
      
      // Process results and build maps
      lookupResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const { type, data } = result.value;
          
          if (type === 'labs') {
            data.forEach(lab => {
              lookupMaps.labs.set(lab.labId, lab);
            });
          } else if (type === 'appointments') {
            data.forEach(appointment => {
              if (!lookupMaps.appointments.has(appointment.patientId)) {
                lookupMaps.appointments.set(appointment.patientId, []);
              }
              lookupMaps.appointments.get(appointment.patientId).push(appointment);
            });
          } else if (type === 'prescriptions') {
            data.forEach(prescription => {
              if (!lookupMaps.prescriptions.has(prescription.patientId)) {
                lookupMaps.prescriptions.set(prescription.patientId, []);
              }
              lookupMaps.prescriptions.get(prescription.patientId).push(prescription);
            });
          }
        }
      });
      
      const lookupTime = Date.now() - lookupStart;
      console.log(`🔍 Batch lookups completed in ${lookupTime}ms`);
    }

    // 🔥 STEP 4: Optimized data formatting
    const formatStart = Date.now();
    
    const enhancedPatients = patients.map(patient => {
      const lab = lookupMaps.labs.get(patient.labId);
      const appointments = lookupMaps.appointments.get(patient.patientId) || [];
      const prescriptions = lookupMaps.prescriptions.get(patient.patientId) || [];

      // Process appointments with doctor names
      const appointmentsWithDoctorNames = appointments.map(apt => ({
        ...apt,
        doctorName: apt.doctorId ? 
          `Dr. ${apt.doctorId.profile?.firstName || ''} ${apt.doctorId.profile?.lastName || ''}`.trim() : 
          'Unknown Doctor'
      }));

      // Calculate appointment stats
      const lastAppointment = appointmentsWithDoctorNames[0];
      const reportedAppointment = appointmentsWithDoctorNames.find(apt => 
        apt.status === 'Completed' || apt.status === 'Reported'
      );

      const appointmentStats = {
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(apt => apt.status === 'Completed').length,
        lastAppointmentDate: lastAppointment?.scheduledDate || null,
        lastAppointmentDoctor: lastAppointment?.doctorName || null,
        reportedDate: reportedAppointment?.scheduledDate || reportedAppointment?.completedAt || null,
        reportedBy: reportedAppointment?.doctorName || null
      };

      // Process prescriptions
      const processedPrescriptions = prescriptions.map(p => ({
        _id: p._id,
        prescriptionId: p.prescriptionId || p._id,
        prescriptionCode: p.prescriptionCode,
        doctorId: p.doctorId,
        createdAt: p.createdAt,
        status: p.status,
        medicines: p.medicines || [],
        tests: p.tests || []
      }));

      return {
        ...patient,
        lab,
        labName: lab?.labName || patient.labId,
        appointments: {
          list: appointmentsWithDoctorNames,
          stats: appointmentStats
        },
        prescriptions: processedPrescriptions,
        lastAppointment: {
          date: appointmentStats.lastAppointmentDate,
          doctor: appointmentStats.lastAppointmentDoctor
        },
        reportedDetails: {
          date: appointmentStats.reportedDate,
          by: appointmentStats.reportedBy
        }
      };
    });

    const formatTime = Date.now() - formatStart;

    // 🔥 STEP 5: Calculate optimized stats using parallel aggregation
    const statsStart = Date.now();
    
    const statusMatch = { ...queryFilters };
    delete statusMatch.workflowStatus;
    delete statusMatch.registrationDate;

    const [statusCountsResult, timeCountsResult] = await Promise.allSettled([
      Patient.aggregate([
        { $match: statusMatch },
        { $group: { _id: '$workflowStatus', count: { $sum: 1 } } }
      ]),
      Promise.all([
        Patient.countDocuments(statusMatch),
        Patient.countDocuments({ 
          ...statusMatch, 
          registrationDate: getOptimizedISTDateRange('today') 
        }),
        Patient.countDocuments({ 
          ...statusMatch, 
          registrationDate: getOptimizedISTDateRange('yesterday') 
        }),
        Patient.countDocuments({ 
          ...statusMatch, 
          registrationDate: getOptimizedISTDateRange('week') 
        }),
        Patient.countDocuments({ 
          ...statusMatch, 
          registrationDate: getOptimizedISTDateRange('month') 
        })
      ])
    ]);

    const statusCounts = statusCountsResult.status === 'fulfilled' ? statusCountsResult.value : [];
    const [countAllTime, countToday, countYesterday, countWeek, countMonth] = 
      timeCountsResult.status === 'fulfilled' ? timeCountsResult.value : [0, 0, 0, 0, 0];

    // Build stats object
    const stats = {
      total,
      all: countAllTime,
      today: countToday,
      yesterday: countYesterday,
      week: countWeek,
      month: countMonth,
      pending: 0,
      inprogress: 0,
      completed: 0,
      istTimestamp: new Date(Date.now() + IST_OFFSET).toISOString()
    };

    // Process status counts
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

    const statsTime = Date.now() - statsStart;
    const totalTime = Date.now() - startTime;

    console.log(`✅ Stats calculation completed in ${statsTime}ms`);
    console.log(`🎯 Total processing time: ${totalTime}ms for ${enhancedPatients.length} patients`);

    // 🔥 Enhanced response with performance metrics
    const response = {
      data: enhancedPatients,
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
      },
      performance: {
        queryTime: totalTime,
        breakdown: {
          coreQuery: queryTime,
          lookups: patients.length > 0 ? `${Date.now() - formatStart}ms` : 0,
          formatting: formatTime,
          stats: statsTime
        },
        recordsReturned: enhancedPatients.length
      },
      metadata: {
        dateRange: {
          from: filterStartDate,
          to: filterEndDate
        },
        jrDoctorInfo: {
          id: req.user.id,
          name: `${req.user.profile?.firstName} ${req.user.profile?.lastName}`,
          labId: labId
        }
      }
    };

    console.log('=== GET JR DOCTOR PATIENTS REQUEST END ===');
    sendSuccess(res, response, 'Patients retrieved successfully for jr doctor');

  } catch (error) {
    console.error('=== GET JR DOCTOR PATIENTS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching patients for jr doctor', 500, error.message);
  }
};

// Update jr doctor status
export const updateJrDoctorStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'clinic') {
      return sendError(res, 'Unauthorized - Only clinic can update jr doctor status', 403);
    }

    const { jrDoctorId } = req.params;
    const { isActive } = req.body;

    const jrDoctor = await User.findOneAndUpdate(
      { 
        _id: jrDoctorId, 
        role: 'jrdoctor',
        'clinicDetails.labId': req.user.clinicDetails?.labId 
      },
      { isActive },
      { new: true }
    ).select('-password');

    if (!jrDoctor) {
      return sendError(res, 'Jr doctor not found', 404);
    }

    sendSuccess(res, jrDoctor, 'Jr doctor status updated successfully');
  } catch (error) {
    console.error('Error updating jr doctor status:', error);
    sendError(res, 'Error updating jr doctor status', 500, error.message);
  }
};

// Delete jr doctor
export const deleteJrDoctor = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'clinic') {
      return sendError(res, 'Unauthorized - Only clinic can delete jr doctors', 403);
    }

    const { jrDoctorId } = req.params;

    const jrDoctor = await User.findOneAndDelete({
      _id: jrDoctorId,
      role: 'jrdoctor',
      'clinicDetails.labId': req.user.clinicDetails?.labId
    });

    if (!jrDoctor) {
      return sendError(res, 'Jr doctor not found', 404);
    }

    sendSuccess(res, null, 'Jr doctor deleted successfully');
  } catch (error) {
    console.error('Error deleting jr doctor:', error);
    sendError(res, 'Error deleting jr doctor', 500, error.message);
  }
};

// Get jr doctor dashboard stats
export const getJrDoctorDashboardStats = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'jrdoctor') {
      return sendError(res, 'Unauthorized - Jr Doctor access only', 403);
    }

    const labId = req.user.clinicDetails?.labId;
    if (!labId) {
      return sendError(res, 'Lab ID not found for jr doctor', 400);
    }

    // Use optimized date ranges
    const todayRange = getOptimizedISTDateRange('today');
    const yesterdayRange = getOptimizedISTDateRange('yesterday');
    const weekRange = getOptimizedISTDateRange('week');
    const monthRange = getOptimizedISTDateRange('month');

    // Parallel execution of all stats queries
    const [
      totalPatients,
      todayPatients,
      yesterdayPatients,
      weekPatients,
      monthPatients,
      workflowStats,
      appointmentStats
    ] = await Promise.all([
      Patient.countDocuments({ labId }),
      Patient.countDocuments({ labId, registrationDate: todayRange }),
      Patient.countDocuments({ labId, registrationDate: yesterdayRange }),
      Patient.countDocuments({ labId, registrationDate: weekRange }),
      Patient.countDocuments({ labId, registrationDate: monthRange }),
      Patient.aggregate([
        { $match: { labId } },
        { $group: { _id: '$workflowStatus', count: { $sum: 1 } } }
      ]),
      Appointment.aggregate([
        { $match: { labId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
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
      appointments: appointmentStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      istTimestamp: new Date(Date.now() + IST_OFFSET).toISOString()
    };

    sendSuccess(res, stats, 'Jr doctor dashboard stats retrieved successfully');
  } catch (error) {
    console.error('Error fetching jr doctor dashboard stats:', error);
    sendError(res, 'Error fetching dashboard stats', 500, error.message);
  }
};