import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar';
import { apiClient } from '../../services/api';

// ✅ ADD: Import the modal components
import CreateDoctorModal from '../../components/assigner/CreateDoctorModal';
import EditDoctorModal from './DoctorEditModal';
import DeleteDoctorModal from './DeleteDoctorModal';

const DoctorManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(20);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Auto-refresh
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const autoRefreshIntervalRef = useRef(null);
  const isComponentMountedRef = useRef(true);

  // Specializations for filter dropdown
  const specializations = [
    'General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics',
    'ENT', 'Gynecology', 'Neurology', 'Gastroenterology', 'Psychiatry'
  ];

  // Fetch doctors with filters
  const fetchDoctors = useCallback(async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        console.log('🔄 DoctorManagement - Auto-refreshing doctors...');
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        sortBy,
        sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(specialization && { specialization }),
        ...(statusFilter !== 'all' && { isActive: statusFilter === 'active' })
      });

      const response = await apiClient.get(`/assigner/doctors?${params}`);
      
      if (response.data.success && isComponentMountedRef.current) {
        const data = response.data.data;
        setDoctors(Array.isArray(data) ? data : data.doctors || []);
        
        // Handle pagination data
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.totalCount);
        } else {
          setTotalPages(Math.ceil((data.length || 0) / limit));
          setTotalCount(data.length || 0);
        }
        
        setLastRefreshTime(new Date());
      }
    } catch (error) {
      console.error('❌ Error fetching doctors:', error);
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      }
    }
  }, [currentPage, limit, sortBy, sortOrder, searchQuery, specialization, statusFilter]);

  // Auto-refresh setup
  const setupAutoRefresh = useCallback(() => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    if (autoRefreshEnabled) {
      autoRefreshIntervalRef.current = setInterval(() => {
        if (isComponentMountedRef.current) {
          fetchDoctors(true);
        }
      }, 2 * 60 * 1000); // 2 minutes for doctor management
    }
  }, [autoRefreshEnabled, fetchDoctors]);

  // Effects
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    setupAutoRefresh();
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [setupAutoRefresh]);

  useEffect(() => {
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

  // Event handlers
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDoctors();
  };

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === 'specialization') {
      setSpecialization(value);
    } else if (filterType === 'status') {
      setStatusFilter(value);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleCreateDoctor = () => {
    setSelectedDoctor(null);
    setShowCreateModal(true);
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowEditModal(true);
  };

  const handleDeleteDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedDoctor(null);
    fetchDoctors(); // Refresh after any modal action
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  };

  const getStatusBadge = (doctor) => {
    if (!doctor.isActive) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Inactive</span>;
    }
    if (doctor.doctorDetails?.isVerified) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Verified</span>;
    }
    return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
  };

  const getRoleBadge = (role) => {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
        Doctor
      </span>
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navbar />

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/assigner-dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <div className="h-6 border-l border-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
              <p className="text-sm text-gray-600">Manage doctors in the system</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </span>
            
            {/* Auto-refresh toggle */}
            <button
              onClick={toggleAutoRefresh}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                autoRefreshEnabled 
                  ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className={`h-2 w-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              Auto-refresh
            </button>
            
            <button
              onClick={handleCreateDoctor}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Doctor
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctors by name, email, or registration number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                type="submit"
                className="absolute right-2 top-1.5 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>

          {/* Specialization Filter */}
          <select
            value={specialization}
            onChange={(e) => handleFilterChange('specialization', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Specializations</option>
            {specializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Results count */}
          <div className="text-sm text-gray-600">
            Showing {doctors.length} of {totalCount} doctors
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading doctors...</p>
              </div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No doctors found</h3>
                <p className="mt-2 text-gray-500">Get started by creating a new doctor.</p>
                <button
                  onClick={handleCreateDoctor}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Doctor
                </button>
              </div>
            </div>
          ) : (
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('profile.firstName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Doctor</span>
                      {sortBy === 'profile.firstName' && (
                        <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('doctorDetails.specialization')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Specialization</span>
                      {sortBy === 'doctorDetails.specialization' && (
                        <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience & Fee
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Registration</span>
                      {sortBy === 'createdAt' && (
                        <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {doctors.map((doctor) => (
                  <tr key={doctor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-800">
                              {doctor.profile?.firstName?.charAt(0)}{doctor.profile?.lastName?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{doctor.email}</div>
                          <div className="text-xs text-gray-400">
                            Reg: {doctor.doctorDetails?.registrationNumber || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {getStatusBadge(doctor)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {doctor.doctorDetails?.specialization || 'Not specified'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doctor.doctorDetails?.qualification || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {doctor.doctorDetails?.experience ? `${doctor.doctorDetails.experience} years` : 'Not specified'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Fee: ₹{doctor.doctorDetails?.consultationFee || 'Not set'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doctor.clinicDetails?.clinicName || 'No clinic assigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditDoctor(doctor)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Edit Doctor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doctor)}
                        className="text-red-600 hover:text-red-900 transition-colors ml-2"
                        title="Delete Doctor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!loading && doctors.length > 0 && (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <span>Show</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border text-sm rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>

            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages} ({totalCount} total)
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateDoctorModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}

      {showEditModal && selectedDoctor && (
        <EditDoctorModal
          isOpen={showEditModal}
          doctor={selectedDoctor}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}

      {showDeleteModal && selectedDoctor && (
        <DeleteDoctorModal
          isOpen={showDeleteModal}
          doctor={selectedDoctor}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}
    </div>
  );
};

export default DoctorManagement;