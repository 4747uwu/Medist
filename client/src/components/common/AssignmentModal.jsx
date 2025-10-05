import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

const AssignmentModal = ({ isOpen, onClose, patient, onSuccess }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch available doctors when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      fetchCurrentAssignments();
    }
  }, [isOpen, patient]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(''); // ✅ Clear any previous errors
      const response = await apiClient.get('/assigner/doctors');
      
      console.log('Doctors API response:', response.data); // ✅ Debug log
      
      if (response.data.success) {
        // ✅ Ensure doctors is always an array
        const doctorsData = Array.isArray(response.data.data) ? response.data.data : [];
        setDoctors(doctorsData);
      } else {
        setDoctors([]);
        setError('Failed to load doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]); // ✅ Set empty array on error
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentAssignments = async () => {
    if (!patient?.patientId) return;

    try {
      const response = await apiClient.get(`/assigner/patients/${patient.patientId}/assignments`);
      
      if (response.data.success) {
        const assignedDoctorIds = response.data.data.map(assignment => assignment.doctorId);
        setSelectedDoctors(assignedDoctorIds);
      }
    } catch (error) {
      console.error('Error fetching current assignments:', error);
      // ✅ Don't set error for this, just log it and continue with empty assignments
      setSelectedDoctors([]);
    }
  };

  const handleDoctorToggle = (doctorId) => {
    setSelectedDoctors(prev => {
      if (prev.includes(doctorId)) {
        return prev.filter(id => id !== doctorId);
      } else {
        return [...prev, doctorId];
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      const response = await apiClient.post(`/assigner/patients/${patient.patientId}/assign`, {
        doctorIds: selectedDoctors
      });

      if (response.data.success) {
        onSuccess && onSuccess(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Error assigning patient:', error);
      setError(error.response?.data?.message || 'Failed to assign patient');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Assign Patient</h3>
              <p className="text-sm text-gray-500 mt-1">
                {patient?.personalInfo?.fullName} ({patient?.patientId})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm text-gray-600">Loading doctors...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Available Doctors ({doctors.length})
              </h4>
              
              {doctors.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">No doctors available</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {/* ✅ Safe to use .map now since doctors is always an array */}
                  {doctors.map((doctor) => (
                    <div
                      key={doctor._id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDoctors.includes(doctor._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleDoctorToggle(doctor._id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedDoctors.includes(doctor._id)}
                          onChange={() => handleDoctorToggle(doctor._id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        
                        <div className="ml-3 flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                              <span className="text-xs font-semibold text-white">
                                {doctor.profile?.firstName?.charAt(0)?.toUpperCase() || 'D'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doctor.doctorDetails?.specialization || 'General Medicine'}
                            </p>
                            {doctor.doctorDetails?.experience && (
                              <p className="text-xs text-gray-400">
                                {doctor.doctorDetails.experience} years exp.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedDoctors.length} doctor{selectedDoctors.length !== 1 ? 's' : ''} selected
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={submitting || doctors.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Assigning...
                </>
              ) : (
                'Assign Patient'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentModal;