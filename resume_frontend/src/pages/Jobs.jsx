import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, http, asList } from '../services/api';
import { useSessionState } from '../hooks/useSessionState';
import { useJobStore } from '../store/useJobStore';

// Utility to safely get skills array
const getSkillsArray = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  if (typeof skills === 'string') return skills.split(',').map(s => s.trim()).filter(Boolean);
  if (typeof skills === 'object') return Object.values(skills);
  return [];
};

const Jobs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [experience, setExperience] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [, setLastVisitedPage] = useSessionState('lastVisitedPage', null);
  const { setSelectedJob } = useJobStore();

  useEffect(() => {
    setLastVisitedPage('/jobs');
  }, [setLastVisitedPage]);

  // Dropdown closer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-dropdown')) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchJobs = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const sessionId = localStorage.getItem('job_session_id') || localStorage.getItem('session_id');
      const params = sessionId ? { session_id: sessionId } : {};
      const response = await api.listJobDescriptions(params, { signal });
      
      let jobList = [];
      if (Array.isArray(response.data)) {
        jobList = response.data;
      } else if (response.data?.results) {
        jobList = response.data.results;
      }
      setJobs(jobList);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchJobs(controller.signal);
    return () => controller.abort();
  }, [fetchJobs]);

  useEffect(() => {
    if (editingJob) {
      setTitle(editingJob.title || '');
      setDescription(editingJob.description || '');
      setRequirements(editingJob.skills || '');
      setExperience(editingJob.min_experience || '');
    } else {
      setTitle('');
      setDescription('');
      setRequirements('');
      setExperience('');
    }
  }, [editingJob]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const sessionId = localStorage.getItem('job_session_id') || localStorage.getItem('session_id');
      if (editingJob) {
        await api.updateJobDescription(editingJob.id, {
          title: title.trim(),
          description: description.trim(),
          skills: requirements.trim(),
          min_experience: experience.trim(),
        });
      } else {
        await api.createJobDescription({
          title: title.trim(), 
          description: description.trim(), 
          skills: requirements.trim(), 
          min_experience: experience.trim(), 
          session_id: sessionId
        });
      }
      setShowCreateForm(false);
      setEditingJob(null);
      fetchJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Archive this position permanently?')) return;
    try {
      await api.deleteJobDescription(id);
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[500px]">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-bold tracking-widest uppercase text-[10px] animate-pulse">Syncing Environment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 min-h-full">
      {/* ✨ REFINED HEADER ✨ */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] tracking-[0.4em] uppercase">
            <span className="w-8 h-[1px] bg-indigo-500/50"></span>
            Strategic Management
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Active <span className="text-indigo-500">Positions</span>
          </h1>
          <p className="text-slate-500 text-sm max-w-lg leading-relaxed font-medium">
            Manage your high-priority openings with AI-enhanced candidate matching.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 overflow-hidden active:scale-95"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Deploy Role
          </span>
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold flex items-center gap-3">
           {error}
        </div>
      )}

      {/* 📋 JOBS GRID 📋 */}
      {jobs.length === 0 ? (
        <div className="glass-card py-24 text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2" />
            </svg>
          </div>
           <h3 className="text-xl font-black text-white mb-2">No Active Deployments</h3>
           <p className="text-slate-500 text-xs max-w-xs mx-auto mb-8 font-medium">Post your first position to activate AI Matching.</p>
           <button onClick={() => setShowCreateForm(true)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 font-bold text-[10px] uppercase tracking-widest transition-all">Start Now</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card group flex flex-col hover:border-indigo-500/40 hover:bg-white/[0.01] transition-all duration-500 shadow-2xl shadow-black/40"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    <div className="relative actions-dropdown">
                      <button 
                        onClick={() => setMenuOpenId(menuOpenId === job.id ? null : job.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:text-white transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      
                      <AnimatePresence>
                        {menuOpenId === job.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            className="absolute right-0 top-10 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[100] p-1.5 backdrop-blur-3xl"
                          >
                             <button
                              onClick={() => { setSelectedJob(job); navigate(`/jobs/${job.id}/match`); }}
                              className="w-full flex items-center gap-3 p-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-indigo-500/20 rounded-lg transition-all"
                            >
                              Match AI
                            </button>
                            <button
                              onClick={() => { setSelectedJob(job); navigate(`/jobs/${job.id}/funnel`); }}
                              className="w-full flex items-center gap-3 p-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-emerald-500/20 rounded-lg transition-all"
                            >
                              Funnel
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <h2 className="text-xl font-black text-white mb-2 tracking-tight line-clamp-1 group-hover:text-indigo-400 transition-colors duration-300">
                    {job.title}
                  </h2>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded border border-white/5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {job.min_experience || '0'}Y Exp
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-6 font-medium italic">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                  {getSkillsArray(job.skills).slice(0, 3).map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-900 border border-white/5 rounded text-[9px] font-black uppercase text-slate-500 tracking-tighter">
                      {skill}
                    </span>
                  ))}
                  </div>
                </div>

                <div className="px-6 py-4 mt-auto flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
                  <button
                    onClick={() => { setSelectedJob(job); setEditingJob(job); setShowCreateForm(true); }}
                    className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    Refine
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 🪄 PRODUCTION MODAL 🪄 */}
      <AnimatePresence mode="wait">
        {showCreateForm && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowCreateForm(false); setEditingJob(null); }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="relative w-full max-w-lg bg-[#0F172A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                  <h2 className="text-2xl font-black text-white tracking-tighter">
                    {editingJob ? 'Refine' : 'Post'} <span className="text-indigo-500 tracking-normal">Deployment</span>
                  </h2>
                </div>

                <form onSubmit={handleCreateJob} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Title</label>
                    <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lead Designer" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mission briefing</label>
                    <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="..." rows="3" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all resize-none font-medium leading-relaxed" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stack</label>
                      <input type="text" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="React, Python..." className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Exp</label>
                      <input type="text" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-medium" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20">{isSubmitting ? 'Syncing...' : 'Deploy Position'}</button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Jobs;