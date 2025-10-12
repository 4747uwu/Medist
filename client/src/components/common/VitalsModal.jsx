import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

const VitalsModal = ({ isOpen, onClose, appointment, patient, onSuccess }) => {
  const [formData, setFormData] = useState({
    // Vitals
    vitals: {
      weight: { value: '', unit: 'kg' },
      height: { value: '', unit: 'cm' },
      temperature: { value: '', unit: '°F' },
      bloodPressure: { systolic: '', diastolic: '' },
      heartRate: { value: '', unit: 'bpm' },
      oxygenSaturation: { value: '', unit: '%' },
      bloodSugar: { value: '', type: 'Random', unit: 'mg/dL' }
    },
    // Chief Complaints
    chiefComplaints: {
      primary: '',
      duration: '',
      severity: 'Moderate'
    },
    // Examination
    examination: {
      physicalFindings: '',
      provisionalDiagnosis: '',
      differentialDiagnosis: []
    },
    // Investigations
    investigations: {
      testsRecommended: []
    },
    // Treatment
    treatment: {
      medicines: [],
      lifestyleAdvice: '',
      dietSuggestions: ''
    },
    // Follow-up
    followUp: {
      nextAppointmentDate: '',
      instructions: '',
      notes: ''
    },
    // Doctor Notes
    doctorNotes: ''
  });
  
  const [activeTab, setActiveTab] = useState('vitals');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // New item states
  const [newTest, setNewTest] = useState({ testName: '', urgency: 'Routine' });
  const [newMedicine, setNewMedicine] = useState({ medicineName: '', dosage: '', duration: '' });

  // Pre-populate form with existing appointment data
  useEffect(() => {
    if (appointment) {
      setFormData({
        vitals: {
          weight: appointment.vitals?.weight || { value: '', unit: 'kg' },
          height: appointment.vitals?.height || { value: '', unit: 'cm' },
          temperature: appointment.vitals?.temperature || { value: '', unit: '°F' },
          bloodPressure: appointment.vitals?.bloodPressure || { systolic: '', diastolic: '' },
          heartRate: appointment.vitals?.heartRate || { value: '', unit: 'bpm' },
          oxygenSaturation: appointment.vitals?.oxygenSaturation || { value: '', unit: '%' },
          bloodSugar: appointment.vitals?.bloodSugar || { value: '', type: 'Random', unit: 'mg/dL' }
        },
        chiefComplaints: {
          primary: appointment.chiefComplaints?.primary || '',
          duration: appointment.chiefComplaints?.duration || '',
          severity: appointment.chiefComplaints?.severity || 'Moderate'
        },
        examination: {
          physicalFindings: appointment.examination?.physicalFindings || '',
          provisionalDiagnosis: appointment.examination?.provisionalDiagnosis || '',
          differentialDiagnosis: appointment.examination?.differentialDiagnosis || []
        },
        investigations: {
          testsRecommended: appointment.investigations?.testsRecommended || []
        },
        treatment: {
          medicines: appointment.treatment?.medicines || [],
          lifestyleAdvice: appointment.treatment?.lifestyleAdvice || '',
          dietSuggestions: appointment.treatment?.dietSuggestions || ''
        },
        followUp: {
          nextAppointmentDate: appointment.followUp?.nextAppointmentDate || '',
          instructions: appointment.followUp?.instructions || '',
          notes: appointment.followUp?.notes || ''
        },
        doctorNotes: appointment.doctorNotes || ''
      });
    }
  }, [appointment]);

  if (!isOpen) return null;

  const handleChange = (section, field, value, subField = null, subSubField = null) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      if (subSubField) {
        newData[section][field][subField][subSubField] = value;
      } else if (subField) {
        newData[section][field][subField] = value;
      } else if (field) {
        newData[section][field] = value;
      } else {
        newData[section] = value;
      }
      
      return newData;
    });
  };

  const addTest = () => {
    if (newTest.testName.trim()) {
      setFormData(prev => ({
        ...prev,
        investigations: {
          ...prev.investigations,
          testsRecommended: [...prev.investigations.testsRecommended, { ...newTest }]
        }
      }));
      setNewTest({ testName: '', urgency: 'Routine' });
    }
  };

  const removeTest = (index) => {
    setFormData(prev => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        testsRecommended: prev.investigations.testsRecommended.filter((_, i) => i !== index)
      }
    }));
  };

  const addMedicine = () => {
    if (newMedicine.medicineName.trim()) {
      setFormData(prev => ({
        ...prev,
        treatment: {
          ...prev.treatment,
          medicines: [...prev.treatment.medicines, { ...newMedicine }]
        }
      }));
      setNewMedicine({ medicineName: '', dosage: '', duration: '' });
    }
  };

  const removeMedicine = (index) => {
    setFormData(prev => ({
      ...prev,
      treatment: {
        ...prev.treatment,
        medicines: prev.treatment.medicines.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await apiClient.put(`/appointments/${appointment.appointmentId}/assessment`, {
        vitals: formData.vitals,
        chiefComplaints: formData.chiefComplaints,
        examination: formData.examination,
        investigations: formData.investigations,
        treatment: formData.treatment,
        followUp: formData.followUp,
        doctorNotes: formData.doctorNotes
      });

      if (response.data.success) {
        onSuccess && onSuccess(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError(error.response?.data?.message || 'Failed to update appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'vitals', label: 'Vitals', icon: '🩺' },
    { id: 'complaints', label: 'Complaints', icon: '💬' },
    { id: 'examination', label: 'Examination', icon: '🔍' },
    { id: 'investigations', label: 'Tests', icon: '🧪' },
    { id: 'treatment', label: 'Treatment', icon: '💊' },
    { id: 'followup', label: 'Follow-up', icon: '📅' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'vitals':
        return (
          <div className="space-y-6">
            {/* Basic Measurements */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-rose-100 p-2 rounded-lg mr-3">📏</span>
                Basic Measurements
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitals.weight.value}
                      onChange={(e) => handleChange('vitals', 'weight', e.target.value, 'value')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="70.5"
                    />
                    <select
                      value={formData.vitals.weight.unit}
                      onChange={(e) => handleChange('vitals', 'weight', e.target.value, 'unit')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitals.height.value}
                      onChange={(e) => handleChange('vitals', 'height', e.target.value, 'value')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="170"
                    />
                    <select
                      value={formData.vitals.height.unit}
                      onChange={(e) => handleChange('vitals', 'height', e.target.value, 'unit')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="cm">cm</option>
                      <option value="ft">ft</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitals.temperature.value}
                      onChange={(e) => handleChange('vitals', 'temperature', e.target.value, 'value')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="98.6"
                    />
                    <select
                      value={formData.vitals.temperature.unit}
                      onChange={(e) => handleChange('vitals', 'temperature', e.target.value, 'unit')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="°F">°F</option>
                      <option value="°C">°C</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Cardiovascular */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-red-100 p-2 rounded-lg mr-3">❤️</span>
                Cardiovascular
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Pressure</label>
                  <div className="flex space-x-2 items-center">
                    <input
                      type="number"
                      value={formData.vitals.bloodPressure.systolic}
                      onChange={(e) => handleChange('vitals', 'bloodPressure', e.target.value, 'systolic')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="120"
                    />
                    <span className="text-gray-500 font-medium">/</span>
                    <input
                      type="number"
                      value={formData.vitals.bloodPressure.diastolic}
                      onChange={(e) => handleChange('vitals', 'bloodPressure', e.target.value, 'diastolic')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="80"
                    />
                    <span className="text-sm text-gray-500">mmHg</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heart Rate</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={formData.vitals.heartRate.value}
                      onChange={(e) => handleChange('vitals', 'heartRate', e.target.value, 'value')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="72"
                    />
                    <span className="flex items-center text-sm text-gray-500">bpm</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Oxygen Saturation</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={formData.vitals.oxygenSaturation.value}
                      onChange={(e) => handleChange('vitals', 'oxygenSaturation', e.target.value, 'value')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="98"
                      min="0"
                      max="100"
                    />
                    <span className="flex items-center text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Laboratory */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 p-2 rounded-lg mr-3">🧪</span>
                Laboratory
              </h4>
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">Blood Sugar</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vitals.bloodSugar.value}
                    onChange={(e) => handleChange('vitals', 'bloodSugar', e.target.value, 'value')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="100"
                  />
                  <select
                    value={formData.vitals.bloodSugar.type}
                    onChange={(e) => handleChange('vitals', 'bloodSugar', e.target.value, 'type')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Random">Random</option>
                    <option value="Fasting">Fasting</option>
                    <option value="Post-meal">Post-meal</option>
                  </select>
                  <span className="flex items-center text-sm text-gray-500">mg/dL</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complaints':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 p-2 rounded-lg mr-3">💬</span>
                Chief Complaints
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Complaint *</label>
                  <textarea
                    value={formData.chiefComplaints.primary}
                    onChange={(e) => handleChange('chiefComplaints', 'primary', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe the patient's main complaint..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <input
                      type="text"
                      value={formData.chiefComplaints.duration}
                      onChange={(e) => handleChange('chiefComplaints', 'duration', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 3 days, 2 weeks"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                    <select
                      value={formData.chiefComplaints.severity}
                      onChange={(e) => handleChange('chiefComplaints', 'severity', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'examination':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-green-100 p-2 rounded-lg mr-3">🔍</span>
                Physical Examination & Diagnosis
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Physical Findings</label>
                  <textarea
                    value={formData.examination.physicalFindings}
                    onChange={(e) => handleChange('examination', 'physicalFindings', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Document physical examination findings..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provisional Diagnosis *</label>
                  <input
                    type="text"
                    value={formData.examination.provisionalDiagnosis}
                    onChange={(e) => handleChange('examination', 'provisionalDiagnosis', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Primary suspected diagnosis"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'investigations':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-purple-100 p-2 rounded-lg mr-3">🧪</span>
                Recommended Tests
              </h4>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTest.testName}
                    onChange={(e) => setNewTest({ ...newTest, testName: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Test name (e.g., CBC, X-Ray Chest)"
                  />
                  <select
                    value={newTest.urgency}
                    onChange={(e) => setNewTest({ ...newTest, urgency: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="STAT">STAT</option>
                  </select>
                  <button
                    type="button"
                    onClick={addTest}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Add Test
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {formData.investigations.testsRecommended.map((test, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200">
                      <div>
                        <span className="font-medium text-gray-900">{test.testName}</span>
                        <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                          test.urgency === 'STAT' ? 'bg-red-100 text-red-700' :
                          test.urgency === 'Urgent' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {test.urgency}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTest(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'treatment':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-orange-100 p-2 rounded-lg mr-3">💊</span>
                Prescribed Medicines
              </h4>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newMedicine.medicineName}
                    onChange={(e) => setNewMedicine({ ...newMedicine, medicineName: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Medicine name"
                  />
                  <input
                    type="text"
                    value={newMedicine.dosage}
                    onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Dosage (e.g., 500mg)"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMedicine.duration}
                      onChange={(e) => setNewMedicine({ ...newMedicine, duration: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Duration"
                    />
                    <button
                      type="button"
                      onClick={addMedicine}
                      className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {formData.treatment.medicines.map((medicine, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200">
                      <div>
                        <span className="font-medium text-gray-900">{medicine.medicineName}</span>
                        <span className="text-gray-500 ml-3 text-sm">
                          {medicine.dosage} • {medicine.duration}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedicine(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lifestyle Advice</label>
                <textarea
                  value={formData.treatment.lifestyleAdvice}
                  onChange={(e) => handleChange('treatment', 'lifestyleAdvice', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Lifestyle recommendations..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diet Suggestions</label>
                <textarea
                  value={formData.treatment.dietSuggestions}
                  onChange={(e) => handleChange('treatment', 'dietSuggestions', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Dietary recommendations..."
                />
              </div>
            </div>
          </div>
        );

      case 'followup':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-indigo-100 p-2 rounded-lg mr-3">📅</span>
                Follow-up Instructions
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Next Appointment Date</label>
                  <input
                    type="date"
                    value={formData.followUp.nextAppointmentDate}
                    onChange={(e) => handleChange('followUp', 'nextAppointmentDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Instructions</label>
                  <textarea
                    value={formData.followUp.instructions}
                    onChange={(e) => handleChange('followUp', 'instructions', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Instructions for patient follow-up..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                  <textarea
                    value={formData.followUp.notes}
                    onChange={(e) => handleChange('followUp', 'notes', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Additional follow-up notes..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Doctor's Notes</label>
                  <textarea
                    value={formData.doctorNotes}
                    onChange={(e) => handleChange('doctorNotes', null, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={4}
                    placeholder="Additional notes and observations..."
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-pink-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Complete Medical Assessment</h3>
              <p className="text-sm text-gray-500">
                {patient?.personalInfo?.fullName} • #{patient?.patientId} • {appointment?.appointmentId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-1 p-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-rose-600 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(95vh-160px)]">
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {renderTabContent()}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50">
            <div className="flex space-x-2">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    activeTab === tab.id ? 'bg-rose-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-white hover:border-gray-400 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2 text-sm bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{isSubmitting ? 'Saving Assessment...' : 'Save Complete Assessment'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VitalsModal;