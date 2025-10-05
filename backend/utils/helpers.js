import jwt from 'jsonwebtoken';

// Response helper functions
export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const sendError = (res, message = 'Something went wrong', statusCode = 500, error = null) => {
  const response = {
    success: false,
    message
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  res.status(statusCode).json(response);
};

// Send token response helper
export const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Create token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  // Remove password from user object
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;

  // Set cookie options
  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Send response
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      data: userObj
    });
};

// Validation helper
export const validateRequired = (fields, body) => {
  const missing = [];
  
  fields.forEach(field => {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missing.push(field);
    }
  });

  return missing;
};

// Pagination helper
export const getPagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip
  };
};

// Generate pagination response
export const getPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

// Date formatting
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Search helper
export const buildSearchQuery = (searchTerm, fields) => {
  if (!searchTerm) return {};

  const searchRegex = new RegExp(searchTerm, 'i');
  
  return {
    $or: fields.map(field => ({
      [field]: searchRegex
    }))
  };
};

// File upload helpers
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

export const isValidImageExtension = (extension) => {
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  return validExtensions.includes(extension);
};

export const isValidDocumentExtension = (extension) => {
  const validExtensions = ['pdf', 'doc', 'docx', 'txt'];
  return validExtensions.includes(extension);
};

// Generate unique identifiers
export const generateUniqueId = (prefix = '', length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// Time helpers
export const getTimeSlots = (startTime, endTime, duration = 30) => {
  const slots = [];
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  
  let current = new Date(start);
  
  while (current < end) {
    const timeStr = current.toTimeString().slice(0, 5);
    slots.push(timeStr);
    current.setMinutes(current.getMinutes() + duration);
  }
  
  return slots;
};

// Validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/,
  pincode: /^\d{6}$/,
  gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
};

// Validate input using patterns
export const validateInput = (value, pattern) => {
  return patterns[pattern]?.test(value) || false;
};