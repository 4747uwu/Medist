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
