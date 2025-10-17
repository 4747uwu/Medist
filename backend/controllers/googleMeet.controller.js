import googleMeetService from '../services/googleMeet.js';
import Appointment from '../modals/Appointment.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

// Get authentication URL
export const getAuthUrl = async (req, res) => {
  try {
    console.log('=== GET GOOGLE MEET AUTH URL ===');
    
    const authUrl = googleMeetService.getAuthUrl();
    
    sendSuccess(res, { authUrl }, 'Authentication URL generated successfully');
  } catch (error) {
    console.error('Error getting auth URL:', error);
    sendError(res, 'Failed to generate authentication URL', 500, error.message);
  }
};

// Handle OAuth callback
export const handleOAuthCallback = async (req, res) => {
  try {
    console.log('=== GOOGLE MEET OAUTH CALLBACK ===');
    const { code } = req.query;
    
    if (!code) {
      return sendError(res, 'Authorization code not provided', 400);
    }
    
    const tokens = await googleMeetService.handleCallback(code);
    
    console.log('Google Meet authentication successful');
    
    // Redirect to success page or close popup
    res.redirect('/auth-success.html'); // You'll need to create this page
    
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.redirect('/auth-error.html'); // You'll need to create this page
  }
};

// Create Google Meet for appointment
export const createMeetingForAppointment = async (req, res) => {
  try {
    console.log('=== CREATE GOOGLE MEET FOR APPOINTMENT ===');
    const { appointmentId } = req.params;
    const { meetingTitle } = req.body;
    
    // Check if user has permission (assigner or doctor)
    if (!['assigner', 'doctor', 'jrdoctor'].includes(req.user.role)) {
      return sendError(res, 'Insufficient permissions to create meeting', 403);
    }
    
    // Find the appointment
    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }
    
    // Check if meeting already exists
    if (appointment.googleMeet && appointment.googleMeet.meetingUri) {
      return sendSuccess(res, {
        meetingData: appointment.googleMeet,
        message: 'Meeting already exists for this appointment'
      }, 'Meeting retrieved successfully');
    }
    
    // Check authentication
    if (!googleMeetService.isAuthenticated()) {
      return sendError(res, 'Google Meet not authenticated. Please authenticate first.', 401);
    }
    
    // Create the meeting
    const meetingData = await googleMeetService.createMeeting(
      meetingTitle || `Medical Consultation - ${appointment.appointmentId}`
    );
    
    // Update appointment with meeting details
    appointment.googleMeet = {
      spaceId: meetingData.spaceId,
      meetingUri: meetingData.meetingUri,
      meetingCode: meetingData.meetingCode,
      createdAt: new Date(),
      createdBy: req.user.id
    };
    
    await appointment.save();
    
    console.log('Meeting created and saved to appointment:', appointmentId);
    
    sendSuccess(res, {
      appointmentId,
      meetingData: appointment.googleMeet
    }, 'Google Meet created successfully');
    
  } catch (error) {
    console.error('Error creating meeting for appointment:', error);
    sendError(res, 'Failed to create Google Meet', 500, error.message);
  }
};

// Get meeting details for appointment
export const getMeetingForAppointment = async (req, res) => {
  try {
    console.log('=== GET MEETING FOR APPOINTMENT ===');
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findOne({ appointmentId })
      .select('appointmentId googleMeet');
    
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }
    
    if (!appointment.googleMeet || !appointment.googleMeet.meetingUri) {
      return sendError(res, 'No meeting found for this appointment', 404);
    }
    
    sendSuccess(res, {
      appointmentId,
      meetingData: appointment.googleMeet
    }, 'Meeting details retrieved successfully');
    
  } catch (error) {
    console.error('Error getting meeting for appointment:', error);
    sendError(res, 'Failed to retrieve meeting details', 500, error.message);
  }
};

// Check authentication status
export const checkAuthStatus = async (req, res) => {
  try {
    const isAuthenticated = googleMeetService.isAuthenticated();
    
    sendSuccess(res, { 
      isAuthenticated,
      message: isAuthenticated ? 'Google Meet is authenticated' : 'Google Meet not authenticated'
    });
    
  } catch (error) {
    console.error('Error checking auth status:', error);
    sendError(res, 'Failed to check authentication status', 500, error.message);
  }
};