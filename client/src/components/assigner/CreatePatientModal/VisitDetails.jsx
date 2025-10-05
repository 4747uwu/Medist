import React from 'react';

const VisitDetails = ({ 
  formData, 
  patientExists, 
  handleInputChange, 
  appointmentModes,
  newTest,
  setNewTest,
  addTest,
  removeTest,
  newMedicine,
  setNewMedicine,
  addMedicine,
  removeMedicine,
  errors
}) => {
  // Updated: Access appointment data directly from formData.appointment
  const appointmentData = formData.appointment || {
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    mode: 'In-person',
    vitals: {
      weight: { value: '', unit: 'kg' },
      temperature: { value: '', unit: '°F' },
      bloodPressure: { systolic: '', diastolic: '' },
      heartRate: { value: '', unit: 'bpm' },
      oxygenSaturation: { value: '', unit: '%' },
      bloodSugar: { value: '', type: 'Random', unit: 'mg/dL' }
    },
    complaints: {
      chief: '',
      duration: '',
      severity: 'Moderate'
    },
    examination: {
      physicalFindings: '',
      provisionalDiagnosis: '',
      differentialDiagnosis: []
    },
    investigations: {
      testsRecommended: []
    },
    treatment: {
      medicines: []
    },
    followUp: {
      nextAppointmentDate: '',
      instructions: '',
      notes: ''
    },
    doctorNotes: ''
  };

  return (
    <div className="space-y-6">
      {patientExists && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <p className="text-sm text-green-800">
            <strong>Existing Patient:</strong> {formData.personalInfo?.fullName}
          </p>
        </div>
      )}

      {/* Appointment Details */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Appointment Details</h4>
        
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={appointmentData.date}
              onChange={(e) => handleInputChange('appointment', 'date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={appointmentData.time}
              onChange={(e) => handleInputChange('appointment', 'time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mode</label>
            <select
              value={appointmentData.mode}
              onChange={(e) => handleInputChange('appointment', 'mode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {appointmentModes.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vitals */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Vitals</h4>
        
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input
              type="number"
              value={appointmentData.vitals.weight.value}
              onChange={(e) => handleInputChange('appointment', 'vitals', e.target.value, 'weight', 'value')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="70"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Temp (°F)</label>
            <input
              type="number"
              step="0.1"
              value={appointmentData.vitals.temperature.value}
              onChange={(e) => handleInputChange('appointment', 'vitals', e.target.value, 'temperature', 'value')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="98.6"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
            <input
              type="number"
              value={appointmentData.vitals.heartRate.value}
              onChange={(e) => handleInputChange('appointment', 'vitals', e.target.value, 'heartRate', 'value')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="72"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">BP Systolic</label>
            <input
              type="number"
              value={appointmentData.vitals.bloodPressure.systolic}
              onChange={(e) => handleInputChange('appointment', 'vitals', e.target.value, 'bloodPressure', 'systolic')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="120"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">BP Diastolic</label>
            <input
              type="number"
              value={appointmentData.vitals.bloodPressure.diastolic}
              onChange={(e) => handleInputChange('appointment', 'vitals', e.target.value, 'bloodPressure', 'diastolic')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="80"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">SpO₂ (%)</label>
            <input
              type="number"
              value={appointmentData.vitals.oxygenSaturation.value}
              onChange={(e) => handleInputChange('appointment', 'vitals', e.target.value, 'oxygenSaturation', 'value')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="98"
            />
          </div>
        </div>
      </div>

      {/* Complaints */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Chief Complaints</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complaints *</label>
            <textarea
              value={appointmentData.complaints.chief}
              onChange={(e) => handleInputChange('appointment', 'complaints', e.target.value, 'chief')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={3}
              placeholder="Patient's main complaints..."
            />
            {errors.complaints && <p className="text-xs text-red-500 mt-1">{errors.complaints}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <input
              type="text"
              value={appointmentData.complaints.duration}
              onChange={(e) => handleInputChange('appointment', 'complaints', e.target.value, 'duration')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., 3 days, 2 weeks"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={appointmentData.complaints.severity}
              onChange={(e) => handleInputChange('appointment', 'complaints', e.target.value, 'severity')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Examination */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Examination & Diagnosis</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Physical Findings</label>
            <textarea
              value={appointmentData.examination.physicalFindings}
              onChange={(e) => handleInputChange('appointment', 'examination', e.target.value, 'physicalFindings')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={2}
              placeholder="Physical examination findings..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provisional Diagnosis *</label>
            <input
              type="text"
              value={appointmentData.examination.provisionalDiagnosis}
              onChange={(e) => handleInputChange('appointment', 'examination', e.target.value, 'provisionalDiagnosis')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Primary suspected diagnosis"
            />
            {errors.diagnosis && <p className="text-xs text-red-500 mt-1">{errors.diagnosis}</p>}
          </div>
        </div>
      </div>

      {/* Tests */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Recommended Tests</h4>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTest.testName}
            onChange={(e) => setNewTest({ ...newTest, testName: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Test name"
          />
          <select
            value={newTest.urgency}
            onChange={(e) => setNewTest({ ...newTest, urgency: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="Routine">Routine</option>
            <option value="Urgent">Urgent</option>
            <option value="STAT">STAT</option>
          </select>
          <button
            onClick={addTest}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {appointmentData.investigations.testsRecommended.map((test, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium">{test.testName}</span>
                <span className="text-xs text-gray-500 ml-2">({test.urgency})</span>
              </div>
              <button
                onClick={() => removeTest(idx)}
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

      {/* Medicines */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Prescribed Medicines</h4>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newMedicine.medicineName}
            onChange={(e) => setNewMedicine({ ...newMedicine, medicineName: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Medicine name"
          />
          <input
            type="text"
            value={newMedicine.dosage}
            onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Dosage"
          />
          <input
            type="text"
            value={newMedicine.duration}
            onChange={(e) => setNewMedicine({ ...newMedicine, duration: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Duration"
          />
          <button
            onClick={addMedicine}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {appointmentData.treatment.medicines.map((medicine, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium">{medicine.medicineName}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {medicine.dosage} - {medicine.duration}
                </span>
              </div>
              <button
                onClick={() => removeMedicine(idx)}
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

      {/* Follow-up & Notes */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Follow-up & Notes</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Next Appointment Date</label>
            <input
              type="date"
              value={appointmentData.followUp.nextAppointmentDate}
              onChange={(e) => handleInputChange('appointment', 'followUp', e.target.value, 'nextAppointmentDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Instructions</label>
            <textarea
              value={appointmentData.followUp.instructions}
              onChange={(e) => handleInputChange('appointment', 'followUp', e.target.value, 'instructions')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={2}
              placeholder="Follow-up instructions..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor's Notes</label>
            <textarea
              value={appointmentData.doctorNotes}
              onChange={(e) => handleInputChange('appointment', 'doctorNotes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={3}
              placeholder="Additional notes and observations..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitDetails;