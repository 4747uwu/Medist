import React from 'react';

const HistoryTab = ({ history }) => {
  if (!history) return null;

  const { chronicConditions, allergies, pastSurgeries, familyHistory, previousAppointments } = history;

  const hasAnyHistory = 
    (chronicConditions && chronicConditions.length > 0) ||
    (allergies && allergies.length > 0) ||
    (pastSurgeries && pastSurgeries.length > 0) ||
    (familyHistory && familyHistory.length > 0) ||
    (previousAppointments && previousAppointments.length > 0);

  if (!hasAnyHistory) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No medical history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chronic Conditions */}
      {chronicConditions && chronicConditions.length > 0 && (
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <h3 className="text-sm font-semibold text-orange-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Chronic Conditions ({chronicConditions.length})
          </h3>
          <div className="space-y-2">
            {chronicConditions.map((condition, index) => (
              <div key={index} className="bg-white rounded border border-orange-200 p-3 text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-orange-900">{condition.condition}</p>
                    {condition.diagnosedDate && (
                      <p className="text-xs text-orange-700 mt-1">
                        Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString('en-IN')}
                      </p>
                    )}
                    {condition.notes && (
                      <p className="text-xs text-gray-600 mt-1">{condition.notes}</p>
                    )}
                  </div>
                  {condition.severity && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      condition.severity === 'Severe' ? 'bg-red-200 text-red-900' :
                      condition.severity === 'Moderate' ? 'bg-yellow-200 text-yellow-900' :
                      'bg-green-200 text-green-900'
                    }`}>
                      {condition.severity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allergies */}
      {allergies && allergies.length > 0 && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Allergies ({allergies.length})
          </h3>
          <div className="space-y-2">
            {allergies.map((allergy, index) => (
              <div key={index} className="bg-white rounded border border-red-200 p-3 text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-red-900">{allergy.allergen}</p>
                    <p className="text-xs text-red-700 mt-1">Reaction: {allergy.reaction}</p>
                  </div>
                  {allergy.severity && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      allergy.severity === 'Life-threatening' ? 'bg-red-600 text-white' :
                      allergy.severity === 'Severe' ? 'bg-red-200 text-red-900' :
                      allergy.severity === 'Moderate' ? 'bg-yellow-200 text-yellow-900' :
                      'bg-green-200 text-green-900'
                    }`}>
                      {allergy.severity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Surgeries */}
      {pastSurgeries && pastSurgeries.length > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Past Surgeries ({pastSurgeries.length})
          </h3>
          <div className="space-y-2">
            {pastSurgeries.map((surgery, index) => (
              <div key={index} className="bg-white rounded border border-blue-200 p-3 text-sm">
                <p className="font-medium text-blue-900">{surgery.surgery}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-blue-700">
                  {surgery.date && (
                    <div>
                      <span className="text-blue-600">Date:</span> {new Date(surgery.date).toLocaleDateString('en-IN')}
                    </div>
                  )}
                  {surgery.hospital && (
                    <div>
                      <span className="text-blue-600">Hospital:</span> {surgery.hospital}
                    </div>
                  )}
                  {surgery.surgeon && (
                    <div className="col-span-2">
                      <span className="text-blue-600">Surgeon:</span> {surgery.surgeon}
                    </div>
                  )}
                </div>
                {surgery.notes && (
                  <p className="text-xs text-gray-600 mt-2">{surgery.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Family History */}
      {familyHistory && familyHistory.length > 0 && (
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Family History ({familyHistory.length})
          </h3>
          <div className="space-y-2">
            {familyHistory.map((item, index) => (
              <div key={index} className="bg-white rounded border border-purple-200 p-3 text-sm flex items-start justify-between">
                <div>
                  <p className="font-medium text-purple-900">{item.condition}</p>
                  <p className="text-xs text-purple-700 mt-1">Relation: {item.relation}</p>
                  {item.notes && (
                    <p className="text-xs text-gray-600 mt-1">{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Appointments */}
      {previousAppointments && previousAppointments.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Recent Visits ({previousAppointments.length})
          </h3>
          <div className="space-y-2">
            {previousAppointments.map((apt, index) => (
              <div key={index} className="bg-white rounded border border-gray-200 p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-gray-500">#{apt.appointmentId}</span>
                  <span className="text-xs text-gray-600">
                    {new Date(apt.scheduledDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
                {apt.chiefComplaints?.primary && (
                  <p className="text-gray-700 mb-1">
                    <span className="text-gray-500">Complaint:</span> {apt.chiefComplaints.primary}
                  </p>
                )}
                {apt.examination?.provisionalDiagnosis && (
                  <p className="text-gray-700">
                    <span className="text-gray-500">Diagnosis:</span> {apt.examination.provisionalDiagnosis}
                  </p>
                )}
                {apt.prescriptions && apt.prescriptions.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ {apt.prescriptions.length} prescription(s) issued
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;