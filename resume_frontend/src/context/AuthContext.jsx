import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { clearAllSessionState } from '../hooks/useSessionState';
import { decodeJWT } from '../utils/auth';
import { inferRoleFromEmail, computeDisplayName } from '../utils/user';

const AuthContext = createContext(null);

// JWT decoding moved to utils/auth.js for reusability

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sidebar state moved to UIContext.jsx to avoid unnecessary re-renders

  const getActiveStorage = () => {
    // Prefer whichever storage currently holds the token
    try {
      if (localStorage.getItem('token')) return localStorage;
      if (sessionStorage.getItem('token')) return sessionStorage;
    } catch {
      // ignore storage errors
    }
    return localStorage;
  };

  const updateUser = (partial, updateFromToken = false) => {
    setUser((prev) => {
      let merged = {
        ...(prev || {}),
        ...(partial || {}),
      };

      try {
        const storage = getActiveStorage();
        
        // If updateFromToken is true, re-decode the JWT to get fresh claims
        if (updateFromToken) {
          const token = storage.getItem('token');
          if (token) {
            const tokenData = decodeJWT(token);
            if (tokenData) {
              merged.role = tokenData.role ?? merged.role;
            }
          }
        }
        
        merged.display_name = merged.display_name || computeDisplayName(merged);
        storage.setItem('user', JSON.stringify(merged));
        if (merged.role) storage.setItem('role', merged.role);
      } catch {
        // ignore storage errors
      }

      return merged;
    });
  };

   const login = async (userData, token, remember = true, refreshToken = null) => {
    // Force admin role if email is listed in VITE_ADMIN_EMAILS, even if backend role says recruiter.
    // This matches the "Assign role based on email" requirement.
    const inferredRole = inferRoleFromEmail(userData?.email || userData?.username);
    const effectiveRole = inferredRole || userData?.role || 'recruiter';
    const userWithRole = {
      ...userData,
      role: effectiveRole,
      display_name: computeDisplayName(userData),
    };

    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    // Clear old session from the other storage
    otherStorage.removeItem('token');
    otherStorage.removeItem('user');
    otherStorage.removeItem('role');
    otherStorage.removeItem('refresh');
    otherStorage.removeItem('session_id');
    otherStorage.removeItem('job_session_id');

    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(userWithRole));
    storage.setItem('role', effectiveRole);
    if (refreshToken) {
      storage.setItem('refresh', refreshToken);
    }
    // Clear any previously selected session when switching users
    storage.removeItem('session_id');
    storage.removeItem('job_session_id');
    
    // 🏁 SET USER IMMEDIATELY FOR UI REACTIVITY 🏁
    setUser(userWithRole);

    // Fetch fresh user data from backend as a background check
    try {
      const freshUserData = await fetchUserProfile();
      if (freshUserData) {
        const finalUser = {
          ...freshUserData,
          role: freshUserData.role || effectiveRole,
          display_name: freshUserData.display_name || computeDisplayName(freshUserData),
        };
        
        setUser(finalUser);
        storage.setItem('user', JSON.stringify(finalUser));
        storage.setItem('role', finalUser.role);
      }
    } catch (error) {
      console.warn('Background profile refresh failed, keeping initial login data:', error);
    }
  };



  const logout = async () => {
    // Get the refresh token before clearing storage
    const storage = getActiveStorage();
    const refreshToken = storage.getItem('refresh');

    // Call backend logout endpoint to blacklist the refresh token
    if (refreshToken) {
      try {
        await api.logout(refreshToken);
      } catch (error) {
        // Log error but continue with client-side logout
        console.error('Backend logout failed:', error);
      }
    }

    // Clear all auth data from both storages
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('refresh');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('refresh');
    localStorage.removeItem('session_id');
    localStorage.removeItem('job_session_id');
    sessionStorage.removeItem('session_id');
    sessionStorage.removeItem('job_session_id');

     // Clear all session state for UI persistence
    clearAllSessionState();
    
    // Clear job match store state
    localStorage.removeItem('job-match-store');
    
    // Clear redirect flags
    sessionStorage.removeItem('jobs_redirected');

    setUser(null);
  };

  // Fetch fresh user profile from backend
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.me();
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    // Check both localStorage and sessionStorage for valid session
    let storedUser = null;
    let token = null;
    let storageUsed = null;

    // First check localStorage
    const localUser = localStorage.getItem('user');
    const localToken = localStorage.getItem('token');
    if (localUser && localToken) {
      storedUser = localUser;
      token = localToken;
      storageUsed = localStorage;
    }

    // If not in localStorage, check sessionStorage
    if (!storedUser) {
      const sessionUser = sessionStorage.getItem('user');
      const sessionToken = sessionStorage.getItem('token');
      if (sessionUser && sessionToken) {
        storedUser = sessionUser;
        token = sessionToken;
        storageUsed = sessionStorage;
      }
    }
    
    if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser);
        // Extract role from JWT token
        const tokenData = decodeJWT(token);
        const effectiveRole = tokenData?.role ?? parsed.role ?? 'recruiter';

        const userToSet = {
          ...parsed,
          role: effectiveRole,
          display_name: parsed.display_name || computeDisplayName(parsed),
        };
        
        setUser(userToSet);
        
        // Sync back to storage to ensure consistency
        if (storageUsed) {
          storageUsed.setItem('user', JSON.stringify(userToSet));
          storageUsed.setItem('role', effectiveRole);
        }
        
        // Fetch fresh user data from backend to ensure we have the latest
        fetchUserProfile().then(freshUserData => {
          if (freshUserData) {
            // Merge with existing user data to preserve computed fields
            const finalUser = {
              ...freshUserData,
              role: freshUserData.role || effectiveRole,
              display_name: freshUserData.display_name || computeDisplayName(freshUserData),
            };
            
            setUser(finalUser);
            // Update storage with fresh data
            if (storageUsed) {
              storageUsed.setItem('user', JSON.stringify(finalUser));
              storageUsed.setItem('role', finalUser.role);
            }
          }
        }).catch(error => {
          console.warn('Failed to fetch fresh user data, using stored data:', error);
        });
      } catch (err) {
        console.error('Error restoring session:', err);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [fetchUserProfile]);

  // Manual profile refresh for UI components
  const refreshUserProfile = useCallback(async () => {
    try {
      const freshUserData = await fetchUserProfile();
      if (freshUserData) {
        const storage = getActiveStorage();
        const finalUser = {
          ...freshUserData,
          role: freshUserData.role || user?.role || 'recruiter',
          display_name: freshUserData.display_name || computeDisplayName(freshUserData),
        };
        
        setUser(finalUser);
        storage.setItem('user', JSON.stringify(finalUser));
        storage.setItem('role', finalUser.role);
        return finalUser;
      }
    } catch (error) {
      console.warn('Failed to refresh user profile:', error);
      throw error;
    }
  }, [fetchUserProfile, user]);

  // Memoize to prevent re-renders when parent re-renders but auth state hasn't changed
  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      updateUser,
      refreshUserProfile,
      isAuthenticated: !!user,
    }),
    [user, loading, login, logout, updateUser, refreshUserProfile]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
