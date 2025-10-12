import express from 'express';
import { protect, authorize } from '../utils/auth.js';
import {
  createJrDoctor,
  listJrDoctors,
  getAllPatientsForJrDoctor,
  updateJrDoctorStatus,
  deleteJrDoctor,
  getJrDoctorDashboardStats
} from '../controllers/jrdoctor.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes for clinic to manage jr doctors
router.post('/', authorize('clinic'), createJrDoctor);
router.get('/', authorize('clinic'), listJrDoctors);
router.put('/:jrDoctorId/status', authorize('clinic'), updateJrDoctorStatus);
router.delete('/:jrDoctorId', authorize('clinic'), deleteJrDoctor);

// Routes for jr doctor dashboard (same as clinic routes but with jr doctor auth)
router.get('/patients', authorize('jrdoctor'), getAllPatientsForJrDoctor);
router.get('/dashboard-stats', authorize('jrdoctor'), getJrDoctorDashboardStats);

export default router;