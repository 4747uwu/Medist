import Patient, { Visit } from '../modals/Patient.js';
import User from '../modals/User.js';
import Lab from '../modals/Lab.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

// @desc    Get all patients assigned to doctor
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

    // Build query for patients assigned to this doctor
    const query = {
      'assignment.doctorId': req.user.id
    };

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
        query.workflowStatus = { $in: ['Assigned', 'Revisited'] };
      } else if (workflowStatus === 'inprogress') {
        query.workflowStatus = { $in: ['Doctor Opened', 'In Progress', 'Reported'] };
      } else if (workflowStatus === 'completed') {
        query.workflowStatus = 'Completed';
      } else {
        query.workflowStatus = workflowStatus;
      }
    }

    // Add date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          query.lastActivity = { $gte: startDate, $lt: endDate };
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      if (dateFilter !== 'yesterday') {
        query.lastActivity = { $gte: startDate };
      }
    }

    console.log('Final query:', JSON.stringify(query, null, 2));

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [patients, total] = await Promise.all([
      Patient.find(query)
        .populate('assignedBy', 'profile.firstName profile.lastName')
        .populate('assignment.assignedBy', 'profile.firstName profile.lastName')
        .sort({ lastActivity: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Patient.countDocuments(query)
    ]);

    // Populate lab information and visit details
    const patientsWithVisitsAndLabs = await Promise.all(
      patients.map(async (patient) => {
        // Get lab information
        const lab = await Lab.findOne({ labId: patient.labId }).lean();
        
        // Get visit information if available
        let currentVisit = null;
        if (patient.currentVisitId) {
          currentVisit = await Visit.findOne({ visitId: patient.currentVisitId }).lean();
        }
        
        return { 
          ...patient, 
          lab: lab,
          labName: lab?.labName || patient.labId,
          currentVisit: currentVisit 
        };
      })
    );

    // Get workflow status counts for this doctor's patients
    const statusCounts = await Patient.aggregate([
      { $match: { 'assignment.doctorId': req.user.id } },
      {
        $group: {
          _id: '$workflowStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Status counts from DB:', statusCounts);

    // Format status counts with correct mapping
    const stats = {
      total,
      all: total,
      pending: 0,
      inprogress: 0,
      completed: 0,
      assigned: 0,
      doctorOpened: 0,
      reported: 0,
      revisited: 0
    };

    statusCounts.forEach(item => {
      const status = item._id;
      const count = item.count;
      
      // Map individual statuses
      if (status) {
        const statusKey = status.toLowerCase().replace(/\s+/g, '');
        stats[statusKey] = count;
      }
      
      // Group statuses according to mapping
      if (['Assigned', 'Revisited'].includes(status)) {
        stats.pending += count;
      } else if (['Doctor Opened', 'In Progress', 'Reported'].includes(status)) {
        stats.inprogress += count;
      } else if (['Completed'].includes(status)) {
        stats.completed += count;
      }
    });

    console.log('Processed stats:', stats);
    console.log('Found patients:', patientsWithVisitsAndLabs.length);
    console.log('Total count:', total);

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

    console.log('=== GET DOCTOR ASSIGNED PATIENTS REQUEST END ===');
    sendSuccess(res, response, 'Assigned patients retrieved successfully');

  } catch (error) {
    console.error('=== GET DOCTOR ASSIGNED PATIENTS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching assigned patients', 500, error.message);
  }
};

// @desc    Update patient workflow status by doctor
// @route   PUT /api/doctor/patients/:patientId/status
// @access  Private (Doctor only)
export const updatePatientWorkflowStatus = async (req, res) => {
  console.log('=== UPDATE PATIENT WORKFLOW STATUS REQUEST START ===');
  console.log('Doctor ID:', req.user?.id);
  console.log('Patient ID:', req.params.patientId);
  console.log('New status:', req.body.workflowStatus);

  try {
    const { workflowStatus, notes } = req.body;
    const { patientId } = req.params;

    // Validate workflow status
    const validStatuses = ['Doctor Opened', 'In Progress', 'Reported', 'Completed'];
    if (!validStatuses.includes(workflowStatus)) {
      return sendError(res, 'Invalid workflow status for doctor', 400);
    }

    // Check if patient is assigned to this doctor
    const patient = await Patient.findOne({
      patientId,
      'assignment.doctorId': req.user.id
    });

    if (!patient) {
      return sendError(res, 'Patient not found or not assigned to you', 404);
    }

    // Update patient workflow status
    const updatedPatient = await Patient.findOneAndUpdate(
      { patientId },
      {
        workflowStatus,
        lastActivity: new Date(),
        ...(notes && { 'assignment.notes': notes })
      },
      { new: true }
    ).populate('assignment.assignedBy', 'profile.firstName profile.lastName');

    console.log('Patient workflow status updated successfully');

    sendSuccess(res, updatedPatient, 'Patient status updated successfully');

  } catch (error) {
    console.error('=== UPDATE PATIENT WORKFLOW STATUS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error updating patient status', 500, error.message);
  }
};

// @desc    Get patient details for doctor
// @route   GET /api/doctor/patients/:patientId
// @access  Private (Doctor only)
export const getPatientDetails = async (req, res) => {
  console.log('=== GET PATIENT DETAILS REQUEST START ===');
  console.log('Doctor ID:', req.user?.id);
  console.log('Patient ID:', req.params.patientId);

  try {
    const { patientId } = req.params;

    // Check if patient is assigned to this doctor
    const patient = await Patient.findOne({
      patientId,
      'assignment.doctorId': req.user.id
    })
    .populate('assignedBy', 'profile.firstName profile.lastName')
    .populate('assignment.assignedBy', 'profile.firstName profile.lastName')
    .lean();

    if (!patient) {
      return sendError(res, 'Patient not found or not assigned to you', 404);
    }

    // Get lab information
    const lab = await Lab.findOne({ labId: patient.labId }).lean();

    // Get current visit details
    let currentVisit = null;
    if (patient.currentVisitId) {
      currentVisit = await Visit.findOne({ visitId: patient.currentVisitId }).lean();
    }

    // Get all visits for this patient
    const visits = await Visit.find({ patientId })
      .sort({ 'appointment.date': -1 })
      .lean();

    const patientWithDetails = {
      ...patient,
      lab: lab,
      labName: lab?.labName || patient.labId,
      currentVisit: currentVisit,
      visits: visits
    };

    console.log('Patient details retrieved successfully');

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

    const [
      totalAssigned,
      todayPatients,
      weekPatients,
      monthPatients,
      workflowStats,
      recentActivity
    ] = await Promise.all([
      Patient.countDocuments({ 'assignment.doctorId': doctorId }),
      Patient.countDocuments({ 
        'assignment.doctorId': doctorId, 
        lastActivity: { $gte: startOfDay } 
      }),
      Patient.countDocuments({ 
        'assignment.doctorId': doctorId, 
        lastActivity: { $gte: startOfWeek } 
      }),
      Patient.countDocuments({ 
        'assignment.doctorId': doctorId, 
        lastActivity: { $gte: startOfMonth } 
      }),
      Patient.aggregate([
        { $match: { 'assignment.doctorId': doctorId } },
        { $group: { _id: '$workflowStatus', count: { $sum: 1 } } }
      ]),
      Patient.find({ 'assignment.doctorId': doctorId })
        .select('patientId personalInfo.fullName workflowStatus lastActivity')
        .sort({ lastActivity: -1 })
        .limit(10)
        .lean()
    ]);

    const stats = {
      patients: {
        total: totalAssigned,
        today: todayPatients,
        week: weekPatients,
        month: monthPatients
      },
      workflow: workflowStats.reduce((acc, item) => {
        const key = item._id.toLowerCase().replace(/\s+/g, '');
        acc[key] = item.count;
        return acc;
      }, {}),
      recentActivity
    };

    console.log('Doctor statistics generated:', stats);

    sendSuccess(res, stats, 'Doctor statistics retrieved successfully');

  } catch (error) {
    console.error('=== GET DOCTOR STATS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching doctor statistics', 500, error.message);
  }
};