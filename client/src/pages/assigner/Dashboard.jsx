import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar';
import SearchBar from '../../components/assigner/SearchBar';
import DateFilter from '../../components/assigner/DateFilter';
import WorklistTable from '../../components/common/WorklistTable';
import PaginationFooter from '../../components/common/PaginationFooter';
import CreateClinicModal from '../../components/assigner/CreateClinicModal';
import CreateDoctorModal from '../../components/assigner/CreateDoctorModal';
import CreatePatientModal from '../../components/assigner/CreatePatientModal';
import usePagination from '../../hooks/usePagination';
import { apiClient } from '../../services/api';

const AssignerDashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [workflowFilter, setWorkflowFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [clinicFilter, setClinicsFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [showCreateLabModal, setShowCreateLabModal] = useState(false);
  const [showCreateDoctorModal, setShowCreateDoctorModal] = useState(false);
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
  
  // 🔥 AUTO-REFRESH: Add auto-refresh state and refs
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const autoRefreshIntervalRef = useRef(null);
  const isComponentMountedRef = useRef(true);

  // Use pagination hook
  const { pagination, updatePagination, setPage, setLimit, resetPagination } = usePagination(50);

  console.log('AssignerDashboard - Mounted with user:', user);

  // 🔥 AUTO-REFRESH: Enhanced fetch function with refresh tracking
  const fetchPatients = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        console.log('🔄 AssignerDashboard - Auto-refreshing data...');
      } else {
        console.log('🔄 AssignerDashboard - Fetching patients with filters:', { 
          dateFilter, 
          workflowFilter, 
          searchQuery,
          clinicFilter,
          pagination
        });
      }
      
      if (!isAutoRefresh) {
        setLoading(true);
      }

      const params = new URLSearchParams({
        dateFilter,
        workflowStatus: workflowFilter,
        labId: clinicFilter,
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(searchQuery && { search: searchQuery })
      });

      const response = await apiClient.get(`/assigner/patients?${params}`);
      
      if (isAutoRefresh) {
        console.log('✅ AssignerDashboard - Auto-refresh completed');
      } else {
        console.log('📊 AssignerDashboard - Patients response:', response.data);
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
      console.error('❌ AssignerDashboard - Error fetching patients:', error);
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
      
      console.log('🔄 AssignerDashboard - Auto-refresh enabled (5 minutes)');
    }
  };

  // 🔥 AUTO-REFRESH: Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    console.log('🔄 AssignerDashboard - Auto-refresh toggled:', !autoRefreshEnabled);
  };

  // 🔥 AUTO-REFRESH: Manual refresh
  const handleManualRefresh = () => {
    console.log('🔄 AssignerDashboard - Manual refresh triggered');
    fetchPatients(false);
  };

  // Initial load
  useEffect(() => {
    console.log('🚀 AssignerDashboard - Initial load');
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
    console.log('🔄 AssignerDashboard - Filters or pagination changed, refetching');
    fetchPatients();
  }, [dateFilter, workflowFilter, searchQuery, clinicFilter, pagination.currentPage, pagination.limit]);

  // Reset to first page when filters change
  useEffect(() => {
    resetPagination();
  }, [dateFilter, workflowFilter, searchQuery, clinicFilter, resetPagination]);

  const handleSearch = (query) => {
    console.log('🔍 AssignerDashboard - Search query changed:', query);
    setSearchQuery(query);
  };

  const handleFilterChange = (filter) => {
    console.log('📅 AssignerDashboard - Date filter changed:', filter);
    setDateFilter(filter);
  };

  const handleWorkflowFilterChange = (filter) => {
    console.log('🏷️ AssignerDashboard - Workflow filter changed:', filter);
    setWorkflowFilter(filter);
  };

  const handleClinicFilterChange = (clinicId) => {
    console.log('🏥 AssignerDashboard - Clinic filter changed:', clinicId);
    setClinicsFilter(clinicId);
  };

  const handlePageChange = (page) => {
    console.log('📄 AssignerDashboard - Page changed to:', page);
    setPage(page);
  };

  const handleLimitChange = (limit) => {
    console.log('📊 AssignerDashboard - Limit changed to:', limit);
    setLimit(limit);
  };

  const handlePatientSelect = (patient) => {
    console.log('👤 AssignerDashboard - Patient selected:', patient);
    // Handle patient selection (open details modal, etc.)
  };

  const handleAssignPatient = (result) => {
    console.log('✅ AssignerDashboard - Assignment updated:', result);
    // Refresh the patient list to reflect the new assignment status
    fetchPatients();
  };

  const handleViewReport = (patient) => {
    console.log('📋 AssignerDashboard - View report for patient:', patient);
    // Handle report viewing (open report modal/window, etc.)
    if (patient.reportUrl || patient.currentVisit?.reportUrl) {
      window.open(patient.reportUrl || patient.currentVisit.reportUrl, '_blank');
    }
  };

  const handleCreateLab = () => {
    console.log('🏥 AssignerDashboard - Create Lab clicked');
    setShowCreateLabModal(true);
  };

  const handleCreateDoctor = () => {
    console.log('👨‍⚕️ AssignerDashboard - Create Doctor clicked');
    setShowCreateDoctorModal(true);
  };

  const handleCreatePatient = () => {
    console.log('👤 AssignerDashboard - Create Patient clicked');
    setShowCreatePatientModal(true);
  };

  const handleLabCreated = (newLab) => {
    console.log('✅ AssignerDashboard - Lab created successfully:', newLab);
    alert(`Clinic "${newLab.lab.labName}" created successfully!`);
    fetchPatients(); // Refresh data
  };

  const handleDoctorCreated = (newDoctor) => {
    console.log('✅ AssignerDashboard - Doctor created successfully:', newDoctor);
    alert(`Doctor ${newDoctor.profile.firstName} ${newDoctor.profile.lastName} created successfully!`);
    fetchPatients(); // Refresh data
  };

  const handlePatientCreated = (result) => {
    console.log('✅ AssignerDashboard - Patient/Visit created successfully:', result);
    if (result.patient) {
      alert(`Patient ${result.patient.personalInfo.fullName} created successfully!`);
    } else {
      alert(`New visit recorded successfully!`);
    }
    fetchPatients(); // Refresh data
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Navbar - Fixed height */}
      <Navbar />

      {/* Main Content Container - Takes remaining height */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search and Filter Section - Fixed height */}
        <div className="flex-shrink-0 px-3 py-2">
          <div className="bg-white rounded px-3 py-1.5 border border-gray-200">
            <div className="flex items-center gap-2">
              <SearchBar 
                onSearch={handleSearch} 
                onCreateLab={handleCreateLab}
                onCreateDoctor={handleCreateDoctor}
                onCreatePatient={handleCreatePatient}
                onClinicFilter={handleClinicFilterChange}
                placeholder="Search patients..."
                showLabButton={true}
                showDoctorButton={true}
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
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
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

        {/* Table Container - Flexible height with scroll */}
        <div className="flex-1 flex flex-col px-3 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <WorklistTable
              patients={patients}
              loading={loading}
              onPatientSelect={handlePatientSelect}
              onAssignPatient={handleAssignPatient}
              onViewReport={handleViewReport}
              showActions={true}
              showWorkflowFilter={true}
              workflowFilter={workflowFilter}
              onWorkflowFilterChange={handleWorkflowFilterChange}
              stats={stats}
            />
          </div>
        </div>

        {/* Pagination Footer - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200">
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

      {/* Modals */}
      <CreateClinicModal
        isOpen={showCreateLabModal}
        onClose={() => setShowCreateLabModal(false)}
        onSuccess={handleLabCreated}
      />

      <CreateDoctorModal
        isOpen={showCreateDoctorModal}
        onClose={() => setShowCreateDoctorModal(false)}
        onSuccess={handleDoctorCreated}
      />

      <CreatePatientModal
        isOpen={showCreatePatientModal}
        onClose={() => setShowCreatePatientModal(false)}
        onSuccess={handlePatientCreated}
      />
    </div>
  );
};

export default AssignerDashboard;