import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api';

const formatDateTime = (d) => {
  if (!d) return 'N/A';
  const dt = new Date(d);
  if (isNaN(dt)) return 'N/A';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const SeePrescriptionModal = ({ isOpen, onClose, patientId }) => {
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState({});
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    if (!isOpen || !patientId) return;
    
    const fetchPrescriptions = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching prescriptions for patient:', patientId);
        const response = await apiClient.get(`/prescriptions/patient/${patientId}`);
        const prescriptionList = response.data?.data || [];
        setPrescriptions(prescriptionList);
        console.log('Found prescriptions:', prescriptionList.length);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [isOpen, patientId]);

  const downloadPDF = async (prescriptionId) => {
    setDownloadingPDF(prev => ({ ...prev, [prescriptionId]: true }));
    try {
      console.log('Downloading PDF for prescription:', prescriptionId);
      const response = await apiClient.get(`/prescriptions/${prescriptionId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `prescription-${prescriptionId}.pdf`;
      if (contentDisposition) {
        const matches = /filename="(.+)"/.exec(contentDisposition);
        if (matches?.[1]) filename = matches[1];
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF');
    } finally {
      setDownloadingPDF(prev => ({ ...prev, [prescriptionId]: false }));
    }
  };

  const toggleExpanded = (prescriptionId) => {
    setExpandedCards(prev => ({
      ...prev,
      [prescriptionId]: !prev[prescriptionId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h3 className="text-xl font-semibold text-black">
              Prescriptions
            </h3>
            <p className="text-sm text-gray-600 mt-1">Patient #{patientId}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-black transition-all duration-200 p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[78vh] bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
              <span className="ml-3 text-gray-600 font-medium">Loading prescriptions...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 inline-block">
                <svg className="w-6 h-6 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-red-700 text-sm font-medium">{error}</div>
              </div>
            </div>
          )}

          {!loading && !error && prescriptions.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 inline-block">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-gray-500 font-medium">No prescriptions found</div>
                <div className="text-gray-400 text-sm mt-1">This patient has no prescription history</div>
              </div>
            </div>
          )}

          {!loading && prescriptions.length > 0 && (
            <div className="space-y-3">
              {prescriptions.map((prescription, index) => {
                const isExpanded = expandedCards[prescription._id];
                return (
                  <div key={prescription._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                    {/* Header - Always Visible */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150" 
                      onClick={() => toggleExpanded(prescription._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-semibold text-black">
                                {prescription.prescriptionCode || `RX-${prescription._id.slice(-6).toUpperCase()}`}
                              </div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {formatDateTime(prescription.createdAt)}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              Dr. {prescription.doctorName || 'Unknown Doctor'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex gap-3 text-xs text-gray-500">
                              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                                {prescription.medicines?.length || 0} Medicine{(prescription.medicines?.length || 0) !== 1 ? 's' : ''}
                              </span>
                              <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                                {prescription.tests?.length || 0} Test{(prescription.tests?.length || 0) !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadPDF(prescription._id);
                            }}
                            disabled={downloadingPDF[prescription._id]}
                            className="px-4 py-2 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                          >
                            {downloadingPDF[prescription._id] ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download PDF
                              </>
                            )}
                          </button>
                          
                          <button className="text-gray-400 hover:text-black transition-colors duration-200 p-1">
                            <svg 
                              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50">
                        <div className="p-4 space-y-4">
                          {prescription.medicines && prescription.medicines.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                <h6 className="text-sm font-semibold text-black">
                                  Medicines ({prescription.medicines.length})
                                </h6>
                              </div>
                              <div className="grid gap-2">
                                {prescription.medicines.map((med, idx) => (
                                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-150">
                                    <div className="font-medium text-black">
                                      {med.medicineName || 'Unknown Medicine'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {prescription.tests && prescription.tests.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                <h6 className="text-sm font-semibold text-black">
                                  Tests ({prescription.tests.length})
                                </h6>
                              </div>
                              <div className="grid gap-2">
                                {prescription.tests.map((test, idx) => (
                                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 hover:bg-green-50 transition-colors duration-150">
                                    <div className="font-medium text-black">
                                      {test.testName || 'Unknown Test'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(!prescription.medicines || prescription.medicines.length === 0) && 
                           (!prescription.tests || prescription.tests.length === 0) && (
                            <div className="text-center py-4">
                              <div className="text-gray-400 text-sm italic">No medicines or tests prescribed</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeePrescriptionModal;