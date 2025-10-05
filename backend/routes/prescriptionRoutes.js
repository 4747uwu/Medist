import express from 'express';
import Prescription from '../modals/Prescription.js';
import Patient from '../modals/Patient.js';
import Appointment from '../modals/Appointment.js'; // ✅ ADD: Import Appointment model
import { protect } from '../utils/auth.js';
import { sendSuccess, sendError } from '../utils/helpers.js';
import { getPrescriptionsByPatient, generatePrescriptionPDF, getPrescriptionById } from '../controllers/prescription.controller.js';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// **IMPORTANT: Order matters - most specific routes first**

// Get prescriptions by appointment ID
router.get('/appointment/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    console.log('Fetching prescriptions for appointment:', appointmentId);
    
    const prescriptions = await Prescription.find({ appointmentId })
      .populate('doctorId', 'profile.firstName profile.lastName name')
      .populate('medicines.medicineId', 'name companyName')
      .populate('tests.testId', 'testName category')
      .sort({ createdAt: -1 });

    console.log(`Found ${prescriptions.length} prescriptions for appointment ${appointmentId}`);
    
    sendSuccess(res, prescriptions, 'Appointment prescriptions retrieved successfully');
  } catch (error) {
    console.error('Error fetching appointment prescriptions:', error);
    sendError(res, 'Error fetching appointment prescriptions', 500, error.message);
  }
});

// Get all prescriptions for a patient
router.get('/patient/:patientId', getPrescriptionsByPatient);

// Generate PDF for specific prescription
router.get('/:id/pdf', generatePrescriptionPDF);

// Get prescription by ID
router.get('/:id', getPrescriptionById);

// Get prescriptions for current doctor
router.get('/doctor', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.user.id })
      .populate('doctorId', 'profile.firstName profile.lastName name')
      .populate('medicines.medicineId', 'name companyName')
      .populate('tests.testId', 'testName category')
      .sort({ createdAt: -1 })
      .limit(50);

    sendSuccess(res, prescriptions, 'Doctor prescriptions retrieved successfully');
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    sendError(res, 'Error fetching prescriptions', 500, error.message);
  }
});

// Get patient prescription history 
router.get('/patient/:patientId/history', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await Patient.findOne({ patientId })
      .populate({
        path: 'prescriptions.list.prescriptionId',
        populate: [
          { path: 'doctorId', select: 'profile' },
          { path: 'medicines.medicineId', select: 'name companyName' },
          { path: 'tests.testId', select: 'testName category' }
        ]
      })
      .populate('prescriptions.list.doctorId', 'profile');

    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    sendSuccess(res, patient, 'Patient history retrieved successfully');
  } catch (error) {
    console.error('Error fetching patient history:', error);
    sendError(res, 'Error fetching patient history', 500, error.message);
  }
});

