import React, { useEffect, useState } from 'react';

const ModalLayout = ({ 
  currentSlide, 
  step, 
  patientExists, 
  onClose, 
  onBack, 
  onNext, 
  onSubmit, 
  isSubmitting, 
  errors, 
  children 
}) => {
  // ✅ UPDATED: Simplified step order
  const stepOrder = ['phone', 'permanent', 'medical', 'appointment'];
  const currentStepIndex = stepOrder.indexOf(step);
  const isLastStep = currentStepIndex === stepOrder.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // ✅ UPDATED: Step labels for clinic workflow
  const getStepLabel = (stepName) => {
    const labels = {
      phone: 'Phone Verification',
      permanent: 'Patient Details', 
      medical: 'Medical History',
      appointment: 'Schedule Appointment'
    };
    return labels[stepName] || stepName;
  };

  const getNextButtonText = () => {
    if (step === 'phone') return 'Continue';
    if (step === 'permanent') return patientExists ? 'Next' : 'Next';
    if (step === 'medical') return 'Schedule Appointment';
    if (step === 'appointment') return 'Create Appointment';
    return 'Next';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
        {/* Left Sidebar */}
        <div className={`w-1/3 bg-gradient-to-br ${currentSlide.color} p-8 flex flex-col justify-between text-white relative overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute bottom-20 right-10 w-24 h-24 bg-white rounded-full"></div>
            <div className="absolute top-1/2 right-5 w-16 h-16 bg-white rounded-full"></div>
          </div>

          <div className="relative z-10">
            <div className="text-6xl mb-6">{currentSlide.image}</div>
            <h2 className="text-3xl font-bold mb-4">{currentSlide.title}</h2>
            <p className="text-lg opacity-90 leading-relaxed">{currentSlide.description}</p>
            
            {/* ✅ UPDATED: Progress Steps for clinic workflow */}
            <div className="mt-8 space-y-3">
              {stepOrder.map((stepName, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={stepName} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted 
                        ? 'bg-white text-green-600 border-white' 
                        : isCurrent 
                          ? 'bg-white bg-opacity-20 border-white text-white' 
                          : 'border-white border-opacity-50 text-white text-opacity-50'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      isCompleted || isCurrent ? 'text-white' : 'text-white text-opacity-50'
                    }`}>
                      {getStepLabel(stepName)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ✅ UPDATED: Simplified workflow note */}
          <div className="relative z-10 bg-white bg-opacity-10 rounded-lg p-4">
            <h4 className="font-semibold mb-2">📋 Clinic Workflow</h4>
            <div className="text-sm space-y-1 opacity-90">
              <p>• Basic patient registration</p>
              <p>• Medical history collection</p>
              <p>• Appointment scheduling</p>
              <p>• Jr Doctor will complete assessment</p>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="w-2/3 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {getStepLabel(step)}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStepIndex + 1} of {stepOrder.length}
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onBack}
              disabled={isFirstStep}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                isFirstStep
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Back
            </button>

            <div className="flex items-center space-x-3">
              {errors.submit && (
                <p className="text-sm text-red-600">{errors.submit}</p>
              )}
              
              {isLastStep ? (
                <button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>{getNextButtonText()}</span>
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="px-8 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all"
                >
                  {getNextButtonText()}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalLayout;