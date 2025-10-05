import express from 'express';
import {
  getAllPatients,
  getDashboardStats,
  updatePatientStatus
} from '../controllers/clinic.controller.js';
import { protect, authorize } from '../utils/auth.js';

const router = express.Router();

// All routes require authentication and clinic role
router.use(protect);
router.use(authorize('clinic'));

// Patient routes for clinic
router.get('/patients', getAllPatients);
router.get('/dashboard-stats', getDashboardStats);
router.put('/patients/:patientId/status', updatePatientStatus);

export default router;