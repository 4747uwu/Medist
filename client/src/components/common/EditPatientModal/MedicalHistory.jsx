import React from 'react';

const MedicalHistory = ({ 
  formData, 
  newCondition, 
  setNewCondition, 
  addChronicCondition, 
  removeChronicCondition,
  newAllergy,
  setNewAllergy,
  addAllergy,
  removeAllergy,
  newSurgery,
  setNewSurgery,
  addSurgery,
  removeSurgery
}) => {
  return (
    <div className="space-y-6">
      {/* Chronic Conditions */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Chronic Conditions</h4>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Add chronic condition (e.g., Diabetes, Hypertension)"
          />
          <button
            onClick={addChronicCondition}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {formData.medicalHistory.chronicConditions.map((condition, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">{condition.condition}</span>
              <button
                onClick={() => removeChronicCondition(idx)}
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

      {/* Allergies */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Allergies</h4>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Add allergy (e.g., Penicillin, Peanuts)"
          />
          <button
            onClick={addAllergy}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {formData.medicalHistory.allergies.map((allergy, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">{allergy.allergen}</span>
              <button
                onClick={() => removeAllergy(idx)}
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

      {/* Past Surgeries */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Past Surgeries</h4>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newSurgery.surgery}
            onChange={(e) => setNewSurgery({ ...newSurgery, surgery: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Surgery name"
          />
          <input
            type="date"
            value={newSurgery.date}
            onChange={(e) => setNewSurgery({ ...newSurgery, date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={addSurgery}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {formData.medicalHistory.pastSurgeries.map((surgery, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium">{surgery.surgery}</span>
                <span className="text-xs text-gray-500 ml-2">({surgery.date})</span>
              </div>
              <button
                onClick={() => removeSurgery(idx)}
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
  );
};

export default MedicalHistory;