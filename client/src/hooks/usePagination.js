import { useState, useCallback } from 'react';

const usePagination = (initialLimit = 50) => {
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: initialLimit
  });

  const updatePagination = useCallback((newPagination) => {
    setPagination(prev => ({
      ...prev,
      ...newPagination
    }));
  }, []);

  const setPage = useCallback((page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  }, []);

  const setLimit = useCallback((limit) => {
    setPagination(prev => ({
      ...prev,
      limit,
      currentPage: 1 // Reset to first page when changing limit
    }));
  }, []);

  const resetPagination = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  }, []);

  return {
    pagination,
    updatePagination,
    setPage,
    setLimit,
    resetPagination
  };
};

export default usePagination;