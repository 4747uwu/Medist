import React from 'react';

const PatientInfoTab = ({ patient }) => {
  if (!patient) return null;

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-gray-500 text-xs">Full Name</label>
            <p className="font-medium text-gray-900">{patient.personalInfo?.fullName}</p>
          </div>
          <div>
            <label className="text-gray-500 text-xs">Patient ID</label>
            <p className="font-medium text-gray-900 font-mono">#{patient.patientId}</p>
          </div>
          <div>
            <label className="text-gray-500 text-xs">Age</label>
            <p className="font-medium text-gray-900">{patient.age} years</p>
          </div>
          <div>
            <label className="text-gray-500 text-xs">Date of Birth</label>
            <p className="font-medium text-gray-900">{patient.formattedDOB}</p>
          </div>
          <div>
            <label className="text-gray-500 text-xs">Gender</label>
            <p className="font-medium text-gray-900">{patient.personalInfo?.gender}</p>
          </div>
          <div>
            <label className="text-gray-500 text-xs">Blood Group</label>
            <p className="font-medium text-gray-900">{patient.personalInfo?.bloodGroup || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Contact Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-gray-500 text-xs">Phone</label>
            <p className="font-medium text-gray-900">{patient.contactInfo?.phone}</p>
          </div>
          <div>
            <label className="text-gray-500 text-xs">Email</label>
            <p className="font-medium text-gray-900">{patient.contactInfo?.email || 'Not provided'}</p>
          </div>
          <div className="col-span-2">
            <label className="text-gray-500 text-xs">Address</label>
            <p className="font-medium text-gray-900">
              {patient.contactInfo?.address ? (
                <>
                  {patient.contactInfo.address.street && `${patient.contactInfo.address.street}, `}
                  {patient.contactInfo.address.city && `${patient.contactInfo.address.city}, `}
                  {patient.contactInfo.address.state && `${patient.contactInfo.address.state} - `}
                  {patient.contactInfo.address.pincode}
                </>
              ) : (
                'Not provided'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-50 rounded-lg border border-red-200 p-4">
        <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Emergency Contact
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <label className="text-red-700 text-xs">Name</label>
            <p className="font-medium text-red-900">{patient.emergencyContact?.name}</p>
          </div>
          <div>
            <label className="text-red-700 text-xs">Relationship</label>
            <p className="font-medium text-red-900">{patient.emergencyContact?.relationship}</p>
          </div>
          <div>
            <label className="text-red-700 text-xs">Phone</label>
            <p className="font-medium text-red-900">{patient.emergencyContact?.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientInfoTab;