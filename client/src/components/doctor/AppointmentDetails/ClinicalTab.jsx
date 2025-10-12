import React from 'react';

const ClinicalTab = ({ clinical }) => {
  if (!clinical) return null;

  const { chiefComplaints, examination, hasFindings } = clinical;

  if (!hasFindings) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No clinical findings recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chief Complaints */}
      {chiefComplaints?.primary && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Chief Complaints
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-red-700 text-xs font-medium">Primary Complaint</label>
              <p className="text-red-900 font-medium mt-1">{chiefComplaints.primary}</p>
            </div>
            {chiefComplaints.secondary && chiefComplaints.secondary.length > 0 && (
              <div>
                <label className="text-red-700 text-xs font-medium">Secondary Complaints</label>
                <ul className="text-red-900 mt-1 list-disc list-inside">
                  {chiefComplaints.secondary.map((complaint, index) => (
                    <li key={index}>{complaint}</li>
                  ))}
                </ul>
              </div>
            )}
            {chiefComplaints.duration && (
              <div className="flex items-center space-x-4 text-red-800">
                <div>
                  <span className="text-xs text-red-600">Duration:</span>
                  <span className="ml-2 font-medium">{chiefComplaints.duration}</span>
                </div>
                {chiefComplaints.severity && (
                  <div>
                    <span className="text-xs text-red-600">Severity:</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                      chiefComplaints.severity === 'Critical' ? 'bg-red-200 text-red-900' :
                      chiefComplaints.severity === 'Severe' ? 'bg-orange-200 text-orange-900' :
                      chiefComplaints.severity === 'Moderate' ? 'bg-yellow-200 text-yellow-900' :
                      'bg-green-200 text-green-900'
                    }`}>
                      {chiefComplaints.severity}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Physical Examination */}
      {examination?.physicalFindings && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Physical Examination Findings
          </h3>
          <div className="text-sm">
            <p className="text-blue-900 whitespace-pre-wrap">{examination.physicalFindings}</p>
          </div>
        </div>
      )}

      {/* Provisional Diagnosis */}
      {examination?.provisionalDiagnosis && (
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Provisional Diagnosis
          </h3>
          <div className="text-sm">
            <p className="text-purple-900 font-medium">{examination.provisionalDiagnosis}</p>
          </div>
        </div>
      )}

      {/* Differential Diagnosis */}
      {examination?.differentialDiagnosis && examination.differentialDiagnosis.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Differential Diagnosis
          </h3>
          <ul className="space-y-2 text-sm">
            {examination.differentialDiagnosis.map((diagnosis, index) => (
              <li key={index} className="flex items-center text-gray-700">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-medium mr-2">
                  {index + 1}
                </span>
                {diagnosis}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClinicalTab;