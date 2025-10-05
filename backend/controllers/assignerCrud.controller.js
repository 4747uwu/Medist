import Lab from '../modals/Lab.js';
import User from '../modals/User.js';
import { sendSuccess, sendError } from '../utils/helpers.js';
import { validateRequired } from '../utils/helpers.js';
import bcrypt from 'bcryptjs';

// ==================== LAB CRUD OPERATIONS ====================

// @desc    Create a new lab (clinic)
// @route   POST /api/assigner/labs
// @access  Private (Assigner only)
export const createLab = async (req, res) => {
  console.log('=== CREATE LAB REQUEST START ===');
  console.log('Assigner ID:', req.user?.id);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { 
      labId, 
      labName, 
      registrationDetails, 
      contactInfo, 
      operationalDetails,
      // User account credentials
      email,
      password,
      adminName
    } = req.body;

    // Validate required fields
    const missing = validateRequired(['labId', 'labName', 'email', 'password'], req.body);
    if (missing.length > 0) {
      console.log('Missing required fields:', missing);
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    // Check if lab ID already exists
    const existingLab = await Lab.findOne({ labId: labId.toUpperCase() });
    if (existingLab) {
      console.log('Lab ID already exists:', labId);
      return sendError(res, 'Lab ID already exists', 400);
    }

    // Check if user email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('Email already registered:', email);
      return sendError(res, 'Email already registered', 400);
    }

    // // Hash password for user account
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    // Create lab first
    const lab = await Lab.create({
      labId: labId.toUpperCase(),
      labName,
      registrationDetails,
      contactInfo,
      operationalDetails,
      isActive: true,
      owner: req.user.id
    });

    console.log('Lab created successfully:', lab.labId);

    // Extract admin name or use lab name
    const [firstName, ...lastNameParts] = (adminName || labName).split(' ');
    const lastName = lastNameParts.join(' ') || 'Admin';

    // Create user account for the clinic
    const clinicUser = await User.create({
      email: email.toLowerCase(),
      password: password,
      role: 'clinic',
      profile: {
        firstName,
        lastName,
        phone: contactInfo?.phone?.primary || ''
      },
      clinicDetails: {
        clinicName: labName,
        address: `${contactInfo?.address?.street}, ${contactInfo?.address?.city}`,
        registrationNumber: registrationDetails?.registrationNumber,
        labId: lab.labId,
        registrationDate: new Date()
      },
      isActive: true,
      registrationComplete: true
    });

    console.log('Clinic user account created:', clinicUser.email);

    // Update lab with user reference
    lab.owner = clinicUser._id;
    await lab.save();

    console.log('Lab updated with user reference');
    console.log('=== CREATE LAB REQUEST END ===');

    // Return both lab and user info (without password)
    const response = {
      lab: lab,
      user: {
        id: clinicUser._id,
        email: clinicUser.email,
        role: clinicUser.role,
        profile: clinicUser.profile
      }
    };

    sendSuccess(res, response, 'Clinic and user account created successfully', 201);
  } catch (error) {
    console.error('=== CREATE LAB ERROR ===');
    console.error('Error:', error);
    console.error('=== CREATE LAB ERROR END ===');

    sendError(res, 'Error creating clinic', 500, error.message);
  }
};

