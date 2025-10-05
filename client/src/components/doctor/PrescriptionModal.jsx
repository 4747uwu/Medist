import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import MedicineSearchModal from '../common/MedicineSearchModal';
import TestSearchModal from '../common/TestSearchModal';

const PrescriptionModal = ({ isOpen, onClose, patient, onSuccess }) => {
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
      },
      precautions: [],
      emergencyInstructions: ''
    },
    notes: {
      doctorNotes: ''
    }
  });

  const [newSymptom, setNewSymptom] = useState('');
  const [newSecondaryDiagnosis, setNewSecondaryDiagnosis] = useState('');
  const [newPrecaution, setNewPrecaution] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setSelectedMedicines([]);
      setSelectedTests([]);
      setPrescriptionData({
        diagnosis: { primary: '', secondary: [] },
        symptoms: [],
        advice: {
          lifestyle: '',
          diet: '',
          followUp: { required: false, duration: '', instructions: '' },
          precautions: [],
          emergencyInstructions: ''
        },
        notes: { doctorNotes: '' }
      });
      setError('');
    }
  }, [isOpen]);

  const handleMedicineSelect = (medicines) => {
    setSelectedMedicines(medicines);
    setShowMedicineModal(false);
  };

  const handleTestSelect = (tests) => {
    setSelectedTests(tests);
    setShowTestModal(false);
  };

  const updateMedicineField = (index, field, value) => {
    const updatedMedicines = [...selectedMedicines];
    updatedMedicines[index] = { ...updatedMedicines[index], [field]: value };
    setSelectedMedicines(updatedMedicines);
  };

  const updateTestField = (index, field, value) => {
    const updatedTests = [...selectedTests];
    updatedTests[index] = { ...updatedTests[index], [field]: value };
    setSelectedTests(updatedTests);
  };

  const removeMedicine = (index) => {
    setSelectedMedicines(selectedMedicines.filter((_, i) => i !== index));
  };

  const removeTest = (index) => {
    setSelectedTests(selectedTests.filter((_, i) => i !== index));
  };

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setPrescriptionData({
        ...prescriptionData,
        symptoms: [...prescriptionData.symptoms, newSymptom.trim()]
      });
      setNewSymptom('');
    }
  };

  const removeSymptom = (index) => {
    setPrescriptionData({
      ...prescriptionData,
      symptoms: prescriptionData.symptoms.filter((_, i) => i !== index)
    });
  };

  const addSecondaryDiagnosis = () => {
    if (newSecondaryDiagnosis.trim()) {
      setPrescriptionData({
        ...prescriptionData,
        diagnosis: {
          ...prescriptionData.diagnosis,
          secondary: [...prescriptionData.diagnosis.secondary, newSecondaryDiagnosis.trim()]
        }
      });
      setNewSecondaryDiagnosis('');
    }
  };

  const removeSecondaryDiagnosis = (index) => {
    setPrescriptionData({
      ...prescriptionData,
      diagnosis: {
        ...prescriptionData.diagnosis,
        secondary: prescriptionData.diagnosis.secondary.filter((_, i) => i !== index)
      }
    });
  };

  const addPrecaution = () => {
    if (newPrecaution.trim()) {
      setPrescriptionData({
        ...prescriptionData,
        advice: {
          ...prescriptionData.advice,
          precautions: [...prescriptionData.advice.precautions, newPrecaution.trim()]
        }
      });
      setNewPrecaution('');
    }
  };

  const removePrecaution = (index) => {
    setPrescriptionData({
      ...prescriptionData,
      advice: {
        ...prescriptionData.advice,
        precautions: prescriptionData.advice.precautions.filter((_, i) => i !== index)
      }
    });
  };

  const handleInputChange = (section, field, value, nested = null) => {
    if (nested) {
      setPrescriptionData({
        ...prescriptionData,
        [section]: {
          ...prescriptionData[section],
          [nested]: {
            ...prescriptionData[section][nested],
            [field]: value
          }
        }
      });
    } else {
      setPrescriptionData({
        ...prescriptionData,
        [section]: {
          ...prescriptionData[section],
          [field]: value
        }
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      // Validate required fields
      if (!prescriptionData.diagnosis.primary) {
        setError('Primary diagnosis is required');
        return;
      }

      if (selectedMedicines.length === 0 && selectedTests.length === 0) {
        setError('Please add at least one medicine or test');
        return;
      }

      // Prepare medicines data
      const medicines = selectedMedicines.map(med => ({
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
      }));

      // Prepare tests data
      const tests = selectedTests.map(test => ({
        testId: test._id,
        testName: test.testName,
        testCode: test.testCode,
        urgency: test.urgency || 'Routine',
        instructions: test.instructions || '',
        reportRequired: test.reportRequired !== false
      }));

      const prescriptionPayload = {
        patientId: patient.patientId,
        visitId: patient.currentVisitId,
        medicines,
        tests,
        ...prescriptionData
      };

      console.log('Creating prescription:', prescriptionPayload);

      const response = await apiClient.post('/prescriptions', prescriptionPayload);

      if (response.data.success) {
        onSuccess && onSuccess(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      setError(error.response?.data?.message || 'Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Prescription</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {patient?.personalInfo?.fullName} ({patient?.patientId})
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Diagnosis Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Diagnosis</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Diagnosis *
                  </label>
                  <input
                    type="text"
                    value={prescriptionData.diagnosis.primary}
                    onChange={(e) => handleInputChange('diagnosis', 'primary', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter primary diagnosis"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Diagnosis
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSecondaryDiagnosis}
                      onChange={(e) => setNewSecondaryDiagnosis(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add secondary diagnosis"
                    />
                    <button
                      onClick={addSecondaryDiagnosis}
                      className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {prescriptionData.diagnosis.secondary.map((diagnosis, index) => (
                      <div key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
                        <span className="text-sm">{diagnosis}</span>
                        <button
                          onClick={() => removeSecondaryDiagnosis(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Symptoms Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Symptoms</h4>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add symptom"
                />
                <button
                  onClick={addSymptom}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {prescriptionData.symptoms.map((symptom, index) => (
                  <div key={index} className="flex items-center bg-white px-3 py-1 rounded-full border">
                    <span className="text-sm">{symptom}</span>
                    <button
                      onClick={() => removeSymptom(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Medicines Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-900">
                  Medicines ({selectedMedicines.length})
                </h4>
                <button
                  onClick={() => setShowMedicineModal(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Add Medicines
                </button>
              </div>

              {selectedMedicines.length === 0 ? (
                <p className="text-gray-500 text-sm">No medicines selected</p>
              ) : (
                <div className="space-y-3">
                  {selectedMedicines.map((medicine, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">{medicine.name}</h5>
                          <p className="text-xs text-gray-500">{medicine.companyName}</p>
                        </div>
                        <button
                          onClick={() => removeMedicine(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Dosage</label>
                          <input
                            type="text"
                            value={medicine.dosage || ''}
                            onChange={(e) => updateMedicineField(index, 'dosage', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="e.g., 500mg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                          <select
                            value={medicine.frequency || ''}
                            onChange={(e) => updateMedicineField(index, 'frequency', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="Four times daily">Four times daily</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Timing</label>
                          <select
                            value={medicine.timing || ''}
                            onChange={(e) => updateMedicineField(index, 'timing', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select</option>
                            <option value="Before meals">Before meals</option>
                            <option value="After meals">After meals</option>
                            <option value="With meals">With meals</option>
                            <option value="Empty stomach">Empty stomach</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                          <input
                            type="text"
                            value={medicine.duration || ''}
                            onChange={(e) => updateMedicineField(index, 'duration', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="e.g., 7 days"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Special Instructions</label>
                        <input
                          type="text"
                          value={medicine.instructions || ''}
                          onChange={(e) => updateMedicineField(index, 'instructions', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Any special instructions"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tests Section */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-900">
                  Recommended Tests ({selectedTests.length})
                </h4>
                <button
                  onClick={() => setShowTestModal(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  Add Tests
                </button>
              </div>

              {selectedTests.length === 0 ? (
                <p className="text-gray-500 text-sm">No tests selected</p>
              ) : (
                <div className="space-y-3">
                  {selectedTests.map((test, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">{test.testName}</h5>
                          <p className="text-xs text-gray-500">{test.category}</p>
                        </div>
                        <button
                          onClick={() => removeTest(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Urgency</label>
                          <select
                            value={test.urgency || 'Routine'}
                            onChange={(e) => updateTestField(index, 'urgency', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="Routine">Routine</option>
                            <option value="Urgent">Urgent</option>
                            <option value="STAT">STAT</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Instructions</label>
                          <input
                            type="text"
                            value={test.instructions || ''}
                            onChange={(e) => updateTestField(index, 'instructions', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Preparation instructions"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medical Advice Section */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Medical Advice</h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lifestyle Advice</label>
                    <textarea
                      value={prescriptionData.advice.lifestyle}
                      onChange={(e) => handleInputChange('advice', 'lifestyle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Lifestyle recommendations"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diet Advice</label>
                    <textarea
                      value={prescriptionData.advice.diet}
                      onChange={(e) => handleInputChange('advice', 'diet', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Dietary recommendations"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precautions</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newPrecaution}
                      onChange={(e) => setNewPrecaution(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add precaution"
                    />
                    <button
                      onClick={addPrecaution}
                      className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {prescriptionData.advice.precautions.map((precaution, index) => (
                      <div key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
                        <span className="text-sm">{precaution}</span>
                        <button
                          onClick={() => removePrecaution(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={prescriptionData.advice.followUp.required}
                      onChange={(e) => handleInputChange('advice', 'required', e.target.checked, 'followUp')}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Follow-up Required</label>
                  </div>
                  
                  {prescriptionData.advice.followUp.required && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <input
                          type="text"
                          value={prescriptionData.advice.followUp.duration}
                          onChange={(e) => handleInputChange('advice', 'duration', e.target.value, 'followUp')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 1 week"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                        <input
                          type="text"
                          value={prescriptionData.advice.followUp.instructions}
                          onChange={(e) => handleInputChange('advice', 'instructions', e.target.value, 'followUp')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Follow-up instructions"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Doctor Notes Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Doctor Notes</h4>
              <textarea
                value={prescriptionData.notes.doctorNotes}
                onChange={(e) => handleInputChange('notes', 'doctorNotes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Additional notes for prescription"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {selectedMedicines.length} medicine(s), {selectedTests.length} test(s)
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Prescription'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Medicine Search Modal */}
      <MedicineSearchModal
        isOpen={showMedicineModal}
        onClose={() => setShowMedicineModal(false)}
        onSelectMedicines={handleMedicineSelect}
        selectedMedicines={selectedMedicines}
      />

      {/* Test Search Modal */}
      <TestSearchModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        onSelectTests={handleTestSelect}
        selectedTests={selectedTests}
      />
    </>
  );
};

export default PrescriptionModal;