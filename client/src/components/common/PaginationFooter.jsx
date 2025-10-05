import React from 'react';

const PaginationFooter = ({
  pagination,
  onPageChange,
  onLimitChange,
  loading = false,
  totalItems = 0,
  currentItems = 0,
  itemName = 'items',
  showLimitSelector = true,
  limitOptions = [10, 25, 50, 100]
}) => {
  if (!pagination) return null;

  const {
    currentPage = 1,
    totalPages = 1,
    totalCount = 0,
    limit = 50
  } = pagination;

  // Calculate start and end item numbers
  const startItem = totalCount === 0 ? 0 : ((currentPage - 1) * limit) + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  // Generate page numbers to show (max 5 pages for compact design)
  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta);
         i <= Math.min(totalPages - 1, currentPage + delta);
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pageNumbers = totalPages > 1 ? getPageNumbers() : [];

  return (
    <div className="bg-white px-4 py-2 flex items-center justify-between text-sm border-gray-200">
      {/* Left side - Compact items info */}
      <div className="flex items-center gap-3">
        {/* Items count */}
        <div className="text-gray-700">
          <span className="font-medium">{startItem}</span>-<span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalCount}</span> {itemName}
        </div>
        
        {/* Progress indicator - compact */}
        {totalCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-16 bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((endItem / totalCount) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8">
              {Math.round((endItem / totalCount) * 100)}%
            </span>
          </div>
        )}

        {/* Items per page selector - compact */}
        {showLimitSelector && (
          <div className="flex items-center gap-1">
            <span className="text-gray-600 text-xs">Show:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange && onLimitChange(parseInt(e.target.value))}
              disabled={loading}
              className="text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              {limitOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side - Compact pagination controls */}
      <div className="flex items-center gap-1">
        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mr-2">
            <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent" />
            Loading...
          </div>
        )}

        {totalPages > 1 && (
          <>
            {/* First and Previous */}
            <button
              onClick={() => onPageChange(1)}
              disabled={loading || currentPage <= 1}
              className="px-1.5 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="First page"
            >
              ‹‹
            </button>

            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={loading || currentPage <= 1}
              className="px-1.5 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              ‹
            </button>

            {/* Page numbers - compact */}
            <div className="flex items-center gap-0.5 mx-1">
              {pageNumbers.map((pageNum, index) => {
                if (pageNum === '...') {
                  return (
                    <span
                      key={`dots-${index}`}
                      className="px-1 py-0.5 text-xs text-gray-500"
                    >
                      ...
                    </span>
                  );
                }

                const isCurrentPage = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    disabled={loading || isCurrentPage}
                    className={`px-2 py-0.5 text-xs border rounded transition-colors min-w-[24px] ${
                      isCurrentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50 disabled:opacity-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next and Last */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={loading || currentPage >= totalPages}
              className="px-1.5 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              ›
            </button>

            <button
              onClick={() => onPageChange(totalPages)}
              disabled={loading || currentPage >= totalPages}
              className="px-1.5 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Last page"
            >
              ››
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaginationFooter;