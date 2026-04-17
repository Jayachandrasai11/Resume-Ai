import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api, asList } from '../services/api';
import { useSessionState, SESSION_KEYS } from '../hooks/useSessionState';
import { useJobStore } from '../store/useJobStore';
import { motion, AnimatePresence } from 'framer-motion';

const Candidates = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const [filters, setFilters] = useSessionState(SESSION_KEYS.CANDIDATES_FILTERS, { searchTerm: '', statusFilter: '' });

  const { selectedJob, matches, isViewingMatches } = useJobStore();

  const locationMatches = location.state?.matches || [];
  const locationSelectedJob = location.state?.selectedJob || null;
  const locationIsViewingMatches = location.state?.isViewingMatches || false;
  
  const displayMatches = locationIsViewingMatches ? locationMatches : matches;
  const displaySelectedJob = locationIsViewingMatches ? locationSelectedJob : selectedJob;
  const displayIsViewingMatches = locationIsViewingMatches || isViewingMatches;

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    if (displayIsViewingMatches && displayMatches?.length > 0) {
      const filtered = displayMatches.filter(match => {
        const searchStr = filters.searchTerm.toLowerCase();
        const name = (match.name || match.candidate_name || '').toLowerCase();
        return name.includes(searchStr);
      });
      setFilteredCandidates(filtered);
    } else {
      const filtered = candidates.filter(candidate => {
        const searchStr = filters.searchTerm.toLowerCase();
        const name = (candidate.name || '').toLowerCase();
        const matchesStatus = filters.statusFilter === '' || candidate.status === filters.statusFilter;
        return name.includes(searchStr) && matchesStatus;
      });
      setFilteredCandidates(filtered);
    }
  }, [filters, candidates, displayMatches, displayIsViewingMatches]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await api.listCandidates();
      const list = asList(response.data);
      setCandidates(list);
      setFilteredCandidates(list);
    } catch (err) {
      setError('Talent database link offline.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (candidateId, newStatus) => {
    try {
      setUpdatingId(candidateId);
      await api.patchCandidate(candidateId, { status: newStatus });
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c));
    } catch (err) {
      alert('Sync failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[600px] bg-[#020617]">
      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="mt-6 text-slate-500 font-bold tracking-[0.2em] uppercase text-xs animate-pulse">Scanning Talent Index...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 bg-[#020617] min-h-screen">
       
       {/* 🏛️ STRATEGIC HEADER 🏛️ */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                <span className="w-8 h-[2px] bg-indigo-500"></span>
                Global Talent Repository
             </div>
             <h1 className="text-5xl font-black text-white tracking-tight uppercase leading-none">
                {displayIsViewingMatches ? 'Targeted Matches' : 'Candidate Index'}
             </h1>
             <p className="text-slate-500 text-sm font-medium">
                {displayIsViewingMatches ? `Analyzing elite matches for "${displaySelectedJob?.title || 'Selected Job'}"` : `Accessing ${candidates.length} verified professional profiles`}
             </p>
          </div>

          <div className="flex items-center gap-4">
             <Link to="/upload" className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all">
                Import Assets
             </Link>
             <button onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')} className="p-4.5 bg-white/[0.03] border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl">
                {viewMode === 'table' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
             </button>
          </div>
       </div>

       {/* 🔍 SEARCH HUD 🔍 */}
       <div className="flex flex-col md:flex-row gap-4 items-center bg-white/[0.02] border border-white/5 p-5 rounded-[2.5rem] shadow-2xl">
          <div className="relative flex-1 group">
             <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             <input 
               type="text" 
               placeholder="IDENTIFY BY NAME, EMAIL, OR SKILLS..." 
               value={filters.searchTerm}
               onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
               className="w-full bg-transparent border-none px-14 py-4 text-xs font-bold uppercase text-white tracking-widest outline-none placeholder:text-slate-700"
             />
          </div>
          <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
          <div className="flex items-center gap-3 px-4 overflow-x-auto no-scrollbar">
             {['applied', 'screening', 'interview', 'hired', 'rejected'].map(status => (
                <button 
                  key={status}
                  onClick={() => setFilters({...filters, statusFilter: filters.statusFilter === status ? '' : status})}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${filters.statusFilter === status ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/[0.03] border-white/5 text-slate-500 hover:text-white'}`}
                >
                  {status}
                </button>
             ))}
          </div>
       </div>

       {/* 📊 REFINED WORKSPACE 📊 */}
       <div className="glass-card !rounded-[2.5rem] overflow-hidden border-white/5">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-white/[0.02] border-b border-white/5">
                        <th className="px-6 py-7 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">S.No</th>
                        <th className="px-10 py-7 text-xs font-bold text-slate-500 uppercase tracking-widest">Identify</th>
                        <th className="px-10 py-7 text-xs font-bold text-slate-500 uppercase tracking-widest">Expertise Layer</th>
                        <th className="px-10 py-7 text-xs font-bold text-slate-500 uppercase tracking-widest">Tenure</th>
                        <th className="px-10 py-7 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                        <th className="px-10 py-7 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Terminal</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                     <AnimatePresence mode="popLayout">
                        {filteredCandidates.map((candidate, idx) => {
                           const cId = candidate.id || candidate.candidate_id;
                           const cName = candidate.name || candidate.candidate_name || 'Anonymous Asset';
                           const cEmail = candidate.email || 'internal@system.ai';
                           const cStatus = (candidate.status || 'applied').toLowerCase();
                           const cSkills = candidate.skills || [];

                           return (
                            <motion.tr 
                              key={cId}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.02 }}
                              className="table-row group"
                            >
                               <td className="px-6 py-7 text-center">
                                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">#{idx + 1}</span>
                               </td>
                               <td className="px-10 py-7">
                                  <div className="flex items-center gap-5">
                                     <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-white group-hover:bg-indigo-600 transition-all">
                                        {cName.charAt(0)}
                                     </div>
                                     <div>
                                        <p className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight text-sm">{cName}</p>
                                        <p className="text-xs text-slate-600 font-medium lowercase mt-1">{cEmail}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-10 py-7">
                                  <div className="flex flex-wrap gap-2 max-w-[320px]">
                                     {(Array.isArray(cSkills) ? cSkills : []).slice(0, 3).map((skill, i) => (
                                        <span key={i} className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-lg text-[10px] font-bold uppercase text-indigo-400/80 tracking-widest">{skill}</span>
                                     ))}
                                  </div>
                               </td>
                               <td className="px-10 py-7 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                  {candidate.experience_years ? `${candidate.experience_years}Y` : '—'}
                               </td>
                               <td className="px-10 py-7 text-center">
                                  <div className="relative inline-block w-40">
                                    <select 
                                      value={cStatus}
                                      onChange={(e) => handleStatusChange(cId, e.target.value)}
                                      className="appearance-none w-full bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-widest outline-none cursor-pointer hover:text-white transition-all border border-white/10 rounded-xl px-4 py-2.5 shadow-inner"
                                    >
                                       {['applied', 'screening', 'interview', 'hired', 'rejected'].map(s => (
                                          <option key={s} value={s} className="bg-slate-950 text-white">{s.toUpperCase()}</option>
                                       ))}
                                    </select>
                                    <svg className="absolute right-3 top-3 w-3 h-3 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                  </div>
                               </td>
                               <td className="px-10 py-7 text-right">
                                  <Link to={`/candidates/${cId}`} className="px-8 py-3 bg-white/[0.03] hover:bg-indigo-600 border border-white/10 rounded-[1.2rem] text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-all active:scale-95">Access Intel</Link>
                               </td>
                            </motion.tr>
                           );
                        })}
                     </AnimatePresence>
                  </tbody>
               </table>
            </div>
          ) : (
            <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
               {filteredCandidates.map((candidate, idx) => {
                  const cId = candidate.id || candidate.candidate_id;
                  const cName = candidate.name || candidate.candidate_name || 'Anonymous Asset';
                  return (
                    <motion.div 
                      key={cId}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => navigate(`/candidates/${cId}`)}
                      className="p-10 glass-card border-white/5 hover:border-indigo-500/40 cursor-pointer group !rounded-[2rem]"
                    >
                       <div className="flex justify-between items-start mb-8">
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-sm font-bold text-white group-hover:bg-indigo-600 transition-all duration-500">
                             {cName.charAt(0)}
                          </div>
                          <span className="px-4 py-1.5 bg-white/[0.03] border border-white/10 rounded-xl text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] group-hover:text-indigo-400 transition-colors">{candidate.status || 'Active'}</span>
                       </div>
                       <h3 className="text-xl font-bold text-white tracking-tight uppercase mb-2 leading-tight group-hover:text-indigo-400 transition-colors truncate">{cName}</h3>
                       <p className="text-xs font-medium text-slate-600 lowercase tracking-widest truncate mb-8">{candidate.email || 'internal@system.ai'}</p>
                       
                       <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                          {(Array.isArray(candidate.skills) ? candidate.skills : []).slice(0, 3).map((skill, i) => (
                             <span key={i} className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{skill}</span>
                          ))}
                       </div>
                    </motion.div>
                  );
               })}
            </div>
          )}
       </div>

    </div>
  );
};

export default Candidates;
