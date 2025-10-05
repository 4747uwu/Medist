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
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Auto-advance slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!currentSlide) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex">
        {/* Left Side - Visual */}
        <div className={`w-1/2 bg-gradient-to-br ${currentSlide.color} relative overflow-hidden flex flex-col justify-between p-8 text-white`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute transform rotate-45 bg-white w-96 h-96 rounded-full -top-48 -right-48"></div>
            <div className="absolute transform -rotate-45 bg-white w-64 h-64 rounded-full -bottom-32 -left-32"></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="text-6xl mb-6">{currentSlide.image}</div>
            <h2 className="text-3xl font-bold mb-4">{currentSlide.title}</h2>
            <p className="text-lg opacity-90">{currentSlide.description}</p>
          </div>

          {/* Progress indicators */}
          <div className="relative z-10">
            {step !== 'phone' && (
              <div className="flex gap-2">
                {['permanent', 'medical', 'documents', 'visit'].map((s, idx) => (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      step === s ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-1/2 p-8 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{currentSlide.title}</h3>
              <p className="text-sm text-gray-500">
                {patientExists ? 'Existing patient - Record new visit' : 'New patient registration'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto">
            {children}

            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Footer - Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <button
              onClick={onBack}
              disabled={step === 'phone' || (step === 'visit' && patientExists)}
              className="px-6 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>

            {step === 'visit' ? (
              <button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {patientExists ? 'Record Visit' : 'Create Patient'}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={onNext}
                disabled={step === 'phone'}
                className="px-6 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
              >
                Next
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalLayout;