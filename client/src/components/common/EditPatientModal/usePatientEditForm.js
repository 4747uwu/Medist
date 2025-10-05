import { useState } from 'react';

export const usePatientEditForm = () => {
  const [step, setStep] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
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
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      }
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    medicalHistory: {
      chronicConditions: [],
      allergies: [],
      pastSurgeries: [],
      familyHistory: []
    },
    photo: null,
    currentVisit: null
  });

  // Medical history state
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newSurgery, setNewSurgery] = useState({ surgery: '', date: '' });

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return '';
    
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Handle input changes with nested support
  const handleInputChange = (section, field, value, nested = null, subField = null) => {
    setFormData(prevFormData => {
      if (section === 'root') {
        return { ...prevFormData, [field]: value };
      } else if (subField) {
        return {
          ...prevFormData,
          [section]: {
            ...prevFormData[section],
            [field]: {
              ...prevFormData[section][field],
              [nested]: {
                ...prevFormData[section][field][nested],
                [subField]: value
              }
            }
          }
        };
      } else if (nested) {
        return {
          ...prevFormData,
          [section]: {
            ...prevFormData[section],
            [field]: {
              ...prevFormData[section][field],
              [nested]: value
            }
          }
        };
      } else {
        return {
          ...prevFormData,
          [section]: {
            ...prevFormData[section],
            [field]: value
          }
        };
      }
    });

    // Calculate age when date of birth changes
    if (section === 'personalInfo' && field === 'dateOfBirth') {
      const age = calculateAge(value);
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          age: age.toString()
        }
      }));
    }
  };

  // Medical History handlers
  const addChronicCondition = () => {
    if (newCondition.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          chronicConditions: [
            ...prev.medicalHistory.chronicConditions,
            { condition: newCondition, diagnosedDate: new Date(), severity: 'Moderate' }
          ]
        }
      }));
      setNewCondition('');
    }
  };

  const removeChronicCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        chronicConditions: prev.medicalHistory.chronicConditions.filter((_, i) => i !== index)
      }
    }));
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          allergies: [
            ...prev.medicalHistory.allergies,
            { allergen: newAllergy, severity: 'Mild', reaction: '' }
          ]
        }
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        allergies: prev.medicalHistory.allergies.filter((_, i) => i !== index)
      }
    }));
  };

  const addSurgery = () => {
    if (newSurgery.surgery.trim() && newSurgery.date) {
      setFormData(prev => ({
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          pastSurgeries: [
            ...prev.medicalHistory.pastSurgeries,
            newSurgery
          ]
        }
      }));
      setNewSurgery({ surgery: '', date: '' });
    }
  };

  const removeSurgery = (index) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        pastSurgeries: prev.medicalHistory.pastSurgeries.filter((_, i) => i !== index)
      }
    }));
  };

  // Validation functions
  const validatePersonalInfo = () => {
    const newErrors = {};
    
    if (!formData.personalInfo.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.personalInfo.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.personalInfo.gender) newErrors.gender = 'Gender is required';
    if (!formData.contactInfo.address.street) newErrors.street = 'Street address is required';
    if (!formData.contactInfo.address.city) newErrors.city = 'City is required';
    if (!formData.contactInfo.address.state) newErrors.state = 'State is required';
    if (!formData.contactInfo.address.pincode) newErrors.pincode = 'Pincode is required';
    if (!formData.emergencyContact.name) newErrors.emergencyName = 'Emergency contact name is required';
    if (!formData.emergencyContact.relationship) newErrors.emergencyRelationship = 'Emergency contact relationship is required';
    if (!formData.emergencyContact.phone) newErrors.emergencyPhone = 'Emergency phone is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateVisitDetails = () => {
    const newErrors = {};
    
    // Only validate if there's a current visit
    if (formData.currentVisit) {
      if (!formData.currentVisit.complaints?.chief) {
        newErrors.complaints = 'Chief complaints are required';
      }
      if (!formData.currentVisit.examination?.provisionalDiagnosis) {
        newErrors.diagnosis = 'Provisional diagnosis is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
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
  };
};