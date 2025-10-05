import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import PhoneEntry from './CreatePatientModal/PhoneEntry';
import PersonalInfo from './CreatePatientModal/PersonalInfo';
import MedicalHistory from './CreatePatientModal/MedicalHistory';
import Documents from './CreatePatientModal/Documents';
import VisitDetails from './CreatePatientModal/VisitDetails';
import ModalLayout from './CreatePatientModal/ModalLayout';
import { usePatientForm } from './CreatePatientModal/usePatientForm';

const CreatePatientModal = ({ isOpen, onClose, onSuccess }) => {
  const {
    step,
    setStep,
    phoneNumber,
    setPhoneNumber,
    checkingPatient,
    setCheckingPatient,
    patientExists,
    setPatientExists,
    isSubmitting,
    setIsSubmitting,
    formData,
    setFormData,
    errors,
    setErrors,
    newCondition,
    setNewCondition,
    newAllergy,
    setNewAllergy,
    newSurgery,
    setNewSurgery,
    newTest,
    setNewTest,
    newMedicine,
    setNewMedicine,
    handleInputChange,
    addChronicCondition,
    removeChronicCondition,
    addAllergy,
    removeAllergy,
    addSurgery,
    removeSurgery,
    addTest,
    removeTest,
    addMedicine,
    removeMedicine,
    validatePersonalInfo,
    validateAppointmentDetails,
    calculateAge,
    // NEW: Document functions
    addDocument,
    removeDocument,
    updateDocument,
    convertFileToBase64
  } = usePatientForm();

  const slides = [
    {
      title: "Patient Registration",
      description: "Enter patient mobile number to begin",
      image: "📱",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Patient Details",
      description: "Enter patient details for comprehensive care",
      image: "👤",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Medical History",
      description: "Document chronic conditions and allergies",
      image: "📋",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Upload Documents",
      description: "Upload patient documents and ID proofs",
      image: "📄",
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Schedule Appointment",
      description: "Book appointment with medical assessment",
      image: "📅",
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];
  const appointmentModes = ['In-person', 'Online', 'Emergency'];

  console.log('CreatePatientModal - Current step:', step, 'Phone:', phoneNumber, 'Patient exists:', patientExists);

  // Check patient when phone is entered
  const handleCheckPatient = async () => {
    if (!/^\d{10}$/.test(phoneNumber)) {
      setErrors({ phone: 'Phone number must be 10 digits' });
      return;
    }

    console.log('Checking patient:', phoneNumber);
    setCheckingPatient(true);
    setErrors({});

    try {
      const response = await apiClient.get(`/patients/check/${phoneNumber}`);
      
      console.log('Check patient response:', response.data);

      if (response.data.success && response.data.data.exists) {
        // Patient exists - prefill form
        console.log('Patient exists, prefilling form');
        const patient = response.data.data.patient;
        
        // Format dateOfBirth to YYYY-MM-DD string for the date input
        const formattedDateOfBirth = patient.personalInfo.dateOfBirth 
          ? new Date(patient.personalInfo.dateOfBirth).toISOString().split('T')[0] 
          : '';
        
        setFormData({
          ...formData,
          personalInfo: {
            ...patient.personalInfo,
            dateOfBirth: formattedDateOfBirth
          },
          contactInfo: patient.contactInfo,
          emergencyContact: patient.emergencyContact,
          medicalHistory: patient.medicalHistory,
          photo: patient.photo,
          documents: patient.documents || [] // Include existing documents
        });
        
        setPatientExists(true);
        // 🔥 FIXED: Go to documents step instead of directly to visit
        setStep('documents'); // Allow user to add new documents even for existing patients
      } else {
        // New patient - collect all details
        console.log('New patient, collecting details');
        setFormData({
          ...formData,
          contactInfo: {
            ...formData.contactInfo,
            phone: phoneNumber
          }
        });
        setPatientExists(false);
        setStep('permanent'); // Start with permanent details
      }
    } catch (error) {
      console.error('Error checking patient:', error);
      setErrors({ submit: 'Error checking patient details' });
    } finally {
      setCheckingPatient(false);
    }
  };

  const handleNext = () => {
    if (step === 'permanent' && !validatePersonalInfo()) return;
    
    // Updated step order to include documents
    const stepOrder = ['phone', 'permanent', 'medical', 'documents', 'visit'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    // Updated step order to include documents
    const stepOrder = ['phone', 'permanent', 'medical', 'documents', 'visit'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    console.log('Submitting patient and appointment data...');
    console.log('Form data being submitted:', formData);
    
    if (!validateAppointmentDetails()) {
      console.log('Validation failed:', errors);
      return;
    }

    setIsSubmitting(true);

    try {
      let patientResponse;

      // Step 1: Create/update patient (for both new AND existing patients if documents are added)
      const hasNewDocuments = formData.documents && formData.documents.length > 0;
      
      if (!patientExists || hasNewDocuments) {
        const patientPayload = {
          patientId: phoneNumber,
          personalInfo: formData.personalInfo,
          contactInfo: formData.contactInfo,
          emergencyContact: formData.emergencyContact,
          medicalHistory: formData.medicalHistory,
          photo: formData.photo,
          documents: formData.documents || [] // Include documents (new or existing)
        };

        console.log('Patient payload (new patient or has documents):', patientPayload);
        patientResponse = await apiClient.post('/patients', patientPayload);
        console.log('Patient response:', patientResponse.data);
      }

      // Step 2: Create appointment with correct format
      const appointmentPayload = {
        scheduledDate: formData.appointment.date,
        scheduledTime: formData.appointment.time,
        mode: formData.appointment.mode,
        appointmentType: formData.appointment.type || 'Consultation',
        duration: formData.appointment.duration || 30,
        doctorId: formData.appointment.doctorId || null,
        
        // Medical data
        chiefComplaints: {
          primary: formData.appointment.complaints?.chief || '',
          duration: formData.appointment.complaints?.duration || '',
          severity: formData.appointment.complaints?.severity || 'Moderate'
        },
        
        vitals: {
          weight: {
            value: formData.appointment.vitals?.weight?.value ? parseFloat(formData.appointment.vitals.weight.value) : null,
            unit: 'kg'
          },
          temperature: {
            value: formData.appointment.vitals?.temperature?.value ? parseFloat(formData.appointment.vitals.temperature.value) : null,
            unit: '°F'
          },
          bloodPressure: {
            systolic: formData.appointment.vitals?.bloodPressure?.systolic ? parseInt(formData.appointment.vitals.bloodPressure.systolic) : null,
            diastolic: formData.appointment.vitals?.bloodPressure?.diastolic ? parseInt(formData.appointment.vitals.bloodPressure.diastolic) : null
          },
          heartRate: {
            value: formData.appointment.vitals?.heartRate?.value ? parseInt(formData.appointment.vitals.heartRate.value) : null,
            unit: 'bpm'
          },
          oxygenSaturation: {
            value: formData.appointment.vitals?.oxygenSaturation?.value ? parseInt(formData.appointment.vitals.oxygenSaturation.value) : null,
            unit: '%'
          },
          bloodSugar: {
            value: formData.appointment.vitals?.bloodSugar?.value ? parseFloat(formData.appointment.vitals.bloodSugar.value) : null,
            type: formData.appointment.vitals?.bloodSugar?.type || 'Random',
            unit: 'mg/dL'
          }
        },
        
        examination: {
          physicalFindings: formData.appointment.examination?.physicalFindings || '',
          provisionalDiagnosis: formData.appointment.examination?.provisionalDiagnosis || '',
          differentialDiagnosis: formData.appointment.examination?.differentialDiagnosis || []
        },
        
        followUp: {
          nextAppointmentDate: formData.appointment.followUp?.nextAppointmentDate || null,
          instructions: formData.appointment.followUp?.instructions || '',
          notes: formData.appointment.followUp?.notes || ''
        },
        
        doctorNotes: formData.appointment.doctorNotes || ''
      };

      console.log('Creating appointment with properly structured data:', appointmentPayload);
      const appointmentResponse = await apiClient.post(
        `/patients/${phoneNumber}/appointments`,
        appointmentPayload
      );

      console.log('Appointment response:', appointmentResponse.data);

      if (appointmentResponse.data.success) {
        // 🔥 RESET THE FORM STATE AFTER SUCCESS
        resetForm();
        
        onSuccess && onSuccess({
          patient: patientResponse?.data?.data,
          appointment: appointmentResponse.data.data
        });
        onClose();
      }

    } catch (error) {
      console.error('Error:', error);
      console.error('Error details:', error.response?.data);
      setErrors({ submit: error.response?.data?.message || 'Failed to create patient/appointment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔥 ADD: Reset function
  const resetForm = () => {
    setStep('phone');
    setPhoneNumber('');
    setPatientExists(false);
    setCheckingPatient(false);
    setIsSubmitting(false);
    setErrors({});
    setNewCondition('');
    setNewAllergy('');
    setNewSurgery({ surgery: '', date: '' });
    setNewTest({ testName: '', urgency: 'Routine' });
    setNewMedicine({ medicineName: '', dosage: '', duration: '' });
    
    // Reset form data to initial state
    setFormData({
      personalInfo: {
        fullName: '',
        dateOfBirth: '',
        age: '',
        gender: '',
        bloodGroup: '',
        height: { value: '', unit: 'cm' }
      },
      contactInfo: {
        phone: '',
        email: '',
        address: { street: '', city: '', state: '', pincode: '', country: 'India' }
      },
      emergencyContact: { name: '', relationship: '', phone: '' },
      medicalHistory: { chronicConditions: [], allergies: [], pastSurgeries: [], familyHistory: [] },
      photo: null,
      documents: [],
      appointment: {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        mode: 'In-person',
        type: 'Consultation',
        duration: 30,
        doctorId: '',
        doctorName: '',
        specialization: '',
        vitals: {
          weight: { value: '', unit: 'kg' },
          temperature: { value: '', unit: '°F' },
          bloodPressure: { systolic: '', diastolic: '' },
          heartRate: { value: '', unit: 'bpm' },
          oxygenSaturation: { value: '', unit: '%' },
          bloodSugar: { value: '', type: 'Random', unit: 'mg/dL' }
        },
        complaints: { chief: '', duration: '', severity: 'Moderate', pastHistoryRelevant: '' },
        examination: { physicalFindings: '', provisionalDiagnosis: '', differentialDiagnosis: [] },
        investigations: { testsRecommended: [], pastReportsReviewed: [] },
        treatment: { medicines: [], lifestyleAdvice: '', dietSuggestions: '' },
        followUp: { nextAppointmentDate: '', instructions: '', notes: '' },
        doctorNotes: ''
      }
    });
  };

  // 🔥 ADD: Handle modal close with reset
  const handleModalClose = () => {
    resetForm(); // Reset the form state
    onClose(); // Call the original onClose
  };

  // 🔥 ADD: Reset form when modal opens (fresh start)
  useEffect(() => {
    if (isOpen) {
      resetForm(); // Reset to fresh state when modal opens
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSlide = slides.find(slide => slide.color.includes(
    step === 'phone' ? 'blue' :
    step === 'permanent' ? 'green' :
    step === 'medical' ? 'purple' :
    step === 'documents' ? 'orange' : 'indigo'
  )) || slides[0];

  const renderStepContent = () => {
    switch (step) {
      case 'phone':
        return (
          <PhoneEntry
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            onCheckPatient={handleCheckPatient}
            checkingPatient={checkingPatient}
            errors={errors}
          />
        );

      case 'permanent':
        return (
          <PersonalInfo
            formData={formData}
            phoneNumber={phoneNumber}
            handleInputChange={handleInputChange}
            calculateAge={calculateAge}
            errors={errors}
            indianStates={indianStates}
            bloodGroups={bloodGroups}
            genders={genders}
          />
        );

      case 'medical':
        return (
          <MedicalHistory
            formData={formData}
            newCondition={newCondition}
            setNewCondition={setNewCondition}
            addChronicCondition={addChronicCondition}
            removeChronicCondition={removeChronicCondition}
            newAllergy={newAllergy}
            setNewAllergy={setNewAllergy}
            addAllergy={addAllergy}
            removeAllergy={removeAllergy}
            newSurgery={newSurgery}
            setNewSurgery={setNewSurgery}
            addSurgery={addSurgery}
            removeSurgery={removeSurgery}
          />
        );

      case 'documents':
        return (
          <Documents
            formData={formData}
            addDocument={addDocument}
            removeDocument={removeDocument}
            updateDocument={updateDocument}
            convertFileToBase64={convertFileToBase64}
            errors={errors}
          />
        );

      case 'visit':
        return (
          <VisitDetails
            formData={formData}
            patientExists={patientExists}
            handleInputChange={handleInputChange}
            appointmentModes={appointmentModes}
            newTest={newTest}
            setNewTest={setNewTest}
            addTest={addTest}
            removeTest={removeTest}
            newMedicine={newMedicine}
            setNewMedicine={setNewMedicine}
            addMedicine={addMedicine}
            removeMedicine={removeMedicine}
            errors={errors}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ModalLayout
      currentSlide={currentSlide}
      step={step}
      patientExists={patientExists}
      onClose={handleModalClose} // 🔥 Use the reset-enabled close handler
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      errors={errors}
    >
      {renderStepContent()}
    </ModalLayout>
  );
};

export default CreatePatientModal;