import mongoose from 'mongoose';

const termsAndConditionsSchema = new mongoose.Schema({
  // Version tracking
  version: {
    type: String,
    required: true,
    unique: true
  },
  effectiveDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Content sections
  content: {
    eligibility: {
      type: String,
      required: true
    },
    platformServices: {
      type: String,
      required: true
    },
    revenuePayments: {
      type: String,
      required: true
    },
    professionalResponsibilities: {
      type: String,
      required: true
    },
    liabilityIndemnity: {
      type: String,
      required: true
    },
    legalCompliance: {
      type: String,
      required: true
    },
    termination: {
      type: String,
      required: true
    },
    automaticAcceptance: {
      type: String,
      required: true
    },
    finalConfirmation: {
      type: String,
      required: true
    }
  },
  
  // Privacy Policy
  privacyPolicy: {
    dataCollection: {
      type: String,
      required: true
    },
    dataUsage: {
      type: String,
      required: true
    },
    dataPrivacy: {
      type: String,
      required: true
    },
    dataProtection: {
      type: String,
      required: true
    },
    dataRetention: {
      type: String,
      required: true
    },
    thirdPartyAccess: {
      type: String,
      required: true
    },
    securityMeasures: {
      type: String,
      required: true
    },
    consentAcknowledgment: {
      type: String,
      required: true
    }
  },
  
  // Document references
  pdfUrl: {
    type: String, // Base64 or file path to PDF
    required: false
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Acceptance tracking schema (separate collection for user acceptances)
const termsAcceptanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // ✅ UPDATED: Doctor ID is now the MongoDB ObjectId as string
  doctorId: {
    type: String, // MongoDB ObjectId as string
    required: true, // Required for doctors
    index: true
  },
  termsVersion: {
    type: String,
    required: true
  },
  termsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TermsAndConditions',
    required: true
  },
  acceptedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  // ✅ Enhanced signature storage
  signature: {
    formSignature: String, // From step 4 registration form
    termsSignature: String, // From terms acceptance modal
    timestamp: Date
  },
  // ✅ Enhanced doctor info with MongoDB ID
  doctorInfo: {
    doctorId: String, // MongoDB ObjectId as string
    mongoId: mongoose.Schema.Types.ObjectId, // Actual ObjectId reference
    name: String,
    email: String,
    specialization: String,
    registrationNumber: String
  },
  // Additional acknowledgments
  acknowledgments: {
    readAndUnderstood: {
      type: Boolean,
      required: true,
      default: false
    },
    acceptsFullResponsibility: {
      type: Boolean,
      required: true,
      default: false
    },
    authorizesVerification: {
      type: Boolean,
      required: true,
      default: false
    },
    understandsBindingNature: {
      type: Boolean,
      required: true,
      default: false
    }
  }
}, {
  timestamps: true
});

// ✅ Enhanced indexes
termsAcceptanceSchema.index({ userId: 1, termsVersion: 1 }, { unique: true });
termsAcceptanceSchema.index({ doctorId: 1 }); // Index on doctorId for fast lookups
termsAcceptanceSchema.index({ 'doctorInfo.mongoId': 1 }); // Index on mongoId reference

const TermsAndConditions = mongoose.model('TermsAndConditions', termsAndConditionsSchema);
const TermsAcceptance = mongoose.model('TermsAcceptance', termsAcceptanceSchema);

export { TermsAndConditions, TermsAcceptance };