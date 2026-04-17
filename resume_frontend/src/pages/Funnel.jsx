import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJobStore } from '../store/useJobStore';
import { http } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Funnel = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { selectedJob, funnelData, setFunnelData, selectedStage, setSelectedStage, searchType } = useJobStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('applied');
  const [movingId, setMovingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const stages = [
    { key: 'applied', label: 'Applied', color: 'indigo', icon: 'inbox' },
    { key: 'shortlisted', label: 'Shortlisted', color: 'blue', icon: 'clipboard' },
    { key: 'interview', label: 'Interview', color: 'amber', icon: 'target' },
    { key: 'offer', label: 'Offer', color: 'purple', icon: 'briefcase' },
    { key: 'hired', label: 'Hired', color: 'emerald', icon: 'check' },
    { key: 'rejected', label: 'Rejected', color: 'rose', icon: 'x' }
  ];

  const quickActions = [
    { from: 'applied', to: 'shortlisted', label: 'Shortlist', color: 'blue' },
    { from: 'shortlisted', to: 'interview', label: 'Schedule Interview', color: 'amber' },
    { from: 'interview', to: 'offer', label: 'Make Offer', color: 'purple' },
    { from: 'offer', to: 'hired', label: 'Confirm Hire', color: 'emerald' },
    { from: 'applied', to: 'rejected', label: 'Reject', color: 'rose' },
    { from: 'shortlisted', to: 'rejected', label: 'Reject', color: 'rose' },
    { from: 'interview', to: 'rejected', label: 'Reject', color: 'rose' },
    { from: 'offer', to: 'rejected', label: 'Reject', color: 'rose' },
  ];

  useEffect(() => {
    const fetchJobAndFunnel = async () => {
      setLoading(true);
      try {
        if (!selectedStage) {
          setActiveTab('applied');
        } else {
          setActiveTab(selectedStage);
        }
        await fetchFunnelData();
      } finally {
        setLoading(false);
      }
    };
    fetchJobAndFunnel();
  }, [jobId]);

  const [refreshing, setRefreshing] = useState(false);

  const fetchFunnelData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await http.get(`/jobs/${jobId}/funnel/?_t=${Date.now()}`);
      setFunnelData(response.data.funnel || {});
    } catch (err) {
      setError('Error loading funnel data.');
    } finally {
      setRefreshing(false);
    }
  };

  const moveCandidate = async (funnelId, newStage) => {
    try {
      setMovingId(funnelId);
      await http.patch(`/funnel/${funnelId}/update-stage/`, { stage: newStage });
      await fetchFunnelData();
    } catch (error) {
      alert('Failed to move candidate');
    } finally {
      setMovingId(null);
    }
  };

  const handleQuickAction = (funnelId, toStage) => {
    moveCandidate(funnelId, toStage);
  };

  const handleDelete = async (funnelId) => {
    if (!window.confirm('Remove from recruitment pipeline?')) return;
    try {
      setMovingId(funnelId);
      await http.delete(`/funnel/${funnelId}/delete/`);
      await fetchFunnelData();
    } catch (error) {
      alert('Failed to remove candidate');
    } finally {
      setMovingId(null);
    }
  };

  const currentCandidates = (funnelData[activeTab] || []).filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getQuickActionsList = (candidateStage) => {
    return quickActions.filter(action => action.from === candidateStage);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#020617]">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Pipeline Phases...</p>
      </div>
    );
  }

  const jobTitle = selectedJob?.title || 'System Mandate';

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* ✨ CALIBRATED HEADER ✨ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex items-start gap-6">
            <button 
              onClick={() => navigate('/jobs')}
              className="mt-2 p-3 bg-white/[0.03] hover:bg-white/[0.08] text-slate-500 hover:text-white rounded-xl border border-white/5 transition-all group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                <span className="w-6 h-[2px] bg-indigo-500"></span>
                Recruitment Protocol
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight leading-none uppercase">
                Talent <span className="text-indigo-500">Funnel</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="px-5 py-3 bg-white/[0.02] rounded-2xl border border-white/5 backdrop-blur-xl">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Active Job</span>
                <span className="text-sm font-bold text-white">{jobTitle}</span>
             </div>
             <button 
               onClick={fetchFunnelData}
               disabled={refreshing}
               className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
             >
               <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
             </button>
          </div>
        </div>

        {/* 🚀 ELITE PHASE NAVIGATION 🚀 */}
        <div className="mb-10 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 min-w-max pb-2">
            {stages.map((stage) => {
              const isActive = activeTab === stage.key;
              const count = (funnelData[stage.key] || []).length;
              
              return (
                <button
                  key={stage.key}
                  onClick={() => setActiveTab(stage.key)}
                  className={`relative flex flex-col items-start px-8 py-5 rounded-2xl border transition-all duration-300 ${
                    isActive 
                      ? 'bg-indigo-500/10 border-indigo-500/30' 
                      : 'bg-transparent border-white/5 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                      {stage.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-600'}`}>
                      {count}
                    </span>
                  </div>
                  <div className={`text-xl font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}>
                    0{stages.indexOf(stage) + 1}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between mb-8">
           <div className="relative group max-w-sm w-full">
              <input 
                type="text" 
                placeholder="Find a candidate..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:border-indigo-500/50 outline-none transition-all"
              />
              <svg className="w-4 h-4 absolute left-4 top-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
           </div>
           
           <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              Acquisition Phase: <span className="text-indigo-400">{activeTab}</span>
           </div>
        </div>

        {/* Talent Index Table */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card shadow-2xl border-white/5"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-6 py-4">CANDIDATE</th>
                  <th className="px-6 py-4">SCORE</th>
                  <th className="px-6 py-4">EXPERIENCE</th>
                  <th className="px-6 py-4">PIPELINE TRANSITION</th>
                  <th className="px-6 py-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {currentCandidates.length > 0 ? (
                  currentCandidates.map((candidate, index) => {
                    const isProcessing = movingId === candidate.funnel_id;
                    const actions = getQuickActionsList(activeTab);
                    
                    return (
                      <motion.tr 
                        key={candidate.funnel_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`table-row group ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-white group-hover:bg-indigo-600 transition-all">
                              {candidate.name?.charAt(0) || 'C'}
                            </div>
                            <div>
                               <h4 className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                                 {candidate.name || 'Anonymous Asset'}
                               </h4>
                               <p className="text-xs text-slate-600 font-medium lowercase">
                                 {candidate.email}
                               </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-12 text-xs font-bold text-indigo-400">{candidate.match_score}%</div>
                              <div className="flex-1 max-w-[80px] h-1 bg-white/5 rounded-full overflow-hidden">
                                 <motion.div initial={{ width: 0 }} animate={{ width: `${candidate.match_score}%` }} className="h-full bg-indigo-500" />
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">
                           {candidate.experience_years || '0'} Years
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative max-w-[180px]">
                            <select
                              onChange={(e) => moveCandidate(candidate.funnel_id, e.target.value)}
                              value=""
                              className="appearance-none w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 focus:border-indigo-500/50 outline-none transition-all shadow-inner"
                            >
                              <option value="" disabled className="bg-slate-950 text-slate-600">Move Pipeline...</option>
                              {stages.filter(s => s.key !== activeTab).map(stage => (
                                <option key={stage.key} value={stage.key} className="bg-slate-950 text-white">{stage.label}</option>
                              ))}
                            </select>
                            <svg className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                             {actions.slice(0, 1).map((action, i) => (
                               <button
                                 key={i}
                                 onClick={() => handleQuickAction(candidate.funnel_id, action.to)}
                                 className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                   action.to === 'rejected' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-600 hover:text-white'
                                 }`}
                               >
                                 {action.label}
                               </button>
                             ))}
                             <button
                               onClick={() => handleDelete(candidate.funnel_id)}
                               className="p-2.5 bg-white/[0.03] text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                             >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                             </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-xs font-bold text-slate-700 uppercase tracking-widest">
                       Pipeline Phase Empty
                    </td>
                  </tr>
                )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Funnel;
