import React from 'react';

const PrescriptionsTab = ({ prescriptions }) => {
  if (!prescriptions || prescriptions.count === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No prescriptions issued yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-xs text-green-600 mb-1">Total Prescriptions</p>
          <p className="text-2xl font-bold text-green-900">{prescriptions.count}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-xs text-blue-600 mb-1">Total Medicines</p>
          <p className="text-2xl font-bold text-blue-900">{prescriptions.totalMedicines || 0}</p>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <p className="text-xs text-purple-600 mb-1">Total Tests</p>
          <p className="text-2xl font-bold text-purple-900">{prescriptions.totalTests || 0}</p>
        </div>
      </div>

      {/* Prescription List */}
      {prescriptions.list.map((prescription, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-mono text-sm font-semibold text-gray-900">
                {prescription.prescriptionCode || prescription.prescriptionId?.prescriptionId}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Issued: {new Date(prescription.issuedAt || prescription.prescriptionId?.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              prescription.status === 'Active' ? 'bg-green-100 text-green-800' :
              prescription.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {prescription.status}
            </span>
          </div>

          {/* Medicines */}
          {prescription.prescriptionId?.medicines && prescription.prescriptionId.medicines.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Medicines ({prescription.prescriptionId.medicines.length})
              </h4>
              <div className="space-y-2">
                {prescription.prescriptionId.medicines.map((med, medIndex) => (
                  <div key={medIndex} className="bg-gray-50 rounded p-2 text-xs">
                    <p className="font-medium text-gray-900">
                      {med.medicineId?.name || med.medicineName}
                      {med.medicineId?.strength && <span className="text-gray-600 ml-1">({med.medicineId.strength})</span>}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-gray-600">
                      <div>Dosage: {med.dosage}</div>
                      <div>Frequency: {med.frequency}</div>
                      <div>Duration: {med.duration}</div>
                      <div>Timing: {med.timing}</div>
                    </div>
                    {med.instructions && (
                      <p className="text-gray-500 mt-1 italic">Note: {med.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tests */}
          {prescription.prescriptionId?.tests && prescription.prescriptionId.tests.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Lab Tests ({prescription.prescriptionId.tests.length})
              </h4>
              <div className="space-y-2">
                {prescription.prescriptionId.tests.map((test, testIndex) => (
                  <div key={testIndex} className="bg-gray-50 rounded p-2 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{test.testId?.testName || test.testName}</p>
                      {test.testCode && (
                        <p className="text-gray-500 font-mono">Code: {test.testCode}</p>
                      )}
                    </div>
                    {test.urgency && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        test.urgency === 'Stat' ? 'bg-red-100 text-red-800' :
                        test.urgency === 'Urgent' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {test.urgency}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PrescriptionsTab;