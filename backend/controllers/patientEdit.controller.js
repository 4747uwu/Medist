import { Patient, Visit } from '../modals/Patient.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

// @desc    Get patient details for editing
// @route   GET /api/patients/:patientId/edit
// @access  Private
export const getPatientForEdit = async (req, res) => {
  console.log('=== GET PATIENT FOR EDIT REQUEST START ===');
  console.log('Patient ID:', req.params.patientId);
  console.log('User ID:', req.user?.id);

  try {
    const { patientId } = req.params;

    // Find patient with current visit details
    const patient = await Patient.findOne({ patientId })
      .populate('assignment.doctorId', 'profile doctorDetails')
      .lean();

    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    // Get current visit if exists
    let currentVisit = null;
    if (patient.currentVisitId) {
      currentVisit = await Visit.findOne({ visitId: patient.currentVisitId }).lean();
    }

    console.log('Patient found:', !!patient);
    console.log('Current visit found:', !!currentVisit);

    const responseData = {
      patient,
      currentVisit,
      hasCurrentVisit: !!currentVisit
    };

    sendSuccess(res, responseData, 'Patient data retrieved successfully');

  } catch (error) {
    console.error('=== GET PATIENT FOR EDIT ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error fetching patient data', 500, error.message);
  }
};

// @desc    Update patient details
// @route   PUT /api/patients/:patientId/edit
// @access  Private
export const updatePatientDetails = async (req, res) => {
  console.log('=== UPDATE PATIENT DETAILS REQUEST START ===');
  console.log('Patient ID:', req.params.patientId);
  console.log('User ID:', req.user?.id);
  console.log('Update data:', JSON.stringify(req.body, null, 2));

  try {
    const { patientId } = req.params;
    const updateData = req.body;

    // Find and update patient
    const patient = await Patient.findOneAndUpdate(
      { patientId },
      {
        ...updateData,
        lastActivity: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    console.log('Patient updated successfully');
    sendSuccess(res, patient, 'Patient details updated successfully');

  } catch (error) {
    console.error('=== UPDATE PATIENT DETAILS ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error updating patient details', 500, error.message);
  }
};

// @desc    Update current visit details
// @route   PUT /api/patients/:patientId/visit/:visitId
// @access  Private
export const updateCurrentVisit = async (req, res) => {
  console.log('=== UPDATE CURRENT VISIT REQUEST START ===');
  console.log('Patient ID:', req.params.patientId);
  console.log('Visit ID:', req.params.visitId);
  console.log('User ID:', req.user?.id);

  try {
    const { patientId, visitId } = req.params;
    const updateData = req.body;

    // Update visit
    const visit = await Visit.findOneAndUpdate(
      { visitId, patientId },
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!visit) {
      return sendError(res, 'Visit not found', 404);
    }

    // Update patient's last activity and workflow status if provided
    const patientUpdateData = { lastActivity: new Date() };
    if (updateData.workflowStatus) {
      patientUpdateData.workflowStatus = updateData.workflowStatus;
    }

    await Patient.findOneAndUpdate(
      { patientId },
      patientUpdateData
    );

    console.log('Visit updated successfully');
    sendSuccess(res, visit, 'Visit details updated successfully');

  } catch (error) {
    console.error('=== UPDATE CURRENT VISIT ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error updating visit details', 500, error.message);
  }
};