import React, { useState } from 'react';
import SimpleAssignmentModal from './SimpleAssignmentModal';
import EditPatientModal from './EditPatientModal';
import SeePrescriptionModal from './SeePrescriptionModal';
import AppointmentListModal from './AppointmentListModal';

const WorklistTable = ({ 
  patients = [], 
  loading = false, 
  onPatientSelect, 
  onAssignPatient,
  onViewReport,
  showActions = true,
  showWorkflowFilter = false,
  workflowFilter = 'all',
  onWorkflowFilterChange,
  stats = {}
}) => {
  const [columnConfig, setColumnConfig] = useState({
    status: true,
    patientId: true,
    name: true,
    ageSex: true,
    bloodGroup: true,
    description: true,
    location: true,
    registrationDate: true,
    lastAppointment: true,
    reportedDate: true,
    reportedBy: true,
    prescription: true,
    appointments: true
  });

  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [selectedPatientForAssignment, setSelectedPatientForAssignment] = useState(null);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
  const [selectedPrescriptionPatient, setSelectedPrescriptionPatient] = useState(null);
  const [selectedPatientForAppointments, setSelectedPatientForAppointments] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const getStatusIcon = (status) => {
    const statusMap = {
      'New': { color: 'bg-slate-500', textColor: 'text-slate-700', bgColor: 'bg-slate-50 border-slate-200' },
      'Assigned': { color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
      'Revisited': { color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
      'Doctor Opened': { color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
      'In Progress': { color: 'bg-indigo-500', textColor: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
      'Reported': { color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
      'Completed': { color: 'bg-green-600', textColor: 'text-green-700', bgColor: 'bg-green-50 border-green-200' }
    };
    
    const statusInfo = statusMap[status] || { color: 'bg-gray-400', textColor: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200' };
    
    return (
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.color}`}></div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
          {status || 'New'}
        </span>
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit' // Shortened year for compactness
    });
  };

  const getBloodGroupDisplay = (bloodGroup) => {
    if (!bloodGroup) return <span className="text-gray-400 text-xs">N/A</span>;
    
    const colorMap = {
      'A+': 'bg-red-100 text-red-800 border-red-200',
      'A-': 'bg-red-50 text-red-700 border-red-200',
      'B+': 'bg-blue-100 text-blue-800 border-blue-200',
      'B-': 'bg-blue-50 text-blue-700 border-blue-200',
      'AB+': 'bg-purple-100 text-purple-800 border-purple-200',
      'AB-': 'bg-purple-50 text-purple-700 border-purple-200',
      'O+': 'bg-green-100 text-green-800 border-green-200',
      'O-': 'bg-green-50 text-green-700 border-green-200'
    };

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold border ${colorMap[bloodGroup] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {bloodGroup}
      </span>
    );
  };

  const toggleColumn = (columnKey) => {
    setColumnConfig(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const visibleColumns = Object.entries(columnConfig).filter(([_, visible]) => visible);

  const handleAssignClick = (patient) => {
    setSelectedPatientForAssignment(patient);
  };

  const handleAssignmentSuccess = (result) => {
    console.log('Assignment successful:', result);
    setSelectedPatientForAssignment(null);
    if (onAssignPatient) {
      onAssignPatient(result);
    }
  };

  const handlePatientIdClick = (patient) => {
    setSelectedPatientForEdit(patient.patientId);
    setShowEditModal(true);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setSelectedPatientForEdit(null);
  };

  const handleEditSuccess = (updatedPatient) => {
    console.log('Patient updated successfully:', updatedPatient);
  };

  const openPrescription = (prescriptionId, patientId) => {
    setSelectedPrescriptionId(prescriptionId || null);
    setSelectedPrescriptionPatient(patientId || null);
  };

  const closePrescription = () => {
    setSelectedPrescriptionId(null);
    setSelectedPrescriptionPatient(null);
  };

  const handleAppointmentClick = (patient) => {
    setSelectedPatientForAppointments(patient);
    setShowAppointmentModal(true);
  };

  const handleAppointmentModalClose = () => {
    setShowAppointmentModal(false);
    setSelectedPatientForAppointments(null);
  };

  const handleAppointmentSuccess = (result) => {
    console.log('Appointment operation successful:', result);
    if (onAssignPatient) {
      onAssignPatient(result);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-white border border-gray-300">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-xs text-gray-600 font-medium">Loading patients...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* COMPACT TABLE CONTAINER */}
      <div className="h-screen flex flex-col bg-white border border-gray-300 overflow-hidden">
        {/* COMPACT HEADER */}
        <div className="bg-gray-50 flex space border-b border-gray-300 px-3 py-2 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                
                <h3 className="text-sm font-semibold text-gray-900">Patient Worklist</h3>
                <span className="text-xs text-gray-500">
                  {patients.length} patient{patients.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {showWorkflowFilter && (
                <div className="flex items-center justify-end gap-144">
                  <span className="text-xs font-medium text-gray-600">:</span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onWorkflowFilterChange && onWorkflowFilterChange('all')}
                      className={`px-2 py-1 text-xs rounded font-medium transition-all duration-200 ${
                        workflowFilter === 'all'
                          ? 'bg-gray-900 text-white shadow'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      All ({stats?.total || 0})
                    </button>
                    <button
                      onClick={() => onWorkflowFilterChange && onWorkflowFilterChange('pending')}
                      className={`px-2 py-1 text-xs rounded font-medium transition-all duration-200 ${
                        workflowFilter === 'pending'
                          ? 'bg-amber-500 text-white shadow'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      Pending ({stats?.pending || 0})
                    </button>
                    <button
                      onClick={() => onWorkflowFilterChange && onWorkflowFilterChange('inprogress')}
                      className={`px-2 py-1 text-xs rounded font-medium transition-all duration-200 ${
                        workflowFilter === 'inprogress'
                          ? 'bg-blue-500 text-white shadow'
                          : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      In Progress ({stats?.inprogress || 0})
                    </button>
                    <button
                      onClick={() => onWorkflowFilterChange && onWorkflowFilterChange('completed')}
                      className={`px-2 py-1 text-xs rounded font-medium transition-all duration-200 ${
                        workflowFilter === 'completed'
                          ? 'bg-green-500 text-white shadow'
                          : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      }`}
                    >
                      Completed ({stats?.completed || 0})
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowColumnConfig(!showColumnConfig)}
                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1 font-medium"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Columns
              </button>

              {showColumnConfig && (
                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Configure Columns</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(columnConfig).map(([key, visible]) => (
                      <label key={key} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={visible}
                          onChange={() => toggleColumn(key)}
                          className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="capitalize text-gray-700 font-medium">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => setShowColumnConfig(false)}
                      className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COMPACT TABLE */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs">
            {/* COMPACT TABLE HEADER */}
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {columnConfig.status && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[90px]">
                    Status
                  </th>
                )}
                {columnConfig.patientId && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[80px]">
                    Patient ID
                  </th>
                )}
                {columnConfig.name && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[140px]">
                    Patient Name
                  </th>
                )}
                {columnConfig.ageSex && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[60px]">
                    Age/Sex
                  </th>
                )}
                {columnConfig.bloodGroup && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[80px]">
                    Blood Group
                  </th>
                )}
                {columnConfig.description && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[160px]">
                    Description
                  </th>
                )}
                {columnConfig.location && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[100px]">
                    Location
                  </th>
                )}
                {columnConfig.registrationDate && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[90px]">
                    Registration Date
                  </th>
                )}
                {columnConfig.lastAppointment && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[120px]">
                    Last Appointment
                  </th>
                )}
                {columnConfig.reportedDate && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[100px]">
                    Reported Date
                  </th>
                )}
                {columnConfig.reportedBy && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[120px]">
                    Reported By
                  </th>
                )}
                {columnConfig.prescription && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[100px]">
                    Prescription
                  </th>
                )}
                {columnConfig.appointments && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[100px]">
                    Appointments
                  </th>
                )}
              </tr>
            </thead>

            {/* COMPACT TABLE BODY */}
            <tbody className="bg-white">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="border border-gray-300 px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">No patients found</p>
                        <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((patient, index) => (
                  <tr
                    key={patient._id || patient.patientId || index}
                    className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                    onClick={() => onPatientSelect && onPatientSelect(patient)}
                  >
                    {columnConfig.status && (
                      <td className="border border-gray-300 px-2 py-2 text-xs">
                        {getStatusIcon(patient.workflowStatus || patient.status)}
                      </td>
                    )}
                    {columnConfig.patientId && (
                      <td className="border border-gray-300 px-2 py-2 text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePatientIdClick(patient);
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          #{patient.patientId || 'N/A'}
                        </button>
                      </td>
                    )}
                    {columnConfig.name && (
                      <td className="border border-gray-300 px-2 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">
                              {patient.personalInfo?.fullName?.charAt(0) || 'P'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-gray-900 truncate">
                              {patient.personalInfo?.fullName || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    {columnConfig.ageSex && (
                      <td className="border border-gray-300 px-2 py-2 text-xs text-center">
                        <div className="font-medium text-gray-900">
                          {patient.personalInfo?.age || 'N/A'} / {patient.personalInfo?.gender?.charAt(0) || 'N/A'}
                        </div>
                      </td>
                    )}
                    {columnConfig.bloodGroup && (
                      <td className="border border-gray-300 px-2 py-2 text-xs text-center">
                        {getBloodGroupDisplay(patient.personalInfo?.bloodGroup)}
                      </td>
                    )}
                    {columnConfig.description && (
                      <td className="border border-gray-300 px-2 py-2 text-xs">
                        <div className="text-gray-900 line-clamp-2">
                          {patient.currentVisit?.complaints?.chief || patient.description || 'No description'}
                        </div>
                      </td>
                    )}
                    {columnConfig.location && (
                      <td className="border border-gray-300 px-2 py-2 text-xs">
                        <div className="font-medium text-gray-900 truncate">
                          {patient.labName || patient.lab?.labName || patient.labId || 'N/A'}
                        </div>
                        {patient.labId && patient.labName && (
                          <div className="text-xs text-gray-500 truncate">
                            {patient.labId}
                          </div>
                        )}
                      </td>
                    )}
                    {columnConfig.registrationDate && (
                      <td className="border border-gray-300 px-2 py-2 text-xs text-center">
                        <div className="text-gray-900">
                          {formatDate(patient.registrationDate || patient.createdAt)}
                        </div>
                      </td>
                    )}
                    {columnConfig.lastAppointment && (
                      <td className="border border-gray-300 px-2 py-2 text-xs">
                        <div className="text-gray-900">
                          {formatDate(patient.lastAppointment?.date)}
                        </div>
                        {patient.lastAppointment?.doctor && patient.lastAppointment.doctor !== 'N/A' && (
                          <div className="text-xs text-gray-500 truncate">
                            {patient.lastAppointment.doctor}
                          </div>
                        )}
                      </td>
                    )}
                    {columnConfig.reportedDate && (
                      <td className="border border-gray-300 px-2 py-2 text-xs text-center">
                        <div className="text-gray-900">
                          {formatDate(patient.reportedDetails?.date)}
                        </div>
                      </td>
                    )}
                    {columnConfig.reportedBy && (
                      <td className="border border-gray-300 px-2 py-2 text-xs">
                        <div className="text-gray-900 truncate">
                          {patient.reportedDetails?.by || 'N/A'}
                        </div>
                      </td>
                    )}
                    {columnConfig.prescription && (
                      <td className="border border-gray-300 px-2 py-2 text-xs text-center">
                        {(patient.prescriptions && patient.prescriptions.length > 0) || patient.currentVisit?.prescription ? (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              openPrescription(
                                (patient.prescriptions && patient.prescriptions[0] && patient.prescriptions[0]._id) || patient.currentVisit?.prescription?.prescriptionId,
                                patient.patientId
                              ); 
                            }}
                            className="inline-flex items-center px-1.5 py-0.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                    )}
                    {columnConfig.appointments && (
                      <td className="border border-gray-300 px-2 py-2 text-xs text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentClick(patient);
                            }}
                            className="inline-flex items-center px-1.5 py-0.5 border border-indigo-300 text-xs font-medium rounded text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                          >
                            View
                            {patient.appointments?.stats?.totalAppointments > 0 && (
                              <span className="ml-1 px-1 py-0.5 bg-indigo-200 text-indigo-800 rounded-full text-xs">
                                {patient.appointments.stats.totalAppointments}
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* COMPACT FOOTER */}
        <div className="bg-gray-100 px-3 py-2 border-t border-gray-300 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-700 font-medium">
                Showing <span className="font-bold text-gray-900">{patients.length}</span> patient{patients.length !== 1 ? 's' : ''}
                {stats?.total && stats.total !== patients.length && (
                  <span> of <span className="font-bold text-gray-900">{stats.total}</span> total</span>
                )}
              </div>
              {stats?.total && (
                <div className="flex items-center gap-1">
                  <div className="w-16 bg-gray-300 rounded-full h-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                      style={{ width: `${(patients.length / stats.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round((patients.length / stats.total) * 100)}%
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">
                <span className="font-medium">{visibleColumns.length}</span> of {Object.keys(columnConfig).length} columns visible
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Live Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SimpleAssignmentModal
        isOpen={!!selectedPatientForAssignment}
        onClose={() => setSelectedPatientForAssignment(null)}
        patient={selectedPatientForAssignment}
        onSuccess={handleAssignmentSuccess}
      />

      <EditPatientModal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        patientId={selectedPatientForEdit}
        onSuccess={handleEditSuccess}
      />

      <SeePrescriptionModal
        isOpen={!!selectedPrescriptionId || !!selectedPrescriptionPatient}
        onClose={closePrescription}
        prescriptionId={selectedPrescriptionId}
        patientId={selectedPrescriptionPatient}
      />

      <AppointmentListModal
        isOpen={showAppointmentModal}
        onClose={handleAppointmentModalClose}
        patient={selectedPatientForAppointments}
        onSuccess={handleAppointmentSuccess}
      />
    </>
  );
};

export default WorklistTable;