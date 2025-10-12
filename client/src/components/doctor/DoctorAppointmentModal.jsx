import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import SeePrescriptionModal from '../common/SeePrescriptionModal';
import ManageDocumentsModal from '../common/ManageDocumentsModal';
import AppointmentDetailsModal from './AppointmentDetailsModal';

const DoctorAppointmentModal = ({ isOpen, onClose, patient, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // ✅ UPDATED: Separate assigned and history appointments
  const [assignedAppointments, setAssignedAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [latestAssigned, setLatestAssigned] = useState(null);
  
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [error, setError] = useState('');

  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedAppointmentForDocuments, setSelectedAppointmentForDocuments] = useState(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState(null);

  const isDoctor = user?.role === 'doctor';

  useEffect(() => {
    if (isOpen && patient) {
      fetchAssignedAppointments();
    }
  }, [isOpen, patient]);

  // ✅ NEW: Fetch only assigned appointments
  const fetchAssignedAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching ASSIGNED appointments for patient:', patient.patientId);
      const response = await apiClient.get(`/doctor/appointments/patient/${patient.patientId}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setAssignedAppointments(data.assignedAppointments || []);
        setLatestAssigned(data.latestAssigned || null);
        
        console.log('Assigned appointments:', data.assignedAppointments?.length || 0);
        console.log('Latest assigned:', data.latestAssigned?.appointmentId);
      }
    } catch (error) {
      console.error('Error fetching assigned appointments:', error);
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Fetch history (completed appointments) on demand
  const fetchCompletedAppointments = async () => {
    if (completedAppointments.length > 0) {
      // Already loaded
      setShowHistory(!showHistory);
      return;
    }

    setLoadingHistory(true);
    try {
      console.log('Fetching COMPLETED appointments for patient:', patient.patientId);
      const response = await apiClient.get(`/doctor/appointments/patient/${patient.patientId}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setCompletedAppointments(data.completedAppointments || []);
        setShowHistory(true);
        
        console.log('Completed appointments:', data.completedAppointments?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching completed appointments:', error);
      setError('Failed to fetch history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreatePrescription = (appointment) => {
    sessionStorage.setItem('returnToAppointments', JSON.stringify({
      patientId: patient.patientId,
      appointmentId: appointment.appointmentId
    }));
    
    navigate(`/prescription/${patient.patientId}?appointmentId=${appointment.appointmentId}&fromAppointment=true`);
    onClose();
  };

  const handleViewPrescriptions = (appointment) => {
    setSelectedAppointment(appointment);
    setShowPrescriptions(true);
  };

  const handleManageDocuments = (appointment) => {
    console.log('Opening documents modal for appointment:', appointment.appointmentId);
    setSelectedAppointmentForDocuments(appointment);
    setShowDocumentsModal(true);
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointmentForDetails(appointment.appointmentId);
    setShowDetailsModal(true);
  };

  const formatDateTime = (date, time) => {
    if (!date) return 'Not scheduled';
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    return time ? `${formattedDate} at ${time}` : formattedDate;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Scheduled': 'bg-blue-50 text-blue-900 border-blue-300',
      'Confirmed': 'bg-green-50 text-green-900 border-green-300',
      'In-Progress': 'bg-gray-900 text-white border-gray-900',
      'Completed': 'bg-green-100 text-green-900 border-green-400',
      'Cancelled': 'bg-red-50 text-red-900 border-red-300',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-900 border-gray-300';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden max-h-[85vh] border border-gray-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">My Appointments</h3>
                <p className="text-xs text-gray-500">
                  {patient?.personalInfo?.fullName} • #{patient?.patientId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={fetchAssignedAppointments}
                disabled={loading}
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button 
                onClick={onClose} 
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                  <span className="text-sm text-gray-600">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-red-600 mb-3">{error}</p>
                <button
                  onClick={fetchAssignedAppointments}
                  className="px-3 py-1.5 text-xs bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : !latestAssigned ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">No active appointments</h4>
                <p className="text-xs text-gray-500">You don't have any assigned appointments for this patient</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Latest Assigned Appointment */}
                {latestAssigned && (
                  <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-4">
                    
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-black text-white text-xs rounded font-semibold">
                          ASSIGNED TO YOU
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded font-medium border ${getStatusColor(latestAssigned.status)}`}>
                          {latestAssigned.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">
                        #{latestAssigned.appointmentId}
                      </span>
                    </div>

                    {/* Appointment Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                      <div>
                        <div className="text-gray-500 mb-0.5">Date & Time</div>
                        <div className="text-gray-900 font-medium">
                          {formatDateTime(latestAssigned.scheduledDate, latestAssigned.scheduledTime)}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">
                          {latestAssigned.appointmentType} • {latestAssigned.mode}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-0.5">Doctor</div>
                        {latestAssigned.doctorId ? (
                          <div className="text-gray-900 font-medium">
                            {latestAssigned.doctorId.profile ? 
                              `Dr. ${latestAssigned.doctorId.profile.firstName} ${latestAssigned.doctorId.profile.lastName}` :
                              'Dr. Unknown'
                            }
                          </div>
                        ) : (
                          <div className="text-gray-400">Not assigned</div>
                        )}
                      </div>
                    </div>

                    {/* Chief Complaints */}
                    {latestAssigned.chiefComplaints?.primary && (
                      <div className="bg-white rounded-lg p-2 mb-3 border border-gray-100">
                        <div className="text-xs font-semibold text-gray-500 mb-1">CHIEF COMPLAINT</div>
                        <p className="text-xs text-gray-900">{latestAssigned.chiefComplaints.primary}</p>
                      </div>
                    )}

                    {/* Diagnosis */}
                    {latestAssigned.examination?.provisionalDiagnosis && (
                      <div className="bg-white rounded-lg p-2 mb-3 border border-gray-100">
                        <div className="text-xs font-semibold text-gray-500 mb-1">PROVISIONAL DIAGNOSIS</div>
                        <p className="text-xs text-gray-900">{latestAssigned.examination.provisionalDiagnosis}</p>
                      </div>
                    )}

                    {/* ✅ FIXED: Prescriptions Section - Always show button, check array properly */}
                    <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-xs font-semibold text-gray-900">
                            Prescriptions ({latestAssigned.prescriptions?.length || 0})
                          </span>
                        </div>
                        {/* ✅ ALWAYS show button */}
                        <button
                          onClick={() => handleViewPrescriptions(latestAssigned)}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors font-medium"
                        >
                          View Prescriptions
                        </button>
                      </div>
                      {latestAssigned.prescriptions && latestAssigned.prescriptions.length > 0 ? (
                        <div className="text-xs text-gray-500">
                          {latestAssigned.prescriptions.length} prescription{latestAssigned.prescriptions.length !== 1 ? 's' : ''} issued
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No prescriptions issued yet</p>
                      )}
                    </div>

                    {/* ✅ NEW: Documents Section */}
                    <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-xs font-semibold text-gray-900">
                            Documents ({latestAssigned.documents?.length || 0})
                          </span>
                        </div>
                        <button
                          onClick={() => handleManageDocuments(latestAssigned)}
                          className="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors font-medium"
                        >
                          Manage Documents
                        </button>
                      </div>
                      {latestAssigned.documents && latestAssigned.documents.length > 0 ? (
                        <div className="text-xs text-gray-500">
                          {latestAssigned.documents.length} document{latestAssigned.documents.length !== 1 ? 's' : ''} uploaded
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No documents uploaded yet</p>
                      )}
                    </div>

                    {/* ✅ FIXED: Action Buttons for Latest Assigned Appointment */}
                    <div className="flex flex-wrap gap-2">
                      {/* View Details Button - NEW */}
                      <button
                        onClick={() => handleViewDetails(latestAssigned)}
                        className="flex-1 min-w-[140px] px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-xs font-semibold flex items-center justify-center space-x-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View Details</span>
                      </button>

                      {/* Create Prescription Button */}
                      {isDoctor && (
                        <button
                          onClick={() => handleCreatePrescription(latestAssigned)}
                          className="flex-1 min-w-[140px] px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-xs font-semibold flex items-center justify-center space-x-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Create Prescription</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Other Assigned Appointments */}
                {assignedAppointments.length > 1 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Other Assigned Appointments ({assignedAppointments.length - 1})</span>
                    </h4>
                    
                    {/* ✅ MAP THROUGH OTHER APPOINTMENTS */}
                    {assignedAppointments.slice(1).map((appointment) => (
                      <div 
                        key={appointment._id || appointment.appointmentId}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-md transition-all"
                      >
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 text-xs rounded font-medium border ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                            <span className="text-xs text-gray-500">{appointment.appointmentType}</span>
                          </div>
                          <span className="text-xs text-gray-400 font-mono">#{appointment.appointmentId}</span>
                        </div>

                        {/* Appointment Info */}
                        <div className="space-y-1.5 mb-3 text-xs">
                          <div className="flex items-center space-x-2 text-gray-700">
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">
                              {formatDateTime(appointment.scheduledDate, appointment.scheduledTime)}
                            </span>
                          </div>

                          {appointment.chiefComplaints?.primary && (
                            <div className="flex items-start space-x-2 text-xs text-gray-600">
                              <svg className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span className="line-clamp-1">{appointment.chiefComplaints.primary}</span>
                            </div>
                          )}

                          {appointment.prescriptions?.length > 0 && (
                            <div className="flex items-center space-x-2 text-xs text-green-600">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">{appointment.prescriptions.length} Prescription(s)</span>
                            </div>
                          )}
                        </div>

                        {/* ✅ ACTION BUTTONS - Same as latest appointment */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                          {/* View Details Button - NEW */}
                          <button
                            onClick={() => handleViewDetails(appointment)}
                            className="flex-1 min-w-[120px] px-2 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all text-xs font-semibold flex items-center justify-center space-x-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View Details</span>
                          </button>

                          {isDoctor && (
                            <button
                              onClick={() => handleCreatePrescription(appointment)}
                              className="flex-1 min-w-[120px] px-2 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-all text-xs font-semibold flex items-center justify-center space-x-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span>Prescription</span>
                            </button>
                          )}

                          {appointment.prescriptions?.length > 0 && (
                            <button
                              onClick={() => handleViewPrescriptions(appointment)}
                              className="px-2 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-all text-xs font-semibold flex items-center space-x-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>View ({appointment.prescriptions.length})</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleManageDocuments(appointment)}
                            className="px-2 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-md hover:bg-orange-100 transition-all text-xs font-semibold flex items-center space-x-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span>Docs ({appointment.documents?.length || 0})</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ✅ NEW: History Button */}
                <div className="border-t border-gray-200 pt-3">
                  <button
                    onClick={fetchCompletedAppointments}
                    disabled={loadingHistory}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-900">
                        {loadingHistory ? 'Loading History...' : `Completed History${completedAppointments.length > 0 ? ` (${completedAppointments.length})` : ''}`}
                      </span>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-gray-600 transition-transform ${showHistory ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* ✅ Show completed appointments with full details */}
                  {showHistory && completedAppointments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {completedAppointments.map((appointment) => (
                        <div 
                          key={appointment._id || appointment.appointmentId}
                          className="bg-green-50/50 border border-green-200 rounded-lg p-3"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded font-medium border border-green-300">
                                ✓ Completed
                              </span>
                              <span className="text-xs text-gray-600">{appointment.appointmentType}</span>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">#{appointment.appointmentId}</span>
                          </div>

                          {/* Appointment Info */}
                          <div className="space-y-1.5 mb-3">
                            {/* Date & Time */}
                            <div className="flex items-center space-x-2 text-xs text-gray-700">
                              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">
                                {formatDateTime(appointment.scheduledDate, appointment.scheduledTime)}
                              </span>
                            </div>

                            {/* Completed Date */}
                            {appointment.completedAt && (
                              <div className="flex items-center space-x-2 text-xs text-green-700">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Completed: {new Date(appointment.completedAt).toLocaleDateString('en-IN', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}</span>
                              </div>
                            )}

                            {/* Doctor Name */}
                            {appointment.doctorId && (
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>
                                  {appointment.doctorId?.profile ? 
                                    `Dr. ${appointment.doctorId.profile.firstName} ${appointment.doctorId.profile.lastName}` : 
                                    'Dr. Unknown'}
                                </span>
                              </div>
                            )}

                            {/* Chief Complaint */}
                            {appointment.chiefComplaints?.primary && (
                              <div className="flex items-start space-x-2 text-xs text-gray-600 bg-white rounded p-1.5">
                                <svg className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                  <span className="text-gray-500 font-semibold">Complaint: </span>
                                  <span>{appointment.chiefComplaints.primary}</span>
                                </div>
                              </div>
                            )}

                            {/* Diagnosis */}
                            {appointment.examination?.provisionalDiagnosis && (
                              <div className="flex items-start space-x-2 text-xs text-gray-600 bg-white rounded p-1.5">
                                <svg className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <div>
                                  <span className="text-gray-500 font-semibold">Diagnosis: </span>
                                  <span>{appointment.examination.provisionalDiagnosis}</span>
                                </div>
                              </div>
                            )}

                            {/* Prescription Count */}
                            {appointment.prescriptions?.length > 0 && (
                              <div className="flex items-center space-x-2 text-xs text-green-600 bg-green-50 rounded p-1.5">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">{appointment.prescriptions.length} Prescription{appointment.prescriptions.length !== 1 ? 's' : ''} Issued</span>
                              </div>
                            )}

                            {/* Document Count */}
                            {appointment.documents?.length > 0 && (
                              <div className="flex items-center space-x-2 text-xs text-orange-600 bg-orange-50 rounded p-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">{appointment.documents.length} Document{appointment.documents.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>

                          {/* ✅ ACTION BUTTONS FOR COMPLETED APPOINTMENTS */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-green-200">
                            {/* Always show View Prescriptions button */}
                            <button
                              onClick={() => handleViewPrescriptions(appointment)}
                              disabled={!appointment.prescriptions || appointment.prescriptions.length === 0}
                              className={`flex-1 px-2 py-1.5 rounded-md transition-all text-xs font-semibold flex items-center justify-center space-x-1 ${
                                appointment.prescriptions?.length > 0
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>
                                {appointment.prescriptions?.length > 0 
                                  ? `View Rx (${appointment.prescriptions.length})`
                                  : 'No Prescriptions'
                                }
                              </span>
                            </button>

                            {/* Documents button */}
                            <button
                              onClick={() => handleManageDocuments(appointment)}
                              className="px-2 py-1.5 bg-orange-600 text-white border border-orange-700 rounded-md hover:bg-orange-700 transition-all text-xs font-semibold flex items-center space-x-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span>Documents ({appointment.documents?.length || 0})</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showHistory && completedAppointments.length === 0 && (
                    <div className="mt-3 text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">No completed appointments found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPrescriptions && selectedAppointment && (
        <SeePrescriptionModal
          isOpen={showPrescriptions}
          onClose={() => {
            setShowPrescriptions(false);
            setSelectedAppointment(null);
            fetchAssignedAppointments();
          }}
          patientId={patient.patientId}
          appointmentId={selectedAppointment.appointmentId}
        />
      )}

      {showDocumentsModal && selectedAppointmentForDocuments && (
        <ManageDocumentsModal
          isOpen={showDocumentsModal}
          onClose={() => {
            setShowDocumentsModal(false);
            setSelectedAppointmentForDocuments(null);
            fetchAssignedAppointments();
          }}
          appointment={selectedAppointmentForDocuments}
          patient={patient}
          onSuccess={() => {
            fetchAssignedAppointments();
          }}
        />
      )}

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointmentForDetails && (
        <AppointmentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAppointmentForDetails(null);
          }}
          appointmentId={selectedAppointmentForDetails}
        />
      )}
    </>
  );
};

export default DoctorAppointmentModal;