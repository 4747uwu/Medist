import express from 'express';
import { protect } from '../utils/auth.js';
import {
  assignDoctorToAppointment,
  updateAppointmentStatus,
  createAppointmentPrescription,
  getAppointmentById,
  // ✅ NEW: Document management functions
  getAppointmentDocuments,
  addAppointmentDocument,
  updateAppointmentDocument,
  deleteAppointmentDocument
} from '../controllers/appointment.controller.js';

const router = express.Router();

// Appointment management routes
router.put('/:appointmentId/assign-doctor', protect, assignDoctorToAppointment);
router.put('/:appointmentId/status', protect, updateAppointmentStatus);
router.post('/:appointmentId/prescription', protect, createAppointmentPrescription);
router.get('/:appointmentId', protect, getAppointmentById);

// ✅ NEW: Document management routes
router.get('/:appointmentId/documents', protect, getAppointmentDocuments);
router.post('/:appointmentId/documents', protect, addAppointmentDocument);
router.put('/:appointmentId/documents/:documentId', protect, updateAppointmentDocument);
router.delete('/:appointmentId/documents/:documentId', protect, deleteAppointmentDocument);

export default router;