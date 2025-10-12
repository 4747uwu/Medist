import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

// Import tab components
import PatientInfoTab from '../../../components/doctor/AppointmentDetails/PatientInfoTab';
import VitalsTab from '../../../components/doctor/AppointmentDetails/VitalsTab';
import ClinicalTab from '../../../components/doctor/AppointmentDetails/ClinicalTab';
import PrescriptionsTab from '../../../components/doctor/AppointmentDetails/PrescriptionsTab';
import HistoryTab from '../../../components/doctor/AppointmentDetails/HistoryTab';

const ShowAppointmentDetails = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('patient-info');

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching appointment details for:', appointmentId);
      const response = await apiClient.get(`/doctor/appointments/${appointmentId}/details`);
      
      if (response.data.success) {
        setAppointmentDetails(response.data.data);
        console.log('Appointment details loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      setError(error.response?.data?.message || 'Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'patient-info',
      name: 'Patient Info',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'blue'
    },
    {
      id: 'vitals',
      name: 'Vitals',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      color: 'red'
    },
    {
      id: 'clinical',
      name: 'Clinical Findings',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'purple'
    },
    {
      id: 'prescriptions',
      name: 'Prescriptions',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'green'
    },
    {
      id: 'history',
      name: 'Medical History',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'orange'
    }
  ];

  const getTabColorClasses = (color, isActive) => {
    const colors = {
      blue: {
        active: 'bg-blue-600 text-white border-blue-600',
        inactive: 'text-blue-600 hover:bg-blue-50 border-transparent'
      },
      red: {
        active: 'bg-red-600 text-white border-red-600',
        inactive: 'text-red-600 hover:bg-red-50 border-transparent'
      },
      purple: {
        active: 'bg-purple-600 text-white border-purple-600',
        inactive: 'text-purple-600 hover:bg-purple-50 border-transparent'
      },
      green: {
        active: 'bg-green-600 text-white border-green-600',
        inactive: 'text-green-600 hover:bg-green-50 border-transparent'
      },
      orange: {
        active: 'bg-orange-600 text-white border-orange-600',
        inactive: 'text-orange-600 hover:bg-orange-50 border-transparent'
      }
    };
    return colors[color][isActive ? 'active' : 'inactive'];
  };

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': 'bg-blue-100 text-blue-800 border-blue-300',
      'Confirmed': 'bg-green-100 text-green-800 border-green-300',
      'In-Progress': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'Cancelled': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Error Loading Details</h3>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={fetchAppointmentDetails}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!appointmentDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No appointment details found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { appointment, patient, vitals, clinical, prescriptions, history } = appointmentDetails;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Top Row - Back Button & Actions */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Back</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchAppointmentDetails}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                
                {appointment.status !== 'Completed' && user?.role === 'doctor' && (
                  <button
                    onClick={() => navigate(`/prescription/${appointment.patientId}?appointmentId=${appointment.appointmentId}`)}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-medium text-sm flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Prescription</span>
                  </button>
                )}
              </div>
            </div>

            {/* Appointment Header Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {patient.personalInfo?.fullName}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    <span className="font-mono">#{patient.patientId}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{appointment.formattedDate} • {appointment.formattedTime}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{appointment.labName}</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center space-x-4">
                <div className="text-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Age</p>
                  <p className="text-lg font-bold text-blue-900">{patient.age}</p>
                </div>
                <div className="text-center px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-600 mb-1">Blood Group</p>
                  <p className="text-lg font-bold text-purple-900">{patient.personalInfo?.bloodGroup || 'N/A'}</p>
                </div>
                <div className="text-center px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 mb-1">Prescriptions</p>
                  <p className="text-lg font-bold text-green-900">{prescriptions.count}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mt-6 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm whitespace-nowrap ${
                    getTabColorClasses(tab.color, activeTab === tab.id)
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === 'patient-info' && <PatientInfoTab patient={patient} />}
          {activeTab === 'vitals' && <VitalsTab vitals={vitals} />}
          {activeTab === 'clinical' && <ClinicalTab clinical={clinical} />}
          {activeTab === 'prescriptions' && <PrescriptionsTab prescriptions={prescriptions} />}
          {activeTab === 'history' && <HistoryTab history={history} />}
        </div>
      </div>
    </div>
  );
};

export default ShowAppointmentDetails;