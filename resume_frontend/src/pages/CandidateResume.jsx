import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ResumeViewer from '../components/ResumeViewer';
import { http } from '../services/api';

const CandidateResume = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resumeUrl, setResumeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        const response = await http.get(`/resumes/${id}/`);
        setResumeUrl(response.data.resume_url || response.data.file_url || '');
      } catch (err) {
        setError('Document trace failed. Source file might be offline.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchResume();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[600px]">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-slate-500 font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">Streaming Document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-12 glass-card text-center">
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">{error}</h2>
        <button onClick={() => navigate(-1)} className="mt-8 px-8 py-3 bg-white/5 border border-white/5 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Return to Profile</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 h-[calc(100vh-8rem)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full glass-card overflow-hidden flex flex-col border-indigo-500/10 shadow-2xl"
      >
        <div className="px-8 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Source Intel</p>
              <h1 className="text-lg font-black text-white tracking-tight">Resume Preview</h1>
            </div>
          </div>
          {resumeUrl && (
            <a 
              href={resumeUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              External Access
            </a>
          )}
        </div>

        <div className="flex-1 bg-slate-950 p-2 overflow-hidden">
          {resumeUrl ? (
            <ResumeViewer
              url={resumeUrl}
              title="Candidate Resume"
              className="w-full h-full rounded-xl border-none"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-700 opacity-50 space-y-4">
               <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 0 01.707.293l5.414 5.414a1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               <span className="text-[10px] uppercase font-black tracking-widest">No Document Link Found</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CandidateResume;
