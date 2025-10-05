import jwt from 'jsonwebtoken';
import User from '../modals/User.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  console.log('=== PROTECT MIDDLEWARE START ===');
  console.log('Request headers:', req.headers);
  console.log('Authorization header:', req.headers.authorization);
  
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted from Bearer header:', token);
    }

    if (!token) {
      console.log('❌ No token found in request');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // ✅ FIXED: Use consistent hardcoded secret and import statement
      console.log('🔍 Attempting to verify token...');
      console.log('Using JWT secret: anishanish');
      
      const decoded = jwt.verify(token, 'anishanish');
      console.log('✅ Token verified successfully:', decoded);
      
      // Get user from database
      console.log('🔍 Looking up user with ID:', decoded.id);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('❌ No user found with ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'No user found with this token'
        });
      }

      console.log('✅ User found:', {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      });

      if (!user.isActive) {
        console.log('❌ User account is deactivated');
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      console.log('✅ User authenticated successfully');
      req.user = user;
      next();
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError.message);
      console.log('JWT Error details:', jwtError);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        debug: jwtError.message
      });
    }
  } catch (error) {
    console.log('❌ Server error in authentication:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      error: error.message
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('=== AUTHORIZE MIDDLEWARE ===');
    console.log('Required roles:', roles);
    console.log('User role:', req.user?.role);
    
    if (!roles.includes(req.user.role)) {
      console.log('❌ User role not authorized');
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    console.log('✅ User role authorized');
    next();
  };
};

// Check if user belongs to the same lab
export const checkLabAccess = (req, res, next) => {
  const userLabId = req.user.clinicDetails?.labId || 
                   req.user.doctorDetails?.labId || 
                   req.user.assignerDetails?.labId;
  
  const requestedLabId = req.params.labId || req.body.labId || req.query.labId;

  if (userLabId !== requestedLabId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You can only access data from your lab'
    });
  }

  req.labId = userLabId;
  next();
};

// Generate JWT token
export const generateToken = (id) => {
  console.log('🔐 Generating token for user ID:', id);
  const token = jwt.sign({ id }, 'anishanish', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
  console.log('✅ Token generated successfully');
  return token;
};

// Send token response
export const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  console.log('=== SENDING TOKEN RESPONSE ===');
  console.log('User ID:', user._id);
  console.log('Status code:', statusCode);
  
  const token = generateToken(user._id);

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Remove password from output
  user.password = undefined;

  console.log('✅ Sending token response');
  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      data: user,
    });
};