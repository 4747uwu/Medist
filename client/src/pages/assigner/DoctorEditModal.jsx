import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

const EditDoctorModal = ({ isOpen, doctor, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    profile: {
      firstName: '',
      lastName: '',
      phone: ''
    },
    doctorDetails: {
      specialization: '',
      qualification: '',
      experience: '',
      registrationNumber: '',
      consultationFee: '',
      availableDays: [],
      availableHours: {
        start: '',
        end: ''
      }
    },
    isActive: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form data when doctor prop changes
  useEffect(() => {
    if (doctor) {
      setFormData({
        email: doctor.email || '',
        profile: {
          firstName: doctor.profile?.firstName || '',
          lastName: doctor.profile?.lastName || '',
          phone: doctor.profile?.phone || ''
        },
        doctorDetails: {
          specialization: doctor.doctorDetails?.specialization || '',
          qualification: doctor.doctorDetails?.qualification || '',
          experience: doctor.doctorDetails?.experience || '',
          registrationNumber: doctor.doctorDetails?.registrationNumber || '',
          consultationFee: doctor.doctorDetails?.consultationFee || '',
          availableDays: doctor.doctorDetails?.availableDays || [],
          availableHours: {
            start: doctor.doctorDetails?.availableHours?.start || '',
            end: doctor.doctorDetails?.availableHours?.end || ''
          }
        },
        isActive: doctor.isActive !== undefined ? doctor.isActive : true
      });
    }
  }, [doctor]);

  const specializations = [
    'General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics',
    'ENT', 'Gynecology', 'Neurology', 'Gastroenterology', 'Psychiatry'
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.put(`/assigner/doctors/${doctor._id}`, formData);
      
      if (response.data.success) {
        onSuccess(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      setError(error.response?.data?.message || 'Failed to update doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    const updatedDays = formData.doctorDetails.availableDays.includes(day)
      ? formData.doctorDetails.availableDays.filter(d => d !== day)
      : [...formData.doctorDetails.availableDays, day];
    
    setFormData({
      ...formData,
      doctorDetails: {
        ...formData.doctorDetails,
        availableDays: updatedDays
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Doctor - Dr. {doctor?.profile?.firstName} {doctor?.profile?.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({...formData, isActive: e.target.value === 'active'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={formData.profile.firstName}
                onChange={(e) => setFormData({
                  ...formData,
                  profile: {...formData.profile, firstName: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.profile.lastName}
                onChange={(e) => setFormData({
                  ...formData,
                  profile: {...formData.profile, lastName: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.profile.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  profile: {...formData.profile, phone: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Professional Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                <select
                  value={formData.doctorDetails.specialization}
                  onChange={(e) => setFormData({
                    ...formData,
                    doctorDetails: {...formData.doctorDetails, specialization: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Specialization</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
                <input
                  type="text"
                  value={formData.doctorDetails.qualification}
                  onChange={(e) => setFormData({
                    ...formData,
                    doctorDetails: {...formData.doctorDetails, qualification: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MBBS, MD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience (years)</label>
                <input
                  type="number"
                  value={formData.doctorDetails.experience}
                  onChange={(e) => setFormData({
                    ...formData,
                    doctorDetails: {...formData.doctorDetails, experience: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                <input
                  type="text"
                  value={formData.doctorDetails.registrationNumber}
                  onChange={(e) => setFormData({
                    ...formData,
                    doctorDetails: {...formData.doctorDetails, registrationNumber: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee (₹)</label>
                <input
                  type="number"
                  value={formData.doctorDetails.consultationFee}
                  onChange={(e) => setFormData({
                    ...formData,
                    doctorDetails: {...formData.doctorDetails, consultationFee: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Availability</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {daysOfWeek.map(day => (
                  <label key={day} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.doctorDetails.availableDays.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.doctorDetails.availableHours.start}
                  onChange={(e) => setFormData({
                    ...formData,
                    doctorDetails: {
                      ...formData.doctorDetails,
                      availableHours: {
                        ...formData.doctorDetails.availableHours,
                        start: e.target.value
                      }
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.doctorDetails.availableHours.end}
                  onChange={(e) => setFormData({
                    ...formData,
                    doctorDetails: {
                      ...formData.doctorDetails,
                      availableHours: {
                        ...formData.doctorDetails.availableHours,
                        end: e.target.value
                      }
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{loading ? 'Updating...' : 'Update Doctor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDoctorModal;