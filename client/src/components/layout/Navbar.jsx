import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoNav from '../../assets/logonav.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  console.log('Navbar - User:', user);

  const handleLogout = async () => {
    console.log('Navbar - Logout clicked');
    await logout();
    navigate('/auth');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto px-4">
        <div className="flex justify-between items-center h-12">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <img 
                src={logoNav} 
                alt="HealthTech Pro" 
                className="h-24 w-24 rounded object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                {user?.role === 'assigner' && 'Task Assigner'}
                {user?.role === 'clinic' && 'Clinic Portal'}
                {user?.role === 'doctor' && 'Doctor Portal'}
              </h1>
              <p className="text-xs text-gray-400">
                {user?.assignerDetails?.department || 'HealthTech Pro'}
              </p>
            </div>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="p-1.5 text-gray-400 hover:text-gray-900 rounded transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* User menu */}
            <div className="flex items-center space-x-2 pl-3 border-l border-gray-200">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-900">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-medium shadow-md">
                {user?.profile?.firstName?.[0]}{user?.profile?.lastName?.[0]}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-gray-900 rounded transition-colors"
                title="Logout"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;