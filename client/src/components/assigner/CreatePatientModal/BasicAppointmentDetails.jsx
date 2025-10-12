import React from 'react';

const BasicAppointmentDetails = ({ 
  formData, 
  patientExists, 
  handleInputChange, 
  appointmentModes,
  errors
}) => {
  const appointmentData = formData.appointment || {
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    mode: 'In-person',
    complaints: { chief: '', duration: '' }
  };

  return (
    <div className="space-y-6">
      {patientExists && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <p className="text-sm text-green-800">
            <strong>Existing Patient:</strong> {formData.personalInfo?.fullName}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Creating new appointment for existing patient
          </p>
        </div>
      )}

      {/* Basic Appointment Details */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">📅 Appointment Details</h4>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={appointmentData.date}
              onChange={(e) => handleInputChange('appointment', 'date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.appointmentDate && <p className="text-xs text-red-500 mt-1">{errors.appointmentDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
            <input
              type="time"
              value={appointmentData.time}
              onChange={(e) => handleInputChange('appointment', 'time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.appointmentTime && <p className="text-xs text-red-500 mt-1">{errors.appointmentTime}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
            <select
              value={appointmentData.mode}
              onChange={(e) => handleInputChange('appointment', 'mode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {appointmentModes.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Basic Complaint (Optional) */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">💬 Basic Information (Optional)</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chief Complaint
              <span className="text-xs text-gray-500 ml-1">(Optional - can be filled later by doctor)</span>
            </label>
            <textarea
              value={appointmentData.complaints.chief}
              onChange={(e) => handleInputChange('appointment', 'complaints', e.target.value, 'chief')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Brief description of patient's main concern..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
              <span className="text-xs text-gray-500 ml-1">(Optional)</span>
            </label>
            <input
              type="text"
              value={appointmentData.complaints.duration}
              onChange={(e) => handleInputChange('appointment', 'complaints', e.target.value, 'duration')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 3 days, 2 weeks"
            />
          </div>
        </div>
      </div>

      {/* Information Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h5 className="text-sm font-medium text-blue-900 mb-1">Next Steps</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• 📝 Patient appointment will be created</p>
              <p>• 👨‍⚕️ Jr Doctor will complete detailed assessment</p>
              <p>• 🩺 Vitals, examination, and diagnosis will be added later</p>
              <p>• 💊 Prescriptions can be issued after assessment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicAppointmentDetails;