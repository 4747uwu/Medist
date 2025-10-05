import React from 'react';

const PatientListView = ({ patients, loading, onPatientSelect, onStatusUpdate }) => {
  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-gray-100 text-gray-800',
      'Assigned': 'bg-yellow-100 text-yellow-800',
      'Doctor Opened': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Reported': 'bg-green-100 text-green-800',
      'Completed': 'bg-green-100 text-green-800',
      'Revisited': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNextStatus = (currentStatus) => {
    const workflow = {
      'New': 'Assigned',
      'Assigned': 'Doctor Opened',
      'Doctor Opened': 'In Progress',
      'In Progress': 'Reported',
      'Reported': 'Completed',
      'Completed': 'Revisited'
    };
    return workflow[currentStatus];
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <span className="ml-2 text-sm text-gray-600">Loading patients...</span>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new patient record.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Activity
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr 
                key={patient.patientId} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onPatientSelect(patient)}
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {patient.personalInfo.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {patient.personalInfo.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {patient.patientId} • {patient.personalInfo.age}y • {patient.personalInfo.gender}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{patient.contactInfo.phone}</div>
                  {patient.contactInfo.email && (
                    <div className="text-xs text-gray-500">{patient.contactInfo.email}</div>
                  )}
                </td>

                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(patient.workflowStatus)}`}>
                    {patient.workflowStatus}
                  </span>
                </td>

                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  {new Date(patient.lastActivity).toLocaleDateString()}
                  <div className="text-xs text-gray-400">
                    {new Date(patient.lastActivity).toLocaleTimeString()}
                  </div>
                </td>

                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {getNextStatus(patient.workflowStatus) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusUpdate(patient.patientId, getNextStatus(patient.workflowStatus));
                        }}
                        className="text-blue-600 hover:text-blue-900 text-xs"
                      >
                        → {getNextStatus(patient.workflowStatus)}
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPatientSelect(patient);
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientListView;