import express from 'express';
import { protect, authorize } from '../utils/auth.js';
import {
  getPatients,
  getClinics,
  getPatientById,
  getPatientStats,
  assignDoctorToAppointment,
  updatePatientStatus
} from '../controllers/assigner.controller.js';

// Import CRUD operations (doctors / labs)
import {
  createDoctor,
  createLab,
  getLabs,
  getLabById,
  updateLab,
  deleteLab,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} from '../controllers/assignerCrud.controller.js';

const router = express.Router();

// All routes require authentication and assigner/jrdoctor role
router.use(protect);
router.use(authorize('jrdoctor', 'assigner'));

// Patient routes
router.get('/patients', getPatients);
router.get('/patients/stats', getPatientStats);
router.get('/patients/:id', getPatientById);
router.put('/patients/:id/status', updatePatientStatus);

// Clinic / Lab routes (CRUD)
router.post('/labs', createLab);
router.get('/labs', getLabs);
router.get('/labs/:id', getLabById);
router.put('/labs/:id', updateLab);
router.delete('/labs/:id', deleteLab);

// Doctor routes (CRUD)
router.post('/doctors', createDoctor);            // <--- fixes 404 on create doctor
router.get('/doctors', getDoctors);
router.get('/doctors/:id', getDoctorById);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);

// Assign doctor to appointment
router.post('/appointments/:appointmentId/assign', assignDoctorToAppointment);

export default router;