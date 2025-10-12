import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './modals/User.js';
import Lab from './modals/Lab.js';
import { Patient } from './modals/Patient.js';
import Appointment from './modals/Appointment.js';
import { TermsAndConditions, TermsAcceptance } from './modals/TermsAndConditions.js';

dotenv.config();

// Sample data arrays
const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Aadhya', 'Ananya', 'Anika', 'Avni', 'Diya', 'Ira', 'Kavya', 'Myra', 'Pihu', 'Saanvi',
  'Rahul', 'Rohit', 'Amit', 'Vijay', 'Suresh', 'Rajesh', 'Deepak', 'Ravi', 'Manoj', 'Sanjay',
  'Priya', 'Pooja', 'Kavita', 'Sunita', 'Meera', 'Rekha', 'Geeta', 'Seema', 'Neeta', 'Rita'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Agarwal', 'Jain', 'Bansal', 'Arora', 'Malhotra', 'Khanna', 'Chopra',
  'Singh', 'Kumar', 'Patel', 'Shah', 'Mehta', 'Gandhi', 'Joshi', 'Desai', 'Thakkar', 'Pandya',
  'Reddy', 'Rao', 'Nair', 'Pillai', 'Menon', 'Iyer', 'Krishnan', 'Subramanian', 'Venkatesh', 'Raman'
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
];

const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 
  'ENT', 'Gynecology', 'Neurology', 'Gastroenterology', 'Psychiatry'
];

const CHRONIC_CONDITIONS = [
  'Diabetes Type 2', 'Hypertension', 'Asthma', 'Arthritis', 'Heart Disease',
  'Thyroid Disorder', 'COPD', 'Kidney Disease', 'Liver Disease', 'Depression'
];

const CHIEF_COMPLAINTS = [
  'Fever and body ache', 'Chest pain', 'Shortness of breath', 'Headache', 'Stomach pain',
  'Joint pain', 'Skin rash', 'Cough and cold', 'Dizziness', 'Back pain',
  'Anxiety', 'Sleep problems', 'Digestive issues', 'High blood pressure', 'Diabetes management'
];

// Utility functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomPhone = () => '9' + Math.floor(Math.random() * 900000000 + 100000000).toString();
const getRandomEmail = (name) => `${name.toLowerCase().replace(' ', '.')}${Math.floor(Math.random() * 1000)}@example.com`;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const getRandomAge = () => Math.floor(Math.random() * 60) + 20; // 20-80 years
const getRandomBloodGroup = () => getRandomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

