import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUI } from '../context/UIContext';

const Layout = () => {
  const { isSidebarCollapsed, toggleSidebar } = useUI();

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-purple/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-noise" />
      </div>

      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} />

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Topbar toggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
        
        {/* Scrollable content area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
