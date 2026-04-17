import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-white shadow px-6 py-4 flex justify-between items-center z-10">
      <h2 className="text-xl font-semibold text-gray-800">Resume Intel</h2>
      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {user.display_name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {user.display_name || user.full_name || user.email}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {user.role || 'Recruiter'}
              </div>
            </div>
          </div>
        )}
        <button 
          onClick={handleLogout}
          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200 shadow-sm"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
