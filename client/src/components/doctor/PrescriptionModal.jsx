import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import MedicineSearchModal from '../common/MedicineSearchModal';
import TestSearchModal from '../common/TestSearchModal';

const PrescriptionModal = ({ isOpen, onClose, patient, appointment = null, onSuccess }) => {
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [prescriptionData, setPrescriptionData] = useState({
    diagnosis: {
      primary: '',
      secondary: []
    },
    symptoms: [],
    advice: {
      lifestyle: '',
      diet: '',
      followUp: {
        required: false,
        duration: '',
        instructions: ''
      }
    }
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedMedicines([]);
      setSelectedTests([]);
      setError('');
      
      // ✅ FIXED: Pre-populate with appointment data if available
      if (appointment) {
        setPrescriptionData(prev => ({
          ...prev,
          diagnosis: {
            primary: appointment.examination?.provisionalDiagnosis || '',
            secondary: appointment.examination?.differentialDiagnosis || []
          },
          symptoms: appointment.chiefComplaints?.primary ? [appointment.chiefComplaints.primary] : []
        }));
      }
    }
  }, [isOpen, appointment]);

  const handleMedicineSelect = (medicine) => {
    setSelectedMedicines(prev => [...prev, {
      ...medicine,
      medicineId: medicine._id,
      medicineName: medicine.name,
      dosage: '1 tablet',
      frequency: 'Twice daily',
      timing: 'After meals',
      duration: '7 days',
      instructions: '',
      quantity: 1,
      substitutionAllowed: true
    }]);
    setShowMedicineModal(false);
  };

  const handleTestSelect = (test) => {
    setSelectedTests(prev => [...prev, {
      ...test,
      testId: test._id,
      urgency: 'Routine',
      instructions: '',
      reportRequired: true
    }]);
    setShowTestModal(false);
  };

  const removeMedicine = (index) => {
    setSelectedMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const removeTest = (index) => {
    setSelectedTests(prev => prev.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    setSelectedMedicines(prev => prev.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    ));
  };

  const updateTest = (index, field, value) => {
    setSelectedTests(prev => prev.map((test, i) => 
      i === index ? { ...test, [field]: value } : test
    ));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      if (selectedMedicines.length === 0 && selectedTests.length === 0) {
        setError('Please select at least one medicine or test');
        return;
      }

      const prescriptionPayload = {
        patientId: patient.patientId,
        appointmentId: appointment?.appointmentId || null, // ✅ Ensure appointmentId is included
        visitId: patient.currentVisitId || `VISIT-${patient.patientId}-${Date.now()}`,
        medicines: selectedMedicines.map(med => ({
          medicineId: med._id,
          medicineName: med.name,
          medicineCode: med.medicineCode,
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          timing: med.timing || '',
          duration: med.duration || '',
          instructions: med.instructions || '',
          quantity: med.quantity || 0,
          substitutionAllowed: med.substitutionAllowed !== false
        })),
        tests: selectedTests.map(test => ({
          testId: test._id,
          testName: test.testName,
          testCode: test.testCode,
          urgency: test.urgency || 'Routine',
          instructions: test.instructions || '',
          reportRequired: test.reportRequired !== false
        })),
        ...prescriptionData,
        appointmentData: appointment ? {
          appointmentId: appointment.appointmentId, // ✅ Include appointmentId in appointmentData
          scheduledDate: appointment.scheduledDate,
          scheduledTime: appointment.scheduledTime,
          chiefComplaints: appointment.chiefComplaints,
          vitals: appointment.vitals,
          examination: appointment.examination
        } : null
      };

      // ✅ FIXED: Add detailed logging to verify appointmentId
      console.log('Creating prescription with appointmentId:', {
        appointmentId: prescriptionPayload.appointmentId,
        patientId: prescriptionPayload.patientId,
        hasAppointmentData: !!prescriptionPayload.appointmentData
      });

      const response = await apiClient.post('/prescriptions', prescriptionPayload);
      
      if (response.data.success) {
        console.log('Prescription created successfully:', response.data.data);
        onSuccess?.(response.data.data);
        onClose();
      }
    } catch (err) {
      console.error('Error creating prescription:', err);
      setError(err.response?.data?.message || 'Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Prescription</h3>
                <div className="text-sm text-gray-600 mt-1">
                  <span>Patient: {patient.personalInfo?.fullName} (#{patient.patientId})</span>
                  {/* ✅ FIXED: Show appointment info if available */}
                  {appointment && (
                    <span className="ml-4 text-blue-600 font-medium">
                      Appointment: {appointment.appointmentId}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Medicines Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Medicines</h4>
                  <button
                    onClick={() => setShowMedicineModal(true)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Medicine
                  </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedMedicines.map((medicine, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">{medicine.name}</h5>
                          <p className="text-sm text-gray-600">{medicine.companyName}</p>
                        </div>
                        <button
                          onClick={() => removeMedicine(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Dosage"
                          value={medicine.dosage}
                          onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Frequency"
                          value={medicine.frequency}
                          onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Duration"
                          value={medicine.duration}
                          onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Timing"
                          value={medicine.timing}
                          onChange={(e) => updateMedicine(index, 'timing', e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {selectedMedicines.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No medicines selected</p>
                  )}
                </div>
              </div>

              {/* Tests Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Tests</h4>
                  <button
                    onClick={() => setShowTestModal(true)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                  >
                    Add Test
                  </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedTests.map((test, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">{test.testName}</h5>
                          <p className="text-sm text-gray-600">{test.category} • ₹{test.cost}</p>
                        </div>
                        <button
                          onClick={() => removeTest(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <select
                        value={test.urgency}
                        onChange={(e) => updateTest(index, 'urgency', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="Routine">Routine</option>
                        <option value="Urgent">Urgent</option>
                        <option value="STAT">STAT</option>
                      </select>
                    </div>
                  ))}
                  
                  {selectedTests.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No tests selected</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-6 space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Additional Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Diagnosis
                  </label>
                  <textarea
                    value={prescriptionData.diagnosis.primary}
                    onChange={(e) => setPrescriptionData({
                      ...prescriptionData,
                      diagnosis: { ...prescriptionData.diagnosis, primary: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter primary diagnosis..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lifestyle Advice
                  </label>
                  <textarea
                    value={prescriptionData.advice.lifestyle}
                    onChange={(e) => setPrescriptionData({
                      ...prescriptionData,
                      advice: { ...prescriptionData.advice, lifestyle: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter lifestyle recommendations..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedMedicines.length} medicine(s), {selectedTests.length} test(s) selected
              {appointment && (
                <span className="ml-4 text-blue-600 font-medium">
                  For appointment: {appointment.appointmentId}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || (selectedMedicines.length === 0 && selectedTests.length === 0)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                <span>{submitting ? 'Creating...' : 'Create Prescription'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Medicine Search Modal */}
      {showMedicineModal && (
        <MedicineSearchModal
          isOpen={showMedicineModal}
          onClose={() => setShowMedicineModal(false)}
          onSelect={handleMedicineSelect}
        />
      )}

      {/* Test Search Modal */}
      {showTestModal && (
        <TestSearchModal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
          onSelect={handleTestSelect}
        />
      )}
    </div>
  );
};

export default PrescriptionModal;