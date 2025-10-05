import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

const MedicineSearchModal = ({ isOpen, onClose, onSelectMedicines, selectedMedicines = [] }) => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState(selectedMedicines);
  const [filters, setFilters] = useState({
    companyName: 'all'
  });

  useEffect(() => {
    if (isOpen) {
      fetchMedicines();
    }
  }, [isOpen, searchTerm, filters]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        companyName: filters.companyName !== 'all' ? filters.companyName : '',
        isActive: true,
        limit: 50
      });

      const response = await apiClient.get(`/medicines/search?${params}`);
      if (response.data.success) {
        setMedicines(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMedicine = (medicine) => {
    const isSelected = selectedItems.find(item => item._id === medicine._id);
    
    if (isSelected) {
      setSelectedItems(selectedItems.filter(item => item._id !== medicine._id));
    } else {
      setSelectedItems([...selectedItems, {
        ...medicine,
        dosage: '',
        frequency: '',
        duration: '',
        timing: '',
        instructions: ''
      }]);
    }
  };

  const handleSave = () => {
    onSelectMedicines(selectedItems);
    onClose();
  };

  // Get unique company names for filter
  const uniqueCompanies = [...new Set(medicines.map(med => med.companyName))].sort();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Medicines ({selectedItems.length} selected)
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search medicines by name or company..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={filters.companyName}
                onChange={(e) => setFilters({...filters, companyName: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Companies</option>
                {uniqueCompanies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Medicine List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm text-gray-600">Loading medicines...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {medicines.map((medicine) => {
                const isSelected = selectedItems.find(item => item._id === medicine._id);
                return (
                  <div
                    key={medicine._id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectMedicine(medicine)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => handleSelectMedicine(medicine)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            {medicine.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Company: {medicine.companyName}
                          </p>
                          <p className="text-xs text-gray-400">
                            Code: {medicine.medicineCode || 'Auto-generated'}
                            {medicine.category && ` • Category: ${medicine.category}`}
                            {medicine.strengthDisplay && ` • ${medicine.strengthDisplay}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {medicine.cost?.sellingPrice && (
                          <p className="text-sm font-medium text-gray-900">
                            ₹{medicine.cost.sellingPrice}
                          </p>
                        )}
                        {medicine.form && (
                          <p className="text-xs text-gray-500">
                            {medicine.form}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedItems.length} medicine(s) selected
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Add Selected Medicines
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineSearchModal;