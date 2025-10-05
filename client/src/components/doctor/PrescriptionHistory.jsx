// Add this component to show prescription history in doctor dashboard

// filepath: d:\website\devops\Anish2\client\src\components/doctor/PrescriptionHistory.jsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const PrescriptionHistory = ({ patientId, showAsModal = false, onClose }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (patientId) {
      fetchPrescriptionHistory();
    }
  }, [patientId]);

  const fetchPrescriptionHistory = async () => {
    try {
      setLoading(true);
      // Get patient with prescription history from the updated endpoint
      const response = await apiClient.get(`/prescriptions/patient/${patientId}/history`);
      if (response.data.success) {
        const patient = response.data.data;
        // Use the prescription list from patient model
        setPrescriptions(patient.prescriptions?.list || []);
      }
    } catch (error) {
      console.error('Error fetching prescription history:', error);
      // Fallback to direct prescription fetch
      try {
        const response = await apiClient.get(`/prescriptions/patient/${patientId}`);
        if (response.data.success) {
          setPrescriptions(response.data.data);
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrescription = async (prescription) => {
    try {
      // Fetch full prescription details
      const response = await apiClient.get(`/prescriptions/${prescription.prescriptionCode}`);
      if (response.data.success) {
        setSelectedPrescription(response.data.data);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Error fetching prescription details:', error);
    }
  };

  const handleEditPrescription = (prescription) => {
    // Navigate to prescription page with existing prescription data
    navigate(`/prescription/${patientId}?edit=${prescription.prescriptionCode}`);
  };

  const handleCreateNewPrescription = () => {
    navigate(`/prescription/${patientId}`);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-gray-600">Loading prescription history...</span>
      </div>
    );
  }

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Prescription History</h3>
          <p className="text-sm text-gray-500">
            {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={handleCreateNewPrescription}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Prescription
        </button>
      </div>

      {prescriptions.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h4 className="mt-2 text-sm font-medium text-gray-900">No prescriptions found</h4>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new prescription.</p>
          <button
            onClick={handleCreateNewPrescription}
            className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Prescription
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((prescription) => (
            <div key={prescription._id || prescription.prescriptionCode} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Prescription Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {prescription.prescriptionCode}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(prescription.status)}`}>
                      {prescription.status}
                    </span>
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(prescription.prescribedDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    by Dr. {prescription.doctorName}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewPrescription(prescription)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    View
                  </button>
                  {prescription.status === 'Active' && (
                    <button
                      onClick={() => handleEditPrescription(prescription)}
                      className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Prescription Summary */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                  </svg>
                  <span className="font-medium">{prescription.medicineCount || 0}</span>
                  <span className="text-gray-500">medicines</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="font-medium">{prescription.testCount || 0}</span>
                  <span className="text-gray-500">tests</span>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-500">Visit:</span>
                  <span className="font-mono text-xs">{prescription.visitId}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescription Details Modal */}
      {showDetails && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Prescription Details - {selectedPrescription.prescriptionId}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Prescription Details Content */}
              <div className="space-y-6">
                {/* Medicines */}
                {selectedPrescription.medicines?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Medicines ({selectedPrescription.medicines.length})</h4>
                    <div className="space-y-2">
                      {selectedPrescription.medicines.map((medicine, index) => (
                        <div key={index} className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{medicine.medicineName}</h5>
                              <p className="text-sm text-gray-600">Code: {medicine.medicineCode}</p>
                            </div>
                            <div className="text-right text-sm">
                              <p><span className="font-medium">Dosage:</span> {medicine.dosage}</p>
                              <p><span className="font-medium">Frequency:</span> {medicine.frequency}</p>
                              <p><span className="font-medium">Duration:</span> {medicine.duration}</p>
                            </div>
                          </div>
                          {medicine.instructions && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Instructions:</span> {medicine.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tests */}
                {selectedPrescription.tests?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Tests ({selectedPrescription.tests.length})</h4>
                    <div className="space-y-2">
                      {selectedPrescription.tests.map((test, index) => (
                        <div key={index} className="bg-green-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{test.testName}</h5>
                              <p className="text-sm text-gray-600">Code: {test.testCode}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                test.urgency === 'STAT' ? 'bg-red-100 text-red-800' :
                                test.urgency === 'Urgent' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {test.urgency}
                              </span>
                            </div>
                          </div>
                          {test.instructions && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Instructions:</span> {test.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diagnosis & Advice */}
                {(selectedPrescription.diagnosis?.primary || selectedPrescription.advice) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedPrescription.diagnosis?.primary && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Diagnosis</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {selectedPrescription.diagnosis.primary}
                        </p>
                      </div>
                    )}
                    
                    {selectedPrescription.advice && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Medical Advice</h4>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg space-y-2">
                          {selectedPrescription.advice.lifestyle && (
                            <p><span className="font-medium">Lifestyle:</span> {selectedPrescription.advice.lifestyle}</p>
                          )}
                          {selectedPrescription.advice.diet && (
                            <p><span className="font-medium">Diet:</span> {selectedPrescription.advice.diet}</p>
                          )}
                          {selectedPrescription.advice.followUp?.required && (
                            <p><span className="font-medium">Follow-up:</span> {selectedPrescription.advice.followUp.instructions}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedPrescription.status === 'Active' && (
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      handleEditPrescription(selectedPrescription);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Prescription
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Prescription History</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};

export default PrescriptionHistory;