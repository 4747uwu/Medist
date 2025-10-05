import express from 'express';
import {
  getAssignedPatients,
  updatePatientWorkflowStatus,
  getPatientDetails,
  getDoctorStats
} from '../controllers/doctor.controller.js';
import { protect, authorize } from '../utils/auth.js';

const router = express.Router();

// All routes require authentication and doctor role
router.use(protect);
router.use(authorize('doctor'));

// Patient routes for doctor
router.get('/patients', getAssignedPatients);
router.get('/patients/:patientId', getPatientDetails);
router.put('/patients/:patientId/status', updatePatientWorkflowStatus);
router.get('/stats', getDoctorStats);

export default router;