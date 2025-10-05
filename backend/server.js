import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import assignerRoutes from './routes/assignerRoutes.js'
import patientRoutes from './routes/patientRoutes.js';
import clinicRoutes from './routes/clinicRoutes.js'; // NEW
import doctorRoutes from './routes/doctorRoutes.js';
// Import routes
import authRoutes from './routes/authRoutes.js';
import connectDB from './config/db.js';
import testRoutes from './routes/testRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js'
import patientEDITRoutes from './routes/patients.js';
import appointmentRoutes from './routes/appointmentRoutes.js'

dotenv.config();

const app = express();
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// // Database connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_system', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('MongoDB connected successfully'))
// .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assigner', assignerRoutes)
app.use('/api/patients', patientRoutes);
app.use('/api/clinic', clinicRoutes); // NEW
app.use('/api/doctor', doctorRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
// app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/medicines', medicineRoutes);

app.use('/api/patients', patientEDITRoutes);
app.use('/api/appointments', appointmentRoutes);




// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Medical System API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use( (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
