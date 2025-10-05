import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  medicineCode: {
    type: String,
    unique: true,
    required: [true, 'Medicine code is required'],
    uppercase: true
  },
  medicineName: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
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
    required: [true, 'Medicine category is required'],
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
      'Other'
    ]
  },
  form: {
    type: String,
    required: [true, 'Medicine form is required'],
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
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
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
  manufacturer: {
    type: String,
    required: true
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

// Indexes
medicineSchema.index({ medicineCode: 1 });
medicineSchema.index({ medicineName: 'text', genericName: 'text', brandName: 'text' });
medicineSchema.index({ category: 1 });
medicineSchema.index({ labId: 1 });

// Virtual for full strength display
medicineSchema.virtual('fullStrength').get(function() {
  return `${this.strength.value}${this.strength.unit}`;
});

medicineSchema.set('toJSON', { virtuals: true });

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;