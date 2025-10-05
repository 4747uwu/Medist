import React from 'react';

const DateFilter = ({ activeFilter, onFilterChange, studyCount = 39, liveCount = 0, newCount = 45 }) => {
  console.log('DateFilter - Active filter:', activeFilter);

  const filters = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'custom', label: 'Custom' }
  ];

  const handleFilterClick = (filterId) => {
    console.log('DateFilter - Changing filter to:', filterId);
    onFilterChange(filterId);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Time Filters */}
      <div className="flex items-center gap-0.5 bg-white rounded p-0.5 border border-gray-300">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterClick(filter.id)}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-all whitespace-nowrap
              ${activeFilter === filter.id
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>

      
    </div>
  );
};

export default DateFilter;