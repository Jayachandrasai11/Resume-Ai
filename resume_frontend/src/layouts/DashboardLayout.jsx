import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useUI } from '../context/UIContext';
import { useTheme } from '../context/ThemeContext';

const DashboardLayout = ({ children }) => {
  const { isSidebarCollapsed, toggleSidebar } = useUI();
  const { theme } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] text-slate-100">
      <Sidebar isCollapsed={isSidebarCollapsed} />

      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: isSidebarCollapsed ? '80px' : '256px' }}
      >
        <Topbar toggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
