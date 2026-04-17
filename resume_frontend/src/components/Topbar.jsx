import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import SessionSelector from './SessionSelector';

const Topbar = ({ toggleSidebar, isSidebarCollapsed }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const username = user?.display_name || user?.full_name || user?.username || 'User';
  const role = user?.role || 'recruiter';
  const isAdmin = role === 'admin';

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    window.location.replace('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/20 backdrop-blur-3xl border-b border-white/5 px-8 pt-6 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={toggleSidebar}
            className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all group shadow-sm active:scale-95"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg className={`w-5 h-5 transition-transform duration-500 ${isSidebarCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">Talent <span className="text-indigo-500">Workspace</span></h1>
            <div className="flex items-center gap-2 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Intelligence Mode</p>
            </div>
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-6">
          {!isAdmin && <SessionSelector />}
          
          {/* Notifications */}
          <button className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all relative group">
            <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-slate-950"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-4 pr-3 py-1.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group shadow-inner"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-xs shadow-lg group-hover:scale-110 transition-transform">
                {getInitials(username)}
              </div>
              <div className="text-left hidden sm:block">
                 <p className="text-xs font-black text-white uppercase tracking-tight leading-none truncate max-w-[120px]">{username}</p>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{role}</p>
              </div>
              <svg 
                className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-4 w-64 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-3 z-50 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-white/5 mb-2 bg-white/[0.02]">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Identity</p>
                    <p className="text-sm font-black text-white truncate uppercase tracking-tight">{username}</p>
                  </div>
                  
                  <button
                    onClick={() => { setIsProfileOpen(false); navigate('/profile'); }}
                    className="flex items-center gap-3 w-full px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-indigo-600/10 transition-colors"
                  >
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span>Profile Intelligence</span>
                  </button>

                  <button
                    onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
                    className="flex items-center gap-3 w-full px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-indigo-600/10 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>Core Settings</span>
                  </button>

                  <div className="my-2 border-t border-white/5" />
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-5 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
