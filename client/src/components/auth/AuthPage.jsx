import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Aurora from '../Design/Aurora';
import logoNav from '../../assets/logonav.png';

const AuthPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form data
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const { login, loading, error, isAuthenticated, user, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Clear error when form changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [loginData]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = getDashboardRoute(user.role);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    }
  }, [isAuthenticated, user, navigate, location]);

  // Get dashboard route based on role
  const getDashboardRoute = (role) => {
    switch (role) {
      case 'clinic':
        return '/clinic-dashboard';
      case 'doctor':
        return '/doctor-dashboard';
      case 'assigner':
        return '/assigner-dashboard';
      default:
        return '/auth';
    }
  };

  // Handle login form changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) clearError();
  };

  // Handle login submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await login(loginData.email, loginData.password);
      if (!result.success) {
        console.log('Login failed:', result.error);
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation function
  const isLoginValid = () => loginData.email && loginData.password;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-8 h-8 border-2 border-purple-200 rounded-full animate-spin mx-auto"></div>
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="mt-3 text-gray-600 font-medium text-xs">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      {/* Aurora Effect - Smaller */}
      <div className="absolute top-0 left-0 right-0 h-60 z-0 opacity-50">
        <Aurora
          colorStops={["#FADADD", "#F6B8B8", "#ECA1A6", "#D8A48F"]}
          blend={0.4}
          amplitude={1.0}
          speed={0.4}
        />
      </div>

      {/* Super Compact Content Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 py-4">
        <div className="w-full max-w-sm">
          {/* Ultra Compact Login Card */}
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl p-4 shadow-2xl border border-white/80">
            
            {/* Header - Large Logo, Compact Text */}
            <div className="text-center mb-3 flex flex-col items-center">
              <img 
                src={logoNav} 
                alt="HealthTech Pro" 
                className="w-40 h-40 object-contain mb-2" 
              />
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-sm">
                Sign in to your account
              </p>
            </div>

            {/* Compact Error Display */}
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3">
                <div className="flex items-center text-xs">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Super Compact Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-sm text-sm"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  required
                  disabled={loading || isSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2.5 pr-10 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-sm text-sm"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                    disabled={loading || isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isLoginValid() || loading || isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-purple-800 to-pink-500 hover:from-blue-600 hover:to-pink-400 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] shadow-lg hover:shadow-xl text-sm"
              >
                {(loading || isSubmitting) ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Ultra Compact Features */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="group">
                  <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700 font-medium">Secure</span>
                </div>
                <div className="group">
                  <div className="w-7 h-7 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-3 h-3 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700 font-medium">Fast</span>
                </div>
                <div className="group">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700 font-medium">Reliable</span>
                </div>
              </div>
            </div>

            {/* Compact Footer */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                © 2024 HealthTech Pro. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;