import React, { useState } from 'react';

const SearchBar = ({ onSearch, onCreatePatient, placeholder = "Search patients..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  console.log('SearchBar - Search term:', searchTerm);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('SearchBar - Submitting search:', searchTerm);
    onSearch(searchTerm);
  };

  const handleClear = () => {
    console.log('SearchBar - Clearing search');
    setSearchTerm('');
    onSearch('');
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
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title="Clear search"
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

      {/* Advanced Button */}
      <button className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span className="hidden sm:inline">Advanced</span>
      </button>

      {/* Clear Button */}
      <button className="px-2 py-1 bg-black text-white rounded text-xs hover:bg-gray-800 transition-colors flex items-center gap-1">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="hidden sm:inline">Clear</span>
      </button>

      {/* Refresh Button */}
      <button className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="hidden sm:inline">Refresh</span>
      </button>

      {/* Create Patient Button */}
      <button 
        onClick={onCreatePatient}
        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1 whitespace-nowrap"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Patient
      </button>
    </div>
  );
};

export default SearchBar;