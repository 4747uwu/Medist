import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import PhoneEntry from './CreatePatientModal/PhoneEntry';
import PersonalInfo from './CreatePatientModal/PersonalInfo';
import MedicalHistory from './CreatePatientModal/MedicalHistory';
import BasicAppointmentDetails from './CreatePatientModal/BasicAppointmentDetails';
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
    addDocument,
    removeDocument,
    updateDocument,
    convertFileToBase64
  } = usePatientForm();

  // ✅ NEW: Simplified slides for clinic workflow
  const slides = [
    {
      title: "Patient Registration",
      description: "Enter patient mobile number to begin",
      image: "📱",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Patient Details",
      description: "Enter basic patient information",
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
      title: "Schedule Appointment",
      description: "Book appointment slot",
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
          documents: [] // keep documents but we will skip documents step for existing patients
        });
        
        setPatientExists(true);
        // Directly go to appointment details for existing patients
        setStep('appointment');
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

  // ✅ SIMPLIFIED: Remove documents step, only basic appointment info
  const handleNext = () => {
    if (step === 'permanent' && !validatePersonalInfo()) return;
    
    // ✅ UPDATED: Simplified step order - no documents, no detailed vitals
    const stepOrder = ['phone', 'permanent', 'medical', 'appointment'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    // ✅ UPDATED: Simplified step order
    const stepOrder = ['phone', 'permanent', 'medical', 'appointment'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  // ✅ SIMPLIFIED: Basic appointment validation only
  const validateAppointmentBasics = () => {
    const newErrors = {};

    if (!formData.appointment?.date) {
      newErrors.appointmentDate = 'Appointment date is required';
    }

    if (!formData.appointment?.time) {
      newErrors.appointmentTime = 'Appointment time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('Submitting basic patient and appointment data...');
    
    if (!validateAppointmentBasics()) {
      console.log('Basic appointment validation failed:', errors);
      return;
    }

    setIsSubmitting(true);

    try {
      let patientResponse;

      // ✅ Create/update patient with basic info only
      if (!patientExists) {
        const patientPayload = {
          patientId: phoneNumber,
          personalInfo: formData.personalInfo,
          contactInfo: formData.contactInfo,
          emergencyContact: formData.emergencyContact,
          medicalHistory: formData.medicalHistory,
          photo: formData.photo
        };

        console.log('Creating new patient with basic info:', patientPayload);
        patientResponse = await apiClient.post('/patients', patientPayload);
      }

      // ✅ Create appointment with minimal required data
      const appointmentPayload = {
        scheduledDate: formData.appointment.date,
        scheduledTime: formData.appointment.time,
        mode: formData.appointment.mode || 'In-person',
        appointmentType: 'Consultation',
        duration: 30,
        doctorId: null, // No doctor assigned initially
        
        // ✅ MINIMAL: Only basic complaint if provided
        chiefComplaints: {
          primary: formData.appointment.complaints?.chief || '',
          duration: formData.appointment.complaints?.duration || '',
          severity: 'Moderate'
        },
        
        // ✅ EMPTY: No vitals, examination, or treatment initially
        vitals: {},
        examination: {},
        followUp: {},
        doctorNotes: ''
      };

      console.log('Creating basic appointment:', appointmentPayload);
      
      const appointmentResponse = await apiClient.post(
        `/patients/${phoneNumber}/appointments`,
        appointmentPayload
      );

      if (appointmentResponse.data.success) {
        resetForm();
        
        onSuccess && onSuccess({
          patient: patientResponse?.data?.data,
          appointment: appointmentResponse.data.data
        });
        onClose();
      }

    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to create patient/appointment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ UPDATED: Reset form to basic fields only
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
    
    // ✅ SIMPLIFIED: Basic form data only
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
      appointment: {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        mode: 'In-person',
        complaints: { chief: '', duration: '' }
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

  // ✅ UPDATED: Simplified step content rendering
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

      case 'appointment':
        return (
          <BasicAppointmentDetails
            formData={formData}
            patientExists={patientExists}
            handleInputChange={handleInputChange}
            appointmentModes={appointmentModes}
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