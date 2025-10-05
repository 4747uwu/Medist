import React from 'react';

const PhoneEntry = ({ 
  phoneNumber, 
  setPhoneNumber, 
  onCheckPatient, 
  checkingPatient, 
  errors 
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Patient Lookup:</strong> Enter the patient's mobile number to check if they exist in our system
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Patient Mobile Number</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          placeholder="Enter 10-digit mobile number"
          maxLength={10}
        />
        {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <button
        onClick={onCheckPatient}
        disabled={checkingPatient || !/^\d{10}$/.test(phoneNumber)}
        className="w-full px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {checkingPatient ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Checking Patient...
          </>
        ) : (
          'Check Patient'
        )}
      </button>
    </div>
  );
};

export default PhoneEntry;