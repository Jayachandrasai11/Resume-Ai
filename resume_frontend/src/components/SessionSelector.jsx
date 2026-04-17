import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, asList } from '../services/api';

const SessionSelector = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(localStorage.getItem('session_id'));
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const response = await api.listJobSessions();
        setSessions(asList(response.data));
      } catch (err) {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const activeSession = sessions.find(s => String(s.id) === String(activeSessionId));

  const handleSessionChange = (id) => {
    setActiveSessionId(id);
    localStorage.setItem('session_id', id);
    localStorage.setItem('job_session_id', id);
    
    const selected = sessions.find(s => String(s.id) === String(id));
    if (selected) {
      localStorage.setItem('activeSession', JSON.stringify({
        id: selected.id,
        name: selected.company_name || selected.job_role || selected.job_title || `Session ${selected.id}`,
        description: selected.job_role || selected.job_title,
        created_at: selected.created_at,
        resume_count: selected.resume_count || 0
      }));
    }
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative">
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1.5 ml-1">Mission Control</p>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-4 bg-white/[0.03] border border-white/5 pl-5 pr-4 py-2.5 rounded-2xl hover:bg-white/[0.06] transition-all group"
      >
        <div className="flex flex-col text-left min-w-[160px]">
          <span className="text-[10px] font-black text-white uppercase tracking-tight truncate max-w-[180px]">
            {activeSession ? activeSession.company_name : 'Select Active Mission'}
          </span>
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate max-w-[180px]">
            {activeSession ? (activeSession.job_role || activeSession.job_title) : 'System Standby'}
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 mt-3 w-72 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
          >
            <div className="max-h-[320px] overflow-y-auto no-scrollbar">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionChange(session.id)}
                  className={`w-full flex flex-col items-start px-5 py-4 hover:bg-indigo-600/10 transition-colors border-b border-white/5 last:border-0
                    ${String(session.id) === String(activeSessionId) ? 'bg-indigo-600/10' : ''}`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-tight ${String(session.id) === String(activeSessionId) ? 'text-indigo-400' : 'text-white'}`}>
                    {session.company_name}
                  </span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    {session.job_role || session.job_title}
                  </span>
                </button>
              ))}
              {sessions.length === 0 && !loading && <p className="p-5 text-center text-[9px] font-black text-slate-600 uppercase tracking-widest">No Active Missions</p>}
            </div>
            <button 
              onClick={() => { setIsOpen(false); window.location.href='/setup'; }}
              className="w-full py-4 text-[9px] font-black text-indigo-400 uppercase tracking-widest border-t border-white/5 hover:bg-indigo-600/10 transition-colors"
            >
              + Initiate New Mission
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionSelector;
