import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar';
import SearchBar from '../../components/assigner/SearchBar';
import DateFilter from '../../components/assigner/DateFilter';
import WorklistTable from '../../components/common/WorklistTable';
import PaginationFooter from '../../components/common/PaginationFooter';
import CreatePatientModal from '../../components/assigner/CreatePatientModal';
import usePagination from '../../hooks/usePagination';
import { apiClient } from '../../services/api';

const ClinicDashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [workflowFilter, setWorkflowFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);

  // 🔥 AUTO-REFRESH: Add auto-refresh state and refs
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const autoRefreshIntervalRef = useRef(null);
  const isComponentMountedRef = useRef(true);

  // Use pagination hook
  const { pagination, updatePagination, setPage, setLimit, resetPagination } = usePagination(50);

  console.log('ClinicDashboard - Mounted with user:', user);

  // 🔥 AUTO-REFRESH: Enhanced fetch function with refresh tracking
  const fetchPatients = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        console.log('🔄 ClinicDashboard - Auto-refreshing data...');
      } else {
        console.log('🔄 ClinicDashboard - Fetching patients with filters:', { 
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

      const response = await apiClient.get(`/clinic/patients?${params}`);
      
      if (isAutoRefresh) {
        console.log('✅ ClinicDashboard - Auto-refresh completed');
      } else {
        console.log('📊 ClinicDashboard - Patients response:', response.data);
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
      console.error('❌ ClinicDashboard - Error fetching patients:', error);
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      }
    }
  };

  // 🔥 AUTO-REFRESH: Setup auto-refresh interval
  const setupAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    if (autoRefreshEnabled) {
      autoRefreshIntervalRef.current = setInterval(() => {
        if (isComponentMountedRef.current && autoRefreshEnabled) {
          fetchPatients(true); // isAutoRefresh = true
        }
      }, 5 * 60 * 1000); // 5 minutes
      
      console.log('🔄 ClinicDashboard - Auto-refresh enabled (5 minutes)');
    }
  };

  // 🔥 AUTO-REFRESH: Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    console.log('🔄 ClinicDashboard - Auto-refresh toggled:', !autoRefreshEnabled);
  };

  // 🔥 AUTO-REFRESH: Manual refresh
  const handleManualRefresh = () => {
    console.log('🔄 ClinicDashboard - Manual refresh triggered');
    fetchPatients(false);
  };

  // Initial load
  useEffect(() => {
    console.log('🚀 ClinicDashboard - Initial load');
    fetchPatients();
  }, []);

  // 🔥 AUTO-REFRESH: Setup auto-refresh on mount and when enabled state changes
  useEffect(() => {
    setupAutoRefresh();
    
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoRefreshEnabled]);

  // 🔥 AUTO-REFRESH: Cleanup on unmount
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    return () => {
      isComponentMountedRef.current = false;
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

  // Refetch when filters or pagination change
  useEffect(() => {
    console.log('🔄 ClinicDashboard - Filters or pagination changed, refetching');
    fetchPatients();
  }, [dateFilter, workflowFilter, searchQuery, pagination.currentPage, pagination.limit]);

  // Reset to first page when filters change
  useEffect(() => {
    resetPagination();
  }, [dateFilter, workflowFilter, searchQuery, resetPagination]);

  const handleSearch = (query) => {
    console.log('🔍 ClinicDashboard - Search query changed:', query);
    setSearchQuery(query);
  };

  const handleFilterChange = (filter) => {
    console.log('📅 ClinicDashboard - Date filter changed:', filter);
    setDateFilter(filter);
  };

  const handleWorkflowFilterChange = (filter) => {
    console.log('🏷️ ClinicDashboard - Workflow filter changed:', filter);
    setWorkflowFilter(filter);
  };

  const handlePageChange = (page) => {
    console.log('📄 ClinicDashboard - Page changed to:', page);
    setPage(page);
  };

  const handleLimitChange = (limit) => {
    console.log('📊 ClinicDashboard - Limit changed to:', limit);
    setLimit(limit);
  };

  const handlePatientSelect = (patient) => {
    console.log('👤 ClinicDashboard - Patient selected:', patient);
    // Handle patient selection (open details, etc.)
  };

  const handleAssignPatient = (result) => {
    console.log('✅ ClinicDashboard - Assignment updated:', result);
    fetchPatients();
  };

  const handleViewReport = (patient) => {
    console.log('📋 ClinicDashboard - View report for patient:', patient);
    if (patient.reportUrl || patient.currentVisit?.reportUrl) {
      window.open(patient.reportUrl || patient.currentVisit.reportUrl, '_blank');
    }
  };

  const handleCreatePatient = () => {
    console.log('👤 ClinicDashboard - Create Patient clicked');
    setShowCreatePatientModal(true);
  };

  const handlePatientCreated = (result) => {
    console.log('✅ ClinicDashboard - Patient/Visit created successfully:', result);
    if (result.patient) {
      alert(`Patient ${result.patient.personalInfo.fullName} created successfully!`);
    } else {
      alert(`New visit recorded successfully!`);
    }
    fetchPatients();
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search and Filter Section */}
        <div className="flex-shrink-0 px-4 py-3 bg-white justify-between border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between space-x-4">
              <SearchBar 
                onSearch={handleSearch} 
                onCreatePatient={handleCreatePatient}
                placeholder="Search clinic patients..."
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

              {/* 🔥 AUTO-REFRESH: Refresh Controls */}
              <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                {/* Manual Refresh Button */}
                <button
                  onClick={handleManualRefresh}
                  disabled={loading}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  <span>Auto </span>
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

export default ClinicDashboard;