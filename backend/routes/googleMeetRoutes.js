import express from 'express';
import { protect, authorize } from '../utils/auth.js';
import {
  getAuthUrl,
  handleOAuthCallback,
  createMeetingForAppointment,
  getMeetingForAppointment,
  checkAuthStatus
} from '../controllers/googleMeet.controller.js';

const router = express.Router();

// Public routes
router.get('/auth', getAuthUrl);
router.get('/oauth2callback', handleOAuthCallback);

// Protected routes
router.use(protect);

// Check authentication status
router.get('/auth-status', checkAuthStatus);

// Meeting management routes (assigner, doctor, jrdoctor can access)
router.post('/appointments/:appointmentId/create-meeting', 
  authorize('assigner', 'doctor', 'jrdoctor'), 
  createMeetingForAppointment
);

router.get('/appointments/:appointmentId/meeting', 
  authorize('assigner', 'doctor', 'jrdoctor', 'clinic'), 
  getMeetingForAppointment
);

export default router;