import mongoose from 'mongoose';

const testSchema = new mongoose.Schema({
  testCode: {
    type: String,
    unique: true,
    required: [true, 'Test code is required'],
    uppercase: true
  },
  testName: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [false, 'Test category is required'],
    enum: [
      'Blood Test',
      'Urine Test',
      'Imaging',
      'Cardiac',
      'Neurological',
      'Endocrine',
      'Liver Function',
      'Kidney Function',
      'Lipid Profile',
      'Thyroid Function',
      'Diabetes',
      'Vitamin',
      'Mineral',
      'Infection',
      'Cancer Markers',
      'Allergy',
      'Other',
      'Special'
    ]
  },
  description: {
    type: String,
    trim: true
  },
  normalRange: {
    min: Number,
    max: Number,
    unit: String,
    textRange: String // For non-numeric ranges
  },
  preparation: {
    fasting: {
      type: Boolean,
      default: false
    },
    fastingHours: Number,
    instructions: [String]
  },
  sampleType: {
    type: String,
    enum: ['Blood', 'Urine', 'Stool', 'Saliva', 'Tissue', 'Other'],
    required: true
  },
  reportingTime: {
    type: String,
    required: true // e.g., "24 hours", "Same day", "3-5 days"
  },
  cost: {
    type: Number,
    required: true
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
testSchema.index({ testCode: 1 });
testSchema.index({ testName: 'text' });
testSchema.index({ category: 1 });
testSchema.index({ labId: 1 });

const Test = mongoose.model('Test', testSchema);

export default Test;