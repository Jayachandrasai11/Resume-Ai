import { useState, useEffect } from 'react';

// Session state management hook for comprehensive state persistence
export const useSessionState = (key, defaultValue = null) => {
  const [value, setValue] = useState(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to load session state:', error);
      return defaultValue;
    }
  });

  const setSessionValue = (newValue) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(newValue));
      setValue(newValue);
    } catch (error) {
      console.warn('Failed to save session state:', error);
    }
  };

  return [value, setSessionValue];
};

// Session keys constants for comprehensive state management
export const SESSION_KEYS = {
  // Candidates page state
  CANDIDATES_PAGE: 'candidates_page',
  CANDIDATES_FILTERS: 'candidates_filters',
  CANDIDATES_SCROLL: 'candidates_scroll',
  CANDIDATES_LIST: 'candidates_list',

  // Jobs page state
  JOBS_PAGE: 'jobs_page',
  JOBS_FILTERS: 'jobs_filters',
  JOBS_SCROLL: 'jobs_scroll',
  JOBS_LIST: 'jobs_list',
  JOBS_MATCH_RESULTS: 'jobs_match_results',

  // Job details page state
  JOB_DETAILS_SCROLL: 'job_details_scroll',

  // Navigation context
  SELECTED_JOB: 'selected_job',
  LAST_VISITED_PAGE: 'last_visited_page'
};

// Clear all session state (useful for logout)
export const clearAllSessionState = () => {
  Object.values(SESSION_KEYS).forEach(key => {
    sessionStorage.removeItem(key);
  });
};

// Enhanced back navigation helper
export const getSmartBackNavigation = (navigate, currentPage, sessionKeys) => {
  console.log('🔍 getSmartBackNavigation called - currentPage:', currentPage);

  // Check LAST_VISITED_PAGE first
  try {
    const lastVisited = sessionStorage.getItem(sessionKeys.LAST_VISITED_PAGE);
    console.log('🔍 LAST_VISITED_PAGE:', lastVisited);
    if (lastVisited && lastVisited !== currentPage) {
      console.log('🔄 Navigating to last visited page:', lastVisited);
      navigate(lastVisited);
      return;
    }
  } catch (error) {
    console.warn('Error checking LAST_VISITED_PAGE:', error);
  }

  // Check for specific page states in order of priority
  const pageStates = [
    { key: sessionKeys.JOBS_PAGE, path: '/jobs' },
    { key: sessionKeys.CANDIDATES_PAGE, path: '/candidates' }
  ];

  for (const { key, path } of pageStates) {
    try {
      const state = sessionStorage.getItem(key);
      console.log('🔍 Checking', key, ':', state, 'path:', path, '!== currentPage:', path !== currentPage);
      if (state && path !== currentPage) {
        console.log('🔄 Navigating to', path, 'based on', key);
        navigate(path);
        return;
      }
    } catch (error) {
      console.warn('Error checking session state:', error);
    }
  }

  console.log('🔄 Falling back to browser back: navigate(-1)');
  // Fallback to browser back
  navigate(-1);
};

// Logout function that clears session state and redirects
export const logout = (navigate) => {
  clearAllSessionState();
  // Additional logout logic can be added here (clear tokens, etc.)
  if (navigate) {
    navigate('/login');
  }
};