// Create prescription
router.post('/', async (req, res) => {
  try {
    const {
      patientId,
      appointmentId, // ✅ FIXED: Capture appointmentId
      medicines,
      tests,
      diagnosis,
      symptoms,
      advice,
      appointmentData
    } = req.body;

    console.log('Creating prescription for:', {
      patientId,
      appointmentId, // ✅ FIXED: Log appointmentId
      doctorId: req.user.id,
      medicinesCount: medicines?.length || 0,
      testsCount: tests?.length || 0
    });

    // Validate required fields
    if (!patientId) {
      return sendError(res, 'Patient ID is required', 400);
    }

    if (!medicines?.length && !tests?.length) {
      return sendError(res, 'At least one medicine or test is required', 400);
    }

    // Get patient details
    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    // ✅ FIXED: If appointmentId is provided, validate and get appointment
    let appointment = null;
    if (appointmentId) {
      appointment = await Appointment.findOne({ appointmentId });
      if (!appointment) {
        return sendError(res, 'Appointment not found', 404);
      }
      console.log('Linked to appointment:', appointment.appointmentId);
    }

    // Get user's lab ID or default
    let labId = 'DEFAULT';
    if (req.user.doctorDetails?.labId) {
      labId = req.user.doctorDetails.labId;
    } else if (appointment?.labId) {
      labId = appointment.labId;
    }

    // Generate visitId if not provided
    const visitId = `VISIT-${patientId}-${Date.now()}`;

    const prescriptionData = {
      patientId,
      appointmentId: appointmentId || null,
      visitId,
      doctorId: req.user.id,
      labId,
      generatedBy: req.user.id,
      appointmentData: appointmentData || (appointment ? {
        appointmentId: appointment.appointmentId,
        scheduledDate: appointment.scheduledDate,
        scheduledTime: appointment.scheduledTime,
        chiefComplaints: appointment.chiefComplaints,
        // ✅ FIXED: More robust vitals handling
        vitals: appointment.vitals ? {
          weight: appointment.vitals.weight || null,
          height: appointment.vitals.height || null,
          temperature: appointment.vitals.temperature || null,
          bloodPressure: appointment.vitals.bloodPressure || null,
          heartRate: appointment.vitals.heartRate || null,
          oxygenSaturation: appointment.vitals.oxygenSaturation || null,
          // ✅ FIXED: Ensure bloodSugar is properly structured
          bloodSugar: appointment.vitals.bloodSugar ? {
            value: appointment.vitals.bloodSugar.value || null,
            type: appointment.vitals.bloodSugar.type || 'Random',
            unit: appointment.vitals.bloodSugar.unit || 'mg/dL'
          } : {
            value: null,
            type: 'Random',
            unit: 'mg/dL'
          }
        } : null,
        examination: appointment.examination || null
      } : null),
      medicines: (medicines || []).map(med => ({
        medicineId: med.medicineId,
        medicineName: med.medicineName,
        medicineCode: med.medicineCode,
        dosage: med.dosage || '1 tablet',
        frequency: med.frequency || 'Twice daily',
        timing: med.timing || 'After meals',
        duration: med.duration || '7 days',
        instructions: med.instructions || '',
        quantity: med.quantity || 1
      })),
      tests: (tests || []).map(test => ({
        testId: test.testId,
        testName: test.testName,
        testCode: test.testCode,
        urgency: test.urgency || 'Routine',
        instructions: test.instructions || ''
      })),
      diagnosis: diagnosis || { primary: '', secondary: [] },
      symptoms: symptoms || [],
      advice: advice || {
        lifestyle: '',
        diet: '',
        followUp: { required: false }
      }
    };

    // ✅ FIXED: Add detailed logging to debug the exact data being saved
    console.log('📋 Prescription creation details:', {
      patientId: prescriptionData.patientId,
      appointmentId: prescriptionData.appointmentId,
      hasAppointmentData: !!prescriptionData.appointmentData,
      appointmentDataVitals: prescriptionData.appointmentData?.vitals,
      bloodSugarData: prescriptionData.appointmentData?.vitals?.bloodSugar
    });

    // Create prescription
    const prescription = await Prescription.create(prescriptionData);

    // ✅ FIXED: Update appointment to mark prescription as issued
    if (appointmentId && appointment) {
      appointment.treatment = {
        ...appointment.treatment,
        prescriptionIssued: true,
        prescriptionId: prescription._id,
        prescriptionDate: new Date()
      };
      await appointment.save();
      console.log('Appointment updated with prescription info');

      // ✅ FIXED: Update patient appointment record
      await patient.updateAppointmentPrescription(
        appointmentId, 
        prescription._id, 
        prescription.prescriptionId
      );
    }

    // Add prescription reference to patient with appointmentId
    await patient.addPrescription({
      _id: prescription._id,
      prescriptionId: prescription.prescriptionId,
      doctorId: req.user.id,
      doctorName: req.user.profile?.fullName || 'Unknown Doctor',
      visitId: visitId,
      appointmentId: appointmentId || null, // ✅ FIXED: Include appointmentId
      createdAt: prescription.createdAt,
      medicines: prescription.medicines,
      tests: prescription.tests
    });

    // Update patient workflow status to "Reported" when prescription is created
    await Patient.findOneAndUpdate(
      { patientId },
      {
        workflowStatus: 'Reported',
        lastActivity: new Date()
      }
    );

    console.log('Prescription created successfully with appointmentId:', {
      prescriptionId: prescription.prescriptionId,
      appointmentId: prescription.appointmentId
    });

    sendSuccess(res, prescription, 'Prescription created successfully', 201);
  } catch (error) {
    console.error('Error creating prescription:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return sendError(res, 'Validation failed', 400, validationErrors);
    }
    
    sendError(res, 'Error creating prescription', 500, error.message);
  }
});

// Update prescription
router.put('/:prescriptionId', async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const updateData = req.body;

    // FIXED: Add generatedBy if not present
    if (!updateData.generatedBy) {
      updateData.generatedBy = req.user.id;
    }

    const prescription = await Prescription.findOneAndUpdate(
      { prescriptionId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!prescription) {
      return sendError(res, 'Prescription not found', 404);
    }

    // Update patient's prescription reference
    await Patient.updateOne(
      { 
        patientId: prescription.patientId,
        'prescriptions.list.prescriptionCode': prescriptionId 
      },
      {
        $set: {
          'prescriptions.list.$.medicineCount': prescription.medicines?.length || 0,
          'prescriptions.list.$.testCount': prescription.tests?.length || 0,
          'prescriptions.stats.lastPrescriptionDate': new Date()
        }
      }
    );

    // 🔥 NEW: Update patient workflow status to "Reported" when prescription is updated (if not already reported/completed)
    const patient = await Patient.findOne({ patientId: prescription.patientId });
    if (patient && !['Reported', 'Completed'].includes(patient.workflowStatus)) {
      await Patient.findOneAndUpdate(
        { patientId: prescription.patientId },
        {
          workflowStatus: 'Reported',
          lastActivity: new Date()
        }
      );
      console.log('Patient workflow status updated to Reported after prescription update');
    }

    sendSuccess(res, prescription, 'Prescription updated successfully');
  } catch (error) {
    console.error('Error updating prescription:', error);
    sendError(res, 'Error updating prescription', 500, error.message);
  }
});

export default router;