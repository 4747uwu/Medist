import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    profile: {
      firstName: '',
      lastName: '',
      phone: ''
    },
    clinicDetails: {
      clinicName: '',
      address: '',
      registrationNumber: ''
    },
    doctorDetails: {
      specialization: '',
      qualification: '',
      experience: '',
      registrationNumber: '',
      consultationFee: ''
    },
    assignerDetails: {
      department: ''
    }
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);

  const { register, loading, error, isAuthenticated, user, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRoute(user.role);
      navigate(dashboardRoute, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const getDashboardRoute = (role) => {
    switch (role) {
      case 'clinic':
        return '/clinic-dashboard';
      case 'doctor':
        return '/doctor-dashboard';
      case 'assigner':
        return '/assigner-dashboard';
      default:
        return '/';
    }
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 6) errors.push('At least 6 characters');
    if (!/(?=.*[a-z])/.test(password)) errors.push('One lowercase letter');
    if (!/(?=.*[A-Z])/.test(password)) errors.push('One uppercase letter');
    if (!/(?=.*\d)/.test(password)) errors.push('One number');
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Validate password
    if (name === 'password') {
      setPasswordErrors(validatePassword(value));
    }

    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      clearError();
      return setIsSubmitting(false);
    }

    // Validate password strength
    if (passwordErrors.length > 0) {
      return setIsSubmitting(false);
    }

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: formData.profile
      };

      // Add role-specific details
      if (formData.role === 'clinic') {
        userData.clinicDetails = formData.clinicDetails;
      } else if (formData.role === 'doctor') {
        userData.doctorDetails = {
          ...formData.doctorDetails,
          experience: parseInt(formData.doctorDetails.experience) || 0,
          consultationFee: parseFloat(formData.doctorDetails.consultationFee) || 0
        };
      } else if (formData.role === 'assigner') {
        userData.assignerDetails = formData.assignerDetails;
      }

      const result = await register(userData);
      
      if (result.success) {
        console.log('Registration successful');
      }
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      passwordErrors.length === 0 &&
      formData.role &&
      formData.profile.firstName &&
      formData.profile.lastName
    );
  };

  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'clinic':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Clinic Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <input
                name="clinicDetails.clinicName"
                type="text"
                placeholder="Clinic Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.clinicDetails.clinicName}
                onChange={handleChange}
                required
              />
              <textarea
                name="clinicDetails.address"
                placeholder="Clinic Address"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.clinicDetails.address}
                onChange={handleChange}
                required
              />
              <input
                name="clinicDetails.registrationNumber"
                type="text"
                placeholder="Registration Number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.clinicDetails.registrationNumber}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        );

      case 'doctor':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Doctor Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="doctorDetails.specialization"
                type="text"
                placeholder="Specialization"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.doctorDetails.specialization}
                onChange={handleChange}
                required
              />
              <input
                name="doctorDetails.qualification"
                type="text"
                placeholder="Qualification"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.doctorDetails.qualification}
                onChange={handleChange}
                required
              />
              <input
                name="doctorDetails.experience"
                type="number"
                placeholder="Years of Experience"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.doctorDetails.experience}
                onChange={handleChange}
                min="0"
              />
              <input
                name="doctorDetails.registrationNumber"
                type="text"
                placeholder="Medical Registration Number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.doctorDetails.registrationNumber}
                onChange={handleChange}
                required
              />
              <input
                name="doctorDetails.consultationFee"
                type="number"
                placeholder="Consultation Fee"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.doctorDetails.consultationFee}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        );

      case 'assigner':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Assigner Details</h3>
            <input
              name="assignerDetails.department"
              type="text"
              placeholder="Department"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.assignerDetails.department}
              onChange={handleChange}
              required
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Medical System Portal
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="profile.firstName"
                type="text"
                placeholder="First Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.profile.firstName}
                onChange={handleChange}
                required
              />
              <input
                name="profile.lastName"
                type="text"
                placeholder="Last Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.profile.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <input
              name="email"
              type="email"
              placeholder="Email Address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              name="profile.phone"
              type="tel"
              placeholder="Phone Number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.profile.phone}
              onChange={handleChange}
            />

            {/* Role Selection */}
            <select
              name="role"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select Role</option>
              <option value="clinic">Clinic</option>
              <option value="doctor">Doctor</option>
              <option value="assigner">Assigner</option>
            </select>

            {/* Password Fields */}
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {passwordErrors.length > 0 && (
              <div className="text-sm text-red-600">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside">
                  {passwordErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-sm text-red-600">Passwords do not match</p>
            )}
          </div>

          {/* Role-specific fields */}
          {formData.role && renderRoleSpecificFields()}

          <button
            type="submit"
            disabled={!isFormValid() || loading || isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(loading || isSubmitting) ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in here
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;