import express from 'express';
import { protect } from '../utils/auth.js';
import { 
  getPatientForEdit, 
  updatePatientDetails, 
  updateCurrentVisit 
} from '../controllers/patientEdit.controller.js';

const router = express.Router();

// Edit patient routes
router.get('/:patientId/edit', protect, getPatientForEdit);
router.put('/:patientId/edit', protect, updatePatientDetails);
router.put('/:patientId/visit/:visitId', protect, updateCurrentVisit);

export default router;