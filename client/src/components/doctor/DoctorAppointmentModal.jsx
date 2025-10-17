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
      console.log(response);
      
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

  // Add this helper function at the top of the component (after the imports)
  const extractMeetLink = (assignmentNotes) => {
    if (!assignmentNotes) return null;
    
    // Check for Google Meet links in assignment notes
    const meetLinkPattern = /https:\/\/meet\.google\.com\/[a-z-]+/i;
    const match = assignmentNotes.match(meetLinkPattern);
    
    return match ? match[0] : null;
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

                    {/* ✅ NEW: Google Meet Section for Latest Assigned Appointment */}
                    {(latestAssigned.googleMeet?.meetingUri || latestAssigned.meetingLink || extractMeetLink(latestAssigned.assignmentNotes)) && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-semibold text-green-900">Video Consultation Available</span>
                            {extractMeetLink(latestAssigned.assignmentNotes) && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">From Notes</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-xs text-green-700">
                            Meeting Link: {latestAssigned.googleMeet?.meetingUri || latestAssigned.meetingLink || extractMeetLink(latestAssigned.assignmentNotes)}
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const meetLink = latestAssigned.googleMeet?.meetingUri || 
                                                latestAssigned.meetingLink || 
                                                extractMeetLink(latestAssigned.assignmentNotes);
                                window.open(meetLink, '_blank');
                              }}
                              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center justify-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span>Join Video Call</span>
                            </button>
                            
                            <button
                              onClick={async () => {
                                try {
                                  const meetLink = latestAssigned.googleMeet?.meetingUri || 
                                                  latestAssigned.meetingLink || 
                                                  extractMeetLink(latestAssigned.assignmentNotes);
                                  await navigator.clipboard.writeText(meetLink);
                                  alert('Meeting link copied to clipboard!');
                                } catch (error) {
                                  console.error('Failed to copy link:', error);
                                }
                              }}
                              className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center space-x-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span>Copy Link</span>
                            </button>
                          </div>
                          
                          {latestAssigned.assignmentNotes && extractMeetLink(latestAssigned.assignmentNotes) && (
                            <div className="text-xs text-gray-500 bg-white rounded p-1.5">
                              <span className="font-medium">Assignment Notes:</span> {latestAssigned.assignmentNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                      {/* Google Meet Button - Prominent placement */}
                      {(latestAssigned.googleMeet?.meetingUri || latestAssigned.meetingLink || extractMeetLink(latestAssigned.assignmentNotes)) && (
                        <button
                          onClick={() => {
                            const meetLink = latestAssigned.googleMeet?.meetingUri || 
                                            latestAssigned.meetingLink || 
                                            extractMeetLink(latestAssigned.assignmentNotes);
                            window.open(meetLink, '_blank');
                          }}
                          className="flex-1 min-w-[140px] px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-xs font-semibold flex items-center justify-center space-x-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Join Meeting</span>
                        </button>
                      )}

                      {/* View Details Button */}
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
                    
                    {/* ✅ UPDATED: Other appointments with Google Meet support */}
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

                        {/* ✅ NEW: Google Meet section for other appointments */}
                        {(appointment.googleMeet?.meetingUri || appointment.meetingLink || extractMeetLink(appointment.assignmentNotes)) && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs font-semibold text-green-800">Video Call Available</span>
                                {extractMeetLink(appointment.assignmentNotes) && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Notes</span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  const meetLink = appointment.googleMeet?.meetingUri || 
                                                  appointment.meetingLink || 
                                                  extractMeetLink(appointment.assignmentNotes);
                                  window.open(meetLink, '_blank');
                                }}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors font-semibold"
                              >
                                Join
                              </button>
                            </div>
                            {appointment.assignmentNotes && extractMeetLink(appointment.assignmentNotes) && (
                              <div className="mt-1 text-xs text-gray-600 bg-white rounded p-1">
                                <span className="font-medium">Notes:</span> {appointment.assignmentNotes}
                              </div>
                            )}
                          </div>
                        )}

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
                          {/* Google Meet Button */}
                          {(appointment.googleMeet?.meetingUri || appointment.meetingLink || extractMeetLink(appointment.assignmentNotes)) && (
                            <button
                              onClick={() => {
                                const meetLink = appointment.googleMeet?.meetingUri || 
                                                appointment.meetingLink || 
                                                extractMeetLink(appointment.assignmentNotes);
                                window.open(meetLink, '_blank');
                              }}
                              className="flex-1 min-w-[100px] px-2 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all text-xs font-semibold flex items-center justify-center space-x-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span>Join Meet</span>
                            </button>
                          )}

                          {/* View Details Button */}
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ✅ UPDATED: History section with Google Meet support */}
                {showHistory && completedAppointments.map((appointment) => (
                  <div key={appointment._id || appointment.appointmentId} className="bg-green-50/50 border border-green-200 rounded-lg p-3">
                    {/* Existing completed appointment content... */}

                    {/* ✅ Google Meet section for completed appointments */}
                    {(appointment.googleMeet?.meetingUri || appointment.meetingLink || extractMeetLink(appointment.assignmentNotes)) && (
                      <div className="flex items-center space-x-2 text-xs text-green-700 bg-white rounded p-1.5 mb-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Video consultation was conducted</span>
                        {extractMeetLink(appointment.assignmentNotes) && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">From Notes</span>
                        )}
                        <button
                          onClick={() => {
                            const meetLink = appointment.googleMeet?.meetingUri || 
                                            appointment.meetingLink || 
                                            extractMeetLink(appointment.assignmentNotes);
                            window.open(meetLink, '_blank');
                          }}
                          className="ml-auto px-2 py-0.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          View Link
                        </button>
                      </div>
                    )}

                    {/* ... rest of existing completed appointment content ... */}
                  </div>
                ))}
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