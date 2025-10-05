import React from 'react';

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
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
        {/* Left Side - Slideshow */}
        <div className={`w-1/2 bg-gradient-to-br ${currentSlide.color} p-12 flex flex-col justify-between text-white`}>
          <div>
            <h2 className="text-4xl font-bold mb-4">{currentSlide.title}</h2>
            <p className="text-lg opacity-90">{currentSlide.description}</p>
          </div>
          
          <div className="text-9xl text-center">{currentSlide.image}</div>
          
          <div className="flex gap-2">
            {['personal', 'medical', 'visit'].map((s, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-all ${
                  step === s ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-1/2 p-8 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{currentSlide.title}</h3>
              <p className="text-sm text-gray-500">
                Update patient information and medical records
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
              disabled={step === 'personal'}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>

            {step === 'visit' ? (
              <button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Patient'
                )}
              </button>
            ) : (
              <button
                onClick={onNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Next Step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalLayout;