import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Session = () => {
  const navigate = useNavigate();
  const { user, completeSession } = useAuth();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          completeSession();
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleContinue = () => {
    completeSession();
    navigate('/dashboard');
  };

  const userName = user?.first_name || user?.full_name || user?.email || 'User';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full border border-gray-100">
        <div className="flex flex-col items-center text-center">
          {/* Welcome Icon */}
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg mb-6">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-10 w-10 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>

          {/* Welcome Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome!
          </h1>
          
          {/* User Name */}
          <p className="text-xl text-blue-600 font-semibold mb-8">
            {userName}
          </p>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>Continue</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 7l5 5m0 0l-5 5m5-5H6" 
              />
            </svg>
          </button>

          {/* Auto-redirect countdown */}
          <p className="mt-4 text-sm text-gray-500">
            Redirecting to dashboard in {countdown} seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Session;
