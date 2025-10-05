import express from 'express';
import {
  getPatients,
  getPatientById,
  getPatientStats,
  updatePatientStatus,
  getDoctors,
  assignPatientToDoctor,  // ✅ Updated function name,
  getClinics
} from '../controllers/assigner.controller.js';
import {
  createLab,
  getLabs,
  getLabById,
  updateLab,
  deleteLab,
  createDoctor,
  getDoctors as getCrudDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} from '../controllers/assignerCrud.controller.js';

import { protect, authorize } from '../utils/auth.js';

const router = express.Router();

// Protect all routes and authorize only assigners
router.use(protect);
// router.use(authorize('assigner')); // ✅ Uncomment if you want to restrict to assigners only

// Patient routes
router.get('/patients', getPatients);
router.get('/patients/stats', getPatientStats);
router.get('/patients/:id', getPatientById);
router.put('/patients/:id/status', updatePatientStatus);

// ✅ SIMPLIFIED Assignment routes
router.get('/doctors', getDoctors);                                  // For assignment dropdown
router.post('/patients/:patientId/assign', assignPatientToDoctor);   // Assign/reassign patient

// Lab CRUD routes
router.post('/labs', createLab);
router.get('/labs', getLabs);
router.get('/labs/:id', getLabById);
router.put('/labs/:id', updateLab);
router.delete('/labs/:id', deleteLab);

// Doctor CRUD routes
router.post('/doctors', createDoctor);
router.get('/doctors/all', getCrudDoctors);
router.get('/doctors/:id', getDoctorById);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);

// ✅ Add clinic route
router.get('/clinics', getClinics);

export default router;