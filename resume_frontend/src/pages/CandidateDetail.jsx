import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, http, deleteResume } from '../services/api';

// ✨ PREMIUM RESUME TEXT VIEWER ✨
const ResumeTextDisplay = ({ text, maxLength = 1500 }) => {
  const [expanded, setExpanded] = useState(false);

  const formattedSections = useMemo(() => {
    if (!text) return [];
    const sectionPatterns = [
      /^\s*(EXPERIENCE|WORK\s*EXPERIENCE|PROFESSIONAL\s*EXPERIENCE)/gim,
      /^\s*(EDUCATION|ACADEMIC)/gim,
      /^\s*(SKILLS|TECHNICAL\s*SKILLS|CORE\s*SKILLS)/gim,
      /^\s*(PROJECTS|PROJECT)/gim,
      /^\s*(SUMMARY|PROFILE|OBJECTIVE)/gim,
      /^\s*(CERTIFICATIONS|CERTIFICATES)/gim,
      /^\s*(LANGUAGES)/gim,
    ];

    const sections = [];
    let currentSection = { title: 'General Overview', content: '' };
    const lines = text.split('\n');

    lines.forEach((line) => {
      const isHeader = sectionPatterns.some(pattern => {
        pattern.lastIndex = 0;
        return pattern.test(line.trim());
      });

      if (isHeader && line.trim().length < 50) {
        if (currentSection.content.trim()) sections.push(currentSection);
        currentSection = { title: line.trim().replace(/[^a-zA-Z\s]/g, ''), content: '' };
      } else {
        currentSection.content += line + '\n';
      }
    });

    if (currentSection.content.trim()) sections.push(currentSection);
    return sections.length > 0 ? sections : [{ title: 'Raw Content', content: text }];
  }, [text]);

  if (!text) return null;

  return (
    <div className="space-y-6">
      {formattedSections.map((section, idx) => (
        <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">
            {section.title}
          </h4>
          <div className="text-sm text-slate-400 whitespace-pre-line leading-relaxed font-medium">
            {section.content.trim()}
          </div>
        </div>
      ))}
      
      <div className="pt-4 border-t border-white/5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          {expanded ? '▲ Hide Full Feed' : `▼ View Full Metadata (${text.length} chars)`}
        </button>
        
        <AnimatePresence>
          {expanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 bg-slate-950 p-6 rounded-2xl border border-white/5 overflow-hidden"
            >
              <pre className="text-[11px] text-slate-500 whitespace-pre-wrap font-mono leading-relaxed">
                {text}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingResume, setDeletingResume] = useState(false);

  useEffect(() => {
    const normalizedId = (!id || id === 'undefined' || id === 'null') ? undefined : id;
    if (!normalizedId) {
      setError(`Invalid profile request.`);
      setLoading(false);
      return;
    }

    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const response = await api.getCandidate(normalizedId);
        setCandidate(response.data);
      } catch (err) {
        setError('Candidate profile trace lost or unauthorized.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [id]);

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Wipe resume data permanently?')) return;
    try {
      setDeletingResume(true);
      await deleteResume(resumeId);
      setCandidate(prev => ({
        ...prev,
        resumes: prev.resumes.filter(r => r.id !== resumeId)
      }));
    } catch (err) {
      alert('Sync error: Data deletion failed.');
    } finally {
      setDeletingResume(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[600px]">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-slate-500 font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">Syncing Profile Stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-12 glass-card text-center">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
           <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
           </svg>
        </div>
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">{error}</h2>
        <button onClick={() => navigate('/candidates')} className="mt-8 px-8 py-3 bg-white/5 border border-white/5 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Back to Directory</button>
      </div>
    );
  }

  if (!candidate) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-full">
      {/* 🧭 NAVIGATION OVERLAY 🧭 */}
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
        <div className="flex flex-col">
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Profile ID</span>
           <span className="text-xs font-mono text-indigo-400 font-bold">#{candidate.id?.toString().padStart(6, '0')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 👤 SIDEBAR - PROFILE SNAPSHOT 👤 */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 border-indigo-500/10 sticky top-24 shadow-2xl shadow-indigo-500/5 group"
          >
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-indigo-600 to-violet-600 p-[1px] mb-8 group-hover:rotate-6 transition-transform duration-500 shadow-2xl shadow-indigo-600/30">
               <div className="w-full h-full rounded-[2rem] bg-slate-950 flex items-center justify-center text-2xl font-black text-white">
                 {candidate.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
               </div>
            </div>

            <h1 className="text-3xl font-black text-white tracking-tighter mb-1">{candidate.name}</h1>
            <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-8">{candidate.email}</p>

            <div className="space-y-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pipeline Level</span>
                <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                   {candidate.status || 'Applied'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Tenacity</span>
                <span className="text-sm font-black text-slate-200">{candidate.experience_years || '0'} Years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location Origin</span>
                <span className="text-sm font-bold text-slate-200">{candidate.location || 'Remote Opt'}</span>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-white/10 grid grid-cols-1 gap-3">
               <a 
                 href={`mailto:${candidate.email}`}
                 className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-center font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
               >
                 Contact Talent
               </a>
            </div>
          </motion.div>
        </div>

        {/* 📄 MAIN - CAREER FEED 📄 */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Core Stack */}
          <section className="glass-card p-10">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                 Technical Stack <span className="h-[1px] flex-1 bg-white/5"></span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {(candidate.extracted_skills || candidate.skills || []).map((skill, index) => (
                <span key={index} className="px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-black uppercase text-indigo-400 tracking-wider shadow-lg">
                  {skill}
                </span>
              ))}
              {(!candidate.extracted_skills && !candidate.skills) && <span className="text-slate-700 font-bold uppercase tracking-widest text-[10px]">No Stack Data Found</span>}
            </div>
          </section>

          {/* Professional History */}
          <section className="glass-card p-10">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                 Career Timeline <span className="h-[1px] flex-1 bg-white/5"></span>
            </h3>
            {candidate.experience?.length > 0 ? (
              <div className="space-y-10 pl-4 border-l border-white/5">
                {candidate.experience.map((exp, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-[21px] top-0 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    <div className="space-y-1">
                      <p className="text-lg font-black text-white">{exp.role || 'Tenure Entry'}</p>
                      <div className="flex items-center gap-3 text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
                        <span>{exp.company}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span className="text-slate-500">{exp.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-700 font-bold uppercase tracking-widest text-[10px]">No History Captured</p>
            )}
          </section>

          {/* Resume Deep Dive */}
          <section className="glass-card p-10 bg-indigo-500/[0.01]">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                 Document Intel <span className="h-[1px] flex-1 bg-white/5"></span>
            </h3>
            <div className="space-y-8">
              {candidate.resumes && candidate.resumes.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-4 p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                    <a
                      href={candidate.resumes[0].file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[140px] px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-center font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      View Source PDF
                    </a>
                    <button
                      onClick={() => handleDeleteResume(candidate.resumes[0].id)}
                      disabled={deletingResume}
                      className="px-6 py-4 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      Wipe Data
                    </button>
                  </div>
                  
                  {candidate.resumes[0].text ? (
                    <ResumeTextDisplay text={candidate.resumes[0].text} />
                  ) : (
                    <div className="p-8 text-center bg-slate-900/20 rounded-2xl border border-dashed border-white/10">
                       <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No Parsed Metadata Available</p>
                    </div>
                  )}
                </>
              ) : (
                 <div className="p-12 text-center bg-slate-950/50 rounded-2xl border border-dashed border-white/10">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No Documents on File</p>
                 </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;
