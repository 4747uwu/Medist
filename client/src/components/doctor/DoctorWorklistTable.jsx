import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ManageDocumentsModal from '../common/ManageDocumentsModal';
import DoctorAppointmentModal from './DoctorAppointmentModal'; // ✅ Use the updated modal

const DoctorWorklistTable = ({ 
  patients = [], 
  loading = false, 
  onPatientSelect, 
  onUpdateStatus,
  onViewReport,
  showWorkflowFilter = false,
  workflowFilter = 'all',
  onWorkflowFilterChange,
  stats = {}
}) => {
  const { user } = useAuth();
  const [columnConfig, setColumnConfig] = useState({
    status: true,
    patientId: true,
    name: true,
    ageSex: true,
    description: true,
    location: true,
    date: true,
    report: true,
    documents: true,
    appointments: true,
  });

  // Documents modal state
  const [selectedPatientForDocuments, setSelectedPatientForDocuments] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);

  // ✅ Appointments modal state
  const [selectedPatientForAppointments, setSelectedPatientForAppointments] = useState(null);
  const [showDoctorAppointmentModal, setShowDoctorAppointmentModal] = useState(false);

  const isDoctor = user?.role === 'doctor';

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
      year: '2-digit'
    });
  };

  const getNextStatus = (currentStatus) => {
    const workflow = {
      'Assigned': 'Doctor Opened',
      'Doctor Opened': 'In Progress',
      'In Progress': 'Reported',
      'Reported': 'Completed'
    };
    return workflow[currentStatus];
  };

  const handleStatusUpdate = (patient, newStatus) => {
    // ✅ UPDATED: Update appointment status, not patient status
    const latestAppointment = patient.latestAppointment || patient.doctorAppointments?.[0];
    
    if (latestAppointment) {
      onUpdateStatus && onUpdateStatus(latestAppointment.appointmentId, newStatus);
    } else {
      console.error('No appointment found for patient:', patient.patientId);
    }
  };

  const handleCreatePrescription = (patient) => {
    console.log('Creating prescription for patient:', patient);
    setSelectedPatientForPrescription(patient);
    setShowPrescriptionModal(true);
  };

  const handlePrescriptionSuccess = (prescription) => {
    console.log('Prescription created successfully:', prescription);
    setShowPrescriptionModal(false);
    setSelectedPatientForPrescription(null);
  };

  const toggleColumn = (columnKey) => {
    setColumnConfig(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const visibleColumns = Object.entries(columnConfig).filter(([_, visible]) => visible);

  const handleDocumentsClick = (patient) => {
    setSelectedPatientForDocuments(patient);
    setShowDocumentsModal(true);
  };

  const handleDocumentsModalClose = () => {
    setShowDocumentsModal(false);
    setSelectedPatientForDocuments(null);
  };

  const handleDocumentsSuccess = (result) => {
    console.log('Documents operation successful:', result);
  };

  // ✅ Appointment handlers
  const handleAppointmentClick = (patient) => {
    setSelectedPatientForAppointments(patient);
    setShowDoctorAppointmentModal(true);
  };

  const handleAppointmentModalClose = () => {
    setShowDoctorAppointmentModal(false);
    setSelectedPatientForAppointments(null);
  };

  const handleAppointmentSuccess = (result) => {
    console.log('Appointment operation successful:', result);
    if (onUpdateStatus && result.patient) {
      onUpdateStatus(result.patient.patientId, result.patient.workflowStatus);
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
      {/* Table */}
      <div className="h-screen flex flex-col bg-white border border-gray-300 overflow-hidden">
        {/* WORKFLOW FILTER HEADER */}
        {showWorkflowFilter && (
          <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">Workflow Status:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onWorkflowFilterChange && onWorkflowFilterChange('all')}
                  className={`px-2 py-1 text-xs rounded font-medium transition-all duration-200 ${
                    workflowFilter === 'all'
                      ? 'bg-gray-900 text-white shadow'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All ({stats?.all || 0})
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
          </div>
        )}

        {/* COMPACT TABLE */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs">
            {/* COMPACT TABLE HEADER */}
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {columnConfig.status && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[90px]">
                    STATUS
                  </th>
                )}
                {columnConfig.patientId && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[100px]">
                    PATIENT ID
                  </th>
                )}
                {columnConfig.name && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[180px]">
                    PATIENT NAME
                  </th>
                )}
                {columnConfig.ageSex && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[80px]">
                    AGE/SEX
                  </th>
                )}
                {columnConfig.description && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[160px]">
                    DESCRIPTION
                  </th>
                )}
                {columnConfig.location && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[120px]">
                    LOCATION
                  </th>
                )}
                {columnConfig.date && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[100px]">
                    DATE
                  </th>
                )}
                {columnConfig.report && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[100px]">
                    REPORT
                  </th>
                )}
                {columnConfig.documents && (
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-bold text-gray-700 uppercase bg-gray-200 min-w-[100px]">
                    Documents
                  </th>
                )}
                {/* ✅ ADD: Appointments column */}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">No assigned patients</p>
                        <p className="text-xs text-gray-500 mt-1">You don't have any assigned patients at the moment</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((patient, index) => {
                  const nextStatus = getNextStatus(patient.workflowStatus);
                  
                  return (
                    <tr
                      key={patient._id || patient.patientId || index}
                      className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                      onClick={() => onPatientSelect && onPatientSelect(patient)}
                    >
                      {/* STATUS */}
                      {columnConfig.status && (
                        <td className="border border-gray-300 px-2 py-2 text-xs">
                          {getStatusIcon(patient.workflowStatus || patient.status)}
                        </td>
                      )}

                      {/* PATIENT ID */}
                      {columnConfig.patientId && (
                        <td className="border border-gray-300 px-2 py-2 text-xs">
                          <span className="text-xs font-medium text-blue-600">
                            {patient.patientId || 'N/A'}
                          </span>
                        </td>
                      )}

                      {/* PATIENT NAME */}
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
                              {patient.assignment?.doctorName && (
                                <div className="text-xs text-gray-500 truncate">
                                  Dr. {patient.assignment.doctorName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      )}

                      {/* AGE/SEX */}
                      {columnConfig.ageSex && (
                        <td className="border border-gray-300 px-2 py-2 text-xs text-center">
                          <div className="font-medium text-gray-900">
                            {patient.personalInfo?.age || 'N/A'} / {patient.personalInfo?.gender?.charAt(0) || 'N/A'}
                          </div>
                        </td>
                      )}

                      {/* DESCRIPTION */}
                      {columnConfig.description && (
                        <td className="border border-gray-300 px-2 py-2 text-xs">
                          <div className="text-gray-900 line-clamp-2">
                            {patient.currentVisit?.complaints?.chief || patient.description || 'No description'}
                          </div>
                        </td>
                      )}

                      {/* LOCATION */}
                      {columnConfig.location && (
                        <td className="border border-gray-300 px-2 py-2 text-xs">
                          <div className="font-medium text-gray-900 truncate">
                            {patient.labName || patient.lab?.labName || patient.labId || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {patient.currentVisit?.appointment?.mode || 'In-person'}
                          </div>
                        </td>
                      )}

                      {/* DATE */}
                      {columnConfig.date && (
                        <td className="border border-gray-300 px-2 py-2 text-xs text-center">
                          <div className="text-gray-900">
                            {formatDate(patient.currentVisit?.appointment?.date || patient.lastActivity || patient.registrationDate)}
                          </div>
                        </td>
                      )}

                      {/* REPORT */}
                      {columnConfig.report && (
                        <td className="border border-gray-300 px-2 py-2 text-xs text-center">
                          {patient.reportUrl || patient.currentVisit?.reportUrl ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewReport && onViewReport(patient);
                              }}
                              className="inline-flex items-center px-1.5 py-0.5 border border-purple-300 text-xs font-medium rounded text-purple-700 bg-purple-50 hover:bg-purple-100"
                            >
                              View Report
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">No Report</span>
                          )}
                        </td>
                      )}

                      {/* DOCUMENTS */}
                      {columnConfig.documents && (
                        <td className="border border-gray-300 px-2 py-2 text-xs text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDocumentsClick(patient);
                            }}
                            className="inline-flex items-center px-1.5 py-0.5 border border-orange-300 text-xs font-medium rounded text-orange-700 bg-orange-50 hover:bg-orange-100"
                          >
                            View
                            {patient.documents && patient.documents.length > 0 && (
                              <span className="ml-1 px-1 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs">
                                {patient.documents.length}
                              </span>
                            )}
                          </button>
                        </td>
                      )}

                      {/* ✅ ADD: APPOINTMENTS COLUMN */}
                      {columnConfig.appointments && (
                        <td className="border border-gray-300 px-2 py-2 text-xs text-center">
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
                        </td>
                      )}

                      {/* ACTIONS */}
                     
                    </tr>
                  );
                })
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

      {/* Documents Modal */}
      <ManageDocumentsModal
        isOpen={showDocumentsModal}
        onClose={handleDocumentsModalClose}
        patient={selectedPatientForDocuments}
        onSuccess={handleDocumentsSuccess}
      />

      {/* ✅ Doctor Appointments Modal - Uses PrescriptionPage for creating prescriptions */}
      <DoctorAppointmentModal
        isOpen={showDoctorAppointmentModal}
        onClose={handleAppointmentModalClose}
        patient={selectedPatientForAppointments}
        onSuccess={handleAppointmentSuccess}
      />
    </>
  );
};

export default DoctorWorklistTable;