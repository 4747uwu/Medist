import express from 'express';
import { protect, authorize } from '../utils/auth.js';
import {
  getAssignedPatients,
  getPatientDetails,
  getDoctorStats
} from '../controllers/doctor.controller.js';
import {
  getDoctorAppointments,
  getDoctorAppointmentsByPatient,
  updateDoctorAppointmentStatus
} from '../controllers/doctorappointment.controller.js';

const router = express.Router();

// All routes require authentication and doctor role
router.use(protect);
router.use(authorize('doctor'));

// ✅ NEW: Appointment routes
router.get('/appointments', getDoctorAppointments);
router.get('/appointments/patient/:patientId', getDoctorAppointmentsByPatient);
router.put('/appointments/:appointmentId/status', updateDoctorAppointmentStatus);

// Patient routes (kept for backward compatibility)
router.get('/patients', getAssignedPatients);
router.get('/patients/:patientId', getPatientDetails);

// Statistics route
router.get('/stats', getDoctorStats);

export default router;