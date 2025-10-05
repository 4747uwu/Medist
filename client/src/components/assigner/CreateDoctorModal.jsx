import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

const CreateDoctorModal = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureType, setSignatureType] = useState('upload');
  const [signatureData, setSignatureData] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Personal Details
    profile: {
      firstName: '',
      lastName: '',
      phone: '',
      profileImage: null
    },
    
    // Step 3: Professional Details
    doctorDetails: {
      specialization: '',
      qualification: '',
      experience: '',
      registrationNumber: '',
      consultationFee: '',
      availableDays: [],
      availableHours: {
        start: '',
        end: ''
      }
    }
  });

  const [errors, setErrors] = useState({});

  // ✅ Enhanced slides with moving gradients and animated elements
  const slides = [
    {
      title: "Welcome Doctor!",
      subtitle: "Join our healthcare network and make a difference",
      images: ["👨‍⚕️", "👩‍⚕️", "🩺", "💊"],
      background: "from-blue-500 via-indigo-600 to-purple-600",
      particles: Array.from({length: 12}, (_, i) => ({
        id: i,
        size: Math.random() * 6 + 3,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 4
      }))
    },
    {
      title: "Professional Profile",
      subtitle: "Build your medical identity and credentials",
      images: ["📋", "🎓", "👤", "📊"],
      background: "from-green-500 via-emerald-600 to-teal-600",
      particles: Array.from({length: 15}, (_, i) => ({
        id: i,
        size: Math.random() * 5 + 4,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3
      }))
    },
    {
      title: "Medical Expertise",
      subtitle: "Configure your specialization and practice details",
      images: ["🏥", "⚕️", "📅", "💰"],
      background: "from-purple-500 via-pink-600 to-red-600",
      particles: Array.from({length: 18}, (_, i) => ({
        id: i,
        size: Math.random() * 7 + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5
      }))
    },
    {
      title: "Digital Signature",
      subtitle: "Secure your prescriptions with digital authentication",
      images: ["✍️", "🔐", "📝", "✅"],
      background: "from-orange-500 via-amber-600 to-yellow-600",
      particles: Array.from({length: 20}, (_, i) => ({
        id: i,
        size: Math.random() * 8 + 3,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 6
      }))
    }
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const specializations = [
    'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics',
    'Psychiatry', 'Radiology', 'Surgery', 'General Medicine', 'Gynecology'
  ];

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

  console.log('CreateDoctorModal - Current step:', currentStep, 'Form data:', formData);

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        break;

      case 2:
        if (!formData.profile.firstName) newErrors.firstName = 'First name is required';
        if (!formData.profile.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.profile.phone) newErrors.phone = 'Phone is required';
        else if (!/^\d{10}$/.test(formData.profile.phone)) newErrors.phone = 'Phone must be 10 digits';
        break;

      case 3:
        if (!formData.doctorDetails.specialization) newErrors.specialization = 'Specialization is required';
        if (!formData.doctorDetails.qualification) newErrors.qualification = 'Qualification is required';
        if (!formData.doctorDetails.experience) newErrors.experience = 'Experience is required';
        if (!formData.doctorDetails.registrationNumber) newErrors.registrationNumber = 'Registration number is required';
        if (!formData.doctorDetails.consultationFee) newErrors.consultationFee = 'Consultation fee is required';
        if (formData.doctorDetails.availableDays.length === 0) newErrors.availableDays = 'Select at least one day';
        break;

      case 4:
        if (!signatureData) newErrors.signature = 'Signature is required';
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

  const handleInputChange = (section, field, value) => {
    if (section === 'root') {
      setFormData({ ...formData, [field]: value });
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
    const days = formData.doctorDetails.availableDays;
    if (days.includes(day)) {
      handleInputChange('doctorDetails', 'availableDays', days.filter(d => d !== day));
    } else {
      handleInputChange('doctorDetails', 'availableDays', [...days, day]);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureData(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    console.log('CreateDoctorModal - Submitting form...');
    setIsSubmitting(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        profile: formData.profile,
        doctorDetails: {
          ...formData.doctorDetails,
          signature: {
            image: signatureData
          }
        }
      };

      console.log('CreateDoctorModal - Payload:', payload);

      const response = await apiClient.post('/assigner/doctors', payload);

      console.log('CreateDoctorModal - Response:', response.data);

      if (response.data.success) {
        onSuccess && onSuccess(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('CreateDoctorModal - Error:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to create doctor' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentSlide = slides[currentStep - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden">
        {/* ✅ Left Side - Animated Slideshow with Moving Gradients */}
        <div className={`w-2/5 bg-gradient-to-br ${currentSlide.background} p-8 flex flex-col justify-between text-white relative overflow-hidden`}>
          {/* ✅ Moving gradient overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)`,
              animation: `moveGradient 4s ease-in-out infinite alternate`
            }}
          />

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
              <div className="text-8xl transition-all duration-1000 ease-in-out transform hover:scale-110 animate-pulse">
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
              <h3 className="text-xl font-bold text-gray-900">Create Doctor Account</h3>
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
            {/* Step 1: Account Credentials */}
            {currentStep === 1 && (
              <div className="space-y-3">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                  <p className="text-xs text-blue-800">
                    <strong>Account Setup:</strong> Create secure login credentials for the doctor
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('root', 'email', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="doctor@example.com"
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

            {/* Step 2: Personal Details */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.profile.firstName}
                      onChange={(e) => handleInputChange('profile', 'firstName', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="John"
                    />
                    {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.profile.lastName}
                      onChange={(e) => handleInputChange('profile', 'lastName', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Doe"
                    />
                    {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.profile.phone}
                    onChange={(e) => handleInputChange('profile', 'phone', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Professional Details */}
            {currentStep === 3 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Specialization</label>
                  <select
                    value={formData.doctorDetails.specialization}
                    onChange={(e) => handleInputChange('doctorDetails', 'specialization', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select specialization</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                  {errors.specialization && <p className="text-xs text-red-500 mt-1">{errors.specialization}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={formData.doctorDetails.qualification}
                      onChange={(e) => handleInputChange('doctorDetails', 'qualification', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="MBBS, MD"
                    />
                    {errors.qualification && <p className="text-xs text-red-500 mt-1">{errors.qualification}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Experience (years)</label>
                    <input
                      type="number"
                      value={formData.doctorDetails.experience}
                      onChange={(e) => handleInputChange('doctorDetails', 'experience', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="5"
                      min="0"
                    />
                    {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Registration Number</label>
                    <input
                      type="text"
                      value={formData.doctorDetails.registrationNumber}
                      onChange={(e) => handleInputChange('doctorDetails', 'registrationNumber', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Medical Council No."
                    />
                    {errors.registrationNumber && <p className="text-xs text-red-500 mt-1">{errors.registrationNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      value={formData.doctorDetails.consultationFee}
                      onChange={(e) => handleInputChange('doctorDetails', 'consultationFee', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="500"
                      min="0"
                    />
                    {errors.consultationFee && <p className="text-xs text-red-500 mt-1">{errors.consultationFee}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Available Days</label>
                  <div className="grid grid-cols-4 gap-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-2 py-1.5 text-xs rounded-md border transition-all ${
                          formData.doctorDetails.availableDays.includes(day)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  {errors.availableDays && <p className="text-xs text-red-500 mt-1">{errors.availableDays}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.doctorDetails.availableHours.start}
                      onChange={(e) => handleInputChange('doctorDetails', 'availableHours', { ...formData.doctorDetails.availableHours, start: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.doctorDetails.availableHours.end}
                      onChange={(e) => handleInputChange('doctorDetails', 'availableHours', { ...formData.doctorDetails.availableHours, end: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Signature */}
            {currentStep === 4 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Signature Type</label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => setSignatureType('upload')}
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-center ${
                        signatureType === 'upload'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-xl mb-1">📤</div>
                      <div className="text-xs font-medium">Upload Image</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureType('draw')}
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-center ${
                        signatureType === 'draw'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-xl mb-1">✍️</div>
                      <div className="text-xs font-medium">Draw Signature</div>
                    </button>
                  </div>
                </div>

                {signatureType === 'upload' ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Upload Signature Image</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                        id="signature-upload"
                      />
                      <label htmlFor="signature-upload" className="cursor-pointer">
                        {signatureData ? (
                          <img src={signatureData} alt="Signature" className="max-h-24 mx-auto" />
                        ) : (
                          <>
                            <div className="text-3xl mb-2">📷</div>
                            <p className="text-xs text-gray-600">Click to upload signature image</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Draw Your Signature</label>
                    <div className="border-2 border-gray-300 rounded-lg p-3 bg-white">
                      <canvas
                        className="w-full h-32 border border-gray-200 rounded cursor-crosshair bg-gray-50"
                        onMouseDown={() => console.log('Drawing started')}
                      />
                      <div className="flex justify-between mt-2">
                        <button
                          type="button"
                          className="text-xs text-gray-600 hover:text-gray-900"
                          onClick={() => setSignatureData(null)}
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          onClick={() => console.log('Save signature')}
                        >
                          Save Signature
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Draw your signature using your mouse or touchpad</p>
                  </div>
                )}

                {errors.signature && <p className="text-xs text-red-500 mt-1">{errors.signature}</p>}
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
                    👨‍⚕️ Create Doctor
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Add CSS for moving gradient animation */}
      <style jsx>{`
        @keyframes moveGradient {
          0% { transform: translateX(-100%) rotate(0deg); }
          50% { transform: translateX(100%) rotate(180deg); }
          100% { transform: translateX(-100%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CreateDoctorModal;