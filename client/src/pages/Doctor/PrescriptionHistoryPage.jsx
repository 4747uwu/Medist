import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import PrescriptionHistory from '../../components/doctor/PrescriptionHistory';

const PrescriptionHistoryPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Prescription History</h1>
          <button
            onClick={() => navigate('/doctor-dashboard')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        <PrescriptionHistory patientId={patientId} />
      </div>
    </div>
  );
};

export default PrescriptionHistoryPage;