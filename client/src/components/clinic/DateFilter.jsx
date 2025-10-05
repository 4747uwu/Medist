import React from 'react';

const DateFilter = ({ 
  activeFilter, 
  onFilterChange, 
  workflowFilter, 
  onWorkflowFilterChange, 
  stats 
}) => {
  const dateFilters = [
    { key: 'all', label: 'All Time', count: stats?.total || 0 },
    { key: 'today', label: 'Today', count: stats?.today || 0 },
    { key: 'week', label: 'This Week', count: stats?.week || 0 },
    { key: 'month', label: 'This Month', count: stats?.month || 0 }
  ];

  const workflowFilters = [
    { key: 'all', label: 'All', count: stats?.total || 0, color: 'bg-gray-100 text-gray-800' },
    { key: 'pending', label: 'Pending', count: stats?.pending || 0, color: 'bg-yellow-100 text-yellow-800' },
    { key: 'inprogress', label: 'In Progress', count: stats?.inprogress || 0, color: 'bg-blue-100 text-blue-800' },
    { key: 'completed', label: 'Completed', count: stats?.completed || 0, color: 'bg-green-100 text-green-800' }
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Date Filters */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 font-medium">Date:</span>
        {dateFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
              activeFilter === filter.key
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{filter.label}</span>
            <span className={`px-1 rounded text-xs ${
              activeFilter === filter.key
                ? 'bg-white text-black'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Workflow Status Filters */}
      <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
        <span className="text-xs text-gray-500 font-medium">Status:</span>
        {workflowFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onWorkflowFilterChange(filter.key)}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
              workflowFilter === filter.key
                ? 'bg-black text-white'
                : `${filter.color} hover:opacity-80`
            }`}
          >
            <span>{filter.label}</span>
            <span className={`px-1 rounded text-xs ${
              workflowFilter === filter.key
                ? 'bg-white text-black'
                : 'bg-white bg-opacity-50'
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateFilter;