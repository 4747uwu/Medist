import React, { useState } from 'react';

const Documents = ({ 
  formData, 
  addDocument, 
  removeDocument, 
  updateDocument, 
  convertFileToBase64,
  errors = {} 
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const documentTypes = [
    'Aadhar Card',
    'PAN Card', 
    'Insurance Card',
    'Medical Report',
    'Lab Report',
    'Prescription',
    'Other'
  ];

  const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const validateFile = (file) => {
    if (!allowedFileTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and PDF files are allowed';
    }
    if (file.size > maxFileSize) {
      return 'File size must be less than 5MB';
    }
    return null;
  };

  const handleFileUpload = async (files, documentType = 'Other', description = '') => {
    setUploading(true);
    
    try {
      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          alert(validationError);
          continue;
        }

        const base64Data = await convertFileToBase64(file);
        
        const documentData = {
          documentType,
          fileName: file.name,
          fileUrl: base64Data,
          fileSize: file.size,
          mimeType: file.type,
          description,
          uploadedAt: new Date()
        };

        addDocument(documentData);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
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
    if (mimeType.includes('pdf')) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else if (mimeType.includes('image')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Documents</h3>
        <p className="text-sm text-gray-600">
          Upload patient documents like ID cards, medical reports, etc. (Optional)
        </p>
      </div>

      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Drop files here' : 'Upload Documents'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop files here, or{' '}
              <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                browse files
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports: JPEG, PNG, PDF (max 5MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Document Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            />
            <div className="p-3 border border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-center">
              <div className="text-xs font-medium text-gray-700">{type}</div>
              <div className="text-xs text-gray-500 mt-1">Upload</div>
            </div>
          </label>
        ))}
      </div>

      {/* Uploaded Documents List */}
      {formData.documents && formData.documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Uploaded Documents</h4>
          <div className="space-y-2">
            {formData.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  {getFileIcon(doc.mimeType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.fileName}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {doc.documentType}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.fileSize)}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* View/Download Button */}
                  <button
                    type="button"
                    onClick={() => {
                      // Create blob and download
                      const byteCharacters = atob(doc.fileUrl.split(',')[1]);
                      const byteNumbers = new Array(byteCharacters.length);
                      for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                      }
                      const byteArray = new Uint8Array(byteNumbers);
                      const blob = new Blob([byteArray], { type: doc.mimeType });
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    }}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="View Document"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Remove Document"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm text-gray-600">Uploading documents...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {errors.documents && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.documents}</p>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900">Document Upload Tips</h4>
            <ul className="text-xs text-blue-800 mt-1 space-y-1">
              <li>• Documents are optional but help with patient verification</li>
              <li>• Ensure documents are clear and readable</li>
              <li>• All documents are stored securely and encrypted</li>
              <li>• You can add more documents later from the patient profile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;