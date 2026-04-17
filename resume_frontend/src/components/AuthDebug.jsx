import React from 'react';
import { useAuth } from '../context/AuthContext';

// Debug component to view AuthContext state
const AuthDebug = () => {
  const { user, loading, refreshUserProfile } = useAuth();
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-sm opacity-75 hover:opacity-100 z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>User: {user ? 'Present' : 'Null'}</p>
        {user && (
          <>
            <p>ID: {user.id}</p>
            <p>Email: {user.email}</p>
            <p>Name: {user.display_name}</p>
            <p>Role: {user.role}</p>
          </>
        )}
      </div>
      <button 
        onClick={refreshUserProfile}
        className="mt-2 px-2 py-1 bg-blue-600 rounded text-white text-xs w-full"
      >
        Refresh Profile
      </button>
    </div>
  );
};

export default AuthDebug;