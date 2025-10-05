import mongoose from 'mongoose';

const labSchema = new mongoose.Schema({
  labId: {
    type: String,
    required: [true, 'Lab ID is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  labName: {
    type: String,
    required: [true, 'Clinic name is required'],
    trim: true
  },
  registrationDetails: {
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true
    },
    registrationDate: {
      type: Date,
      required: [true, 'Registration date is required']
    },
    validUntil: {
      type: Date
    },
    issuedBy: {
      type: String,
      required: [true, 'Issuing authority is required'],
      trim: true
    }
  },
  contactInfo: {
    address: {
      street: {
        type: String,
        required: [true, 'Street address is required']
      },
      city: {
        type: String,
        required: [true, 'City is required']
      },
      state: {
        type: String,
        required: [true, 'State is required']
      },
      pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        validate: {
          validator: function(v) {
            return /^\d{6}$/.test(v);
          },
          message: 'Pincode must be 6 digits'
        }
      },
      country: {
        type: String,
        default: 'India'
      }
    },
    phone: {
      primary: {
        type: String,
        required: [true, 'Primary phone is required'],
        validate: {
          validator: function(v) {
            return /^\d{10}$/.test(v);
          },
          message: 'Phone must be 10 digits'
        }
      },
      secondary: String
    },
    email: {
      primary: {
        type: String,
        required: [true, 'Primary email is required'],
        lowercase: true,
        validate: {
          validator: function(v) {
            return /\S+@\S+\.\S+/.test(v);
          },
          message: 'Email is invalid'
        }
      },
      secondary: {
        type: String,
        lowercase: true
      }
    },
    website: String
  },
  operationalDetails: {
    operatingHours: {
      monday: {
        isOpen: { type: Boolean, default: true },
        open: String,
        close: String
      },
      tuesday: {
        isOpen: { type: Boolean, default: true },
        open: String,
        close: String
      },
      wednesday: {
        isOpen: { type: Boolean, default: true },
        open: String,
        close: String
      },
      thursday: {
        isOpen: { type: Boolean, default: true },
        open: String,
        close: String
      },
      friday: {
        isOpen: { type: Boolean, default: true },
        open: String,
        close: String
      },
      saturday: {
        isOpen: { type: Boolean, default: true },
        open: String,
        close: String
      },
      sunday: {
        isOpen: { type: Boolean, default: false },
        open: String,
        close: String
      }
    },
    capacity: {
      patientsPerDay: {
        type: Number,
        required: [true, 'Daily patient capacity is required'],
        min: 0
      },
      doctorsCount: {
        type: Number,
        required: [true, 'Number of doctors is required'],
        min: 0
      },
      bedsCount: {
        type: Number,
        min: 0
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
labSchema.index({ labId: 1 });
labSchema.index({ 'contactInfo.email.primary': 1 });
labSchema.index({ 'contactInfo.address.city': 1 });
labSchema.index({ isActive: 1 });

const Lab = mongoose.model('Lab', labSchema);

export default Lab;