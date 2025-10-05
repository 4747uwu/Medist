import express from 'express';
import { protect } from '../utils/auth.js';
import { getPrescriptionsByPatient, getPrescriptionById } from '../controllers/prescription.controller.js';

const router = express.Router();

router.get('/patient/:patientId', protect, getPrescriptionsByPatient);
router.get('/:id', protect, getPrescriptionById);

export default router;