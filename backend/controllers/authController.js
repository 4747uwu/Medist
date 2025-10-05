import User from '../modals/User.js';
import Lab from '../modals/Lab.js';
import { sendSuccess, sendError, sendTokenResponse } from '../utils/helpers.js';
import { validateRequired } from '../utils/helpers.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  console.log('=== REGISTER REQUEST START ===');
  console.log('Request IP:', req.ip);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { email, password, role, profile, clinicDetails, doctorDetails, assignerDetails } = req.body;

    console.log('Extracted fields:', {
      email,
      role,
      profileKeys: profile ? Object.keys(profile) : 'none',
      hasClinicDetails: !!clinicDetails,
      hasDoctorDetails: !!doctorDetails,
      hasAssignerDetails: !!assignerDetails
    });

    // Validate required fields
    const requiredFields = ['email', 'password', 'role'];
    const missing = validateRequired(requiredFields, req.body);
    
    if (missing.length > 0) {
      console.log('Missing required fields:', missing);
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return sendError(res, 'Invalid email format', 400);
    }

    // Validate role
    const validRoles = ['clinic', 'doctor', 'assigner'];
    if (!validRoles.includes(role)) {
      console.log('Invalid role:', role);
      return sendError(res, 'Invalid role. Must be clinic, doctor, or assigner', 400);
    }

    // Validate password strength
    if (password.length < 6) {
      console.log('Password too short:', password.length);
      return sendError(res, 'Password must be at least 6 characters long', 400);
    }

    // Check if user already exists
    console.log('Checking if user exists with email:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', existingUser._id);
      return sendError(res, 'User already exists with this email', 400);
    }

    // Validate role-specific required fields
    if (role === 'clinic') {
      const clinicRequired = ['clinicName'];
      const missingClinic = clinicRequired.filter(field => !clinicDetails?.[field]);
      if (missingClinic.length > 0) {
        console.log('Missing clinic details:', missingClinic);
        return sendError(res, `Missing clinic details: ${missingClinic.join(', ')}`, 400);
      }
    }

    if (role === 'doctor') {
      const doctorRequired = ['specialization', 'qualification'];
      const missingDoctor = doctorRequired.filter(field => !doctorDetails?.[field]);
      if (missingDoctor.length > 0) {
        console.log('Missing doctor details:', missingDoctor);
        return sendError(res, `Missing doctor details: ${missingDoctor.join(', ')}`, 400);
      }
    }

    if (role === 'assigner') {
      const assignerRequired = ['department'];
      const missingAssigner = assignerRequired.filter(field => !assignerDetails?.[field]);
      if (missingAssigner.length > 0) {
        console.log('Missing assigner details:', missingAssigner);
        return sendError(res, `Missing assigner details: ${missingAssigner.join(', ')}`, 400);
      }
    }

    // Prepare user data
    const userData = {
      email,
      password,
      role,
      profile: {
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        phone: profile?.phone || ''
      }
    };

    console.log('Prepared base user data:', {
      email: userData.email,
      role: userData.role,
      profile: userData.profile
    });

    // Add role-specific details
    if (role === 'clinic' && clinicDetails) {
      console.log('Processing clinic registration...');
      
      // Generate lab ID
      const labId = await Lab.generateLabId(clinicDetails.clinicName);
      console.log('Generated lab ID:', labId);
      
      userData.clinicDetails = { 
        ...clinicDetails, 
        labId,
        registrationDate: new Date()
      };

      console.log('Clinic details added:', userData.clinicDetails);
    } else if (role === 'doctor' && doctorDetails) {
      console.log('Processing doctor registration...');
      
      userData.doctorDetails = {
        ...doctorDetails,
        experience: parseInt(doctorDetails.experience) || 0,
        consultationFee: parseFloat(doctorDetails.consultationFee) || 0,
        registrationDate: new Date(),
        isVerified: false // Doctors need verification
      };

      console.log('Doctor details added:', userData.doctorDetails);
    } else if (role === 'assigner' && assignerDetails) {
      console.log('Processing assigner registration...');
      
      userData.assignerDetails = {
        ...assignerDetails,
        registrationDate: new Date(),
        permissions: ['assign_tasks', 'view_reports'] // Default permissions
      };

      console.log('Assigner details added:', userData.assignerDetails);
    }

    // Create user
    console.log('Creating user in database...');
    const user = await User.create(userData);
    console.log('User created successfully:', {
      id: user._id,
      email: user.email,
      role: user.role
    });

    // Create lab record if clinic user
    if (role === 'clinic' && userData.clinicDetails) {
      console.log('Creating lab record...');
      try {
        const labData = {
          labId: userData.clinicDetails.labId,
          clinicName: userData.clinicDetails.clinicName,
          address: userData.clinicDetails.address,
          registrationNumber: userData.clinicDetails.registrationNumber,
          owner: user._id,
          isActive: true
        };

        const lab = await Lab.create(labData);
        console.log('Lab record created:', lab._id);

        // Update user with lab reference
        user.labId = lab._id;
        await user.save();
        console.log('User updated with lab reference');
      } catch (labError) {
        console.error('Error creating lab record:', labError);
        // Don't fail registration if lab creation fails
      }
    }

    // Update last login
    user.lastLogin = new Date();
    user.registrationComplete = true;
    await user.save();

    console.log('Registration completed successfully for user:', user._id);
    console.log('=== REGISTER REQUEST END ===');

    console.log('Sending token response with user data:', {
      id: user._id,
      email: user.email,
      role: user.role
    });
    sendTokenResponse(user, 201, res, 'User registered successfully');
  } catch (error) {
    console.error('=== REGISTER ERROR ===');
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('=== REGISTER ERROR END ===');
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return sendError(res, `${field} already exists`, 400);
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendError(res, `Validation error: ${errors.join(', ')}`, 400);
    }

    sendError(res, 'Error in user registration', 500, error.message);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  console.log('=== LOGIN REQUEST START ===');
  console.log('Request IP:', req.ip);
  console.log('Login attempt for email:', req.body.email);
  
  try {
    const { email, password } = req.body;

    // Validate required fields
    const missing = validateRequired(['email', 'password'], req.body);
    if (missing.length > 0) {
      console.log('Missing login fields:', missing);
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format in login:', email);
      return sendError(res, 'Invalid email format', 400);
    }

    // Check for user
    console.log('Looking up user in database...');
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found:', email);
      return sendError(res, 'Invalid credentials', 401);
    }

    console.log('User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    });

    // Check if account is active
    if (!user.isActive) {
      console.log('Inactive account login attempt:', user._id);
      return sendError(res, 'Account is deactivated. Please contact administrator', 401);
    }

    // Check password
    console.log('Verifying password...');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Invalid password for user:', user._id);
      
      // Track failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLogin = new Date();
      
      if (user.failedLoginAttempts >= 5) {
        user.isActive = false;
        await user.save();
        console.log('Account locked due to failed attempts:', user._id);
        return sendError(res, 'Account locked due to multiple failed login attempts', 401);
      }
      
      await user.save();
      return sendError(res, 'Invalid credentials', 401);
    }

    console.log('Password verified successfully');

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.lastFailedLogin = null;
    }

    // Update last login
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    console.log('Login successful for user:', {
      id: user._id,
      email: user.email,
      role: user.role,
      loginCount: user.loginCount
    });
    console.log('=== LOGIN REQUEST END ===');

    console.log('Sending token response with user data:', {
      id: user._id,
      email: user.email,
      role: user.role
    });
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('=== LOGIN ERROR END ===');
    
    sendError(res, 'Error in user login', 500, error.message);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  console.log('=== GET ME REQUEST START ===');
  console.log('User ID from token:', req.user?.id);
  
  try {
    // First get the user without populate
    const user = await User.findById(req.user.id)
      .select('-password'); // Exclude password
    
    if (!user) {
      console.log('User not found in getMe:', req.user.id);
      return sendError(res, 'User not found', 404);
    }

    console.log('User found:', {
      id: user._id,
      email: user.email,
      role: user.role
    });

    // Only populate labId if user is a clinic and has labId
    if (user.role === 'clinic' && user.labId) {
      console.log('Populating lab info for clinic user...');
      await user.populate('labId', 'labId clinicName');
    }

    console.log('User profile retrieved:', {
      id: user._id,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin
    });
    console.log('=== GET ME REQUEST END ===');
    
    sendSuccess(res, user, 'User profile retrieved successfully');
  } catch (error) {
    console.error('=== GET ME ERROR ===');
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('=== GET ME ERROR END ===');
    
    sendError(res, 'Error retrieving user profile', 500, error.message);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  console.log('=== UPDATE PROFILE REQUEST START ===');
  console.log('User ID:', req.user.id);
  console.log('Update data:', JSON.stringify(req.body, null, 2));
  
  try {
    const { profile, clinicDetails, doctorDetails, assignerDetails } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found for profile update:', req.user.id);
      return sendError(res, 'User not found', 404);
    }

    console.log('Current user data:', {
      id: user._id,
      role: user.role,
      email: user.email
    });

    // Update profile
    if (profile) {
      console.log('Updating profile data...');
      user.profile = { ...user.profile, ...profile };
    }

    // Update role-specific details
    if (user.role === 'clinic' && clinicDetails) {
      console.log('Updating clinic details...');
      user.clinicDetails = { ...user.clinicDetails, ...clinicDetails };
      
      // Update lab record if it exists
      if (user.labId) {
        const lab = await Lab.findById(user.labId);
        if (lab) {
          lab.clinicName = clinicDetails.clinicName || lab.clinicName;
          lab.address = clinicDetails.address || lab.address;
          lab.registrationNumber = clinicDetails.registrationNumber || lab.registrationNumber;
          await lab.save();
          console.log('Lab record updated');
        }
      }
    } else if (user.role === 'doctor' && doctorDetails) {
      console.log('Updating doctor details...');
      user.doctorDetails = { 
        ...user.doctorDetails, 
        ...doctorDetails,
        experience: parseInt(doctorDetails.experience) || user.doctorDetails.experience,
        consultationFee: parseFloat(doctorDetails.consultationFee) || user.doctorDetails.consultationFee
      };
    } else if (user.role === 'assigner' && assignerDetails) {
      console.log('Updating assigner details...');
      user.assignerDetails = { ...user.assignerDetails, ...assignerDetails };
    }

    user.updatedAt = new Date();
    await user.save();

    console.log('Profile updated successfully for user:', user._id);
    console.log('=== UPDATE PROFILE REQUEST END ===');

    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    console.error('=== UPDATE PROFILE ERROR ===');
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('=== UPDATE PROFILE ERROR END ===');
    
    sendError(res, 'Error updating profile', 500, error.message);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req, res) => {
  console.log('=== CHANGE PASSWORD REQUEST START ===');
  console.log('User ID:', req.user.id);
  
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    const missing = validateRequired(['currentPassword', 'newPassword'], req.body);
    if (missing.length > 0) {
      console.log('Missing password change fields:', missing);
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      console.log('New password too short');
      return sendError(res, 'New password must be at least 6 characters long', 400);
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      console.log('User not found for password change:', req.user.id);
      return sendError(res, 'User not found', 404);
    }

    // Check current password
    console.log('Verifying current password...');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      console.log('Invalid current password for user:', user._id);
      return sendError(res, 'Current password is incorrect', 400);
    }

    console.log('Current password verified, updating...');

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    console.log('Password changed successfully for user:', user._id);
    console.log('=== CHANGE PASSWORD REQUEST END ===');

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('=== CHANGE PASSWORD ERROR ===');
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('=== CHANGE PASSWORD ERROR END ===');
    
    sendError(res, 'Error changing password', 500, error.message);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  console.log('=== LOGOUT REQUEST START ===');
  console.log('User ID:', req.user?.id);
  
  try {
    // Update user's last logout time
    if (req.user?.id) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.lastLogout = new Date();
        await user.save();
        console.log('Last logout time updated for user:', user._id);
      }
    }

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    console.log('Logout successful');
    console.log('=== LOGOUT REQUEST END ===');

    sendSuccess(res, null, 'User logged out successfully');
  } catch (error) {
    console.error('=== LOGOUT ERROR ===');
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('=== LOGOUT ERROR END ===');
    
    sendError(res, 'Error logging out', 500, error.message);
  }
};

// @desc    Get authentication stats (admin feature)
// @route   GET /api/auth/stats
// @access  Private (Admin only)
export const getAuthStats = async (req, res) => {
  console.log('=== GET AUTH STATS REQUEST START ===');
  
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          recentLogins: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    '$lastLogin',
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    console.log('Auth stats retrieved:', stats);
    console.log('=== GET AUTH STATS REQUEST END ===');

    sendSuccess(res, stats, 'Authentication statistics retrieved successfully');
  } catch (error) {
    console.error('=== GET AUTH STATS ERROR ===');
    console.error('Error:', error);
    console.error('=== GET AUTH STATS ERROR END ===');
    
    sendError(res, 'Error retrieving authentication statistics', 500, error.message);
  }
};