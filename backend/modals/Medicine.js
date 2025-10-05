import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  medicineCode: {
    type: String,
    unique: true,
    uppercase: true,
    sparse: true // Allow null/undefined for auto-generation
  },
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    index: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    index: true
  },
  // Optional fields that can be added later
  genericName: {
    type: String,
    trim: true
  },
  brandName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    // Made optional since you don't have this data
    enum: [
      'Analgesic',
      'Antibiotic',
      'Antiviral',
      'Antifungal',
      'Anti-inflammatory',
      'Antacid',
      'Antihistamine',
      'Cardiovascular',
      'Diabetes',
      'Respiratory',
      'Neurological',
      'Psychiatric',
      'Hormone',
      'Vitamin',
      'Supplement',
      'Topical',
      'Eye/Ear Drops',
      'Injection',
      'Syrup',
      'Other'
    ]
  },
  form: {
    type: String,
    enum: [
      'Tablet',
      'Capsule',
      'Syrup',
      'Injection',
      'Drops',
      'Cream',
      'Ointment',
      'Gel',
      'Patch',
      'Inhaler',
      'Spray',
      'Powder',
      'Other'
    ]
  },
  strength: {
    value: Number,
    unit: {
      type: String,
      enum: ['mg', 'g', 'ml', 'mcg', 'IU', '%', 'units']
    }
  },
  composition: [{
    ingredient: String,
    quantity: String
  }],
  indications: [String],
  contraindications: [String],
  sideEffects: [String],
  dosageInstructions: {
    adultDose: String,
    childDose: String,
    elderlyDose: String,
    frequency: [String], // e.g., ['Once daily', 'Twice daily', 'Three times daily']
    timing: [String] // e.g., ['Before meals', 'After meals', 'With meals']
  },
  interactions: [{
    medicine: String,
    effect: String,
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe']
    }
  }],
  storage: {
    temperature: String,
    conditions: String,
    shelfLife: String
  },
  cost: {
    mrp: Number,
    sellingPrice: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  prescription: {
    required: {
      type: Boolean,
      default: true
    },
    schedule: String // H, H1, X etc.
  },
  labId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for search performance
medicineSchema.index({ name: 'text', companyName: 'text' });
medicineSchema.index({ name: 1 });
medicineSchema.index({ companyName: 1 });
medicineSchema.index({ labId: 1 });
medicineSchema.index({ isActive: 1 });
medicineSchema.index({ category: 1 }); // For when you have category data

// Compound indexes
medicineSchema.index({ name: 1, companyName: 1 });
medicineSchema.index({ labId: 1, isActive: 1 });

// Auto-generate medicine code if not provided
medicineSchema.pre('save', async function(next) {
  if (this.isNew && !this.medicineCode) {
    const count = await this.constructor.countDocuments({ labId: this.labId });
    this.medicineCode = `MED${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual for display name
medicineSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.companyName})`;
});

// Virtual for strength display
medicineSchema.virtual('strengthDisplay').get(function() {
  if (this.strength?.value && this.strength?.unit) {
    return `${this.strength.value}${this.strength.unit}`;
  }
  return '';
});

medicineSchema.set('toJSON', { virtuals: true });

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;