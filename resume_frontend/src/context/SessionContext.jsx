import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, asList } from '../services/api';
import { useAuth } from './AuthContext';

const SessionContext = createContext(null);

const getStorage = () => {
  try {
    if (localStorage.getItem('token')) return localStorage;
    if (sessionStorage.getItem('token')) return sessionStorage;
  } catch {
    // ignore
  }
  return localStorage;
};

export const SessionProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Restore session from storage on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveSession(null);
      setSessions([]);
      setLoading(false);
      return;
    }

    const storage = getStorage();
    const storedSession = storage.getItem('activeSession');
    const sessionId = storage.getItem('job_session_id') || storage.getItem('session_id');
    
    if (storedSession) {
      try {
        setActiveSession(JSON.parse(storedSession));
      } catch {
        storage.removeItem('activeSession');
      }
    } else if (sessionId) {
      // Legacy support - just store ID until we fetch full data
      setActiveSession({ id: sessionId });
    }
    
    setLoading(false);
  }, [isAuthenticated]);

  // Fetch all user sessions
  const fetchSessions = useCallback(async () => {
    if (!isAuthenticated) return [];
    
    try {
      const response = await api.listJobSessions();
      const sessionList = asList(response.data);
      setSessions(sessionList);
      return sessionList;
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      return [];
    }
  }, [isAuthenticated]);

  // Select and persist a session
  const selectSession = useCallback((session) => {
    const storage = getStorage();
    const sessionId = String(session.id);
    
    const sessionData = {
      id: sessionId,
      name: session.company_name || session.job_role || `Session ${sessionId}`,
      description: session.job_role,
      created_at: session.created_at,
      resume_count: session.resume_count || 0
    };

    storage.setItem('session_id', sessionId);
    storage.setItem('job_session_id', sessionId);
    storage.setItem('activeSession', JSON.stringify(sessionData));
    
    setActiveSession(sessionData);
    return sessionData;
  }, []);

  // Clear active session
  const clearSession = useCallback(() => {
    const storage = getStorage();
    storage.removeItem('session_id');
    storage.removeItem('job_session_id');
    storage.removeItem('activeSession');
    setActiveSession(null);
  }, []);

  // Check if current session is valid (exists in user's sessions)
  const validateSession = useCallback(async () => {
    if (!activeSession?.id) return false;
    
    const userSessions = await fetchSessions();
    const isValid = userSessions.some(s => String(s.id) === String(activeSession.id));
    
    if (!isValid) {
      clearSession();
    }
    
    return isValid;
  }, [activeSession, fetchSessions, clearSession]);

  return (
    <SessionContext.Provider value={{
      activeSession,
      sessions,
      loading,
      selectSession,
      clearSession,
      fetchSessions,
      validateSession,
      hasActiveSession: !!activeSession?.id
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
