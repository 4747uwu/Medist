import express from 'express';
import { protect, authorize } from '../utils/auth.js';
import {
  getPatients,
  getClinics,
  getPatientById,
  getPatientStats,
  getDoctors,
  assignDoctorToAppointment, // ✅ UPDATED: Now assigns to appointment
  updatePatientStatus
} from '../controllers/assigner.controller.js';

const router = express.Router();

// All routes require authentication and assigner role
router.use(protect);
router.use(authorize('assigner'));

// Patient routes
router.get('/patients', getPatients);
router.get('/patients/stats', getPatientStats);
router.get('/patients/:id', getPatientById);
router.put('/patients/:id/status', updatePatientStatus);

// Clinic routes
router.get('/clinics', getClinics);

// Doctor routes
router.get('/doctors', getDoctors);

// ✅ UPDATED: Assign doctor to appointment
router.post('/appointments/:appointmentId/assign', assignDoctorToAppointment);

export default router;