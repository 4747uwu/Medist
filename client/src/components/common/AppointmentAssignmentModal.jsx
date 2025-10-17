import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import GoogleMeetModal from './googleMeetModal';

const AppointmentAssignmentModal = ({ isOpen, onClose, appointment, onSuccess, user }) => {
  // ✅ FIX: Initialize doctors as empty array to prevent map error
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showGoogleMeetModal, setShowGoogleMeetModal] = useState(false);
  const [meetingData, setMeetingData] = useState(null);

  // Check if appointment is already assigned
  const isAssigned = appointment?.assignment?.doctorId || appointment?.doctorId;
  const currentDoctor = appointment?.assignment?.doctorName || appointment?.doctorName;

  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      // Pre-fill current assignment
      setSelectedDoctorId(appointment?.assignment?.doctorId || appointment?.doctorId || '');
      setNotes(appointment?.assignment?.notes || '');
      setError(''); // ✅ Clear any previous errors
    }
  }, [isOpen, appointment]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('AppointmentAssignmentModal - Fetching doctors...');
      const response = await apiClient.get('/assigner/doctors');
      
      console.log('AppointmentAssignmentModal - Full response:', response.data);
      
      // ✅ FIX: Extract doctors correctly based on actual response structure
      let doctorsData = [];
      
      if (response.data.success) {
        // ✅ The doctors are directly in response.data.data (based on your console log)
        doctorsData = response.data.data;
        
        console.log('AppointmentAssignmentModal - Extracted doctors data:', doctorsData);
        console.log('AppointmentAssignmentModal - Is array:', Array.isArray(doctorsData));
        console.log('AppointmentAssignmentModal - Length:', doctorsData?.length);
      }
      
      if (Array.isArray(doctorsData) && doctorsData.length > 0) {
        setDoctors(doctorsData);
        console.log('AppointmentAssignmentModal - Doctors set successfully:', doctorsData.length);
        setError(''); // ✅ Clear error on success
      } else {
        console.log('AppointmentAssignmentModal - No doctors found or invalid format');
        setDoctors([]);
        setError('No doctors available');
      }
      
    } catch (error) {
      console.error('AppointmentAssignmentModal - Error fetching doctors:', error);
      setDoctors([]);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDoctorId) {
      setError('Please select a doctor');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('AppointmentAssignmentModal - Submitting assignment:', {
        appointmentId: appointment?.appointmentId || appointment?._id,
        doctorId: selectedDoctorId,
        notes
      });

      const response = await apiClient.post(`/assigner/appointments/${appointment?.appointmentId || appointment?._id}/assign`, {
        doctorId: selectedDoctorId,
        notes
      });

      if (response.data.success) {
        console.log('AppointmentAssignmentModal - Assignment successful');
        onSuccess(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('AppointmentAssignmentModal - Error updating assignment:', error);
      setError(error.response?.data?.message || 'Failed to update assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    if (window.confirm('Are you sure you want to unassign this appointment?')) {
      setSubmitting(true);
      setError('');

      try {
        const response = await apiClient.delete(`/assigner/appointments/${appointment?.appointmentId || appointment?._id}/assign`);
        
        if (response.data.success) {
          onSuccess(response.data.data);
          onClose();
        }
      } catch (error) {
        console.error('AppointmentAssignmentModal - Error unassigning:', error);
        setError(error.response?.data?.message || 'Failed to unassign appointment');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Add this function to check for existing meeting
  const checkExistingMeeting = async () => {
    try {
      const result = await googleMeetService.getMeetingForAppointment(appointment?.appointmentId);
      setMeetingData(result.data.meetingData);
    } catch (error) {
      // No meeting exists, which is fine
      setMeetingData(null);
    }
  };

  // Call this in useEffect
  useEffect(() => {
    if (isOpen && appointment) {
      checkExistingMeeting();
    }
  }, [isOpen, appointment]);

  // ✅ Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-black">
              {isAssigned ? 'Manage Appointment Assignment' : 'Assign Doctor to Appointment'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Patient: {appointment?.patientName} • Appointment ID: {appointment?.appointmentId || appointment?._id}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {isAssigned && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Currently assigned to:</strong> {currentDoctor}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Appointment Date: {appointment?.scheduledDate ? new Date(appointment.scheduledDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isAssigned ? 'Reassign to Doctor' : 'Select Doctor'}
              </label>
              
              {loading ? (
                <div className="flex items-center justify-center py-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading doctors...</span>
                </div>
              ) : (
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="">Select a doctor...</option>
                  {/* ✅ FIX: Add safety check for doctors array */}
                  {Array.isArray(doctors) && doctors.length > 0 ? (
                    doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}
                        {doctor.doctorDetails?.specialization && ` - ${doctor.doctorDetails.specialization}`}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {loading ? 'Loading doctors...' : 'No doctors available'}
                    </option>
                  )}
                </select>
              )}
              
              {/* ✅ Show doctors count for debugging */}
              {Array.isArray(doctors) && (
                <p className="text-xs text-gray-500 mt-1">
                  {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} available
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                rows={3}
                placeholder="Add any notes about this appointment assignment..."
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-3">
                {isAssigned && (
                  <button
                    type="button"
                    onClick={handleUnassign}
                    disabled={submitting}
                    className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Unassigning...' : 'Unassign Doctor'}
                  </button>
                )}
                
                {/* Google Meet button */}
                {/* <button
                  type="button"
                  onClick={() => setShowGoogleMeetModal(true)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                    meetingData 
                      ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {meetingData ? 'Join Meeting' : 'Create Meeting'}
                </button> */}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || loading || !Array.isArray(doctors) || doctors.length === 0}
                  className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                      {isAssigned ? 'Updating...' : 'Assigning...'}
                    </>
                  ) : (
                    isAssigned ? 'Update Assignment' : 'Assign Doctor'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Add the Google Meet Modal */}
      {showGoogleMeetModal && (
        <GoogleMeetModal
          isOpen={showGoogleMeetModal}
          onClose={() => setShowGoogleMeetModal(false)}
          appointment={appointment}
          onMeetingCreated={(newMeetingData) => {
            setMeetingData(newMeetingData);
            setShowGoogleMeetModal(false);
          }}
          userRole={user?.role}
        />
      )}
    </div>
  );
};

export default AppointmentAssignmentModal;