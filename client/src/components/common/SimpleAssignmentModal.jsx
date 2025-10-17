import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

const SimpleAssignmentModal = ({ isOpen, onClose, patient, onSuccess }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check if patient is already assigned
  const isAssigned = patient?.assignment?.doctorId;
  const currentDoctor = patient?.assignment?.doctorName;

  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      // Pre-fill current assignment
      setSelectedDoctorId(patient?.assignment?.doctorId || '');
      setNotes(patient?.assignment?.notes || '');
    }
  }, [isOpen, patient]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(''); // ✅ Clear previous errors
      
      const response = await apiClient.get('/assigner/doctors');
      console.log('SimpleAssignmentModal - Full response:', response.data);
      
      // ✅ FIX: Extract doctors correctly
      let doctorsData = [];
      
      if (response.data.success) {
        doctorsData = response.data.data; // ✅ Based on your backend response
      }
      
      if (Array.isArray(doctorsData)) {
        setDoctors(doctorsData);
        console.log('SimpleAssignmentModal - Doctors set:', doctorsData.length);
      } else {
        setDoctors([]);
        setError('No doctors available');
      }
      
    } catch (error) {
      console.error('SimpleAssignmentModal - Error fetching doctors:', error);
      setDoctors([]);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSubmitting(true);
    setError('');

    try {
      const response = await apiClient.post(`/assigner/patients/${patient.patientId}/assign`, {
        doctorId: selectedDoctorId || null, // null to unassign
        notes
      });

      if (response.data.success) {
        onSuccess(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      setError(error.response?.data?.message || 'Failed to update assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    if (window.confirm('Are you sure you want to unassign this patient?')) {
      setSelectedDoctorId('');
      setNotes('');
      // Trigger form submission with empty doctor ID
      setTimeout(() => {
        handleSubmit({ preventDefault: () => {} });
      }, 100);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-black">
              {isAssigned ? 'Manage Patient Assignment' : 'Assign Patient'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {patient?.personalInfo?.fullName} (#{patient?.patientId})
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
                Assigned on: {new Date(patient.assignment.assignedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Info about appointment-specific assignments */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <svg className="w-4 h-4 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-yellow-800 font-medium">Patient-Level Assignment</p>
                <p className="text-xs text-yellow-700 mt-1">
                  This is the patient's overall assignment. For appointment-specific assignments, use the appointment management interface.
                </p>
              </div>
            </div>
          </div>

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
                  required={!isAssigned}
                >
                  <option value="">Select a doctor...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}
                      {doctor.doctorDetails?.specialization && ` - ${doctor.doctorDetails.specialization}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Notes & Meet Links
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                rows={3}
                placeholder="Add any notes about this assignment..."
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                {isAssigned && (
                  <button
                    type="button"
                    onClick={handleUnassign}
                    className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Unassign Patient
                  </button>
                )}
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
                  disabled={submitting || loading}
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
    </div>
  );
};

export default SimpleAssignmentModal;