// Generate realistic vitals
const generateVitals = () => ({
  weight: { value: Math.floor(Math.random() * 40) + 50, unit: 'kg' }, // 50-90 kg
  height: { value: Math.floor(Math.random() * 30) + 150, unit: 'cm' }, // 150-180 cm
  temperature: { value: (Math.random() * 2 + 97).toFixed(1), unit: '°F' }, // 97-99°F
  bloodPressure: {
    systolic: Math.floor(Math.random() * 40) + 110, // 110-150
    diastolic: Math.floor(Math.random() * 20) + 70   // 70-90
  },
  heartRate: { value: Math.floor(Math.random() * 30) + 60, unit: 'bpm' }, // 60-90 bpm
  oxygenSaturation: { value: Math.floor(Math.random() * 5) + 95, unit: '%' }, // 95-100%
  bloodSugar: {
    value: Math.floor(Math.random() * 100) + 80, // 80-180 mg/dL
    type: getRandomElement(['Fasting', 'Random', 'Post-meal']),
    unit: 'mg/dL'
  }
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTermsAndConditions = async () => {
  console.log('📋 Creating Terms & Conditions...');
  
  try {
    // Check if terms already exist
    const existingTerms = await TermsAndConditions.findOne({ isActive: true });
    if (existingTerms) {
      console.log('✅ Terms & Conditions already exist');
      return existingTerms;
    }

    const terms = await TermsAndConditions.create({
      version: '1.0',
      effectiveDate: new Date(),
      isActive: true,
      content: {
        eligibility: 'Doctors must hold a valid medical degree from a recognized institution.',
        platformServices: 'The app provides telemedicine services, including secure video consultations.',
        revenuePayments: 'Revenue sharing between doctors and the platform will be determined by mutual agreement.',
        professionalResponsibilities: 'Doctors are solely responsible for all medical advice and treatment decisions.',
        liabilityIndemnity: 'Doctors fully accept responsibility for all consultations performed via the platform.',
        legalCompliance: 'All users agree to comply with medical council regulations and telemedicine laws.',
        termination: 'Either party may terminate this agreement with 30 days written notice.',
        automaticAcceptance: 'Continued use of the app implies automatic acceptance of revised terms.',
        finalConfirmation: 'By proceeding, you confirm understanding and acceptance of all terms.'
      },
      privacyPolicy: {
        dataCollection: 'The app collects user data such as name, contact details, and medical records.',
        dataUsage: 'Collected data is used to facilitate consultations and improve services.',
        dataPrivacy: 'All patient information is treated as strictly confidential.',
        dataProtection: 'The platform complies with applicable data protection laws.',
        dataRetention: 'Data is retained only as long as necessary for medical and legal purposes.',
        thirdPartyAccess: 'Limited data may be shared with authorized third-party services.',
        securityMeasures: 'All data transfers are encrypted and stored on secure servers.',
        consentAcknowledgment: 'By using this app, you consent to data collection and processing.'
      }
    });

    console.log('✅ Terms & Conditions created');
    return terms;
  } catch (error) {
    console.error('❌ Error creating terms:', error);
    throw error;
  }
};

const createLabsAndJrDoctors = async (terms) => {
  console.log('🏥 Creating Labs and Jr Doctors...');
  
  const labs = [];
  const jrDoctors = [];

  const labData = [
    { name: 'Star Medical Center', city: 'Mumbai', email: 'star1@gmail.com' },
    { name: 'Galaxy Health Clinic', city: 'Delhi', email: 'star2@gmail.com' },
    { name: 'Apollo Diagnostics', city: 'Bangalore', email: 'star3@gmail.com' },
    { name: 'Metro Health Center', city: 'Chennai', email: 'star4@gmail.com' },
    { name: 'City Care Hospital', city: 'Pune', email: 'star5@gmail.com' }
  ];

  for (let i = 0; i < 5; i++) {
    const labInfo = labData[i];
    const labId = `LAB${String(i + 1).padStart(3, '0')}`;

    // Create Lab
    const lab = await Lab.create({
      labId,
      labName: labInfo.name,
      registrationDetails: {
        registrationNumber: `REG${labId}${Math.floor(Math.random() * 1000)}`,
        registrationDate: getRandomDate(new Date(2020, 0, 1), new Date(2023, 11, 31)),
        issuedBy: 'Medical Council of India'
      },
      contactInfo: {
        address: {
          street: `${Math.floor(Math.random() * 500) + 1} Medical Street`,
          city: labInfo.city,
          state: getRandomElement(['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat']),
          pincode: String(Math.floor(Math.random() * 900000) + 100000),
          country: 'India'
        },
        phone: {
          primary: getRandomPhone(),
          secondary: getRandomPhone()
        },
        email: {
          primary: labInfo.email,
          secondary: `info@${labInfo.name.toLowerCase().replace(/\s+/g, '')}.com`
        }
      },
      operationalDetails: {
        operatingHours: {
          monday: { isOpen: true, open: '09:00', close: '18:00' },
          tuesday: { isOpen: true, open: '09:00', close: '18:00' },
          wednesday: { isOpen: true, open: '09:00', close: '18:00' },
          thursday: { isOpen: true, open: '09:00', close: '18:00' },
          friday: { isOpen: true, open: '09:00', close: '18:00' },
          saturday: { isOpen: true, open: '09:00', close: '14:00' },
          sunday: { isOpen: false, open: '', close: '' }
        },
        capacity: {
          patientsPerDay: Math.floor(Math.random() * 100) + 50,
          doctorsCount: Math.floor(Math.random() * 5) + 2,
          bedsCount: Math.floor(Math.random() * 20) + 10
        }
      },
      isActive: true
    });

    labs.push(lab);

    // Create Jr Doctor for this lab
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    
    const jrDoctor = await User.create({
      email: `jrdoctor${i + 1}@gmail.com`,
      password: 'password123', // Will be hashed by schema
      role: 'jrdoctor',
      profile: {
        firstName,
        lastName,
        phone: getRandomPhone()
      },
      doctorDetails: {
        specialization: getRandomElement(SPECIALIZATIONS),
        qualification: getRandomElement(['MBBS', 'MBBS, MD', 'MBBS, MS', 'BDS', 'BAMS']),
        experience: Math.floor(Math.random() * 5) + 1,
        registrationNumber: `JR${Math.floor(Math.random() * 100000)}`,
        consultationFee: Math.floor(Math.random() * 300) + 200,
        registrationDate: new Date(),
        isVerified: true,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableHours: { start: '09:00', end: '17:00' }
      },
      clinicDetails: {
        labId: lab.labId,
        clinicName: lab.labName
      },
      isActive: true,
      registrationComplete: true
    });

    // Create terms acceptance for jr doctor
    await TermsAcceptance.create({
      userId: jrDoctor._id,
      doctorId: jrDoctor._id.toString(),
      termsVersion: terms.version,
      termsId: terms._id,
      acceptedAt: new Date(),
      acknowledgments: {
        readAndUnderstood: true,
        acceptsFullResponsibility: true,
        authorizesVerification: true,
        understandsBindingNature: true
      },
      doctorInfo: {
        doctorId: jrDoctor._id.toString(),
        mongoId: jrDoctor._id,
        name: `Dr. ${firstName} ${lastName}`,
        email: jrDoctor.email,
        specialization: jrDoctor.doctorDetails.specialization,
        registrationNumber: jrDoctor.doctorDetails.registrationNumber
      }
    });

    jrDoctors.push(jrDoctor);
    console.log(`✅ Created Lab: ${lab.labName} with Jr Doctor: ${firstName} ${lastName}`);
  }

  return { labs, jrDoctors };
};

const createDoctors = async (terms) => {
  console.log('👨‍⚕️ Creating Main Doctors...');
  
  const doctors = [];
  
  for (let i = 1; i <= 3; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    
    const doctor = await User.create({
      email: `ujjwal${i}@gmail.com`,
      password: 'password123', // Will be hashed by schema
      role: 'doctor',
      profile: {
        firstName,
        lastName,
        phone: getRandomPhone()
      },
      doctorDetails: {
        specialization: getRandomElement(SPECIALIZATIONS),
        qualification: getRandomElement(['MBBS, MD', 'MBBS, MS', 'MBBS, DNB', 'MBBS, DM']),
        experience: Math.floor(Math.random() * 15) + 5,
        registrationNumber: `DOC${Math.floor(Math.random() * 100000)}`,
        consultationFee: Math.floor(Math.random() * 500) + 500,
        registrationDate: new Date(),
        isVerified: true,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        availableHours: { start: '10:00', end: '18:00' }
      },
      isActive: true,
      registrationComplete: true
    });

    // Create terms acceptance for doctor
    await TermsAcceptance.create({
      userId: doctor._id,
      doctorId: doctor._id.toString(),
      termsVersion: terms.version,
      termsId: terms._id,
      acceptedAt: new Date(),
      acknowledgments: {
        readAndUnderstood: true,
        acceptsFullResponsibility: true,
        authorizesVerification: true,
        understandsBindingNature: true
      },
      doctorInfo: {
        doctorId: doctor._id.toString(),
        mongoId: doctor._id,
        name: `Dr. ${firstName} ${lastName}`,
        email: doctor.email,
        specialization: doctor.doctorDetails.specialization,
        registrationNumber: doctor.doctorDetails.registrationNumber
      }
    });

    doctors.push(doctor);
    console.log(`✅ Created Doctor: ${firstName} ${lastName}`);
  }

  return doctors;
};

const createPatients = async (labs) => {
  console.log('👥 Creating Patients...');
  
  const patients = [];
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  for (let i = 0; i < 1000; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    const age = getRandomAge();
    const dateOfBirth = new Date();
    dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);
    
    const phone = getRandomPhone();
    const lab = getRandomElement(labs);
    
    // Random registration date within the week
    const registrationDate = getRandomDate(oneWeekAgo, new Date());
    
    const patient = await Patient.create({
      patientId: phone,
      labId: lab.labId,
      registrationDate,
      status: getRandomElement(['Active', 'Active', 'Active', 'Inactive']), // 75% active
      personalInfo: {
        fullName: `${firstName} ${lastName}`,
        dateOfBirth,
        age,
        gender: getRandomElement(['Male', 'Female']),
        bloodGroup: getRandomBloodGroup()
      },
      contactInfo: {
        phone,
        email: getRandomEmail(`${firstName} ${lastName}`),
        address: {
          street: `${Math.floor(Math.random() * 500) + 1} ${getRandomElement(['MG Road', 'Main Street', 'Park Avenue', 'Gandhi Road'])}`,
          city: getRandomElement(CITIES),
          state: getRandomElement(['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat']),
          pincode: String(Math.floor(Math.random() * 900000) + 100000),
          country: 'India'
        }
      },
      emergencyContact: {
        name: `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`,
        relationship: getRandomElement(['Spouse', 'Parent', 'Sibling', 'Child']),
        phone: getRandomPhone()
      },
      medicalHistory: {
        chronicConditions: Math.random() > 0.7 ? [{
          condition: getRandomElement(CHRONIC_CONDITIONS),
          diagnosedDate: getRandomDate(new Date(2020, 0, 1), new Date()),
          severity: getRandomElement(['Mild', 'Moderate', 'Severe'])
        }] : [],
        allergies: Math.random() > 0.8 ? [{
          allergen: getRandomElement(['Peanuts', 'Dust', 'Pollen', 'Medication']),
          reaction: getRandomElement(['Rash', 'Swelling', 'Breathing difficulty']),
          severity: getRandomElement(['Mild', 'Moderate', 'Severe'])
        }] : []
      },
      workflowStatus: 'New'
    });

    patients.push(patient);
    
    if ((i + 1) % 100 === 0) {
      console.log(`✅ Created ${i + 1} patients...`);
    }
  }

  console.log(`✅ Created ${patients.length} patients total`);
  return patients;
};

const createAppointments = async (patients, doctors, jrDoctors, labs) => {
  console.log('📅 Creating Appointments...');
  
  const allDoctors = [...doctors, ...jrDoctors];
  const appointments = [];
  
  // Create appointments for 70% of patients
  const patientsWithAppointments = patients.slice(0, Math.floor(patients.length * 0.7));
  
  for (let i = 0; i < patientsWithAppointments.length; i++) {
    const patient = patientsWithAppointments[i];
    const doctor = getRandomElement(allDoctors);
    const lab = labs.find(l => l.labId === patient.labId);
    
    // Random appointment date within the week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const appointmentDate = getRandomDate(oneWeekAgo, new Date());
    
    // Random appointment time during working hours
    const hours = Math.floor(Math.random() * 8) + 10; // 10 AM to 6 PM
    const minutes = getRandomElement(['00', '15', '30', '45']);
    const appointmentTime = `${String(hours).padStart(2, '0')}:${minutes}`;
    
    const appointment = await Appointment.create({
      patientId: patient.patientId,
      doctorId: doctor._id,
      labId: patient.labId,
      scheduledDate: appointmentDate,
      scheduledTime: appointmentTime,
      duration: getRandomElement([15, 30, 45, 60]),
      appointmentType: getRandomElement(['Consultation', 'Follow-up', 'Check-up', 'Emergency']),
      mode: getRandomElement(['In-person', 'Video Call', 'Phone Call']),
      status: getRandomElement(['Scheduled', 'Completed', 'In-Progress', 'Cancelled']),
      chiefComplaints: {
        primary: getRandomElement(CHIEF_COMPLAINTS),
        duration: getRandomElement(['1 day', '2-3 days', '1 week', '2 weeks', '1 month']),
        severity: getRandomElement(['Mild', 'Moderate', 'Severe'])
      },
      vitals: generateVitals(),
      examination: {
        physicalFindings: 'Patient appears comfortable, vitals stable',
        provisionalDiagnosis: getRandomElement([
          'Upper respiratory tract infection',
          'Hypertension',
          'Diabetes management',
          'Gastritis',
          'Musculoskeletal pain',
          'Anxiety disorder',
          'Skin allergy',
          'Fever of unknown origin'
        ])
      },
      createdBy: doctor._id,
      assignedAt: appointmentDate,
      assignedBy: doctor._id,
      workflowPhase: getRandomElement(['registered', 'assigned', 'in-assessment', 'diagnosed', 'completed'])
    });

    // Update patient with appointment reference
    await patient.addAppointment({
      appointmentId: appointment.appointmentId,
      _id: appointment._id,
      doctorId: doctor._id,
      doctorName: `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}`,
      scheduledDate: appointmentDate,
      scheduledTime: appointmentTime,
      status: appointment.status,
      appointmentType: appointment.appointmentType
    });

    appointments.push(appointment);
    
    if ((i + 1) % 100 === 0) {
      console.log(`✅ Created ${i + 1} appointments...`);
    }
  }

  console.log(`✅ Created ${appointments.length} appointments total`);
  return appointments;
};

const createAssigner = async () => {
  console.log('👔 Creating Assigner...');
  
  const assigner = await User.create({
    email: 'assigner@gmail.com',
    password: 'password123', // Will be hashed by schema
    role: 'assigner',
    profile: {
      firstName: 'Admin',
      lastName: 'Assigner',
      phone: getRandomPhone()
    },
    assignerDetails: {
      department: 'Healthcare Administration',
      registrationDate: new Date(),
      permissions: ['assign_tasks', 'view_reports', 'manage_doctors', 'manage_labs']
    },
    isActive: true,
    registrationComplete: true
  });

  console.log('✅ Created Assigner');
  return assigner;
};

const clearDatabase = async () => {
  console.log('🗑️ Clearing existing data...');
  
  await Promise.all([
    User.deleteMany({}),
    Lab.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({}),
    TermsAndConditions.deleteMany({}),
    TermsAcceptance.deleteMany({})
  ]);
  
  console.log('✅ Database cleared');
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    await clearDatabase();
    
    // Create terms and conditions
    const terms = await createTermsAndConditions();
    
    // Create labs and jr doctors
    const { labs, jrDoctors } = await createLabsAndJrDoctors(terms);
    
    // Create main doctors
    const doctors = await createDoctors(terms);
    
    // Create assigner
    const assigner = await createAssigner();
    
    // Create patients
    const patients = await createPatients(labs);
    
    // Create appointments
    const appointments = await createAppointments(patients, doctors, jrDoctors, labs);
    
    console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('\n📊 SUMMARY:');
    console.log(`   • Terms & Conditions: 1`);
    console.log(`   • Labs: ${labs.length}`);
    console.log(`   • Jr Doctors: ${jrDoctors.length}`);
    console.log(`   • Main Doctors: ${doctors.length}`);
    console.log(`   • Assigner: 1`);
    console.log(`   • Patients: ${patients.length}`);
    console.log(`   • Appointments: ${appointments.length}`);
    
    console.log('\n📧 LOGIN CREDENTIALS:');
    console.log('   MAIN DOCTORS:');
    for (let i = 1; i <= 3; i++) {
      console.log(`     • ujjwal${i}@gmail.com / password123`);
    }
    console.log('\n   JR DOCTORS:');
    for (let i = 1; i <= 5; i++) {
      console.log(`     • jrdoctor${i}@gmail.com / password123`);
    }
    console.log('\n   LAB EMAILS:');
    for (let i = 1; i <= 5; i++) {
      console.log(`     • star${i}@gmail.com / password123`);
    }
    console.log('\n   ASSIGNER:');
    console.log('     • assigner@gmail.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding
seedDatabase();