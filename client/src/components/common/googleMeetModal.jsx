import React, { useState, useEffect } from 'react';
import googleMeetService from '../../services/googleMeet';

const GoogleMeetModal = ({ 
  isOpen, 
  onClose, 
  appointment, 
  onMeetingCreated,
  userRole 
}) => {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [meetingData, setMeetingData] = useState(null);
  const [error, setError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkAuthAndMeeting();
    }
  }, [isOpen, appointment]);

  const checkAuthAndMeeting = async () => {
    try {
      setLoading(true);
      
      // Check authentication status
      const authResult = await googleMeetService.checkAuthStatus();
      setIsAuthenticated(authResult.data.isAuthenticated);
      
      // Check if meeting already exists for this appointment
      if (appointment?.appointmentId) {
        try {
          const meetingResult = await googleMeetService.getMeetingForAppointment(
            appointment.appointmentId
          );
          setMeetingData(meetingResult.data.meetingData);
        } catch (meetingError) {
          // Meeting doesn't exist yet, which is fine
          console.log('No existing meeting found');
        }
      }
    } catch (error) {
      console.error('Error checking auth and meeting:', error);
      setError('Failed to check Google Meet status');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      setAuthenticating(true);
      setError('');
      
      await googleMeetService.authenticateGoogleMeet();
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Authentication failed:', error);
      setError('Failed to authenticate with Google Meet');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleCreateMeeting = async () => {
    try {
      setLoading(true);
      setError('');
      
      const meetingTitle = `Medical Consultation - ${appointment.patientName || 'Patient'} - ${appointment.appointmentId}`;
      
      const result = await googleMeetService.createMeetingForAppointment(
        appointment.appointmentId,
        meetingTitle
      );
      
      setMeetingData(result.data.meetingData);
      
      if (onMeetingCreated) {
        onMeetingCreated(result.data.meetingData);
      }
      
    } catch (error) {
      console.error('Error creating meeting:', error);
      setError(error.response?.data?.message || 'Failed to create Google Meet');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = () => {
    if (meetingData?.meetingUri) {
      window.open(meetingData.meetingUri, '_blank');
    }
  };

  const copyMeetingLink = async () => {
    if (meetingData?.meetingUri) {
      try {
        await navigator.clipboard.writeText(meetingData.meetingUri);
        alert('Meeting link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Google Meet Integration
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {appointment && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">Appointment Details</p>
              <p className="text-sm text-gray-600">ID: {appointment.appointmentId}</p>
              <p className="text-sm text-gray-600">Patient: {appointment.patientName}</p>
              <p className="text-sm text-gray-600">
                Date: {new Date(appointment.scheduledDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {!isAuthenticated ? (
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Authenticate Google Meet
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    To create Google Meet links, you need to authenticate with your Google account.
                  </p>
                  <button
                    onClick={handleAuthenticate}
                    disabled={authenticating}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {authenticating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Authenticate with Google
                      </>
                    )}
                  </button>
                </div>
              ) : meetingData ? (
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Meeting Ready!
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Google Meet link has been created for this appointment.
                  </p>
                  
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-xs text-gray-500 mb-1">Meeting Code</p>
                    <p className="font-mono text-sm font-medium">{meetingData.meetingCode}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleJoinMeeting}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Join Meeting
                    </button>
                    
                    <button
                      onClick={copyMeetingLink}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Link
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Create Google Meet
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Create a Google Meet link for this appointment that both doctor and patient can join.
                  </p>
                  
                  {(['assigner'].includes(userRole)) ? (
                    <button
                      onClick={handleCreateMeeting}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create Meeting
                        </>
                      )}
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Only assigners can create Google Meet links. Please contact your assigner.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMeetModal;