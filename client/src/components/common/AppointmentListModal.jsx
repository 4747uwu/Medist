import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import AppointmentAssignmentModal from './AppointmentAssignmentModal';
import SeePrescriptionModal from './SeePrescriptionModal';
import ManageDocumentsModal from './ManageDocumentsModal'; // ✅ Import ManageDocumentsModal
import VitalsModal from './VitalsModal'; // ✅ NEW: import VitalsModal

const AppointmentListModal = ({ isOpen, onClose, patient, onSuccess }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [error, setError] = useState('');

  // Assignment modal state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAppointmentForAssignment, setSelectedAppointmentForAssignment] = useState(null);
  
  // Prescription modal state
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState(null);
  const [selectedAppointmentForPrescription, setSelectedAppointmentForPrescription] = useState(null);

  // ✅ NEW: Documents modal state
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedAppointmentForDocuments, setSelectedAppointmentForDocuments] = useState(null);

  // ✅ NEW: Vitals modal state
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [selectedAppointmentForVitals, setSelectedAppointmentForVitals] = useState(null);

  const isAssigner = user?.role === 'assigner' || user?.role === 'jrdoctor';
  const canRecordVitals = ['doctor', 'jrdoctor', 'clinic'].includes(user?.role);

  useEffect(() => {
    if (isOpen && patient) {
      fetchAppointments();
    }
  }, [isOpen, patient]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/patients/${patient.patientId}/appointments`);
      if (response.data.success) {
        setAppointments(response.data.data || []);
      }
      console.log(response)
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDoctor = (appointment) => {
    if (!isAssigner) return;
    setSelectedAppointmentForAssignment(appointment);
    setShowAssignmentModal(true);
  };

  const handleAssignmentSuccess = async (updatedAppointment) => {
    setShowAssignmentModal(false);
    setSelectedAppointmentForAssignment(null);
    await fetchAppointments();
    onSuccess && onSuccess({
      appointment: updatedAppointment,
      patient: patient
    });
  };

  const handleManagePrescription = (appointment) => {
    console.log('Opening prescription modal for appointment:', appointment.appointmentId);
    setSelectedPatientForPrescription(patient.patientId);
    setSelectedAppointmentForPrescription(appointment.appointmentId);
    setShowPrescriptionModal(true);
  };

  // ✅ NEW: Handle documents modal
  const handleManageDocuments = (appointment) => {
    console.log('Opening documents modal for appointment:', appointment.appointmentId);
    setSelectedAppointmentForDocuments(appointment);
    setShowDocumentsModal(true);
  };

  // ✅ NEW: Handle vitals modal
  const handleRecordVitals = (appointment) => {
    console.log('Opening vitals modal for appointment:', appointment.appointmentId);
    setSelectedAppointmentForVitals(appointment);
    setShowVitalsModal(true);
  };

  // ✅ ADD: Missing handleVitalsSuccess function
  const handleVitalsSuccess = async (updatedAppointment) => {
    console.log('Vitals updated successfully:', updatedAppointment);
    setShowVitalsModal(false);
    setSelectedAppointmentForVitals(null);
    await fetchAppointments(); // Refresh appointments to show updated vitals
    onSuccess && onSuccess({
      appointment: updatedAppointment,
      patient: patient
    });
  };

  const handleStatusUpdate = async (appointment, newStatus) => {
    if (!isAssigner) return;
    
    try {
      const response = await apiClient.put(`/appointments/${appointment.appointmentId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        fetchAppointments();
        onSuccess && onSuccess(response.data.data);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status');
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Scheduled': 'bg-blue-50 text-blue-700 border-blue-200',
      'Confirmed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'In-Progress': 'bg-amber-50 text-amber-700 border-amber-200',
      'Completed': 'bg-green-50 text-green-700 border-green-200',
      'Cancelled': 'bg-red-50 text-red-700 border-red-200',
      'No-Show': 'bg-gray-50 text-gray-700 border-gray-200',
      'Rescheduled': 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return statusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getAppointmentTypeColor = (type) => {
    const typeColors = {
      'Consultation': 'bg-blue-50 text-blue-600',
      'Follow-up': 'bg-green-50 text-green-600',
      'Check-up': 'bg-yellow-50 text-yellow-600',
      'Emergency': 'bg-red-50 text-red-600',
      'Procedure': 'bg-purple-50 text-purple-600'
    };
    return typeColors[type] || 'bg-gray-50 text-gray-600';
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

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal - Content remains the same but add Documents button */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Appointments</h3>
                <p className="text-sm text-gray-500">
                  {patient?.personalInfo?.fullName} • #{patient?.patientId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Appointment</span>
              </button>
              <button 
                onClick={onClose} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-gray-600 font-medium">Loading appointments...</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium mb-2">{error}</p>
                <button 
                  onClick={fetchAppointments}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No appointments scheduled</h4>
                <p className="text-gray-500 text-sm mb-6">Create the first appointment for this patient</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Schedule Appointment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div 
                    key={appointment._id || appointment.appointmentId} 
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-gray-300"
                  >
                    <div className="flex items-start justify-between">
                      {/* Left Side - Appointment Info */}
                      <div className="flex-1 space-y-3">
                        {/* Status & Type Row */}
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium border ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${getAppointmentTypeColor(appointment.appointmentType)}`}>
                            {appointment.appointmentType}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            #{appointment.appointmentId}
                          </span>
                        </div>

                        {/* Main Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Date & Time */}
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm font-medium text-gray-900">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{formatDateTime(appointment.scheduledDate, appointment.scheduledTime)}</span>
                            </div>
                            <div className="text-xs text-gray-500 ml-6">
                              {appointment.mode} • {appointment.duration || 30} min
                            </div>
                          </div>

                          {/* Doctor Assignment */}
                          <div className="space-y-1">
                            {appointment.doctorId ? (
                              <div className="flex items-center space-x-2 text-sm font-medium text-gray-900">
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>
                                  {appointment.doctorId.profile ? 
                                    `Dr. ${appointment.doctorId.profile.firstName} ${appointment.doctorId.profile.lastName}` :
                                    'Dr. Unknown'
                                  }
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 text-sm text-amber-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>No doctor assigned</span>
                              </div>
                            )}
                            <div className="text-xs text-gray-500 ml-6">
                              {appointment.doctorId ? 'Assigned to appointment' : 'Requires assignment'}
                            </div>
                          </div>

                          {/* Prescription Status */}
                          <div className="space-y-1">
                            {appointment.treatment?.prescriptionIssued ? (
                              <div className="flex items-center space-x-2 text-sm text-green-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Prescription Available</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>No Prescription</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Chief Complaints & Diagnosis */}
                        {(appointment.chiefComplaints?.primary || appointment.examination?.provisionalDiagnosis) && (
                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            {appointment.chiefComplaints?.primary && (
                              <div>
                                <span className="text-xs font-medium text-gray-600">Chief Complaint: </span>
                                <span className="text-sm text-gray-800">
                                  {appointment.chiefComplaints.primary}
                                  {appointment.chiefComplaints.duration && (
                                    <span className="text-gray-500"> • {appointment.chiefComplaints.duration}</span>
                                  )}
                                </span>
                              </div>
                            )}
                            {appointment.examination?.provisionalDiagnosis && (
                              <div>
                                <span className="text-xs font-medium text-gray-600">Diagnosis: </span>
                                <span className="text-sm text-gray-800">{appointment.examination.provisionalDiagnosis}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Side - Action Buttons */}
                      <div className="flex flex-col space-y-2 ml-6">
                        {/* Show Assign Doctor button only for assigners */}
                        {isAssigner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignDoctor(appointment);
                            }}
                            className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                              appointment.doctorId 
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                            }`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{appointment.doctorId ? 'Reassign' : 'Assign'}</span>
                          </button>
                        )}

                        {/* ✅ NEW: Vitals Button - visible to doctors/jrdoctors/clinics */}
                        {canRecordVitals && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecordVitals(appointment);
                            }}
                            className="px-3 py-2 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-all duration-200 flex items-center space-x-2 border border-rose-200"
                            title="Record / update vitals"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>Vitals</span>
                          </button>
                        )}

                        {/* ✅ FIXED: Show Prescription Button for both doctors and assigners */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManagePrescription(appointment);
                          }}
                          className="px-3 py-2 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-all duration-200 flex items-center space-x-2 border border-purple-200"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Prescriptions</span>
                        </button>

                        {/* ✅ NEW: Documents Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManageDocuments(appointment);
                          }}
                          className="px-3 py-2 text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-all duration-200 flex items-center space-x-2 border border-orange-200"
                          title={`${appointment.documents?.length || 0} documents`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Documents ({appointment.documents?.length || 0})</span>
                        </button>

                        {/* View Details Button - Always visible */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(appointment);
                          }}
                          className="px-3 py-2 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center space-x-2 border border-gray-200"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Details</span>
                        </button>

                        {/* Status Update Buttons - Only for assigners */}
                        {isAssigner && (
                          <div className="flex space-x-1">
                            {appointment.status === 'Scheduled' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(appointment, 'In-Progress');
                                }}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Start
                              </button>
                            )}
                            {appointment.status === 'In-Progress' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(appointment, 'Completed');
                                }}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        )}

                        {/* Created Date */}
                        <div className="text-xs text-gray-400 text-right pt-1">
                          {new Date(appointment.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50">
            <div className="text-sm text-gray-500">
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-white hover:border-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateAppointmentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          patient={patient}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAppointments();
          }}
        />
      )}

      {selectedAppointment && (
        <AppointmentDetailsModal
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          appointment={selectedAppointment}
          patient={patient}
          onSuccess={fetchAppointments}
        />
      )}

      {/* Assignment Modal - Only shown for assigners */}
      {isAssigner && (
        <AppointmentAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedAppointmentForAssignment(null);
          }}
          appointment={selectedAppointmentForAssignment}
          patient={patient}
          onSuccess={handleAssignmentSuccess}
        />
      )}

      {/* Prescription Modal */}
      <SeePrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => {
          setShowPrescriptionModal(false);
          setSelectedPatientForPrescription(null);
          setSelectedAppointmentForPrescription(null);
        }}
        patientId={selectedPatientForPrescription}
        appointmentId={selectedAppointmentForPrescription} // ✅ Pass appointment ID
      />

      {/* ✅ NEW: Documents Modal */}
      {showDocumentsModal && selectedAppointmentForDocuments && (
        <ManageDocumentsModal
          isOpen={showDocumentsModal}
          onClose={() => {
            setShowDocumentsModal(false);
            setSelectedAppointmentForDocuments(null);
            fetchAppointments(); // Refresh to update document counts
          }}
          appointment={selectedAppointmentForDocuments}
          patient={patient}
          onSuccess={() => {
            fetchAppointments(); // Refresh appointments when documents change
          }}
        />
      )}

      {/* ✅ NEW: Vitals Modal */}
      {showVitalsModal && selectedAppointmentForVitals && (
        <VitalsModal
          isOpen={showVitalsModal}
          onClose={() => {
            setShowVitalsModal(false);
            setSelectedAppointmentForVitals(null);
          }}
          appointment={selectedAppointmentForVitals}
          patient={patient}
          onSuccess={handleVitalsSuccess}
        />
      )}
    </>
  );
};

