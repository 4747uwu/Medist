import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';

const ManageDocumentsModal = ({ isOpen, onClose, appointment, patient, onSuccess }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  // Check if user can upload documents (assigners, clinics, and doctors)
  const canUpload = ['assigner', 'clinic', 'jrdoctor'].includes(user?.role);

  const documentTypes = [
    'Lab Report',
    'X-Ray',
    'Prescription',
    'Medical Certificate',
    'Referral Letter',
    'Scan Report',
    'Other'
  ];

  const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  useEffect(() => {
    if (isOpen && appointment) {
      fetchDocuments();
    }
  }, [isOpen, appointment]);

  const fetchDocuments = async () => {
    if (!appointment?.appointmentId) {
      setError('No appointment selected');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('Fetching documents for appointment:', appointment.appointmentId);
      const response = await apiClient.get(`/appointments/${appointment.appointmentId}/documents`);
      if (response.data.success) {
        setDocuments(response.data.data || []);
        console.log('Documents fetched:', response.data.data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error.response?.data?.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file) => {
    if (!allowedFileTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.');
    }
    if (file.size > maxFileSize) {
      throw new Error('File size exceeds 50MB limit.');
    }
    return true;
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (files, documentType = 'Other') => {
    if (!canUpload) {
      setError('You do not have permission to upload documents');
      return;
    }

    if (!appointment?.appointmentId) {
      setError('No appointment selected');
      return;
    }

    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    
    try {
      for (const file of Array.from(files)) {
        validateFile(file);
        
        const fileUrl = await convertFileToBase64(file);
        
        const documentData = {
          documentType,
          fileName: file.name,
          fileUrl,
          fileSize: file.size,
          mimeType: file.type,
          description: ''
        };

        console.log('Uploading document to appointment:', appointment.appointmentId);
        const response = await apiClient.post(
          `/appointments/${appointment.appointmentId}/documents`, 
          documentData
        );

        if (response.data.success) {
          console.log('Document uploaded successfully');
        }
      }
      
      await fetchDocuments();
      
      if (onSuccess) {
        onSuccess();
      }
      
      setError('');
    } catch (error) {
      console.error('Error uploading document:', error);
      setError(error.response?.data?.message || error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!canUpload) {
      setError('You do not have permission to delete documents');
      return;
    }

    if (!appointment?.appointmentId) {
      setError('No appointment selected');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      console.log('Deleting document:', documentId, 'from appointment:', appointment.appointmentId);
      const response = await apiClient.delete(
        `/appointments/${appointment.appointmentId}/documents/${documentId}`
      );

      if (response.data.success) {
        await fetchDocuments();
        onSuccess && onSuccess();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setError(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleDownloadDocument = (doc) => {
    try {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document');
    }
  };

  const handleViewDocument = (doc) => {
    try {
      window.open(doc.fileUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      setError('Failed to view document');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!canUpload) {
      setError('You do not have permission to upload documents');
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) {
      return (
        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    } else if (mimeType === 'application/pdf') {
      return (
        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Appointment Documents</h3>
              <p className="text-sm text-gray-500">
                {patient?.personalInfo?.fullName} • #{patient?.patientId}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Appointment: {appointment?.appointmentId} • {appointment?.scheduledDate ? new Date(appointment.scheduledDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${canUpload ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span className="text-gray-600">
                {canUpload ? 'Full Access' : 'View Only'}
              </span>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Upload Area - Only show for users with upload permission */}
          {canUpload && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Upload New Document</h4>
              
              {/* Upload Zone */}
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragActive 
                    ? 'border-orange-400 bg-orange-50' 
                    : 'border-gray-300 hover:border-gray-400'
                } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="space-y-3">
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-600 border-t-transparent mx-auto"></div>
                      <p className="text-sm text-gray-600">Uploading documents...</p>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      
                      <div>
                        <p className="text-base font-medium text-gray-900">
                          {dragActive ? 'Drop files here' : 'Upload Documents'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Drag and drop files here, or{' '}
                          <label className="text-orange-600 hover:text-orange-700 cursor-pointer font-medium">
                            browse files
                            <input
                              type="file"
                              multiple
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                              className="hidden"
                              disabled={uploading}
                            />
                          </label>
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Supports: JPEG, PNG, PDF (max 50MB each)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Document Type Selector */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                {documentTypes.map((type) => (
                  <label key={type} className="relative cursor-pointer">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleFileUpload([e.target.files[0]], type);
                        }
                      }}
                      className="hidden"
                      disabled={uploading}
                    />
                    <div className="p-2 border border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all text-center">
                      <div className="text-xs font-medium text-gray-700">{type}</div>
                      <div className="text-xs text-gray-500 mt-1">Upload</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Documents List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Appointment Documents</h4>
              <span className="text-sm text-gray-500">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-600 border-t-transparent"></div>
                  <span className="text-gray-600 font-medium">Loading documents...</span>
                </div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-gray-900 mb-2">No documents found</h4>
                <p className="text-gray-500 text-sm">
                  {canUpload ? 'Upload the first document for this appointment' : 'No documents have been uploaded yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getFileIcon(doc.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.fileName}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 flex-shrink-0">
                            {doc.documentType}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>
                            {new Date(doc.uploadedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          {doc.uploadedBy && (
                            <>
                              <span>•</span>
                              <span>
                                {doc.uploadedBy.profile?.firstName} {doc.uploadedBy.profile?.lastName}
                              </span>
                            </>
                          )}
                          {doc.description && (
                            <>
                              <span>•</span>
                              <span className="truncate">{doc.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                      {/* View Button */}
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      
                      {/* Download Button */}
                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                        title="Download Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      
                      {/* Delete Button - Only for users with upload permission */}
                      {canUpload && (
                        <button
                          onClick={() => handleDeleteDocument(doc._id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Document"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-500">
            {canUpload ? 'You can upload, view, and delete documents' : 'You can only view and download documents'}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-white hover:border-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageDocumentsModal;