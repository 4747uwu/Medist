import React from 'react';

const PersonalInfo = ({ 
  formData, 
  phoneNumber, 
  handleInputChange, 
  calculateAge, 
  errors, 
  indianStates, 
  bloodGroups, 
  genders 
}) => {
  // Add debugging
  console.log('PersonalInfo - Current dateOfBirth value:', formData.personalInfo.dateOfBirth);
  console.log('PersonalInfo - Current age value:', formData.personalInfo.age);

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    console.log('Date selected:', selectedDate);
    
    // Update date of birth
    handleInputChange('personalInfo', 'dateOfBirth', selectedDate);
    
    // Calculate and update age only if date is valid
    if (selectedDate) {
      const calculatedAge = calculateAge(selectedDate);
      console.log('Calculated age:', calculatedAge);
      handleInputChange('personalInfo', 'age', calculatedAge.toString());
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.personalInfo.fullName}
              onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
            />
            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                value={formData.personalInfo.dateOfBirth || ''} // Ensure it's never undefined
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
              />
              {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                value={formData.personalInfo.age || ''}
                onChange={(e) => handleInputChange('personalInfo', 'age', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="Auto-calculated"
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select
                value={formData.personalInfo.gender}
                onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                {genders.map(gender => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </select>
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              <select
                value={formData.personalInfo.bloodGroup}
                onChange={(e) => handleInputChange('personalInfo', 'bloodGroup', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input
                type="number"
                value={formData.personalInfo.height.value}
                onChange={(e) => handleInputChange('personalInfo', 'height', e.target.value, 'value')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter height"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                value={phoneNumber}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.contactInfo.email}
                onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
            <input
              type="text"
              value={formData.contactInfo.address.street}
              onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value, 'street')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter street address"
            />
            {errors.street && <p className="text-xs text-red-500 mt-1">{errors.street}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                value={formData.contactInfo.address.city}
                onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value, 'city')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City"
              />
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <select
                value={formData.contactInfo.address.state}
                onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value, 'state')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select State</option>
                {indianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
              <input
                type="text"
                value={formData.contactInfo.address.pincode}
                onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value, 'pincode')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="6-digit pincode"
                maxLength={6}
              />
              {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Emergency Contact</h4>
        
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.emergencyContact.name}
              onChange={(e) => handleInputChange('emergencyContact', 'name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Emergency contact name"
            />
            {errors.emergencyName && <p className="text-xs text-red-500 mt-1">{errors.emergencyName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
            <input
              type="text"
              value={formData.emergencyContact.relationship}
              onChange={(e) => handleInputChange('emergencyContact', 'relationship', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Spouse, Parent"
            />
            {errors.emergencyRelationship && <p className="text-xs text-red-500 mt-1">{errors.emergencyRelationship}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              type="tel"
              value={formData.emergencyContact.phone}
              onChange={(e) => handleInputChange('emergencyContact', 'phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10-digit phone number"
              maxLength={10}
            />
            {errors.emergencyPhone && <p className="text-xs text-red-500 mt-1">{errors.emergencyPhone}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;