// Create Appointment Modal Component (unchanged)
const CreateAppointmentModal = ({ isOpen, onClose, patient, onSuccess }) => {
  const [formData, setFormData] = useState({
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: new Date().toTimeString().slice(0, 5),
    mode: 'In-person',
    appointmentType: 'Consultation',
    duration: 30,
    doctorId: '',
    chiefComplaints: {
      primary: '',
      duration: '',
      severity: 'Moderate'
    },
    vitals: {
      weight: { value: '', unit: 'kg' },
      temperature: { value: '', unit: '°F' },
      bloodPressure: { systolic: '', diastolic: '' },
      heartRate: { value: '', unit: 'bpm' }
    },
    examination: {
      physicalFindings: '',
      provisionalDiagnosis: ''
    },
    followUp: {
      instructions: ''
    }
  });
  const [doctors, setDoctors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
    }
  }, [isOpen]);

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get('/assigner/doctors');
      setDoctors(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const appointmentPayload = {
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        mode: formData.mode,
        appointmentType: formData.appointmentType,
        duration: formData.duration,
        doctorId: formData.doctorId || null,
        
        chiefComplaints: {
          primary: formData.chiefComplaints.primary,
          duration: formData.chiefComplaints.duration,
          severity: formData.chiefComplaints.severity
        },
        
        vitals: {
          weight: {
            value: formData.vitals.weight?.value ? parseFloat(formData.vitals.weight.value) : null,
            unit: 'kg'
          },
          temperature: {
            value: formData.vitals.temperature?.value ? parseFloat(formData.vitals.temperature.value) : null,
            unit: '°F'
          },
          bloodPressure: {
            systolic: formData.vitals.bloodPressure?.systolic ? parseInt(formData.vitals.bloodPressure.systolic) : null,
            diastolic: formData.vitals.bloodPressure?.diastolic ? parseInt(formData.vitals.bloodPressure.diastolic) : null
          },
          heartRate: {
            value: formData.vitals.heartRate?.value ? parseInt(formData.vitals.heartRate.value) : null,
            unit: 'bpm'
          }
        },
        
        examination: {
          physicalFindings: formData.examination.physicalFindings,
          provisionalDiagnosis: formData.examination.provisionalDiagnosis
        },
        
        followUp: {
          instructions: formData.followUp.instructions
        }
      };

      const response = await apiClient.post(`/patients/${patient.patientId}/appointments`, appointmentPayload);
      if (response.data.success) {
        onSuccess(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] border border-gray-200">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900">Schedule New Appointment</h3>
          <p className="text-sm text-gray-500">for {patient?.personalInfo?.fullName}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          {/* Form content same as before */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.appointmentType}
                onChange={(e) => setFormData({...formData, appointmentType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Consultation">Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Check-up">Check-up</option>
                <option value="Emergency">Emergency</option>
                <option value="Procedure">Procedure</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({...formData, mode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="In-person">In-person</option>
                <option value="Video Call">Video Call</option>
                <option value="Phone Call">Phone Call</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
            <select
              value={formData.doctorId}
              onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Doctor</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.profile.firstName} {doctor.profile.lastName}
                  {doctor.doctorDetails?.specialization && ` - ${doctor.doctorDetails.specialization}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint</label>
            <textarea
              value={formData.chiefComplaints.primary}
              onChange={(e) => setFormData({
                ...formData, 
                chiefComplaints: {...formData.chiefComplaints, primary: e.target.value}
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe the main complaint..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200"
            >
              {submitting ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Appointment Details Modal Component (unchanged structure but modernized styling)
const AppointmentDetailsModal = ({ isOpen, onClose, appointment, patient, onSuccess }) => {
  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] border border-gray-200">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
          <p className="text-sm text-gray-500">ID: {appointment.appointmentId}</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Date:</strong> {new Date(appointment.scheduledDate).toLocaleDateString()}</div>
                <div><strong>Time:</strong> {appointment.scheduledTime}</div>
                <div><strong>Type:</strong> {appointment.appointmentType}</div>
                <div><strong>Mode:</strong> {appointment.mode}</div>
                <div><strong>Status:</strong> {appointment.status}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentListModal;