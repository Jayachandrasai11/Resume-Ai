import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, http } from '../services/api';
import { useJobStore } from '../store/useJobStore';

const getSkillsArray = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  if (typeof skills === 'string') return skills.split(',').map(s => s.trim()).filter(Boolean);
  if (typeof skills === 'object') return Object.values(skills);
  return [];
};

const MatchCandidates = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { setSelectedJob, setSearchResults, setIsSearchMode, setSearchType } = useJobStore();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    if (!jobId) { navigate('/jobs'); return; }
    fetchJobDetails();
  }, [jobId, navigate]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionId = localStorage.getItem('job_session_id') || localStorage.getItem('session_id');
      if (!sessionId) { navigate('/setup'); return; }
      const response = await http.get(`/jobs/${jobId}/`, { params: { session_id: sessionId } });
      setJob(response.data);
    } catch (err) {
      if (err.response?.status === 404) { navigate('/jobs'); return; }
      setError('Failed to load deployment specs.');
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (matchType) => {
    if (!job) return;
    setMatching(true);
    setError(null);

    try {
      setSelectedJob(job);
      setSearchType(matchType);
      setIsSearchMode(true);

      let results = [];
      let strategy = 'cosine';
      let threshold = 0.3;
      let mode = matchType === 'deep' ? 'semantic' : matchType === 'exact' ? 'keyword' : 'smart';
      
      if (matchType === 'deep') threshold = 0.2;
      if (matchType === 'exact') threshold = 0.5;

      const response = await api.matchByJobId(jobId, 50, threshold, strategy, mode);
      results = response.data?.results || response.data || [];
      
      setSearchResults(results);
      navigate(`/jobs/${jobId}/results`);
    } catch (err) {
      setError('Matching core offline. Retrying extraction...');
    } finally {
      setMatching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[600px]">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-slate-500 font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">Initializing Match Core...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-full">
      {/* 🧭 NAVIGATION BREADCRUMB 🧭 */}
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => navigate('/jobs')} 
          className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex flex-col ml-2">
           <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] leading-none mb-1">Target Position</span>
           <span className="text-sm font-black text-white">{job?.title}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 📋 JD DEEP VIEW 📋 */}
        <div className="lg:col-span-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 border-indigo-500/10 sticky top-24 shadow-2xl shadow-indigo-500/5"
          >
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Job Specification</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium italic mb-8">
               "{job?.description?.substring(0, 300)}..."
            </p>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Target Stack</label>
              <div className="flex flex-wrap gap-2">
                {getSkillsArray(job?.skills).slice(0, 8).map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-900 border border-white/5 rounded text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 🚀 STRATEGIC MATCHING 🚀 */}
        <div className="lg:col-span-8 space-y-8">
           <div className="space-y-2 mb-10">
            <h2 className="text-3xl font-black text-white tracking-tighter">Strategic <span className="text-indigo-500">Matching</span></h2>
            <p className="text-slate-500 text-sm font-medium">Select a matching algorithm to scan your talent pool.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { id: 'smart', title: 'Smart Match', desc: 'Balanced approach using technical skills and semantic profile similarity.', color: 'indigo', icon: 'M13 10V3L4 14h7v7l9-11h-7z', sub: 'Fast & Reliable' },
              { id: 'deep', title: 'AI Deep Search', desc: 'Neural-net driven analysis finds hidden potential across all metadata.', color: 'purple', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', sub: 'Maximum Depth' },
              { id: 'exact', title: 'Exact Filter', desc: 'Strict keyword matching for precise technical requirements.', color: 'amber', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', sub: 'High Precision' }
            ].map((strategy, idx) => (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleMatch(strategy.id)}
                className={`group p-8 glass-card border-white/5 hover:border-${strategy.color}-500/30 hover:bg-${strategy.color}-500/[0.02] cursor-pointer transition-all duration-500 flex items-center gap-6 relative overflow-hidden`}
              >
                 <div className={`w-14 h-14 rounded-2xl bg-${strategy.color}-500/10 border border-${strategy.color}-500/20 flex items-center justify-center text-${strategy.color}-400 group-hover:bg-${strategy.color}-500 group-hover:text-white transition-all duration-500 shadow-lg`}>
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={strategy.icon} />
                   </svg>
                 </div>
                 
                 <div className="flex-1">
                    <p className={`text-[9px] font-black text-${strategy.color}-500 uppercase tracking-widest leading-none mb-1`}>{strategy.sub}</p>
                    <h4 className="text-xl font-black text-white mb-1">{strategy.title}</h4>
                    <p className="text-xs text-slate-500 font-medium max-w-md">{strategy.desc}</p>
                 </div>

                 <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-500">
                    <svg className={`w-6 h-6 text-${strategy.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                 </div>
                 
                 <div className={`absolute bottom-0 left-0 w-0 h-[2px] bg-${strategy.color}-500 group-hover:w-full transition-all duration-700`}></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 🪄 MATCHING OVERLAY 🪄 */}
      <AnimatePresence>
        {matching && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative text-center space-y-8">
               <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-10 h-10 text-indigo-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-black text-white tracking-widest uppercase">Cross-Referencing...</h3>
                 <p className="text-slate-500 text-sm font-medium animate-pulse tracking-widest uppercase text-[10px]">AI Matching in Progress</p>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchCandidates;
