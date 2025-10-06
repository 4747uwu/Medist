import express from 'express';
import {
  checkPatientExists,
  createOrUpdatePatient,
  createVisit,
  getPatientVisits,
  updateVisit,
  getVisitById,
  createAppointment,
  getPatientAppointments,
  updateAppointment,
  getAppointmentById,
  getPatientWithAppointments,
  // getPatientDocuments,
  // addPatientDocument,
  // deletePatientDocument,
  // updatePatientDocument
} from '../controllers/patient.controller.js';
import { protect, authorize } from '../utils/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Patient routes
router.get('/check/:phone', authorize('assigner', 'clinic'), checkPatientExists);
router.post('/', authorize('assigner', 'clinic'), createOrUpdatePatient);
router.get('/:patientId/full', getPatientWithAppointments);

// Visit routes
router.post('/:patientId/visits', authorize('assigner', 'clinic', 'doctor'), createVisit);
router.get('/:patientId/visits', getPatientVisits);
router.get('/visits/:visitId', getVisitById);
router.put('/visits/:visitId', authorize('doctor', 'assigner'), updateVisit);

// Appointment routes
router.post('/:patientId/appointments', authorize('assigner', 'clinic', 'doctor'), createAppointment);
router.get('/:patientId/appointments', getPatientAppointments);
router.get('/appointments/:appointmentId', getAppointmentById);
router.put('/appointments/:appointmentId', authorize('doctor', 'assigner'), updateAppointment);

// Document management routes
// router.get('/:patientId/documents', protect, getPatientDocuments);
// router.post('/:patientId/documents', protect, addPatientDocument);
// router.put('/:patientId/documents/:documentId', protect, updatePatientDocument);
// router.delete('/:patientId/documents/:documentId', protect, deletePatientDocument);

export default router;