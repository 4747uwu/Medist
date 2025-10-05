import { useState } from 'react';

export const usePatientForm = () => {
  const [step, setStep] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [checkingPatient, setCheckingPatient] = useState(false);
  const [patientExists, setPatientExists] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Permanent Details
    personalInfo: {
      fullName: '',
      dateOfBirth: '',
      age: '',
      gender: '',
      bloodGroup: '',
      height: {
        value: '',
        unit: 'cm'
      }
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

    // NEW: Documents field
    documents: [],

    // Appointment Details
    appointment: {
      // Basic appointment info
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      mode: 'In-person',
      type: 'Consultation',
      duration: 30,
      doctorId: '',
      doctorName: '',
      specialization: '',
      
      // Medical data for the appointment
      vitals: {
        weight: { value: '', unit: 'kg' },
        temperature: { value: '', unit: '°F' },
        bloodPressure: { systolic: '', diastolic: '' },
        heartRate: { value: '', unit: 'bpm' },
        oxygenSaturation: { value: '', unit: '%' },
        bloodSugar: { value: '', type: 'Random', unit: 'mg/dL' }
      },
      
      complaints: {
        chief: '',
        duration: '',
        severity: 'Moderate',
        pastHistoryRelevant: ''
      },
      
      examination: {
        physicalFindings: '',
        provisionalDiagnosis: '',
        differentialDiagnosis: []
      },
      
      investigations: {
        testsRecommended: [],
        pastReportsReviewed: []
      },
      
      treatment: {
        medicines: [],
        lifestyleAdvice: '',
        dietSuggestions: ''
      },
      
      followUp: {
        nextAppointmentDate: '',
        instructions: '',
        notes: ''
      },
      
      doctorNotes: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newSurgery, setNewSurgery] = useState({ surgery: '', date: '' });
  const [newTest, setNewTest] = useState({ testName: '', urgency: 'Routine' });
  const [newMedicine, setNewMedicine] = useState({ medicineName: '', dosage: '', duration: '' });

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

  // Handle input changes
  const handleInputChange = (section, field, value, nested = null, subField = null) => {
    console.log('handleInputChange called:', { section, field, value, nested, subField });
    
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
  };

  // NEW: Document handling functions
  const addDocument = (documentData) => {
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, documentData]
    }));
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const updateDocument = (index, documentData) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) => 
        i === index ? { ...doc, ...documentData } : doc
      )
    }));
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Medical History handlers (unchanged)
  const addChronicCondition = () => {
    if (newCondition.trim()) {
      setFormData({
        ...formData,
        medicalHistory: {
          ...formData.medicalHistory,
          chronicConditions: [
            ...formData.medicalHistory.chronicConditions,
            { condition: newCondition, diagnosedDate: new Date(), severity: 'Moderate' }
          ]
        }
      });
      setNewCondition('');
    }
  };

  const removeChronicCondition = (index) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        chronicConditions: formData.medicalHistory.chronicConditions.filter((_, i) => i !== index)
      }
    });
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setFormData({
        ...formData,
        medicalHistory: {
          ...formData.medicalHistory,
          allergies: [
            ...formData.medicalHistory.allergies,
            { allergen: newAllergy, severity: 'Mild', reaction: '' }
          ]
        }
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (index) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        allergies: formData.medicalHistory.allergies.filter((_, i) => i !== index)
      }
    });
  };

  const addSurgery = () => {
    if (newSurgery.surgery.trim() && newSurgery.date) {
      setFormData({
        ...formData,
        medicalHistory: {
          ...formData.medicalHistory,
          pastSurgeries: [
            ...formData.medicalHistory.pastSurgeries,
            newSurgery
          ]
        }
      });
      setNewSurgery({ surgery: '', date: '' });
    }
  };

  const removeSurgery = (index) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        pastSurgeries: formData.medicalHistory.pastSurgeries.filter((_, i) => i !== index)
      }
    });
  };

  // Appointment handlers
  const addTest = () => {
    if (newTest.testName.trim()) {
      setFormData({
        ...formData,
        appointment: {
          ...formData.appointment,
          investigations: {
            ...formData.appointment.investigations,
            testsRecommended: [
              ...formData.appointment.investigations.testsRecommended,
              newTest
            ]
          }
        }
      });
      setNewTest({ testName: '', urgency: 'Routine' });
    }
  };

  const removeTest = (index) => {
    setFormData({
      ...formData,
      appointment: {
        ...formData.appointment,
        investigations: {
          ...formData.appointment.investigations,
          testsRecommended: formData.appointment.investigations.testsRecommended.filter((_, i) => i !== index)
        }
      }
    });
  };

  const addMedicine = () => {
    if (newMedicine.medicineName.trim()) {
      setFormData({
        ...formData,
        appointment: {
          ...formData.appointment,
          treatment: {
            ...formData.appointment.treatment,
            medicines: [
              ...formData.appointment.treatment.medicines,
              newMedicine
            ]
          }
        }
      });
      setNewMedicine({ medicineName: '', dosage: '', duration: '' });
    }
  };

  const removeMedicine = (index) => {
    setFormData({
      ...formData,
      appointment: {
        ...formData.appointment,
        treatment: {
          ...formData.appointment.treatment,
          medicines: formData.appointment.treatment.medicines.filter((_, i) => i !== index)
        }
      }
    });
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

  // Validate appointment details
  const validateAppointmentDetails = () => {
    const newErrors = {};
    
    if (!formData.appointment.complaints.chief) newErrors.complaints = 'Chief complaints are required';
    if (!formData.appointment.examination.provisionalDiagnosis) newErrors.diagnosis = 'Provisional diagnosis is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // KEEP BOTH for backward compatibility
  const validateVisitDetails = validateAppointmentDetails;

  // 🔥 ADD: Reset function
  const resetForm = () => {
    setStep('phone');
    setPhoneNumber('');
    setCheckingPatient(false);
    setPatientExists(false);
    setIsSubmitting(false);
    setErrors({});
    setNewCondition('');
    setNewAllergy('');
    setNewSurgery({ surgery: '', date: '' });
    setNewTest({ testName: '', urgency: 'Routine' });
    setNewMedicine({ medicineName: '', dosage: '', duration: '' });
    
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

  return {
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
    validateVisitDetails,
    calculateAge,
    // NEW: Document functions
    addDocument,
    removeDocument,
    updateDocument,
    convertFileToBase64,
    resetForm // 🔥 ADD: Export the reset function
  };
};