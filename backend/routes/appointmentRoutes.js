import express from 'express';
import { protect } from '../utils/auth.js';
import {
  assignDoctorToAppointment,
  updateAppointmentStatus,
  createAppointmentPrescription,
  getAppointmentById


} from '../controllers/appointment.controller.js';

const router = express.Router();

// Appointment management routes
router.put('/:appointmentId/assign-doctor', protect, assignDoctorToAppointment);
router.put('/:appointmentId/status', protect, updateAppointmentStatus);
router.post('/:appointmentId/prescription', protect, createAppointmentPrescription); // NEW
router.get('/:appointmentId', protect, getAppointmentById); // Add this if not exists

export default router;