import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import components
import AuthPage from './components/auth/AuthPage';
import ClinicDashboard from './pages/clinic/Dashboard';
import DoctorDashboard from './pages/Doctor/Dashboard';
import AssignerDashboard from './pages/assigner/Dashboard';
import PrescriptionPage from './pages/Doctor/PrescriptionPage.jsx';
import PrescriptionHistoryPage from './pages/Doctor/PrescriptionHistoryPage.jsx';
import ShowAppointmentDetails from './pages/Doctor/Appointment/showAppointmentDetails';
import JrDoctorDashboard from './pages/jrDoctor/Dashboard';
import DoctorManagement from './pages/assigner/DoctorManagement';


// Protected Route Component (moved here)
const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - Auth State:', { 
    isAuthenticated, 
    user: user?.role, 
    loading, 
    requiredRole,
    allowedRoles,
    currentPath: location.pathname 
  });

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('ProtectedRoute - Loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    console.log('ProtectedRoute - Insufficient permissions:', { 
      userRole: user?.role, 
      requiredRole 
    });
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if the user's role is in the list of allowed roles
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    console.log('ProtectedRoute - Access denied for this role:', { 
      userRole: user?.role, 
      allowedRoles 
    });
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('ProtectedRoute - Access granted');
  return children;
};

// Unauthorized Component
const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Unauthorized Access</h1>
      <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
      <button 
        onClick={() => window.history.back()}
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

function App() {
  console.log('App - Component rendering');

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected routes */}
            <Route 
              path="/clinic-dashboard" 
              element={
                <ProtectedRoute requiredRole="clinic">
                  <ClinicDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor-dashboard" 
              element={
                <ProtectedRoute requiredRole="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/assigner-dashboard" 
              element={
                <ProtectedRoute requiredRole="assigner">
                  <AssignerDashboard />
                </ProtectedRoute>
              } 
            />

              <Route 
            path="/doctor-management" 
            element={
              <ProtectedRoute requiredRole="assigner">
                <DoctorManagement />
              </ProtectedRoute>
            } 
          />
          
            
            {/* ✅ NEW: Jr Doctor Dashboard Route */}
            <Route 
              path="/jrdoctor-dashboard" 
              element={
                <ProtectedRoute requiredRole="jrdoctor">
                  <JrDoctorDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Doctor-specific routes - Allow both doctor and jrdoctor */}
            <Route 
              path="/prescription/:patientId" 
              element={
                <ProtectedRoute allowedRoles={['doctor', 'jrdoctor']}>
                  <PrescriptionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prescription-history/:patientId" 
              element={
                <ProtectedRoute allowedRoles={['doctor', 'jrdoctor']}>
                  <PrescriptionHistoryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/appointment-details/:appointmentId" 
              element={
                <ProtectedRoute allowedRoles={['doctor', 'jrdoctor']}>
                  <ShowAppointmentDetails />
                </ProtectedRoute>
              } 
            />
            
            {/* ✅ LEGACY: Keep old jrdoctor route for backward compatibility */}
            <Route
              path="/jrdoctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['jrdoctor']}>
                  <JrDoctorDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Unauthorized route */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Default and fallback routes */}
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/register" element={<Navigate to="/auth" replace />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
