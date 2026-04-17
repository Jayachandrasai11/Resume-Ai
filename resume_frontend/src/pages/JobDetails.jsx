import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, http } from '../services/api';
import { useSessionState, SESSION_KEYS, getSmartBackNavigation } from '../hooks/useSessionState';
import { useJobStore } from '../store/useJobStore';
import { motion, AnimatePresence } from 'framer-motion';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMode, setSelectedMode] = useState('smart');

  const [savedScroll, setSavedScroll] = useSessionState(SESSION_KEYS.JOB_DETAILS_SCROLL, 0);
  const [lastVisitedPage, setLastVisitedPage] = useSessionState(SESSION_KEYS.LAST_VISITED_PAGE, null);
  const scrollRef = useRef(null);

  const { setSelectedJob, setSearchResults, setIsSearchMode, setSearchType } = useJobStore();

  useEffect(() => {
    if (jobId) setLastVisitedPage(`/jobs/${jobId}`);
  }, [jobId, setLastVisitedPage]);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const sessionId = localStorage.getItem('job_session_id') || localStorage.getItem('session_id');
        const params = sessionId ? { session_id: sessionId } : {};
        const response = await api.listJobDescriptions(params);
        const jobs = response.data?.results || response.data || [];
        const foundJob = jobs.find(j => j.id === Number(jobId));

        if (foundJob) setJob(foundJob);
        else navigate('/jobs');
      } catch (err) {
        setError('Failed to load deployment specs.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, navigate]);

  const handleMatch = async () => {
    setMatching(true);
    try {
      const typeMap = { 'smart': 'smart', 'semantic': 'deep', 'keyword': 'exact' };
      const backendType = typeMap[selectedMode] || 'smart';
      const response = await http.get(`/jobs/${jobId}/match/?limit=20&threshold=0.3&strategy=cosine&type=${backendType}`);
      
      setSelectedJob(job);
      setSearchResults(response.data?.results || []);
      setIsSearchMode(true);
      setSearchType(selectedMode);
      navigate(`/jobs/${jobId}/results`);
    } catch (err) {
      alert('Neural link interrupted. Please retry.');
    } finally {
      setMatching(false);
    }
  };

  const modes = [
    { id: 'smart', title: 'Smart Match', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'indigo', desc: 'Neural-net driven balance of skills and cultural similarity.' },
    { id: 'semantic', title: 'Deep Search', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707', color: 'violet', desc: 'Semantic analysis find potentials hidden from keyword filters.' },
    { id: 'keyword', title: 'Exact Filter', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'amber', desc: 'Hard technical verification based on specific lexicon tokens.' }
  ];

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[600px]">
      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="mt-6 text-slate-500 font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">Initializing Job Specs...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 space-y-12 transition-all duration-500">
      
      {/* Strategic Header */}
      <div className="flex justify-between items-end">
         <div className="space-y-4">
            <button
               onClick={() => getSmartBackNavigation(navigate, `/jobs/${jobId}`, SESSION_KEYS)}
               className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all flex items-center gap-2"
            >
               ← Mission List
            </button>
            <div className="flex items-center gap-4">
               <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{job.title}</h1>
               <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Mandate</span>
            </div>
         </div>
         <button 
           onClick={handleMatch}
           disabled={matching}
           className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3"
         >
           {matching ? 'Analyzing Pool...' : 'Initiate Matching'}
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         
         {/* Details Panel */}
         <div className="lg:col-span-8 space-y-8">
            <div className="glass-card p-10 border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Strategic Description</p>
                <p className="text-slate-300 text-sm leading-relaxed font-medium whitespace-pre-wrap">{job.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="glass-card p-10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Required Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills && String(job.skills).split(',').map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-[10px] font-black text-indigo-400 uppercase tracking-tight">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
               </div>
               <div className="glass-card p-10 flex flex-col justify-center items-center text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Min. Experience</p>
                  <h3 className="text-4xl font-black text-white tracking-tighter">{job.min_experience || '0'}</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Years Required</p>
               </div>
            </div>
         </div>

         {/* Mode Strategy Panel */}
         <div className="lg:col-span-4 space-y-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2 mb-4">Matching Algorithm</p>
            {modes.map((mode) => (
               <div 
                 key={mode.id}
                 onClick={() => setSelectedMode(mode.id)}
                 className={`p-6 rounded-3xl border-2 cursor-pointer transition-all duration-500 group relative overflow-hidden ${
                   selectedMode === mode.id 
                     ? `bg-${mode.color}-600/10 border-${mode.color}-500/50` 
                     : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                 }`}
               >
                 <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-${mode.color}-500/10 flex items-center justify-center text-${mode.color}-400 group-hover:scale-110 transition-transform`}>
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={mode.icon} /></svg>
                    </div>
                    <div className="flex-1">
                       <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">{mode.title}</h3>
                       <p className="text-[10px] font-medium text-slate-500 leading-normal">{mode.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMode === mode.id ? `border-${mode.color}-500` : 'border-slate-700'}`}>
                       {selectedMode === mode.id && <div className={`w-2 h-2 bg-${mode.color}-500 rounded-full`} />}
                    </div>
                 </div>
                 {selectedMode === mode.id && <motion.div layoutId="modeGlow" className={`absolute inset-0 bg-${mode.color}-500/5 blur-xl -z-10`} />}
               </div>
            ))}
         </div>

      </div>

      <AnimatePresence>
        {matching && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative text-center space-y-8">
               <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-black text-white tracking-widest uppercase">Cross-Referencing...</h3>
                 <p className="text-slate-500 text-[10px] font-black animate-pulse tracking-widest uppercase">AI Matching in Progress</p>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobDetails;
