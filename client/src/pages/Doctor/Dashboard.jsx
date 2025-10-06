import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar';
import DoctorSearchBar from '../../components/doctor/SearchBar';
import DateFilter from '../../components/assigner/DateFilter';
import DoctorWorklistTable from '../../components/doctor/DoctorWorklistTable';
import PrescriptionHistory from '../../components/doctor/PrescriptionHistory';
import PaginationFooter from '../../components/common/PaginationFooter';
import usePagination from '../../hooks/usePagination';
import { apiClient } from '../../services/api';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [workflowFilter, setWorkflowFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // 🔥 AUTO-REFRESH: Add auto-refresh state and refs
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const autoRefreshIntervalRef = useRef(null);
  const isComponentMountedRef = useRef(true);

  // Use pagination hook
  const { pagination, updatePagination, setPage, setLimit, resetPagination } = usePagination(50);

  console.log('DoctorDashboard - Mounted with user:', user);

  // 🔥 AUTO-REFRESH: Enhanced fetch function with refresh tracking
  const fetchPatients = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        console.log('🔄 DoctorDashboard - Auto-refreshing data...');
      } else {
        console.log('🔄 DoctorDashboard - Fetching patients with filters:', { 
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

      const response = await apiClient.get(`/doctor/patients?${params}`);
      
      if (isAutoRefresh) {
        console.log('✅ DoctorDashboard - Auto-refresh completed');
      } else {
        console.log('📊 DoctorDashboard - Patients response:', response.data);
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
      console.error('❌ DoctorDashboard - Error fetching patients:', error);
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
      
      console.log('🔄 DoctorDashboard - Auto-refresh enabled (5 minutes)');
    }
  };

  // 🔥 AUTO-REFRESH: Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    console.log('🔄 DoctorDashboard - Auto-refresh toggled:', !autoRefreshEnabled);
  };

  // 🔥 AUTO-REFRESH: Manual refresh
  const handleManualRefresh = () => {
    console.log('🔄 DoctorDashboard - Manual refresh triggered');
    fetchPatients(false);
  };

  // Initial load
  useEffect(() => {
    console.log('🚀 DoctorDashboard - Initial load');
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
    console.log('🔄 DoctorDashboard - Filters or pagination changed, refetching');
    fetchPatients();
  }, [dateFilter, workflowFilter, searchQuery, pagination.currentPage, pagination.limit]);

  // Reset to first page when filters change
  useEffect(() => {
    resetPagination();
  }, [dateFilter, workflowFilter, searchQuery, resetPagination]);

  const handleSearch = (query) => {
    console.log('🔍 DoctorDashboard - Search query changed:', query);
    setSearchQuery(query);
  };

  const handleFilterChange = (filter) => {
    console.log('📅 DoctorDashboard - Date filter changed:', filter);
    setDateFilter(filter);
  };

  const handleWorkflowFilterChange = (filter) => {
    console.log('🏷️ DoctorDashboard - Workflow filter changed:', filter);
    setWorkflowFilter(filter);
  };

  const handlePageChange = (page) => {
    console.log('📄 DoctorDashboard - Page changed to:', page);
    setPage(page);
  };

  const handleLimitChange = (limit) => {
    console.log('📊 DoctorDashboard - Limit changed to:', limit);
    setLimit(limit);
  };

  const handlePatientSelect = (patient) => {
    console.log('👤 DoctorDashboard - Patient selected:', patient);
    setSelectedPatient(patient);
  };

  const handleUpdateStatus = async (patientId, newStatus) => {
    console.log('🔄 DoctorDashboard - Updating patient status:', patientId, newStatus);
    
    try {
      const response = await apiClient.put(`/doctor/patients/${patientId}/status`, {
        workflowStatus: newStatus
      });

      if (response.data.success) {
        console.log('✅ Status updated successfully');
        fetchPatients(); // Refresh the list
      }
    } catch (error) {
      console.error('❌ Error updating patient status:', error);
      alert('Failed to update patient status');
    }
  };

  const handleViewReport = (patient) => {
    console.log('📋 DoctorDashboard - View report for patient:', patient);
    if (patient.reportUrl || patient.currentVisit?.reportUrl) {
      window.open(patient.reportUrl || patient.currentVisit.reportUrl, '_blank');
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search and Filter Section */}
        <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DoctorSearchBar 
                onSearch={handleSearch} 
                placeholder="Search assigned patients..."
              />
              
              <DateFilter 
                activeFilter={dateFilter} 
                onFilterChange={handleFilterChange}
                studyCount={patients.length}
                liveCount={0}
                newCount={stats?.total || 0}
              />
            </div>

            <div className="flex items-center gap-4">
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

              {/* Clear filters button */}
              <button 
                onClick={() => {
                  setDateFilter('all');
                  setWorkflowFilter('all');
                  setSearchQuery('');
                }}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        

        {/* Table Container */}
        <div className="flex-1 overflow-hidden px-0">
          <DoctorWorklistTable
            patients={patients}
            loading={loading}
            onPatientSelect={handlePatientSelect}
            onUpdateStatus={handleUpdateStatus}
            onViewReport={handleViewReport}
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

      {/* Prescription History - Overlay */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Prescription History - {selectedPatient.personalInfo?.fullName}
              </h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <PrescriptionHistory patientId={selectedPatient._id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;