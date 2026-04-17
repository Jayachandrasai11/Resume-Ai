import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

const ActiveSessionBanner = () => {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(
    localStorage.getItem('session_id') || localStorage.getItem('job_session_id')
  );

  useEffect(() => {
    const handleStorageChange = () => {
      const newSessionId = localStorage.getItem('session_id') || localStorage.getItem('job_session_id');
      setSessionId(newSessionId);
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setSessionData(null);
      setLoading(false);
      return;
    }
    const fetchSession = async () => {
      try {
        setLoading(true);
        const response = await api.getJobSession(sessionId);
        setSessionData(response.data);
      } catch (err) {
        setSessionData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  if (loading || !sessionData) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-indigo-600/5 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-0 mb-8 overflow-hidden shadow-2xl shadow-indigo-500/5"
    >
      <div className="flex flex-col md:flex-row items-stretch">
        <div className="p-5 flex items-center gap-6 flex-1">
           <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
           <div>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1.5 opacity-80">Live Strategic Mandate</p>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{sessionData.company_name}</h2>
              <div className="flex items-center gap-5 mt-3">
                 <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Job Role:</span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{sessionData.job_role || sessionData.job_title}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Intel Lead:</span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{sessionData.hr_name}</span>
                 </div>
              </div>
           </div>
        </div>
        
        <div className="bg-white/[0.02] border-l border-white/5 px-8 flex flex-col justify-center items-center text-center">
            <div className="flex items-center gap-1.5 mb-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Live</span>
            </div>
            <p className="text-2xl font-black text-white px-2 tracking-tighter">{sessionData.resume_count || 0}</p>
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Resumes</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ActiveSessionBanner;
