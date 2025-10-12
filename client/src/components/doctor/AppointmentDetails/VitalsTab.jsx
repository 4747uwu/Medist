import React from 'react';

const VitalsTab = ({ vitals }) => {
  if (!vitals) return null;

  const vitalCards = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      label: 'Weight',
      value: vitals.weight,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-900',
      borderColor: 'border-blue-200'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
      label: 'Height',
      value: vitals.height,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-900',
      borderColor: 'border-purple-200'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: 'BMI',
      value: vitals.bmi,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-900',
      borderColor: 'border-green-200'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      ),
      label: 'Temperature',
      value: vitals.temperature,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-900',
      borderColor: 'border-orange-200'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      label: 'Blood Pressure',
      value: vitals.bloodPressure,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-900',
      borderColor: 'border-red-200'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      label: 'Heart Rate',
      value: vitals.heartRate,
      color: 'pink',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-900',
      borderColor: 'border-pink-200'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
      ),
      label: 'Oxygen Saturation',
      value: vitals.oxygenSaturation,
      color: 'cyan',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-900',
      borderColor: 'border-cyan-200'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      label: 'Blood Sugar',
      value: vitals.bloodSugar,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-900',
      borderColor: 'border-yellow-200'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {vitalCards.map((vital, index) => (
        <div
          key={index}
          className={`${vital.bgColor} rounded-lg border ${vital.borderColor} p-4 transition-all hover:shadow-md`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`${vital.textColor} opacity-70`}>
              {vital.icon}
            </div>
            <span className={`text-xs font-medium ${vital.textColor} opacity-60 uppercase tracking-wide`}>
              {vital.label}
            </span>
          </div>
          <p className={`text-2xl font-bold ${vital.textColor}`}>
            {vital.value}
          </p>
          {vital.value === 'Not recorded' && (
            <p className="text-xs text-gray-500 mt-1">No data available</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default VitalsTab;