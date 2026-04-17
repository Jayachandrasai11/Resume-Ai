import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

/**
 * UIContext — owns UI-only state that was previously mixed into AuthContext.
 * Separated to prevent auth changes from triggering sidebar/layout re-renders.
 */
const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  // Memoize so consumers only re-render when sidebar state actually changes
  const value = useMemo(
    () => ({ isSidebarCollapsed, toggleSidebar }),
    [isSidebarCollapsed, toggleSidebar]
  );

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export default UIContext;
