import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar';
import SearchBar from '../../components/assigner/SearchBar';
import DateFilter from '../../components/assigner/DateFilter';
import WorklistTable from '../../components/common/WorklistTable';
import PaginationFooter from '../../components/common/PaginationFooter';
import CreatePatientModal from '../../components/assigner/CreatePatientModal';
import usePagination from '../../hooks/usePagination';
import { apiClient } from '../../services/api';

const JrDoctorDashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [workflowFilter, setWorkflowFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);

  // 🔥 AUTO-REFRESH: Same as clinic dashboard
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const autoRefreshIntervalRef = useRef(null);
  const isComponentMountedRef = useRef(true);

  // ✅ FIX: Add ref to track if this is initial load
  const isInitialLoadRef = useRef(true);

  // Use pagination hook
  const { pagination, updatePagination, setPage, setLimit, resetPagination } = usePagination(50);

  console.log('JrDoctorDashboard - Mounted with user:', user);

  // ✅ FIX: Memoize fetchPatients to prevent unnecessary re-renders
  const fetchPatients = useCallback(async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        console.log('🔄 JrDoctorDashboard - Auto-refreshing data...');
      } else {
        console.log('🔄 JrDoctorDashboard - Fetching patients with filters:', { 
          dateFilter, 
          workflowFilter, 
          searchQuery,
          pagination
        });
      }
      
      if (!isAutoRefresh) {
        setLoading(true);
      }

      const params = new URLSearchParams({
        dateFilter,
        workflowStatus: workflowFilter,
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(searchQuery && { search: searchQuery })
      });

      // 🔥 Use jr doctor specific endpoint for optimized queries
      const response = await apiClient.get(`/jrdoctors/patients?${params}`);
      console.log(response)
      
      if (isAutoRefresh) {
        console.log('✅ JrDoctorDashboard - Auto-refresh completed');
      } else {
        console.log('📊 JrDoctorDashboard - Patients response:', response.data);
      }

      if (response.data.success && isComponentMountedRef.current) {
        setPatients(response.data.data.data || []);
        setStats(response.data.data.stats || null);
        setLastRefreshTime(new Date());
        
        // Update pagination with response data
        updatePagination({
          currentPage: response.data.data.pagination?.currentPage || 1,
          totalPages: response.data.data.pagination?.totalPages || 1,
          totalCount: response.data.data.pagination?.totalCount || 0,
          limit: response.data.data.pagination?.limit || pagination.limit
        });
      }
    } catch (error) {
      console.error('❌ JrDoctorDashboard - Error fetching patients:', error);
      
      // Fallback to clinic endpoint if jr doctor endpoint fails
      if (error.response?.status === 404) {
        console.log('🔄 Falling back to clinic endpoint...');
        try {
          const params = new URLSearchParams({
            dateFilter,
            workflowStatus: workflowFilter,
            page: pagination.currentPage,
            limit: pagination.limit,
            ...(searchQuery && { search: searchQuery })
          });

          const response = await apiClient.get(`/clinic/patients?${params}`);
          
          if (response.data.success && isComponentMountedRef.current) {
            setPatients(response.data.data.data || []);
            setStats(response.data.data.stats || null);
            setLastRefreshTime(new Date());
            
            updatePagination({
              currentPage: response.data.data.pagination?.currentPage || 1,
              totalPages: response.data.data.pagination?.totalPages || 1,
              totalCount: response.data.data.pagination?.totalCount || 0,
              limit: response.data.data.pagination?.limit || pagination.limit
            });
          }
        } catch (fallbackError) {
          console.error('❌ Fallback to clinic endpoint also failed:', fallbackError);
        }
      }
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      }
    }
  }, [dateFilter, workflowFilter, searchQuery, pagination.currentPage, pagination.limit, updatePagination]); // ✅ Add dependencies

  // 🔥 AUTO-REFRESH: Setup auto-refresh interval (same as clinic)
  const setupAutoRefresh = useCallback(() => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    if (autoRefreshEnabled) {
      autoRefreshIntervalRef.current = setInterval(() => {
        if (isComponentMountedRef.current && autoRefreshEnabled) {
          fetchPatients(true); // isAutoRefresh = true
        }
      }, 5 * 60 * 1000); // 5 minutes
      
      console.log('🔄 JrDoctorDashboard - Auto-refresh enabled (5 minutes)');
    }
  }, [autoRefreshEnabled, fetchPatients]); // ✅ Add fetchPatients dependency

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    console.log('🔄 JrDoctorDashboard - Auto-refresh toggled:', !autoRefreshEnabled);
  };

  // Manual refresh
  const handleManualRefresh = () => {
    console.log('🔄 JrDoctorDashboard - Manual refresh triggered');
    fetchPatients(false);
  };

  // ✅ FIX: Initial load only once
  useEffect(() => {
    if (isInitialLoadRef.current) {
      console.log('🚀 JrDoctorDashboard - Initial load');
      fetchPatients();
      isInitialLoadRef.current = false; // ✅ Mark initial load as complete
    }
  }, []); // ✅ Empty dependency array for initial load only

  // ✅ FIX: Setup auto-refresh separately
  useEffect(() => {
    setupAutoRefresh();
    
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [setupAutoRefresh]);

  // ✅ FIX: Cleanup on unmount
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    return () => {
      isComponentMountedRef.current = false;
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

  // ✅ FIX: Only refetch when filters change (NOT on auto-refresh)
  useEffect(() => {
    if (!isInitialLoadRef.current) {
      console.log('🔄 JrDoctorDashboard - Filters or pagination changed, refetching');
      fetchPatients(false); // ✅ Force manual fetch when filters change
    }
  }, [dateFilter, workflowFilter, searchQuery, pagination.currentPage, pagination.limit]);

  // ✅ FIX: Reset pagination only when search/filter changes (not date filter)
  const resetPaginationCallback = useCallback(() => {
    if (!isInitialLoadRef.current) {
      resetPagination();
    }
  }, [resetPagination]);

  useEffect(() => {
    resetPaginationCallback();
  }, [workflowFilter, searchQuery]); // ✅ Removed dateFilter from here

  const handleSearch = (query) => {
    console.log('🔍 JrDoctorDashboard - Search query changed:', query);
    setSearchQuery(query);
  };

  const handleFilterChange = (filter) => {
    console.log('📅 JrDoctorDashboard - Date filter changed:', filter);
    setDateFilter(filter); // ✅ This will trigger the useEffect above
  };

  const handleWorkflowFilterChange = (filter) => {
    console.log('🏷️ JrDoctorDashboard - Workflow filter changed:', filter);
    setWorkflowFilter(filter);
  };

  const handlePageChange = (page) => {
    console.log('📄 JrDoctorDashboard - Page changed to:', page);
    setPage(page);
  };

  const handleLimitChange = (limit) => {
    console.log('📊 JrDoctorDashboard - Limit changed to:', limit);
    setLimit(limit);
  };

  const handlePatientSelect = (patient) => {
    console.log('👤 JrDoctorDashboard - Patient selected:', patient);
    // Handle patient selection (open details, etc.)
  };

  const handleAssignPatient = (result) => {
    console.log('✅ JrDoctorDashboard - Assignment updated:', result);
    fetchPatients();
  };

  const handleViewReport = (patient) => {
    console.log('📋 JrDoctorDashboard - View report for patient:', patient);
    if (patient.reportUrl || patient.currentVisit?.reportUrl) {
      window.open(patient.reportUrl || patient.currentVisit.reportUrl, '_blank');
    }
  };

  const handleCreatePatient = () => {
    console.log('👤 JrDoctorDashboard - Create Patient clicked');
    setShowCreatePatientModal(true);
  };

  const handlePatientCreated = (result) => {
    console.log('✅ JrDoctorDashboard - Patient/Visit created successfully:', result);
    if (result.patient) {
      alert(`Patient ${result.patient.personalInfo.fullName} created successfully!`);
    } else {
      alert(`New visit recorded successfully!`);
    }
    fetchPatients();
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Navbar with Jr Doctor indicator */}
      <Navbar />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Jr Doctor Badge */}
        <div className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-purple-900">Jr Doctor Dashboard</h2>
                  <p className="text-xs text-purple-600">
                    Dr. {user?.profile?.firstName} {user?.profile?.lastName} • {user?.clinicDetails?.clinicName}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                🩺 Junior Doctor
              </span>
              {/* ✅ FIX: Show current filter in header */}
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                📅 {dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}
              </span>
              <span className="text-xs text-purple-600">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="flex-shrink-0 px-4 py-3 bg-white justify-between border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between space-x-32">
              <SearchBar 
                onSearch={handleSearch} 
                onCreatePatient={handleCreatePatient}
                placeholder="Search patients..."
                showLabButton={false}
                showDoctorButton={false}
                showAdminButton={true}
              />
              
              <DateFilter 
                activeFilter={dateFilter} 
                onFilterChange={handleFilterChange}
                studyCount={patients.length}
                liveCount={0}
                newCount={stats?.active || 0}
              />

              {/* 🔥 AUTO-REFRESH: Refresh Controls (same as clinic) */}
              <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                {/* Manual Refresh Button */}
                <button
                  onClick={handleManualRefresh}
                  disabled={loading}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Refresh data now"
                >
                  <svg 
                    className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>

                {/* Auto-refresh Toggle */}
                <button
                  onClick={toggleAutoRefresh}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                    autoRefreshEnabled 
                      ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                  title={`Auto-refresh is ${autoRefreshEnabled ? 'enabled' : 'disabled'}`}
                >
                  <div className={`h-2 w-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>Auto</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-hidden px-0">
          <WorklistTable
            patients={patients}
            loading={loading}
            onPatientSelect={handlePatientSelect}
            onAssignPatient={handleAssignPatient}
            onViewReport={handleViewReport}
            showActions={false}
            showWorkflowFilter={true}
            workflowFilter={workflowFilter}
            onWorkflowFilterChange={handleWorkflowFilterChange}
            stats={stats}
            userRole="jrdoctor" // 🔥 Pass role for any role-specific behavior
          />
        </div>

        {/* Pagination Footer */}
        <div className="flex-shrink-0">
          <PaginationFooter
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            loading={loading}
            totalItems={pagination.totalCount}
            currentItems={patients.length}
            itemName="patients"
            showLimitSelector={true}
            limitOptions={[10, 25, 50, 100]}
          />
        </div>
      </div>

      {/* Create Patient Modal */}
      <CreatePatientModal
        isOpen={showCreatePatientModal}
        onClose={() => setShowCreatePatientModal(false)}
        onSuccess={handlePatientCreated}
      />
    </div>
  );
};

export default JrDoctorDashboard;