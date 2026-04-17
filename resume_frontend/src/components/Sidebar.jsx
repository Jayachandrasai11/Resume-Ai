import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isCollapsed }) => {
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();
  
  const role = user?.role || localStorage.getItem('role') || 'recruiter';
  const isAdmin = role === 'admin';
  const isJobPage = location.pathname.startsWith('/jobs/') && params.id;
  const currentJobId = params.id;

  // Dropdown States
  const [isResumesOpen, setIsResumesOpen] = useState(location.pathname === '/upload' || location.pathname === '/gmail-import');
  const [isAIToolsOpen, setIsAIToolsOpen] = useState(location.pathname === '/resume-chat');
  const [isJobsOpen, setIsJobsOpen] = useState(isJobPage || location.pathname === '/jobs');

  const NavItem = ({ item, isSubItem = false }) => (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) => `
        flex items-center gap-4 transition-all duration-300 group
        ${isSubItem ? 'py-2 px-4 ml-9 rounded-lg text-xs' : 'p-3.5 rounded-xl text-xs'}
        ${isActive 
          ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-[0_0_20px_rgba(79,140,255,0.05)] font-bold' 
          : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 font-semibold'}
      `}
    >
      {!isSubItem && (
        <span className={`transition-transform duration-300 group-hover:scale-110 ${location.pathname === item.path ? 'text-indigo-400' : ''}`}>
          {item.icon}
        </span>
      )}
      {!isCollapsed && (
        <span className="uppercase tracking-widest truncate">{item.name}</span>
      )}
      {location.pathname === item.path && !isCollapsed && !isSubItem && (
         <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
      )}
    </NavLink>
  );

  const CollapsibleSection = ({ title, icon, isOpen, setIsOpen, children, activePaths = [] }) => {
    const isActive = activePaths.some(path => location.pathname.startsWith(path));
    
    return (
      <div className="flex flex-col space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-4 p-3.5 rounded-xl transition-all duration-300 group
            ${isActive && !isOpen ? 'bg-indigo-600/5 text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-300'}
          `}
        >
          <span className="transition-transform duration-300 group-hover:scale-110">{icon}</span>
          {!isCollapsed && (
            <>
              <span className="font-bold text-xs uppercase tracking-widest flex-1 text-left">{title}</span>
              <svg 
                className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
        <AnimatePresence>
          {isOpen && !isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden flex flex-col space-y-1 py-1"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 88 : 260 }}
      className="fixed left-0 top-0 h-screen bg-slate-950/95 backdrop-blur-3xl border-r border-white/5 flex flex-col z-[100] shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5 h-24 flex items-center justify-center">
        <Link to="/" className="flex items-center gap-4 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-black text-white tracking-tighter uppercase">Recruiter <span className="text-indigo-500">AI</span></span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-8 px-4 space-y-2 no-scrollbar">
        {role === 'recruiter' && (
          <NavItem item={{ name: 'Dashboard', path: '/dashboard', end: true, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> }} />
        )}

        <NavItem item={{ name: 'Candidates', path: '/candidates', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> }} />

        {/* Resumes Section */}
        <CollapsibleSection 
          title="Resumes" 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 0 01.707.293l5.414 5.414a1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          isOpen={isResumesOpen}
          setIsOpen={setIsResumesOpen}
          activePaths={['/upload', '/gmail-import']}
        >
          <NavItem isSubItem item={{ name: 'Upload Manually', path: '/upload' }} />
          <NavItem isSubItem item={{ name: 'Gmail Import', path: '/gmail-import' }} />
        </CollapsibleSection>

        {/* AI Tools Section */}
        <CollapsibleSection 
          title="AI Tools" 
          icon={<svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          isOpen={isAIToolsOpen}
          setIsOpen={setIsAIToolsOpen}
          activePaths={['/resume-chat']}
        >
          <NavItem isSubItem item={{ name: 'Resume Intelligence', path: '/resume-chat' }} />
        </CollapsibleSection>

        {/* Jobs & Subnav */}
        <CollapsibleSection 
          title="Jobs" 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          isOpen={isJobsOpen}
          setIsOpen={setIsJobsOpen}
          activePaths={['/jobs']}
        >
          <NavItem isSubItem item={{ name: 'All Job Roles', path: '/jobs' }} />
          {isJobPage && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
              <p className="px-5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Job Active</p>
              <NavItem isSubItem item={{ name: 'JD Snapshot', path: `/jobs/${currentJobId}` }} />
              <NavItem isSubItem item={{ name: 'Strategic Match', path: `/jobs/${currentJobId}/match` }} />
              <NavItem isSubItem item={{ name: 'Ranked Results', path: `/jobs/${currentJobId}/results` }} />
              <NavItem isSubItem item={{ name: 'Funnel View', path: `/jobs/${currentJobId}/funnel` }} />
            </div>
          )}
        </CollapsibleSection>

        <div className="h-[1px] bg-white/5 my-8" />
        
        <NavItem item={{ name: 'Profile Intel', path: '/profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }} />
        <NavItem item={{ name: 'Core Settings', path: '/settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }} />
      </nav>

      {/* Footer / Status */}
      {!isCollapsed && (
        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">System Online</span>
           </div>
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;
