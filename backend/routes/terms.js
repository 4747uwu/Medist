import express from 'express';
import { TermsAndConditions } from '../modals/TermsAndConditions.js';
import { sendSuccess, sendError } from '../utils/helpers.js';
import mongoose from 'mongoose';

const router = express.Router();

// @desc    Get latest active terms
// @route   GET /api/terms/latest
// @access  Public
router.get('/latest', async (req, res) => {
  try {
    const terms = await TermsAndConditions.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    if (!terms) {
      // ✅ CREATE default terms in database if none exist
      const defaultTerms = await TermsAndConditions.create({
        version: '1.0',
        effectiveDate: new Date(),
        isActive: true,
        content: {
          eligibility: `Doctors must hold a valid medical degree from a recognized institution.\nDoctors must be registered with a State Medical Council or the Medical Council of India.\nDoctors must maintain a valid professional license in good standing.\nPatients must be of legal age or have a legal guardian's consent to use the app.`,
          platformServices: `The app provides telemedicine services, including secure video consultations, chat, appointment scheduling, and medical record management.\nThe platform offers access to secure tools, 24/7 technical support, and training provisions.\nBy continuing to use the app after updates, users automatically accept new features and changes.`,
          revenuePayments: `Revenue sharing between doctors and the platform will be determined by mutual agreement and communicated through official email.\nPayment cycles, methods, and related details will be shared officially.\nThe platform may use third-party payment processors, and users agree to their respective terms.`,
          professionalResponsibilities: `Doctors are solely responsible for all medical advice, prescriptions, and treatment decisions made using the app.\nDoctors must follow medical ethics, clinical guidelines, and telemedicine regulations.\nThe platform does not provide medical advice and holds no responsibility for clinical outcomes.`,
          liabilityIndemnity: `Doctors fully accept responsibility for all consultations and medical actions performed via the platform.\nDoctors agree to indemnify and hold harmless the platform and its affiliates from any claims related to medical advice or malpractice.\nPlatform liability is limited strictly to the refund or payment of consultation fees, as applicable.`,
          legalCompliance: `All users agree to comply with medical council regulations and telemedicine laws in their jurisdiction.\nAny disputes will be subject to the exclusive jurisdiction of the courts in [Insert City].\nPlatform decisions regarding account actions and compliance matters are final and cannot be legally challenged.`,
          termination: `Either party may terminate this agreement with 30 days' written notice.\nThe platform may terminate access immediately in cases of misconduct, non-compliance, or violation of policies.\nA 6-month non-solicitation period applies after termination to prevent direct solicitation of platform users where applicable.`,
          automaticAcceptance: `Continued use of the app after any updates implies automatic acceptance of revised terms and policies.\nMinor updates or policy changes may not be individually notified.\nMajor changes will be communicated via email or in-app notification.`,
          finalConfirmation: `By proceeding with registration or digital signature, you confirm that:\n• You have read and understood all terms and conditions.\n• You accept full legal responsibility as outlined above.\n• You authorize the platform to verify your information.\n• You understand this agreement is legally binding and enforceable.`
        },
        privacyPolicy: {
          dataCollection: `The app collects user data such as name, contact details, registration/license information, consultation records, and communication logs.\nPatient medical records and consultation data are stored securely for healthcare and compliance purposes.`,
          dataUsage: `Collected data is used to facilitate consultations, manage accounts, process payments, and improve services.\nAnonymized data may be used for research, analytics, or service enhancement.`,
          dataPrivacy: `All patient information is treated as strictly confidential.\nDoctors and staff must use secure devices and credentials to access patient data.\nUnauthorized access, sharing, or misuse of patient information is strictly prohibited.`,
          dataProtection: `The platform complies with the Digital Personal Data Protection Act, 2023, and all other applicable data protection laws.\nUsers agree to follow all relevant data privacy regulations while using the app.`,
          dataRetention: `Data is retained only as long as necessary for medical, operational, or legal purposes.\nUsers can request access, correction, or deletion of their personal information, subject to regulatory requirements.`,
          thirdPartyAccess: `Limited data may be shared with authorized third-party services (e.g., payment gateways or cloud providers) under confidentiality agreements.\nNo personal or medical data will ever be sold or used for advertising.`,
          securityMeasures: `All data transfers and communications are encrypted and stored on secure servers.\nRegular audits and compliance checks are performed to maintain data integrity and protection.`,
          consentAcknowledgment: `By using this app:\n• You consent to the collection, storage, and processing of your data as outlined above.\n• You agree to abide by the Terms & Conditions and this Privacy Policy.`
        }
      });
      
      console.log('Default terms created in database:', defaultTerms._id);
      return sendSuccess(res, defaultTerms, 'Default terms and conditions');
    }

    sendSuccess(res, terms, 'Terms and conditions retrieved successfully');
  } catch (error) {
    console.error('Error fetching terms:', error);
    sendError(res, 'Error fetching terms and conditions', 500, error.message);
  }
});

export default router;