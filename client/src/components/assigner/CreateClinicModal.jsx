import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

const CreateClinicModal = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info + User Account
    labId: '',
    labName: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminName: '',
    
    // Step 2: Registration Details
    registrationDetails: {
      registrationNumber: '',
      registrationDate: '',
      validUntil: '',
      issuedBy: ''
    },
    
    // Step 3: Contact Information
    contactInfo: {
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      phone: {
        primary: '',
        secondary: ''
      },
      email: {
        primary: '',
        secondary: ''
      },
      website: ''
    },
    
    // Step 4: Operational Details
    operationalDetails: {
      operatingHours: {
        monday: { open: '09:00', close: '18:00', isOpen: true },
        tuesday: { open: '09:00', close: '18:00', isOpen: true },
        wednesday: { open: '09:00', close: '18:00', isOpen: true },
        thursday: { open: '09:00', close: '18:00', isOpen: true },
        friday: { open: '09:00', close: '18:00', isOpen: true },
        saturday: { open: '09:00', close: '14:00', isOpen: true },
        sunday: { open: '', close: '', isOpen: false }
      },
      capacity: {
        patientsPerDay: '',
        doctorsCount: '',
        bedsCount: ''
      }
    }
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Enhanced slides with animated elements
  const slides = [
    {
      title: "Welcome to Our Network!",
      subtitle: "Register your clinic and create admin account",
      images: ["🏥", "🏨", "🏢", "🩺"],
      background: "from-blue-500 via-blue-600 to-indigo-600",
      particles: Array.from({length: 15}, (_, i) => ({
        id: i,
        size: Math.random() * 6 + 4,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 4
      }))
    },
    {
      title: "Legal Compliance",
      subtitle: "Ensure your clinic meets all regulatory requirements",
      images: ["📋", "📄", "🔏", "✅"],
      background: "from-green-500 via-emerald-600 to-teal-600",
      particles: Array.from({length: 12}, (_, i) => ({
        id: i,
        size: Math.random() * 5 + 3,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3
      }))
    },
    {
      title: "Contact & Location",
      subtitle: "Help patients find and reach your clinic easily",
      images: ["📍", "🗺️", "📞", "✉️"],
      background: "from-purple-500 via-violet-600 to-purple-700",
      particles: Array.from({length: 18}, (_, i) => ({
        id: i,
        size: Math.random() * 7 + 3,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5
      }))
    },
    {
      title: "Operational Setup",
      subtitle: "Configure your clinic's working hours and capacity",
      images: ["⏰", "👥", "🛏️", "⚡"],
      background: "from-orange-500 via-red-500 to-pink-600",
      particles: Array.from({length: 20}, (_, i) => ({
        id: i,
        size: Math.random() * 8 + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 6
      }))
    }
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // ✅ Auto-rotate slideshow images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides[currentStep - 1].images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentStep, slides]);

  // ✅ Reset slide index when step changes
  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [currentStep]);

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.labId) newErrors.labId = 'Lab ID is required';
        if (!formData.labName) newErrors.labName = 'Clinic name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email is invalid';
        }
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
        else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        if (!formData.adminName) newErrors.adminName = 'Admin name is required';
        break;

      case 2:
        if (!formData.registrationDetails.registrationNumber) {
          newErrors.registrationNumber = 'Registration number is required';
        }
        if (!formData.registrationDetails.registrationDate) {
          newErrors.registrationDate = 'Registration date is required';
        }
        if (!formData.registrationDetails.issuedBy) {
          newErrors.issuedBy = 'Issuing authority is required';
        }
        break;

      case 3:
        if (!formData.contactInfo.address.street) newErrors.street = 'Street address is required';
        if (!formData.contactInfo.address.city) newErrors.city = 'City is required';
        if (!formData.contactInfo.address.state) newErrors.state = 'State is required';
        if (!formData.contactInfo.address.pincode) newErrors.pincode = 'Pincode is required';
        else if (!/^\d{6}$/.test(formData.contactInfo.address.pincode)) {
          newErrors.pincode = 'Pincode must be 6 digits';
        }
        if (!formData.contactInfo.phone.primary) newErrors.primaryPhone = 'Primary phone is required';
        else if (!/^\d{10}$/.test(formData.contactInfo.phone.primary)) {
          newErrors.primaryPhone = 'Phone must be 10 digits';
        }
        if (!formData.contactInfo.email.primary) newErrors.primaryEmail = 'Primary email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.contactInfo.email.primary)) {
          newErrors.primaryEmail = 'Email is invalid';
        }
        break;

      case 4:
        if (!formData.operationalDetails.capacity.patientsPerDay) {
          newErrors.patientsPerDay = 'Daily capacity is required';
        }
        if (!formData.operationalDetails.capacity.doctorsCount) {
          newErrors.doctorsCount = 'Number of doctors is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleInputChange = (section, field, value, nested = null) => {
    if (section === 'root') {
      setFormData({ ...formData, [field]: value });
    } else if (nested) {
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: {
            ...formData[section][field],
            [nested]: value
          }
        }
      });
    } else {
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: value
        }
      });
    }
  };

  const handleDayToggle = (day) => {
    const currentDay = formData.operationalDetails.operatingHours[day];
    handleInputChange('operationalDetails', 'operatingHours', {
      ...currentDay,
      isOpen: !currentDay.isOpen
    }, day);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);

    try {
      const payload = {
        labId: formData.labId,
        labName: formData.labName,
        email: formData.email,
        password: formData.password,
        adminName: formData.adminName,
        registrationDetails: formData.registrationDetails,
        contactInfo: formData.contactInfo,
        operationalDetails: formData.operationalDetails
      };

      const response = await apiClient.post('/assigner/labs', payload);

      if (response.data.success) {
        onSuccess && onSuccess(response.data.data);
        onClose();
      }
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Failed to create clinic' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentSlide = slides[currentStep - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden">
        {/* ✅ Left Side - Animated Slideshow */}
        <div className={`w-2/5 bg-gradient-to-br ${currentSlide.background} p-8 flex flex-col justify-between text-white relative overflow-hidden`}>
          {/* ✅ Animated background particles */}
          <div className="absolute inset-0">
            {currentSlide.particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute rounded-full bg-white opacity-10 animate-pulse"
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-3 leading-tight">{currentSlide.title}</h2>
            <p className="text-lg opacity-90 leading-relaxed">{currentSlide.subtitle}</p>
          </div>
          
          {/* ✅ Animated central image display */}
          <div className="relative z-10 text-center">
            <div className="relative inline-block">
              {/* Main rotating image */}
              <div className="text-8xl transition-all duration-1000 ease-in-out transform hover:scale-110">
                {currentSlide.images[currentSlideIndex]}
              </div>
              
              {/* ✅ Floating side images */}
              <div className="absolute -top-4 -left-4 text-3xl opacity-60 animate-bounce" style={{animationDelay: '0.5s'}}>
                {currentSlide.images[(currentSlideIndex + 1) % currentSlide.images.length]}
              </div>
              <div className="absolute -bottom-4 -right-4 text-3xl opacity-60 animate-bounce" style={{animationDelay: '1s'}}>
                {currentSlide.images[(currentSlideIndex + 2) % currentSlide.images.length]}
              </div>
              <div className="absolute top-0 -right-6 text-2xl opacity-40 animate-pulse" style={{animationDelay: '1.5s'}}>
                {currentSlide.images[(currentSlideIndex + 3) % currentSlide.images.length]}
              </div>
            </div>
            
            {/* ✅ Image indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {currentSlide.images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentSlideIndex ? 'bg-white scale-125' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* ✅ Step progress indicators */}
          <div className="relative z-10 flex gap-2">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  idx + 1 === currentStep ? 'bg-white shadow-lg' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ✅ Right Side - Compact Form */}
        <div className="w-3/5 p-6 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Register Clinic</h3>
              <p className="text-xs text-gray-500">Step {currentStep} of 4</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ✅ Compact Form Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Step 1: Basic Information + User Account */}
            {currentStep === 1 && (
              <div className="space-y-3">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                  <p className="text-xs text-blue-800">
                    <strong>Account Setup:</strong> Create login credentials for the clinic administrator
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Lab/Clinic ID</label>
                    <input
                      type="text"
                      value={formData.labId}
                      onChange={(e) => handleInputChange('root', 'labId', e.target.value.toUpperCase())}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                      placeholder="CLI001"
                    />
                    {errors.labId && <p className="text-xs text-red-500 mt-1">{errors.labId}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Admin Name</label>
                    <input
                      type="text"
                      value={formData.adminName}
                      onChange={(e) => handleInputChange('root', 'adminName', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Full name"
                    />
                    {errors.adminName && <p className="text-xs text-red-500 mt-1">{errors.adminName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Clinic Name</label>
                  <input
                    type="text"
                    value={formData.labName}
                    onChange={(e) => handleInputChange('root', 'labName', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="City Healthcare Center"
                  />
                  {errors.labName && <p className="text-xs text-red-500 mt-1">{errors.labName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Login Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('root', 'email', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="admin@clinic.com"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('root', 'password', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                        placeholder="Min 6 chars"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('root', 'confirmPassword', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                        placeholder="Re-enter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Registration Details */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={formData.registrationDetails.registrationNumber}
                    onChange={(e) => handleInputChange('registrationDetails', 'registrationNumber', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Medical Council Registration Number"
                  />
                  {errors.registrationNumber && <p className="text-xs text-red-500 mt-1">{errors.registrationNumber}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Registration Date</label>
                    <input
                      type="date"
                      value={formData.registrationDetails.registrationDate}
                      onChange={(e) => handleInputChange('registrationDetails', 'registrationDate', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.registrationDate && <p className="text-xs text-red-500 mt-1">{errors.registrationDate}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={formData.registrationDetails.validUntil}
                      onChange={(e) => handleInputChange('registrationDetails', 'validUntil', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Issued By</label>
                  <input
                    type="text"
                    value={formData.registrationDetails.issuedBy}
                    onChange={(e) => handleInputChange('registrationDetails', 'issuedBy', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Medical Council of India"
                  />
                  {errors.issuedBy && <p className="text-xs text-red-500 mt-1">{errors.issuedBy}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {currentStep === 3 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
                  <textarea
                    value={formData.contactInfo.address.street}
                    onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value, 'street')}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="2"
                    placeholder="Building name, street, area"
                  />
                  {errors.street && <p className="text-xs text-red-500 mt-1">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.contactInfo.address.city}
                      onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value, 'city')}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="City"
                    />
                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                    <select
                      value={formData.contactInfo.address.state}
                      onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value, 'state')}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      {indianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={formData.contactInfo.address.pincode}
                      onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value, 'pincode')}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="6-digit"
                      maxLength={6}
                    />
                    {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Primary Phone</label>
                    <input
                      type="tel"
                      value={formData.contactInfo.phone.primary}
                      onChange={(e) => handleInputChange('contactInfo', 'phone', e.target.value, 'primary')}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="10-digit number"
                      maxLength={10}
                    />
                    {errors.primaryPhone && <p className="text-xs text-red-500 mt-1">{errors.primaryPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Secondary Phone</label>
                    <input
                      type="tel"
                      value={formData.contactInfo.phone.secondary}
                      onChange={(e) => handleInputChange('contactInfo', 'phone', e.target.value, 'secondary')}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Optional"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Primary Email</label>
                    <input
                      type="email"
                      value={formData.contactInfo.email.primary}
                      onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value, 'primary')}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="clinic@example.com"
                    />
                    {errors.primaryEmail && <p className="text-xs text-red-500 mt-1">{errors.primaryEmail}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Website (Optional)</label>
                    <input
                      type="url"
                      value={formData.contactInfo.website}
                      onChange={(e) => handleInputChange('contactInfo', 'website', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="www.example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Operational Details */}
            {currentStep === 4 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Operating Days</label>
                  <div className="grid grid-cols-2 gap-2">
                    {daysOfWeek.map(day => {
                      const dayData = formData.operationalDetails.operatingHours[day];
                      return (
                        <div key={day} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md">
                          <input
                            type="checkbox"
                            checked={dayData.isOpen}
                            onChange={() => handleDayToggle(day)}
                            className="h-3 w-3"
                          />
                          <span className="text-xs font-medium capitalize w-16">{day.slice(0,3)}</span>
                          {dayData.isOpen && (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="time"
                                value={dayData.open}
                                onChange={(e) => handleInputChange('operationalDetails', 'operatingHours', { ...dayData, open: e.target.value }, day)}
                                className="px-1 py-0.5 border border-gray-300 rounded text-xs w-16"
                              />
                              <span className="text-xs">-</span>
                              <input
                                type="time"
                                value={dayData.close}
                                onChange={(e) => handleInputChange('operationalDetails', 'operatingHours', { ...dayData, close: e.target.value }, day)}
                                className="px-1 py-0.5 border border-gray-300 rounded text-xs w-16"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Patients/Day</label>
                    <input
                      type="number"
                      value={formData.operationalDetails.capacity.patientsPerDay}
                      onChange={(e) => handleInputChange('operationalDetails', 'capacity', e.target.value, 'patientsPerDay')}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="50"
                      min="0"
                    />
                    {errors.patientsPerDay && <p className="text-xs text-red-500 mt-1">{errors.patientsPerDay}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Doctors</label>
                    <input
                      type="number"
                      value={formData.operationalDetails.capacity.doctorsCount}
                      onChange={(e) => handleInputChange('operationalDetails', 'capacity', e.target.value, 'doctorsCount')}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="5"
                      min="0"
                    />
                    {errors.doctorsCount && <p className="text-xs text-red-500 mt-1">{errors.doctorsCount}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Beds</label>
                    <input
                      type="number"
                      value={formData.operationalDetails.capacity.bedsCount}
                      onChange={(e) => handleInputChange('operationalDetails', 'capacity', e.target.value, 'bedsCount')}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="10"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* ✅ Compact Footer - Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t mt-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-medium hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
              >
                Next Step →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-xs font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    🏥 Register Clinic
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClinicModal;