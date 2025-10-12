import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['clinic', 'doctor', 'assigner', 'jrdoctor'],
    required: [true, 'Role is required']
  },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    profileImage: String
  },
  
  // Clinic-specific details
  clinicDetails: {
    clinicName: String,
    address: String,
    registrationNumber: String,
    labId: String,
    registrationDate: Date
  },
  
  // Doctor-specific details
  doctorDetails: {
    specialization: String,
    qualification: String,
    experience: Number,
    registrationNumber: String,
    consultationFee: Number,
    registrationDate: Date,
    isVerified: { type: Boolean, default: false },
    availableDays: [String],
    availableHours: {
      start: String,
      end: String
    },
    signature: {
      image: String,
      type: { type: String, enum: ['upload', 'draw'], default: 'upload' },
      createdAt: Date
    },
    termsAcceptance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TermsAcceptance',
      required: false
    },
    termsAcceptedAt: Date,
    termsVersion: String
  },
  
  // Assigner-specific details
  assignerDetails: {
    department: String,
    registrationDate: Date,
    permissions: [String]
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  lastLogout: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLogin: Date,
  registrationComplete: {
    type: Boolean,
    default: false
  },
  passwordChangedAt: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  console.log('User schema - Hashing password for:', this.email);
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('User schema - Comparing password for:', this.email);
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

export default User;