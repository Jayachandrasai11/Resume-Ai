import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobStore } from '../store/useJobStore';
import { http } from '../services/api';

const MatchResults = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const store = useJobStore();
  const { selectedJob, searchResults, searchType, isSearchMode, setSelectedStage, setSelectedCandidates } = store;
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedCandidates, setSelectedCandidatesLocal] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const sessionId = localStorage.getItem('job_session_id') || localStorage.getItem('session_id');
    if (!sessionId) { navigate('/jobs'); return; }

    if (!isSearchMode || !searchResults || searchResults.length === 0) {
      const fetchResults = async () => {
        try {
          const response = await http.get(`/jobs/${jobId}/match/`, { params: { session_id: sessionId, limit: 50 } });
          const results = response.data?.results || response.data || [];
          if (results.length === 0) { navigate('/jobs'); return; }
        } catch (err) { navigate('/jobs'); return; }
      };
      fetchResults();
    }

    const timer = setTimeout(() => {
      setHasInitialized(true);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [jobId, navigate, isSearchMode, searchResults]);

  const hasResults = isSearchMode && searchResults && searchResults.length > 0;

  const modeDisplay = {
    'smart': 'Smart Match',
    'deep': 'AI Deep Search',
    'exact': 'Exact Filter'
  };

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidatesLocal(prev => 
      prev.includes(candidateId) ? prev.filter(id => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === searchResults.length) {
      setSelectedCandidatesLocal([]);
    } else {
      setSelectedCandidatesLocal(searchResults.map(c => c.candidate_id || c.id));
    }
  };

  const handleSaveToFunnel = async () => {
    if (selectedCandidates.length === 0) return;
    setIsSaving(true);
    try {
      const candidateData = selectedCandidates.map(candidateId => {
        const candidate = searchResults.find(c => (c.candidate_id || c.id) === candidateId);
        return {
          candidate_id: candidateId,
          match_percentage: candidate?.match_percentage || candidate?.similarity_score || candidate?.match_score || 0
        };
      });
      
      const response = await http.post(`/jobs/${jobId}/funnel/add/`, {
        candidate_ids: selectedCandidates,
        candidate_data: candidateData,
        stage: 'applied',
        match_type: searchType
      });

      if (response.status === 200 || response.status === 201) {
        setSelectedStage('applied');
        setSelectedCandidates(selectedCandidates);
        navigate(`/jobs/${jobId}/funnel`);
      }
    } catch (error) {
      alert('Error saving candidates to funnel: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasInitialized || isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[600px]">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-slate-500 font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">Aggregating Results...</p>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-12 glass-card text-center">
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
           <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
           </svg>
        </div>
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">No Active Matches</h2>
        <button onClick={() => navigate(`/jobs/${jobId}/match`)} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg active:scale-95">Re-run Match</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-full">
      {/* 🔮 RESULTS HEADER 🔮 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] tracking-[0.4em] uppercase">
            <span className="w-8 h-[1px] bg-indigo-500/50"></span>
            Match Output [{modeDisplay[searchType]}]
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter leading-none">
            Talent <span className="text-indigo-500">Analytics</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Found {searchResults.length} candidates matching <span className="text-slate-300">"{selectedJob?.title}"</span></p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { store.resetAllMatchState(); navigate('/jobs'); }}
            className="px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Drop Search
          </button>
          <button
            onClick={handleSaveToFunnel}
            disabled={isSaving || selectedCandidates.length === 0}
            className={`px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 ${(isSaving || selectedCandidates.length === 0) ? 'opacity-50 grayscale' : ''}`}
          >
            {isSaving ? 'Syncing...' : `Export to Funnel (${selectedCandidates.length})`}
          </button>
        </div>
      </div>

      {/* 📋 RESULTS LOG 📋 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-5 w-16">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.length === searchResults.length && searchResults.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded-lg border-white/10 bg-slate-900 text-indigo-500 focus:ring-0 cursor-pointer"
                    />
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Candidate</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Expertises</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Experience</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">AI Score</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Intel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {searchResults.map((candidate, index) => {
                const candidateId = candidate.candidate_id || candidate.id;
                const isSelected = selectedCandidates.includes(candidateId);
                const rawExp = candidate.experience_years ?? candidate.experience ?? candidate.years_of_experience;
                const displayExp = (rawExp != null && rawExp !== '' && !isNaN(parseFloat(rawExp))) ? `${parseFloat(rawExp)}Y` : '—';
                
                return (
                  <motion.tr 
                    key={candidateId || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`table-row group transition-colors duration-300 ${isSelected ? 'bg-indigo-500/[0.03]' : ''}`}
                  >
                    <td className="px-6 py-5">
                       <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectCandidate(candidateId)}
                          className={`w-5 h-5 rounded-lg border-white/10 bg-slate-900 text-indigo-500 focus:ring-0 cursor-pointer transition-all ${isSelected ? 'scale-110 shadow-lg shadow-indigo-500/20' : ''}`}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${isSelected ? 'from-indigo-600 to-violet-600' : 'from-slate-900 to-slate-800'} border border-white/5 flex items-center justify-center text-[10px] font-black text-white transition-all duration-500 shadow-lg`}>
                          {candidate.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{candidate.name || 'Anonymous'}</p>
                          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{candidate.email || 'hidden@profile'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2 max-w-[280px]">
                        {(Array.isArray(candidate.skills) ? candidate.skills : 
                          (typeof candidate.skills === 'string' ? candidate.skills.split(',') : 
                          Object.values(candidate.skills || {}))).slice(0, 3).map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-900 border border-white/5 rounded text-[9px] font-black uppercase text-indigo-400/80 tracking-tighter">
                            {typeof skill === 'object' ? 'Expertise' : skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-slate-400">
                      {displayExp}
                    </td>
                    <td className="px-6 py-5 text-center">
                       {(() => {
                          const raw = candidate.match_percentage || candidate.similarity_score || candidate.score || candidate.match_score || 0;
                          let score = typeof raw === 'number' ? raw : parseFloat(raw) || 0;
                          if (score <= 1) score *= 100;
                          return (
                            <div className="inline-flex flex-col items-center">
                               <span className={`text-lg font-black tracking-tighter ${score > 80 ? 'text-emerald-400' : score > 60 ? 'text-indigo-400' : 'text-amber-400'}`}>
                                 {score.toFixed(1)}%
                               </span>
                               <div className="w-12 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                                  <div className={`h-full ${score > 80 ? 'bg-emerald-500' : score > 60 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${score}%` }}></div>
                               </div>
                            </div>
                          );
                       })()}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button
                         onClick={() => candidateId && navigate(`/candidates/${candidateId}`)}
                         className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-[10px] font-black uppercase text-slate-500 hover:text-white rounded-xl border border-white/5 transition-all active:scale-95"
                       >
                         Profile
                       </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MatchResults;
