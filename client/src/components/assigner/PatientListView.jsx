import React from 'react';

const PatientListView = ({ patients, loading, onPatientSelect }) => {
  console.log('PatientListView - Patients:', patients?.length, 'Loading:', loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (!patients || patients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
        <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-1">ID</div>
          <div className="col-span-3">Patient Name</div>
          <div className="col-span-2">Age / Gender</div>
          <div className="col-span-2">Blood Group</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-2">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {patients.map((patient) => (
          <div
            key={patient._id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => onPatientSelect && onPatientSelect(patient)}
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Patient ID */}
              <div className="col-span-1">
                <span className="text-xs font-mono text-gray-600">
                  {patient.patientId?.slice(-6) || 'N/A'}
                </span>
              </div>

              {/* Patient Name with Avatar */}
              <div className="col-span-3 flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                  {patient.personalInfo?.fullName?.charAt(0) || 'P'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.personalInfo?.fullName || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {patient.status || 'Active'}
                  </p>
                </div>
              </div>

              {/* Age and Gender */}
              <div className="col-span-2">
                <p className="text-sm text-gray-900">
                  {patient.personalInfo?.age || 'N/A'} years
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {patient.personalInfo?.gender || 'N/A'}
                </p>
              </div>

              {/* Blood Group */}
              <div className="col-span-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {patient.personalInfo?.bloodGroup || 'N/A'}
                </span>
              </div>

              {/* Contact */}
              <div className="col-span-2">
                <p className="text-sm text-gray-900">
                  {patient.contactInfo?.phone || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {patient.contactInfo?.email || 'No email'}
                </p>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Assign patient:', patient._id);
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                >
                  Assign
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('View patient:', patient._id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="View details"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientListView;