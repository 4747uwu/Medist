import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../services/api';
import Navbar from '../../components/layout/Navbar';

const PrescriptionPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editPrescriptionId = searchParams.get('edit');
  const appointmentId = searchParams.get('appointmentId');
  const fromAppointment = searchParams.get('fromAppointment') === 'true';
  
  // State for medicines
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [medicineLoading, setMedicineLoading] = useState(false);
  const [medicinePage, setMedicinePage] = useState(1);
  const [medicinePagination, setMedicinePagination] = useState({});
  
  // State for tests
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [testSearch, setTestSearch] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testPage, setTestPage] = useState(1);
  const [testPagination, setTestPagination] = useState({});
  
  // State for prescription
  const [patient, setPatient] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [existingPrescription, setExistingPrescription] = useState(null);
  const [activeTab, setActiveTab] = useState('medicines');

  // Additional prescription data
  const [prescriptionData, setPrescriptionData] = useState({
    diagnosis: { primary: '', secondary: [] },
    symptoms: [],
    advice: {
      lifestyle: '',
      diet: '',
      followUp: { required: false, duration: '', instructions: '' }
    }
  });

  // All existing useEffect hooks remain the same...
  useEffect(() => {
    fetchPatientDetails();
    if (appointmentId) {
      fetchAppointmentDetails();
    }
    if (editPrescriptionId) {
      setIsEditing(true);
      fetchExistingPrescription(editPrescriptionId);
    }
  }, [patientId, appointmentId, editPrescriptionId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'medicines') {
        fetchMedicines();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [medicineSearch, medicinePage, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'tests') {
        fetchTests();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [testSearch, testPage, activeTab]);

  useEffect(() => {
    if (activeTab === 'medicines') {
      fetchInitialMedicines();
    } else if (activeTab === 'tests') {
      fetchInitialTests();
    }
  }, [activeTab]);

  // All existing functions with updated limits...
  const fetchPatientDetails = async () => {
    try {
      const response = await apiClient.get(`/doctor/patients/${patientId}`);
      if (response.data.success) {
        setPatient(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
      setError('Failed to load patient details');
    }
  };

  const fetchAppointmentDetails = async () => {
    try {
      const response = await apiClient.get(`/appointments/${appointmentId}`);
      if (response.data.success) {
        setAppointment(response.data.data);
        
        const appointmentData = response.data.data;
        if (appointmentData.chiefComplaints?.primary || appointmentData.examination?.provisionalDiagnosis) {
          setPrescriptionData(prev => ({
            ...prev,
            diagnosis: {
              primary: appointmentData.examination?.provisionalDiagnosis || '',
              secondary: appointmentData.examination?.differentialDiagnosis || []
            },
            symptoms: appointmentData.chiefComplaints?.primary ? [appointmentData.chiefComplaints.primary] : [],
            advice: {
              ...prev.advice,
              followUp: {
                ...prev.advice.followUp,
                instructions: appointmentData.followUp?.instructions || ''
              }
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      setError('Failed to load appointment details');
    }
  };

  const fetchExistingPrescription = async (prescriptionId) => {
    try {
      const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
      if (response.data.success) {
        const prescription = response.data.data;
        setExistingPrescription(prescription);
        
        setSelectedMedicines(prescription.medicines || []);
        setSelectedTests(prescription.tests || []);
        setPrescriptionData({
          diagnosis: prescription.diagnosis || { primary: '', secondary: [] },
          symptoms: prescription.symptoms || [],
          advice: prescription.advice || {
            lifestyle: '',
            diet: '',
            followUp: { required: false, duration: '', instructions: '' }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching existing prescription:', error);
      setError('Failed to load existing prescription');
    }
  };

  const fetchMedicines = async () => {
    try {
      setMedicineLoading(true);
      const params = new URLSearchParams({
        search: medicineSearch,
        page: medicinePage,
        limit: 15,
        isActive: true
      });

      const response = await apiClient.get(`/medicines/search?${params}`);
      if (response.data.success) {
        const medicinesData = response.data.data.data || response.data.data;
        const paginationData = response.data.data.pagination || {};
        
        setMedicines(medicinesData);
        setMedicinePagination(paginationData);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setMedicineLoading(false);
    }
  };

  const fetchInitialMedicines = async () => {
    try {
      setMedicineLoading(true);
      const params = new URLSearchParams({
        page: 1,
        limit: 15,
        isActive: true
      });

      const response = await apiClient.get(`/medicines/search?${params}`);
      if (response.data.success) {
        const medicinesData = response.data.data.data || response.data.data;
        const paginationData = response.data.data.pagination || {};
        
        setMedicines(medicinesData);
        setMedicinePagination(paginationData);
      }
    } catch (error) {
      console.error('Error fetching initial medicines:', error);
      setError('Failed to load medicines');
    } finally {
      setMedicineLoading(false);
    }
  };

  const fetchInitialTests = async () => {
    try {
      setTestLoading(true);
      const params = new URLSearchParams({
        page: 1,
        limit: 15,
        isActive: true
      });

      const response = await apiClient.get(`/tests/search?${params}`);
      if (response.data.success) {
        const testsData = response.data.data.data || response.data.data;
        const paginationData = response.data.data.pagination || {};
        
        setTests(testsData);
        setTestPagination(paginationData);
      }
    } catch (error) {
      console.error('Error fetching initial tests:', error);
      setError('Failed to load tests');
    } finally {
      setTestLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      setTestLoading(true);
      const params = new URLSearchParams({
        search: testSearch,
        page: testPage,
        limit: 15,
        isActive: true
      });

      const response = await apiClient.get(`/tests/search?${params}`);
      if (response.data.success) {
        const testsData = response.data.data.data || response.data.data;
        const paginationData = response.data.data.pagination || {};
        
        setTests(testsData);
        setTestPagination(paginationData);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setTestLoading(false);
    }
  };

  const handleMedicineSelect = (medicine) => {
    const isSelected = selectedMedicines.find(item => item._id === medicine._id || item.medicineId === medicine._id);
    
    if (isSelected) {
      setSelectedMedicines(selectedMedicines.filter(item => 
        item._id !== medicine._id && item.medicineId !== medicine._id
      ));
    } else {
      setSelectedMedicines([...selectedMedicines, {
        _id: medicine._id,
        medicineId: medicine._id,
        name: medicine.name,
        medicineName: medicine.name,
        medicineCode: medicine.medicineCode,
        companyName: medicine.companyName,
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '7 days',
        timing: 'After meals',
        instructions: ''
      }]);
    }
  };

  const handleTestSelect = (test) => {
    const isSelected = selectedTests.find(item => item._id === test._id || item.testId === test._id);
    
    if (isSelected) {
      setSelectedTests(selectedTests.filter(item => 
        item._id !== test._id && item.testId !== test._id
      ));
    } else {
      setSelectedTests([...selectedTests, {
        _id: test._id,
        testId: test._id,
        testName: test.testName,
        testCode: test.testCode,
        category: test.category,
        cost: test.cost,
        urgency: 'Routine',
        instructions: ''
      }]);
    }
  };

  const handleMedicinePageChange = (newPage) => {
    setMedicinePage(newPage);
  };

  const handleTestPageChange = (newPage) => {
    setTestPage(newPage);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      if (selectedMedicines.length === 0 && selectedTests.length === 0) {
        setError('Please select at least one medicine or test');
        return;
      }

      const prescriptionPayload = {
        patientId,
        appointmentId: appointmentId || null, // ✅ Get from URL params
        visitId: appointment?.visitId || patient?.currentVisitId || `VISIT-${patientId}-${Date.now()}`,
        medicines: selectedMedicines.map(med => ({
          medicineId: med._id || med.medicineId,
          medicineName: med.name || med.medicineName,
          medicineCode: med.medicineCode,
          dosage: med.dosage || '1 tablet',
          frequency: med.frequency || 'Twice daily',
          duration: med.duration || '7 days',
          timing: med.timing || 'After meals',
          instructions: med.instructions || ''
        })),
        tests: selectedTests.map(test => ({
          testId: test._id || test.testId,
          testName: test.testName,
          testCode: test.testCode,
          urgency: test.urgency || 'Routine',
          instructions: test.instructions || ''
        })),
        ...prescriptionData,
        appointmentData: appointment ? {
          appointmentId: appointment.appointmentId, // ✅ Include appointmentId in appointmentData
          scheduledDate: appointment.scheduledDate,
          scheduledTime: appointment.scheduledTime,
          chiefComplaints: appointment.chiefComplaints,
          vitals: appointment.vitals,
          examination: appointment.examination
        } : null
      };

      // ✅ FIXED: Add logging to verify appointmentId is being sent
      console.log('Saving prescription with data:', {
        appointmentId: prescriptionPayload.appointmentId,
        isFromAppointment: fromAppointment,
        hasAppointmentData: !!prescriptionPayload.appointmentData
      });

      let response;
      if (isEditing && existingPrescription) {
        response = await apiClient.put(`/prescriptions/${existingPrescription.prescriptionId}`, prescriptionPayload);
      } else {
        response = await apiClient.post('/prescriptions', prescriptionPayload);
      }
      
      if (response.data.success) {
        const prescriptionId = response.data.data.prescriptionId;
        alert(`Prescription ${isEditing ? 'updated' : 'created'} successfully!\nPrescription ID: ${prescriptionId}`);
        
        if (fromAppointment) {
          navigate(`/doctor-dashboard?patientId=${patientId}&tab=appointments`);
        } else {
          navigate('/doctor-dashboard');
        }
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      setError('Failed to save prescription. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistory = () => {
    navigate(`/prescription-history/${patientId}`);
  };

  // Super Compact Pagination Component
  const BottomPagination = ({ pagination, onPageChange, disabled = false, label }) => {
    if (!pagination || !pagination.totalPages || pagination.totalPages <= 1) return null;

    const { currentPage, totalPages } = pagination;
    
    return (
      <div className="flex items-center justify-between py-1 px-2 bg-white border-t border-gray-200 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-gray-600 font-medium">{label}</span>
          <span className="text-gray-500 bg-gray-100 px-1 py-0.5 rounded text-xs">
            {pagination.totalItems || 0}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={disabled || currentPage <= 1}
            className="px-1 py-0.5 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 bg-white"
          >
            ‹‹
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={disabled || currentPage <= 1}
            className="px-2 py-0.5 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 bg-white"
          >
            ‹
          </button>
          
          <span className="text-xs text-gray-700 px-2 py-0.5 bg-gray-100 border border-gray-300 rounded">
            {currentPage}/{totalPages}
          </span>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={disabled || currentPage >= totalPages}
            className="px-2 py-0.5 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 bg-white"
          >
            ›
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={disabled || currentPage >= totalPages}
            className="px-1 py-0.5 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 bg-white"
          >
            ››
          </button>
        </div>
      </div>
    );
  };

  if (!patient) {
    return (
      <div className="h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
          <span className="ml-1 text-xs text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* SUPER COMPACT HEADER */}
      <div className="bg-white border-b border-gray-200 px-2 py-1 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              {isEditing ? 'Edit' : 'New'} Prescription
              {isEditing && existingPrescription && (
                <span className="ml-1 text-xs font-normal text-gray-500">
                  #{existingPrescription.prescriptionId}
                </span>
              )}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{patient.personalInfo?.fullName} • #{patient.patientId}</span>
              {appointment && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">
                    {appointment.appointmentId}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* COMPACT ACTION BUTTONS */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 text-xs">
              <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-medium">
                {selectedMedicines.length}M
              </span>
              <span className="bg-green-100 text-green-700 px-1 py-0.5 rounded font-medium">
                {selectedTests.length}T
              </span>
            </div>
            
            <button
              onClick={handleViewHistory}
              className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-all"
            >
              📋
            </button>
            
            <button
              onClick={() => {
                if (fromAppointment) {
                  navigate(`/doctor-dashboard?patientId=${patientId}&tab=appointments`);
                } else {
                  navigate('/doctor-dashboard');
                }
              }}
              className="px-2 py-0.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-all"
            >
              ✕
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving || (selectedMedicines.length === 0 && selectedTests.length === 0)}
              className="px-2 py-0.5 text-xs bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-2 w-2 border border-white border-t-transparent"></div>
                  {isEditing ? 'Update' : 'Save'}
                </>
              ) : (
                <>
                  <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEditing ? 'Update' : 'Save'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* COMPACT ERROR/INFO DISPLAY */}
      {error && (
        <div className="mx-2 mt-1 p-1 bg-red-50 border-l-2 border-red-400 rounded-r flex-shrink-0">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {appointment && (
        <div className="mx-2 mt-1 p-1 bg-blue-50 border-l-2 border-blue-400 rounded-r flex-shrink-0">
          <p className="text-xs text-blue-700 font-medium">
            Appointment: {appointment.appointmentId}
          </p>
        </div>
      )}

      {/* COMPACT TAB NAVIGATION */}
      <div className="bg-white border-b border-gray-200 px-2 py-1 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('medicines')}
            className={`px-2 py-1 text-xs rounded transition-all ${
              activeTab === 'medicines'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            💊 Medicines ({selectedMedicines.length})
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-2 py-1 text-xs rounded transition-all ${
              activeTab === 'tests'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🧪 Tests ({selectedTests.length})
          </button>
          <button
            onClick={() => setActiveTab('additional')}
            className={`px-2 py-1 text-xs rounded transition-all ${
              activeTab === 'additional'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📝 Info
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex min-h-0">
        
        {/* LEFT SIDE - AVAILABLE ITEMS */}
        <div className="flex-1 flex flex-col bg-white border-r border-gray-200">
          
          {/* MEDICINES TAB */}
          {activeTab === 'medicines' && (
            <>
              {/* Compact Search Header */}
              <div className="p-2 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">💊 Available Medicines</h2>
                <div className="relative">
                  <svg className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={medicineSearch}
                    onChange={(e) => {
                      setMedicineSearch(e.target.value);
                      setMedicinePage(1);
                    }}
                    placeholder="Search medicines..."
                    className="w-full pl-7 pr-3 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  {medicineLoading && (
                    <div className="absolute right-2 top-1.5">
                      <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Medicine List */}
              <div className="flex-1 overflow-y-auto p-2">
                {medicines.length > 0 ? (
                  <div className="space-y-1">
                    {medicines.map((medicine) => {
                      const isSelected = selectedMedicines.find(item => 
                        item._id === medicine._id || item.medicineId === medicine._id
                      );
                      return (
                        <div
                          key={medicine._id}
                          className={`p-2 border rounded cursor-pointer transition-all hover:shadow-sm ${
                            isSelected 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleMedicineSelect(medicine)}
                        >
                          <div className="flex items-center">
                            <div className={`w-3 h-3 mr-2 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-gray-900 truncate">{medicine.name}</h4>
                              <p className="text-xs text-gray-500 truncate">{medicine.companyName}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-500 text-xs">
                    {medicineLoading ? 'Loading...' : 'No medicines found'}
                  </div>
                )}
              </div>

              {/* Pagination */}
              <BottomPagination 
                pagination={medicinePagination}
                onPageChange={handleMedicinePageChange}
                disabled={medicineLoading}
                label="Medicines"
              />
            </>
          )}

          {/* TESTS TAB */}
          {activeTab === 'tests' && (
            <>
              {/* Compact Search Header */}
              <div className="p-2 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">🧪 Available Tests</h2>
                <div className="relative">
                  <svg className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={testSearch}
                    onChange={(e) => {
                      setTestSearch(e.target.value);
                      setTestPage(1);
                    }}
                    placeholder="Search tests..."
                    className="w-full pl-7 pr-3 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent"
                  />
                  {testLoading && (
                    <div className="absolute right-2 top-1.5">
                      <div className="animate-spin rounded-full h-3 w-3 border border-green-600 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Test List */}
              <div className="flex-1 overflow-y-auto p-2">
                {tests.length > 0 ? (
                  <div className="space-y-1">
                    {tests.map((test) => {
                      const isSelected = selectedTests.find(item => 
                        item._id === test._id || item.testId === test._id
                      );
                      return (
                        <div
                          key={test._id}
                          className={`p-2 border rounded cursor-pointer transition-all hover:shadow-sm ${
                            isSelected 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleTestSelect(test)}
                        >
                          <div className="flex items-center">
                            <div className={`w-3 h-3 mr-2 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-green-600 border-green-600' : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-gray-900 truncate">{test.testName}</h4>
                              <p className="text-xs text-gray-500 truncate">{test.category} • ₹{test.cost}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-500 text-xs">
                    {testLoading ? 'Loading...' : 'No tests found'}
                  </div>
                )}
              </div>

              {/* Pagination */}
              <BottomPagination 
                pagination={testPagination}
                onPageChange={handleTestPageChange}
                disabled={testLoading}
                label="Tests"
              />
            </>
          )}

          {/* ADDITIONAL INFO TAB */}
          {activeTab === 'additional' && (
            <div className="flex-1 overflow-y-auto p-2">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">📝 Additional Information</h2>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Primary Diagnosis
                  </label>
                  <textarea
                    value={prescriptionData.diagnosis.primary}
                    onChange={(e) => setPrescriptionData({
                      ...prescriptionData,
                      diagnosis: { ...prescriptionData.diagnosis, primary: e.target.value }
                    })}
                    placeholder="Enter primary diagnosis..."
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Lifestyle Advice
                  </label>
                  <textarea
                    value={prescriptionData.advice.lifestyle}
                    onChange={(e) => setPrescriptionData({
                      ...prescriptionData,
                      advice: { ...prescriptionData.advice, lifestyle: e.target.value }
                    })}
                    placeholder="Enter lifestyle recommendations..."
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - SELECTED ITEMS - SUPER COMPACT */}
        <div className="w-72 bg-gray-50 border-l border-gray-200 flex flex-col">
          <div className="p-2 bg-white border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Selected Items</h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                {selectedMedicines.length}M
              </span>
              <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">
                {selectedTests.length}T
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {/* Selected Medicines */}
            {selectedMedicines.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-900 mb-1">💊 Medicines</h4>
                <div className="space-y-1">
                  {selectedMedicines.map((medicine, index) => (
                    <div key={index} className="bg-white p-2 rounded border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-medium text-gray-900 truncate">
                            {medicine.name || medicine.medicineName}
                          </h5>
                          <p className="text-xs text-gray-500 truncate">{medicine.companyName}</p>
                        </div>
                        <button
                          onClick={() => handleMedicineSelect(medicine)}
                          className="text-red-500 hover:text-red-700 ml-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-0.5">
                        <input
                          type="text"
                          placeholder="Dosage"
                          value={medicine.dosage || ''}
                          onChange={(e) => {
                            const updated = [...selectedMedicines];
                            updated[index].dosage = e.target.value;
                            setSelectedMedicines(updated);
                          }}
                          className="px-1 py-0.5 text-xs border border-gray-200 rounded"
                        />
                        <input
                          type="text"
                          placeholder="Frequency"
                          value={medicine.frequency || ''}
                          onChange={(e) => {
                            const updated = [...selectedMedicines];
                            updated[index].frequency = e.target.value;
                            setSelectedMedicines(updated);
                          }}
                          className="px-1 py-0.5 text-xs border border-gray-200 rounded"
                        />
                        <input
                          type="text"
                          placeholder="Duration"
                          value={medicine.duration || ''}
                          onChange={(e) => {
                            const updated = [...selectedMedicines];
                            updated[index].duration = e.target.value;
                            setSelectedMedicines(updated);
                          }}
                          className="px-1 py-0.5 text-xs border border-gray-200 rounded"
                        />
                        <input
                          type="text"
                          placeholder="Timing"
                          value={medicine.timing || ''}
                          onChange={(e) => {
                            const updated = [...selectedMedicines];
                            updated[index].timing = e.target.value;
                            setSelectedMedicines(updated);
                          }}
                          className="px-1 py-0.5 text-xs border border-gray-200 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Tests */}
            {selectedTests.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-900 mb-1">🧪 Tests</h4>
                <div className="space-y-1">
                  {selectedTests.map((test, index) => (
                    <div key={index} className="bg-white p-2 rounded border border-green-200">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-medium text-gray-900 truncate">{test.testName}</h5>
                          <p className="text-xs text-gray-500 truncate">{test.category} • ₹{test.cost}</p>
                        </div>
                        <button
                          onClick={() => handleTestSelect(test)}
                          className="text-red-500 hover:text-red-700 ml-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <select
                        value={test.urgency || 'Routine'}
                        onChange={(e) => {
                          const updated = [...selectedTests];
                          updated[index].urgency = e.target.value;
                          setSelectedTests(updated);
                        }}
                        className="w-full text-xs border border-gray-200 rounded px-1 py-0.5"
                      >
                        <option value="Routine">Routine</option>
                        <option value="Urgent">Urgent</option>
                        <option value="STAT">STAT</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {selectedMedicines.length === 0 && selectedTests.length === 0 && (
              <div className="text-center py-4">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 text-xs">No items selected</p>
                <p className="text-gray-400 text-xs">Select items to add</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPage;