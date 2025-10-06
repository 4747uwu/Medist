import Prescription from '../modals/Prescription.js';
import Patient from '../modals/Patient.js'; // Add Patient import
import Appointment from '../modals/Appointment.js'; // Add Appointment import
import { sendSuccess, sendError } from '../utils/helpers.js';
import puppeteer from 'puppeteer';

// GET /api/prescriptions/patient/:patientId - Get all prescriptions for a patient
export const getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Getting prescriptions for patient:', patientId);
    
    // Get all prescriptions for this patient
    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'profile doctorDetails')
      .populate('medicines.medicineId', 'name companyName')
      .populate('tests.testId', 'testName category')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${prescriptions.length} prescriptions for patient ${patientId}`);

    sendSuccess(res, prescriptions, 'Prescriptions retrieved successfully');
  } catch (err) {
    console.error('Error fetching prescriptions:', err);
    sendError(res, 'Error fetching prescriptions', 500, err.message);
  }
};

// FIXED: GET /api/prescriptions/:id - Get single prescription by prescriptionId
export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Getting prescription by ID:', id);
    
    // FIXED: Check for invalid IDs upfront
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid prescription ID provided:', id);
      return sendError(res, 'Invalid prescription ID', 400);
    }
    
    // Try to find by prescriptionId first
    let prescription = await Prescription.findOne({ prescriptionId: id })
      .populate('doctorId', 'profile doctorDetails')
      .populate('medicines.medicineId', 'name companyName')
      .populate('tests.testId', 'testName category')
      .lean();

    // If not found by prescriptionId, try by MongoDB _id as fallback
    // FIXED: Only try ObjectId lookup if the ID looks like a valid ObjectId
    if (!prescription && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        prescription = await Prescription.findById(id)
          .populate('doctorId', 'profile doctorDetails')
          .populate('medicines.medicineId', 'name companyName')
          .populate('tests.testId', 'testName category')
          .lean();
      } catch (objectIdError) {
        console.log('Failed to find by ObjectId:', objectIdError.message);
        // Continue to the not found response
      }
    }

    if (!prescription) {
      console.log('Prescription not found for ID:', id);
      return sendError(res, 'Prescription not found', 404);
    }

    console.log('Prescription found:', prescription.prescriptionId || prescription._id);
    sendSuccess(res, prescription, 'Prescription retrieved successfully');
  } catch (err) {
    console.error('Error fetching prescription:', err);
    sendError(res, 'Error fetching prescription', 500, err.message);
  }
};

export const generatePrescriptionPDF = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Generating PDF for prescription:', id);
    
    // FIXED: Check for invalid IDs upfront
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid prescription ID provided for PDF:', id);
      return sendError(res, 'Invalid prescription ID', 400);
    }
    
    // Get prescription details - try by prescriptionId first
    let prescription = await Prescription.findOne({ prescriptionId: id })
      .populate('doctorId', 'profile doctorDetails')
      .populate('medicines.medicineId', 'name companyName')
      .populate('tests.testId', 'testName category')
      .lean();

    // If not found by prescriptionId, try by MongoDB _id as fallback
    // FIXED: Only try ObjectId lookup if the ID looks like a valid ObjectId
    if (!prescription && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        prescription = await Prescription.findById(id)
          .populate('doctorId', 'profile doctorDetails')
          .populate('medicines.medicineId', 'name companyName')
          .populate('tests.testId', 'testName category')
          .lean();
      } catch (objectIdError) {
        console.log('Failed to find by ObjectId for PDF:', objectIdError.message);
        // Continue to the not found response
      }
    }

    if (!prescription) {
      console.log('Prescription not found for PDF generation:', id);
      return sendError(res, 'Prescription not found', 404);
    }

    // 🔥 NEW: Update patient workflow status to "Completed" when PDF is downloaded
    try {
      const patient = await Patient.findOne({ patientId: prescription.patientId });
      
      if (patient) {
        // Only update if current status is "Reported" (to avoid overwriting other statuses)
        if (patient.workflowStatus === 'Reported') {
          await Patient.findOneAndUpdate(
            { patientId: prescription.patientId },
            {
              workflowStatus: 'Completed',
              lastActivity: new Date()
            }
          );
          console.log(`Patient ${prescription.patientId} workflow status updated to "Completed" after PDF download`);
        } else {
          console.log(`Patient ${prescription.patientId} current status is "${patient.workflowStatus}", not updating to Completed`);
        }
      } else {
        console.log(`Patient ${prescription.patientId} not found for status update`);
      }
    } catch (statusUpdateError) {
      // Log error but don't fail the PDF generation
      console.error('Error updating patient workflow status:', statusUpdateError);
    }

    // Generate HTML content
    const htmlContent = generatePrescriptionHTML(prescription);
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescription.prescriptionId || prescription._id}.pdf"`);
    
    // 🔥 NEW: Add completion tracking to prescription
    try {
      await Prescription.findOneAndUpdate(
        { _id: prescription._id },
        {
          $set: {
            'downloadHistory.lastDownloadedAt': new Date(),
            'downloadHistory.downloadedBy': req.user?.id,
            'downloadHistory.downloadCount': (prescription.downloadHistory?.downloadCount || 0) + 1
          }
        }
      );
      console.log(`Prescription ${prescription.prescriptionId} download history updated`);
    } catch (downloadTrackingError) {
      // Log error but don't fail the PDF generation
      console.error('Error updating prescription download history:', downloadTrackingError);
    }
    
    // Send PDF
    res.send(pdfBuffer);
    
  } catch (err) {
    console.error('Error generating PDF:', err);
    sendError(res, 'Error generating PDF', 500, err.message);
  }
};

// POST /api/prescriptions - Create a new prescription
export const createPrescription = async (req, res) => {
  console.log('=== CREATE PRESCRIPTION REQUEST START ===');
  
  try {
    const prescriptionData = req.body;
    const { appointmentId } = prescriptionData;

    // ... existing validation code ...

    // Create prescription
    const prescription = await Prescription.create({
      ...prescriptionData,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    // ✅ If prescription is linked to an appointment, update appointment
    if (appointmentId) {
      const appointment = await Appointment.findOne({ appointmentId });
      
      if (appointment) {
        // Add prescription to appointment
        await appointment.addPrescription(prescription);

        // ✅ AUTO-COMPLETE: Mark appointment as completed
        appointment.status = 'Completed';
        appointment.completedAt = new Date();
        appointment.lastModifiedBy = req.user.id;
        await appointment.save();

        console.log(`✅ Appointment ${appointmentId} marked as Completed after prescription creation`);

        // Update patient's appointment record
        await Patient.findOneAndUpdate(
          {
            patientId: prescription.patientId,
            'appointments.list.appointmentId': appointmentId
          },
          {
            $set: {
              'appointments.list.$.status': 'Completed',
              'appointments.list.$.prescriptionIssued': true,
              'appointments.list.$.prescriptionId': prescription._id,
              'appointments.list.$.prescriptionCode': prescription.prescriptionId
            }
          }
        );
      }
    }

    // ... rest of existing code ...

    sendSuccess(res, {
      prescription,
      appointmentCompleted: !!appointmentId // Flag to inform frontend
    }, 'Prescription created successfully', 201);

  } catch (error) {
    console.error('=== CREATE PRESCRIPTION ERROR ===');
    console.error('Error:', error);
    sendError(res, 'Error creating prescription', 500, error.message);
  }
};

// Helper function to generate HTML
function generatePrescriptionHTML(prescription) {
  const doctorName = prescription.doctorId?.profile 
    ? `${prescription.doctorId.profile.firstName || ''} ${prescription.doctorId.profile.lastName || ''}`.trim()
    : prescription.doctorId?.name || 'Unknown Doctor';
    
  const doctorQualification = prescription.doctorId?.doctorDetails?.qualification || '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Prescription - ${prescription.prescriptionId}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .doctor-info { font-size: 18px; font-weight: bold; color: #2563eb; }
        .qualification { font-size: 14px; color: #666; margin-top: 5px; }
        .prescription-id { font-size: 12px; color: #666; margin-top: 10px; }
        .patient-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .medicine-item, .test-item { background: white; border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 8px; border-radius: 6px; }
        .medicine-name, .test-name { font-weight: bold; color: #374151; }
        .medicine-details, .test-details { font-size: 13px; color: #6b7280; margin-top: 4px; }
        .advice { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .date-info { text-align: right; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="doctor-info">Dr. ${doctorName}</div>
        <div class="qualification">${doctorQualification}</div>
        <div class="prescription-id">Prescription ID: ${prescription.prescriptionId || prescription._id}</div>
      </div>
      
      <div class="date-info">
        Date: ${new Date(prescription.createdAt).toLocaleDateString('en-IN')}
      </div>
      
      <div class="patient-info">
        <strong>Patient ID:</strong> ${prescription.patientId}<br>
        <strong>Visit ID:</strong> ${prescription.visitId}
        ${prescription.appointmentId ? `<br><strong>Appointment ID:</strong> ${prescription.appointmentId}` : ''}
      </div>
      
      ${prescription.medicines && prescription.medicines.length > 0 ? `
        <div class="section">
          <div class="section-title">Medicines Prescribed</div>
          ${prescription.medicines.map(med => `
            <div class="medicine-item">
              <div class="medicine-name">${med.medicineName || med.name || 'Unknown Medicine'}</div>
              <div class="medicine-details">
                ${med.dosage ? `Dosage: ${med.dosage}` : ''} 
                ${med.frequency ? `| Frequency: ${med.frequency}` : ''} 
                ${med.duration ? `| Duration: ${med.duration}` : ''}
                ${med.timing ? `<br>Timing: ${med.timing}` : ''}
                ${med.instructions ? `<br>Instructions: ${med.instructions}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${prescription.tests && prescription.tests.length > 0 ? `
        <div class="section">
          <div class="section-title">Recommended Tests</div>
          ${prescription.tests.map(test => `
            <div class="test-item">
              <div class="test-name">${test.testName || test.name || 'Unknown Test'}</div>
              <div class="test-details">
                ${test.urgency ? `Urgency: ${test.urgency}` : ''}
                ${test.instructions ? `<br>Instructions: ${test.instructions}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${prescription.diagnosis && prescription.diagnosis.primary ? `
        <div class="section">
          <div class="section-title">Diagnosis</div>
          <div class="advice">
            <strong>Primary:</strong> ${prescription.diagnosis.primary}
            ${prescription.diagnosis.secondary && prescription.diagnosis.secondary.length > 0 ? 
              `<br><strong>Secondary:</strong> ${prescription.diagnosis.secondary.join(', ')}` : ''}
          </div>
        </div>
      ` : ''}
      
      ${prescription.advice ? `
        <div class="section">
          <div class="section-title">Medical Advice</div>
          <div class="advice">
            ${prescription.advice.lifestyle ? `<strong>Lifestyle:</strong> ${prescription.advice.lifestyle}<br>` : ''}
            ${prescription.advice.diet ? `<strong>Diet:</strong> ${prescription.advice.diet}<br>` : ''}
            ${prescription.advice.followUp?.instructions ? `<strong>Follow-up:</strong> ${prescription.advice.followUp.instructions}` : ''}
          </div>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>This is a computer-generated prescription.</p>
        <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
      </div>
    </body>
    </html>
  `;
}