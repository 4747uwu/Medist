import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

const SearchBar = ({ 
  onSearch, 
  onCreateLab, 
  onCreateDoctor, 
  onCreatePatient, 
  onClinicFilter, // ✅ New prop for clinic filtering
  placeholder = "Search patients...",
  showLabButton = false,
  showDoctorButton = false, 
  showAdminButton = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedClinic, setSelectedClinic] = useState('all'); // ✅ New state for clinic filter
  const [clinics, setClinics] = useState([]); // ✅ New state for clinics list
  const [loadingClinics, setLoadingClinics] = useState(false);

  console.log('SearchBar - Search term:', searchTerm);
  console.log('SearchBar - Selected clinic:', selectedClinic);

  // ✅ Fetch clinics on component mount
  useEffect(() => {
    if (showLabButton || showAdminButton) { // Only fetch for assigner role
      fetchClinics();
    }
  }, [showLabButton, showAdminButton]);

  const fetchClinics = async () => {
    try {
      setLoadingClinics(true);
      const response = await apiClient.get('/assigner/clinics');
      if (response.data.success) {
        setClinics(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    } finally {
      setLoadingClinics(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('SearchBar - Submitting search:', searchTerm);
    onSearch(searchTerm);
  };

  const handleClear = () => {
    console.log('SearchBar - Clearing search');
    setSearchTerm('');
    setSelectedClinic('all'); // ✅ Reset clinic filter
    onSearch('');
    if (onClinicFilter) {
      onClinicFilter('all'); // ✅ Reset clinic filter
    }
  };

  // ✅ Handle clinic filter change
  const handleClinicChange = (e) => {
    const clinicId = e.target.value;
    console.log('SearchBar - Clinic filter changed:', clinicId);
    setSelectedClinic(clinicId);
    if (onClinicFilter) {
      onClinicFilter(clinicId);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Filter Dropdown */}
      <select 
        value={selectedFilter}
        onChange={(e) => setSelectedFilter(e.target.value)}
        className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white text-gray-700"
      >
        <option>All</option>
        <option>Active</option>
        <option>Inactive</option>
        <option>Deceased</option>
      </select>

      {/* ✅ Clinic Filter Dropdown - Only show for assigner */}
      {(showLabButton || showAdminButton) && (
        <select 
          value={selectedClinic}
          onChange={handleClinicChange}
          disabled={loadingClinics}
          className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white text-gray-700 min-w-32"
        >
          <option value="all">All Clinics</option>
          {clinics.map(clinic => (
            <option key={clinic.labId} value={clinic.labId}>
              {clinic.labName}
            </option>
          ))}
        </select>
      )}

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex-1 relative">
        <div className="relative">
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Input */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="block w-full pl-8 pr-20 py-1 border border-gray-300 rounded text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />

          {/* Clear and Search buttons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-0.5">
            {(searchTerm || selectedClinic !== 'all') && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title="Clear search and filters"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              type="submit"
              className="px-2 py-0.5 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* ✅ Rest of the buttons remain the same... */}
      {/* Advanced Button */}
      <button className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span className="hidden sm:inline">Advanced</span>
      </button>

      {/* Buttons for creating entities */}
      <button 
        onClick={onCreatePatient}
        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1 whitespace-nowrap"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Patient
      </button>

      {/* Lab Button - Only show if prop is true */}
      {showLabButton && (
        <button 
          onClick={onCreateLab}
          className="px-2 py-1 bg-black text-white rounded text-xs hover:bg-gray-800 transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Lab
        </button>
      )}

      {/* Doctor Button - Only show if prop is true */}
      {showDoctorButton && (
        <button 
          onClick={onCreateDoctor}
          className="px-2 py-1 bg-black text-white rounded text-xs hover:bg-gray-800 transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Doctor
        </button>
      )}

      {/* Admin Button - Only show if prop is true */}
      {showAdminButton && (
        <button className="px-2 py-1 bg-black text-white rounded text-xs hover:bg-gray-800 transition-colors flex items-center gap-1 whitespace-nowrap">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Admin
        </button>
      )}
    </div>
  );
};

export default SearchBar;