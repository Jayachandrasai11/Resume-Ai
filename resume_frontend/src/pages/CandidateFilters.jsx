import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ResumeViewer from '../components/ResumeViewer';
import { useCandidateFilters } from '../hooks/useCandidateFilters';

const CandidateFilters = () => {
  const navigate = useNavigate();
  const [previewResume, setPreviewResume] = useState(null);
  
  const {
    candidates,
    loading,
    error,
    filters,
    statusChoices,
    handleInputChange,
    handleSearch,
    handleClear,
  } = useCandidateFilters();

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-full">
      {/* 🔮 ELITE HEADER 🔮 */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] tracking-[0.4em] uppercase">
            <span className="w-8 h-[1px] bg-indigo-500/50"></span>
            Talent Acquisition
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Candidate <span className="text-indigo-500">Directory</span>
          </h1>
          <p className="text-slate-500 text-sm max-w-lg leading-relaxed font-medium">
            Search and filter your global talent pool with precision.
          </p>
        </div>

        <div className="flex items-center gap-3">
           <div className="px-5 py-3 bg-slate-900 border border-white/5 rounded-xl flex flex-col items-center min-w-[120px]">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Pooled</span>
              <span className="text-xl font-black text-white">{candidates.length}</span>
           </div>
        </div>
      </div>

      {/* 🛠️ ADVANCED FILTER BAR 🛠️ */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-8 border-indigo-500/10 shadow-2xl shadow-indigo-500/5"
      >
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleInputChange}
              placeholder="Name or Email..."
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status Phase</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleInputChange}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium appearance-none"
            >
              {statusChoices.map(choice => (
                <option key={choice.value} value={choice.value} className="bg-slate-950">{choice.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Expertise</label>
            <input
              type="text"
              name="skills"
              value={filters.skills}
              onChange={handleInputChange}
              placeholder="e.g. React, UX..."
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Experience</label>
            <input
              type="text"
              name="experience"
              value={filters.experience}
              onChange={handleInputChange}
              placeholder="Years..."
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-3 bg-white/5 hover:bg-white/10 text-slate-500 border border-white/5 rounded-xl transition-all"
              title="Reset Filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </form>
      </motion.div>

      {/* 📋 TALENT TABLE 📋 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">S.No</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Candidate</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Role</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Skills</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Syncing Directory...</p>
                    </div>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                       <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                       </svg>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">No Talent Found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {candidates.map((candidate, index) => (
                    <motion.tr 
                      key={candidate.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="table-row group"
                    >
                     <td className="px-6 py-5 text-center">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">#{index + 1}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-white/5 flex items-center justify-center text-xs font-black text-white group-hover:from-indigo-600 group-hover:to-violet-600 transition-all duration-500 shadow-lg">
                            {candidate.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{candidate.name || 'N/A'}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{candidate.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          candidate.status === 'hired' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          candidate.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          candidate.status === 'interview' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          candidate.status === 'offered' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          'bg-slate-800/10 text-slate-400 border-white/5'
                        }`}>
                          {candidate.status || 'Applied'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0 ? (
                          <div className="min-w-[120px]">
                            <p className="text-xs font-bold text-slate-200">{candidate.experience[0].role}</p>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-tight mt-0.5">{candidate.experience[0].company}</p>
                          </div>
                        ) : (
                          <span className="text-slate-700 text-[10px] font-black uppercase tracking-widest">—</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2 max-w-[280px]">
                          {(candidate.extracted_skills || candidate.skills || []).slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-slate-900 border border-white/5 rounded text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                              {skill}
                            </span>
                          ))}
                          {((candidate.extracted_skills?.length || candidate.skills?.length || 0) > 3) && (
                            <span className="text-[9px] font-black text-slate-700 self-center">
                              +{(Math.max(0, (candidate.extracted_skills?.length || 0) - 3, (candidate.skills?.length || 0) - 3))}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end items-center gap-3">
                          {candidate.resumes?.[0]?.file && (
                            <button
                              onClick={() => setPreviewResume({ url: candidate.resumes[0].file, name: candidate.name })}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
                              title="Resume Preview"
                            >
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          <Link
                            to={`/candidate/${candidate.id}`}
                            className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-slate-400 hover:text-white border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Explore
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🪄 PRO PREVIEW MODAL 🪄 */}
      <AnimatePresence>
        {previewResume && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewResume(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl h-[85vh] bg-[#020617] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Candidate Doc</p>
                    <h2 className="text-lg font-black text-white tracking-tight">{previewResume.name}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewResume(null)}
                  className="p-3 bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl border border-white/5 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 bg-slate-950 p-2 overflow-hidden">
                <ResumeViewer url={previewResume.url} title={`${previewResume.name}'s Resume`} className="h-full rounded-xl" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateFilters;