// @desc    Get all labs
// @route   GET /api/assigner/labs
// @access  Private (Assigner only)
export const getLabs = async (req, res) => {
  console.log('=== GET LABS REQUEST START ===');

  try {
    const { search, isActive, page = 1, limit = 50 } = req.query;

    let query = {};

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search filter
    if (search && search.trim()) {
      query.$or = [
        { labId: { $regex: search, $options: 'i' } },
        { clinicName: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [labs, total] = await Promise.all([
      Lab.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Lab.countDocuments(query)
    ]);

    console.log('Labs retrieved:', labs.length, 'Total:', total);
    console.log('=== GET LABS REQUEST END ===');

    sendSuccess(res, {
      data: labs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Labs retrieved successfully');
  } catch (error) {
    console.error('=== GET LABS ERROR ===');
    console.error('Error:', error);
    console.error('=== GET LABS ERROR END ===');

    sendError(res, 'Error retrieving labs', 500, error.message);
  }
};

// @desc    Get lab by ID
// @route   GET /api/assigner/labs/:id
// @access  Private (Assigner only)
export const getLabById = async (req, res) => {
  console.log('=== GET LAB BY ID REQUEST START ===');
  console.log('Lab ID:', req.params.id);

  try {
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      console.log('Lab not found');
      return sendError(res, 'Lab not found', 404);
    }

    console.log('Lab found:', lab.labId);
    console.log('=== GET LAB BY ID REQUEST END ===');

    sendSuccess(res, lab, 'Lab retrieved successfully');
  } catch (error) {
    console.error('=== GET LAB BY ID ERROR ===');
    console.error('Error:', error);
    console.error('=== GET LAB BY ID ERROR END ===');

    sendError(res, 'Error retrieving lab', 500, error.message);
  }
};

// @desc    Update lab
// @route   PUT /api/assigner/labs/:id
// @access  Private (Assigner only)
export const updateLab = async (req, res) => {
  console.log('=== UPDATE LAB REQUEST START ===');
  console.log('Lab ID:', req.params.id);
  console.log('Update data:', JSON.stringify(req.body, null, 2));

  try {
    const lab = await Lab.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!lab) {
      console.log('Lab not found');
      return sendError(res, 'Lab not found', 404);
    }

    console.log('Lab updated successfully:', lab.labId);
    console.log('=== UPDATE LAB REQUEST END ===');

    sendSuccess(res, lab, 'Lab updated successfully');
  } catch (error) {
    console.error('=== UPDATE LAB ERROR ===');
    console.error('Error:', error);
    console.error('=== UPDATE LAB ERROR END ===');

    sendError(res, 'Error updating lab', 500, error.message);
  }
};

// @desc    Delete lab
// @route   DELETE /api/assigner/labs/:id
// @access  Private (Assigner only)
export const deleteLab = async (req, res) => {
  console.log('=== DELETE LAB REQUEST START ===');
  console.log('Lab ID:', req.params.id);

  try {
    const lab = await Lab.findByIdAndDelete(req.params.id);

    if (!lab) {
      console.log('Lab not found');
      return sendError(res, 'Lab not found', 404);
    }

    console.log('Lab deleted successfully:', lab.labId);
    console.log('=== DELETE LAB REQUEST END ===');

    sendSuccess(res, null, 'Lab deleted successfully');
  } catch (error) {
    console.error('=== DELETE LAB ERROR ===');
    console.error('Error:', error);
    console.error('=== DELETE LAB ERROR END ===');

    sendError(res, 'Error deleting lab', 500, error.message);
  }
};

// ==================== DOCTOR CRUD OPERATIONS ====================

// @desc    Create a new doctor
// @route   POST /api/assigner/doctors
// @access  Private (Assigner only)
export const createDoctor = async (req, res) => {
  console.log('=== CREATE DOCTOR REQUEST START ===');
  console.log('Assigner ID:', req.user?.id);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { email, password, profile, doctorDetails } = req.body;

    // Validate required fields
    const missing = validateRequired(['email', 'password', 'profile', 'doctorDetails'], req.body);
    if (missing.length > 0) {
      console.log('Missing required fields:', missing);
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    // Validate profile fields
    const profileMissing = validateRequired(['firstName', 'lastName', 'phone'], profile);
    if (profileMissing.length > 0) {
      console.log('Missing profile fields:', profileMissing);
      return sendError(res, `Missing profile fields: ${profileMissing.join(', ')}`, 400);
    }

    // Validate doctor details
    const doctorMissing = validateRequired(
      ['specialization', 'qualification', 'experience', 'registrationNumber'],
      doctorDetails
    );
    if (doctorMissing.length > 0) {
      console.log('Missing doctor details:', doctorMissing);
      return sendError(res, `Missing doctor details: ${doctorMissing.join(', ')}`, 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('Email already registered:', email);
      return sendError(res, 'Email already registered', 400);
    }

   
    // Create doctor user
    const doctor = await User.create({
      email: email.toLowerCase(),
      password: password,
      role: 'doctor',
      profile,
      doctorDetails: {
        ...doctorDetails,
        registrationDate: new Date(),
        isVerified: false
      },
      isActive: true,
      registrationComplete: true
    });

    // Remove password from response
    const doctorObj = doctor.toObject();
    delete doctorObj.password;

    console.log('Doctor created successfully:', doctor.email);
    console.log('=== CREATE DOCTOR REQUEST END ===');

    sendSuccess(res, doctorObj, 'Doctor created successfully', 201);
  } catch (error) {
    console.error('=== CREATE DOCTOR ERROR ===');
    console.error('Error:', error);
    console.error('=== CREATE DOCTOR ERROR END ===');

    sendError(res, 'Error creating doctor', 500, error.message);
  }
};

// @desc    Get all doctors
// @route   GET /api/assigner/doctors
// @access  Private (Assigner only)
export const getDoctors = async (req, res) => {
  console.log('=== GET DOCTORS REQUEST START ===');

  try {
    const { search, isActive, specialization, page = 1, limit = 50 } = req.query;

    let query = { role: 'doctor' };

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Filter by specialization
    if (specialization) {
      query['doctorDetails.specialization'] = specialization;
    }

    // Search filter
    if (search && search.trim()) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { 'doctorDetails.registrationNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [doctors, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    console.log('Doctors retrieved:', doctors.length, 'Total:', total);
    console.log('=== GET DOCTORS REQUEST END ===');

    sendSuccess(res, {
      data: doctors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }, 'Doctors retrieved successfully');
  } catch (error) {
    console.error('=== GET DOCTORS ERROR ===');
    console.error('Error:', error);
    console.error('=== GET DOCTORS ERROR END ===');

    sendError(res, 'Error retrieving doctors', 500, error.message);
  }
};

// @desc    Get doctor by ID
// @route   GET /api/assigner/doctors/:id
// @access  Private (Assigner only)
export const getDoctorById = async (req, res) => {
  console.log('=== GET DOCTOR BY ID REQUEST START ===');
  console.log('Doctor ID:', req.params.id);

  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' })
      .select('-password');

    if (!doctor) {
      console.log('Doctor not found');
      return sendError(res, 'Doctor not found', 404);
    }

    console.log('Doctor found:', doctor.email);
    console.log('=== GET DOCTOR BY ID REQUEST END ===');

    sendSuccess(res, doctor, 'Doctor retrieved successfully');
  } catch (error) {
    console.error('=== GET DOCTOR BY ID ERROR ===');
    console.error('Error:', error);
    console.error('=== GET DOCTOR BY ID ERROR END ===');

    sendError(res, 'Error retrieving doctor', 500, error.message);
  }
};

// @desc    Update doctor
// @route   PUT /api/assigner/doctors/:id
// @access  Private (Assigner only)
export const updateDoctor = async (req, res) => {
  console.log('=== UPDATE DOCTOR REQUEST START ===');
  console.log('Doctor ID:', req.params.id);
  console.log('Update data:', JSON.stringify(req.body, null, 2));

  try {
    // Don't allow password updates through this endpoint
    if (req.body.password) {
      delete req.body.password;
    }

    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'doctor' },
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!doctor) {
      console.log('Doctor not found');
      return sendError(res, 'Doctor not found', 404);
    }

    console.log('Doctor updated successfully:', doctor.email);
    console.log('=== UPDATE DOCTOR REQUEST END ===');

    sendSuccess(res, doctor, 'Doctor updated successfully');
  } catch (error) {
    console.error('=== UPDATE DOCTOR ERROR ===');
    console.error('Error:', error);
    console.error('=== UPDATE DOCTOR ERROR END ===');

    sendError(res, 'Error updating doctor', 500, error.message);
  }
};

// @desc    Delete doctor
// @route   DELETE /api/assigner/doctors/:id
// @access  Private (Assigner only)
export const deleteDoctor = async (req, res) => {
  console.log('=== DELETE DOCTOR REQUEST START ===');
  console.log('Doctor ID:', req.params.id);

  try {
    const doctor = await User.findOneAndDelete({ _id: req.params.id, role: 'doctor' });

    if (!doctor) {
      console.log('Doctor not found');
      return sendError(res, 'Doctor not found', 404);
    }

    console.log('Doctor deleted successfully:', doctor.email);
    console.log('=== DELETE DOCTOR REQUEST END ===');

    sendSuccess(res, null, 'Doctor deleted successfully');
  } catch (error) {
    console.error('=== DELETE DOCTOR ERROR ===');
    console.error('Error:', error);
    console.error('=== DELETE DOCTOR ERROR END ===');

    sendError(res, 'Error deleting doctor', 500, error.message);
  }
};