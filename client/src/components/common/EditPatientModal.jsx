import React, { useEffect } from 'react';
import { apiClient } from '../../services/api';
import ModalLayout from '../assigner/CreatePatientModal/ModalLayout';
import PersonalInfo from './EditPatientModal/PersonalInfo';
import MedicalHistory from './EditPatientModal/MedicalHistory';
import VisitDetails from './EditPatientModal/VisitDetails';
import { usePatientEditForm } from './EditPatientModal/usePatientEditForm';

const EditPatientModal = ({ isOpen, onClose, patientId, onSuccess }) => {
  const {
    step,
    setStep,
    loading,
    setLoading,
    isSubmitting,
    setIsSubmitting,
    formData,
    setFormData,
    originalData,
    setOriginalData,
    errors,
    setErrors,
    newCondition,
    setNewCondition,
    newAllergy,
    setNewAllergy,
    newSurgery,
    setNewSurgery,
    handleInputChange,
    addChronicCondition,
    removeChronicCondition,
    addAllergy,
    removeAllergy,
    addSurgery,
    removeSurgery,
    validatePersonalInfo,
    validateVisitDetails,
    calculateAge
  } = usePatientEditForm();

  const slides = [
    {
      title: "Edit Patient Details",
      description: "Update patient information and medical records",
      image: "👤",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Medical History",
      description: "Update chronic conditions and allergies",
      image: "📋",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Current Visit",
      description: "Update current visit details",
      image: "🩺",
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

  // Fetch patient data when modal opens
  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientData();
    }
  }, [isOpen, patientId]);

  const fetchPatientData = async () => {
    setLoading(true);
    setErrors({});

    try {
      const response = await apiClient.get(`/patients/${patientId}/edit`);
      
      if (response.data.success) {
        const { patient, currentVisit } = response.data.data;
        
        // Format date for input
        const formattedDateOfBirth = patient.personalInfo.dateOfBirth 
          ? new Date(patient.personalInfo.dateOfBirth).toISOString().split('T')[0] 
          : '';

        const patientData = {
          personalInfo: {
            ...patient.personalInfo,
            dateOfBirth: formattedDateOfBirth
          },
          contactInfo: patient.contactInfo,
          emergencyContact: patient.emergencyContact,
          medicalHistory: patient.medicalHistory || {
            chronicConditions: [],
            allergies: [],
            pastSurgeries: [],
            familyHistory: []
          },
          photo: patient.photo,
          currentVisit: currentVisit
        };

        setFormData(patientData);
        setOriginalData(patientData);
        
        // Set initial step based on whether there's a current visit
        setStep(currentVisit ? 'personal' : 'personal');
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setErrors({ fetch: 'Failed to load patient data' });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 'personal' && !validatePersonalInfo()) return;
    
    const stepOrder = ['personal', 'medical', 'visit'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder = ['personal', 'medical', 'visit'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      // Update patient details
      const patientPayload = {
        personalInfo: formData.personalInfo,
        contactInfo: formData.contactInfo,
        emergencyContact: formData.emergencyContact,
        medicalHistory: formData.medicalHistory,
        photo: formData.photo
      };

      const patientResponse = await apiClient.put(`/patients/${patientId}/edit`, patientPayload);

      // Update current visit if exists and has changes
      if (formData.currentVisit && originalData.currentVisit) {
        const visitResponse = await apiClient.put(
          `/patients/${patientId}/visit/${formData.currentVisit.visitId}`,
          formData.currentVisit
        );
      }

      if (patientResponse.data.success) {
        onSuccess && onSuccess(patientResponse.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to update patient details' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentSlide = slides.find(slide => slide.color.includes(
    step === 'personal' ? 'blue' :
    step === 'medical' ? 'purple' : 'indigo'
  )) || slides[0];

  const renderStepContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading patient data...</p>
          </div>
        </div>
      );
    }

    if (errors.fetch) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600">{errors.fetch}</p>
            <button 
              onClick={fetchPatientData}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    switch (step) {
      case 'personal':
        return (
          <PersonalInfo
            formData={formData}
            phoneNumber={formData.contactInfo.phone}
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

      case 'visit':
        return (
          <VisitDetails
            formData={formData}
            handleInputChange={handleInputChange}
            errors={errors}
            patientExists={true}
            appointmentModes={['In-Person', 'Video Call', 'Phone Call']}
            newTest={{ testName: '', urgency: 'Routine' }}
            setNewTest={() => {}}
            addTest={() => {}}
            removeTest={() => {}}
            newMedicine={{ medicineName: '', dosage: '', duration: '' }}
            setNewMedicine={() => {}}
            addMedicine={() => {}}
            removeMedicine={() => {}}
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
      patientExists={true}
      onClose={onClose}
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

export default EditPatientModal;