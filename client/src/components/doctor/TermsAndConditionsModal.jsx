import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

const TermsAndConditionsModal = ({ isOpen, onClose, onAccept, doctorData, signatureData }) => {
  const [termsData, setTermsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  
  const [acknowledgments, setAcknowledgments] = useState({
    readAndUnderstood: false,
    acceptsFullResponsibility: false,
    authorizesVerification: false,
    understandsBindingNature: false
  });

  const [activeSection, setActiveSection] = useState('terms');
  const [expandedSection, setExpandedSection] = useState('eligibility');

  useEffect(() => {
    if (isOpen) {
      fetchLatestTerms();
    }
  }, [isOpen]);

  const fetchLatestTerms = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/terms/latest');
      if (response.data.success) {
        setTermsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      setError('Failed to load terms and conditions');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgmentChange = (key) => {
    setAcknowledgments(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const allAcknowledged = Object.values(acknowledgments).every(val => val === true);

  const handleAccept = async () => {
    if (!allAcknowledged) {
      setError('Please accept all acknowledgments to proceed');
      return;
    }

    console.log('=== TERMS ACCEPTANCE START ===');
    console.log('Terms data:', termsData);
    console.log('Acknowledgments:', acknowledgments);
    console.log('Form signature data:', signatureData);

    if (!termsData || !termsData._id) {
      setError('Terms data not loaded properly. Please refresh and try again.');
      return;
    }

    setAccepting(true);
    setError('');

    try {
      const acceptanceData = {
        termsId: termsData._id,
        termsVersion: termsData.version,
        acknowledgments,
        signature: signatureData, // Include the form signature
        // ✅ UPDATED: Include MongoDB-style doctor identification
        doctorInfo: {
          tempMongoId: tempDoctorId, // Temporary MongoDB-style ID
          name: `Dr. ${doctorData?.profile?.firstName} ${doctorData?.profile?.lastName}`,
          email: doctorData?.email,
          specialization: doctorData?.doctorDetails?.specialization,
          registrationNumber: doctorData?.doctorDetails?.registrationNumber
        }
      };

      console.log('Sending acceptance data with MongoDB-style doctor info:', acceptanceData);

      // Call parent's onAccept with terms data and acknowledgments
      await onAccept(acceptanceData);
    } catch (error) {
      console.error('Error accepting terms:', error);
      setError('Failed to accept terms. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  if (!isOpen) return null;

  const termsContent = termsData?.content || {};
  const privacyContent = termsData?.privacyPolicy || {};

  const termsSections = [
    { key: 'eligibility', title: '1. Eligibility', content: termsContent.eligibility },
    { key: 'platformServices', title: '2. Platform Services', content: termsContent.platformServices },
    { key: 'revenuePayments', title: '3. Revenue, Payments & Billing', content: termsContent.revenuePayments },
    { key: 'professionalResponsibilities', title: '4. Professional Responsibilities', content: termsContent.professionalResponsibilities },
    { key: 'liabilityIndemnity', title: '5. Liability and Indemnity', content: termsContent.liabilityIndemnity },
    { key: 'legalCompliance', title: '6. Legal Compliance', content: termsContent.legalCompliance },
    { key: 'termination', title: '7. Termination', content: termsContent.termination },
    { key: 'automaticAcceptance', title: '8. Automatic Acceptance of Updates', content: termsContent.automaticAcceptance },
    { key: 'finalConfirmation', title: '9. Final Confirmation', content: termsContent.finalConfirmation }
  ];

  const privacySections = [
    { key: 'dataCollection', title: '1. Data Collection', content: privacyContent.dataCollection },
    { key: 'dataUsage', title: '2. Data Usage', content: privacyContent.dataUsage },
    { key: 'dataPrivacy', title: '3. Data Privacy and Confidentiality', content: privacyContent.dataPrivacy },
    { key: 'dataProtection', title: '4. Data Protection Compliance', content: privacyContent.dataProtection },
    { key: 'dataRetention', title: '5. Data Retention and Access', content: privacyContent.dataRetention },
    { key: 'thirdPartyAccess', title: '6. Third-Party Access', content: privacyContent.thirdPartyAccess },
    { key: 'securityMeasures', title: '7. Security Measures', content: privacyContent.securityMeasures },
    { key: 'consentAcknowledgment', title: '8. Consent and Acknowledgment', content: privacyContent.consentAcknowledgment }
  ];

  // ✅ Generate temporary MongoDB-style ID for display
  const generateTempMongoId = () => {
    // Generate a temporary 24-character hex string that looks like MongoDB ObjectId
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const random = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return timestamp + random;
  };

  const tempDoctorId = generateTempMongoId();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 border-b border-blue-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Terms & Conditions</h2>
                <p className="text-sm text-blue-100">
                  Doctor-Patient Meeting App • Version {termsData?.version || '1.0'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {termsData?.effectiveDate && (
                <span className="text-xs text-blue-100 bg-white/10 px-3 py-1 rounded-full">
                  Effective: {new Date(termsData.effectiveDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Doctor Info Banner */}
          <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {doctorData?.profile?.firstName?.charAt(0)}{doctorData?.profile?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="text-white">
                <p className="text-sm font-medium">
                  Dr. {doctorData?.profile?.firstName} {doctorData?.profile?.lastName}
                </p>
                <p className="text-xs text-blue-100">
                  {doctorData?.doctorDetails?.specialization} • {doctorData?.email}
                </p>
                {/* ✅ UPDATED: Show MongoDB-style ID */}
                <p className="text-xs text-blue-200 font-mono">
                  ID: {tempDoctorId} • Reg: {doctorData?.doctorDetails?.registrationNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* ✅ Show signature status */}
              {signatureData && (
                <div className="flex items-center space-x-2 text-xs text-blue-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Signature Ready</span>
                </div>
              )}
              {/* ✅ Show form signature preview */}
              {signatureData && (
                <div className="bg-white/20 rounded-lg p-2">
                  <img 
                    src={signatureData} 
                    alt="Signature" 
                    className="h-6 w-auto opacity-80"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 flex-shrink-0 bg-gray-50">
          <button
            onClick={() => setActiveSection('terms')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'terms'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Terms & Conditions
          </button>
          <button
            onClick={() => setActiveSection('privacy')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'privacy'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Loading terms...</span>
              </div>
            </div>
          ) : error && !termsData ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-red-600 mb-3">{error}</p>
                <button
                  onClick={fetchLatestTerms}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Terms & Conditions Content */}
              {activeSection === 'terms' && termsSections.map((section) => (
                <div key={section.key} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        expandedSection === section.key ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSection === section.key && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {section.content || 'Content not available'}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Privacy Policy Content */}
              {activeSection === 'privacy' && privacySections.map((section) => (
                <div key={section.key} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        expandedSection === section.key ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSection === section.key && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {section.content || 'Content not available'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acknowledgments & Footer */}
        <div className="border-t border-gray-200 bg-white px-6 py-4 flex-shrink-0">
          {/* Acknowledgment Checkboxes */}
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Required Acknowledgments:</p>
            
            <label className="flex items-start space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={acknowledgments.readAndUnderstood}
                onChange={() => handleAcknowledgmentChange('readAndUnderstood')}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 group-hover:text-gray-900">
                I have read and understood all terms and conditions
              </span>
            </label>

            <label className="flex items-start space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={acknowledgments.acceptsFullResponsibility}
                onChange={() => handleAcknowledgmentChange('acceptsFullResponsibility')}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 group-hover:text-gray-900">
                I accept full legal responsibility as outlined above
              </span>
            </label>

            <label className="flex items-start space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={acknowledgments.authorizesVerification}
                onChange={() => handleAcknowledgmentChange('authorizesVerification')}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 group-hover:text-gray-900">
                I authorize the platform to verify my information
              </span>
            </label>

            <label className="flex items-start space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={acknowledgments.understandsBindingNature}
                onChange={() => handleAcknowledgmentChange('understandsBindingNature')}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 group-hover:text-gray-900">
                I understand this agreement is legally binding and enforceable
              </span>
            </label>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              {/* ✅ Show signature and ID preview */}
              {signatureData && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>ID: {tempDoctorId.substring(0, 8)}...</span>
                  <img src={signatureData} alt="Signature" className="h-4 w-auto border border-gray-200 rounded" />
                </div>
              )}
            </div>
            <button
              onClick={handleAccept}
              disabled={!allAcknowledged || accepting}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                allAcknowledged && !accepting
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {accepting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Accept & Sign (ID: {tempDoctorId.substring(0, 8)}...)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsModal;