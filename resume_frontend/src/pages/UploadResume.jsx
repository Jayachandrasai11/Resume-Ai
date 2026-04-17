import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { http } from '../services/api';

const UploadResume = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState([]);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) validateAndAddFiles(selectedFiles);
  };

  const validateAndAddFiles = (selectedFiles) => {
    const allowedExtensions = ['.pdf', '.docx'];
    const validFiles = [];
    let hasInvalid = false;

    selectedFiles.forEach(file => {
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (allowedExtensions.includes(extension)) {
        validFiles.push(file);
      } else {
        hasInvalid = true;
      }
    });

    if (hasInvalid) setError('Format Error: Only PDF and DOCX files are accepted.');
    else setError('');

    setFiles(prev => [...prev, ...validFiles]);
    setUploadStatus([]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) validateAndAddFiles(droppedFiles);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setLoading(true);
    setError('');
    const newStatus = files.map(f => ({ name: f.name, status: 'pending' }));
    setUploadStatus(newStatus);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('resume', file);

      const jobSessionId = localStorage.getItem('job_session_id');
      if (jobSessionId) formData.append('job_session_id', jobSessionId);

      setUploadStatus(prev => {
        const next = [...prev];
        next[i] = { ...next[i], status: 'uploading' };
        return next;
      });

      try {
        const response = await http.post('/upload-resume/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setUploadStatus(prev => {
          const next = [...prev];
          next[i] = { 
            ...next[i], 
            status: 'success', 
            message: `Identified: ID-${response.data.candidate_id}` 
          };
          return next;
        });
      } catch (err) {
        setUploadStatus(prev => {
          const next = [...prev];
          next[i] = { 
            ...next[i], 
            status: 'error', 
            message: err.response?.data?.error || 'Extraction failed.' 
          };
          return next;
        });
      }
    }
    setLoading(false);
    setFiles([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-full">
      {/* 🔮 REFINED HEADER 🔮 */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 px-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
            <span className="w-8 h-[2px] bg-indigo-500"></span>
            Data Ingestion Terminal
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            Acquire <span className="text-indigo-500">Talent Assets</span>
          </h1>
          <p className="text-slate-500 text-sm max-w-lg leading-relaxed font-medium">
             Deploy resume archives to the neural extraction engine. Supported: PDF & DOCX protocols.
          </p>
        </div>

        <button 
          onClick={() => navigate('/jobs')} 
          className="px-6 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
        >
          Return to Registry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 🛠️ UPLOAD ZONE 🛠️ */}
        <div className="lg:col-span-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative group flex flex-col items-center justify-center w-full min-h-[420px] border-2 border-dashed rounded-[3rem] transition-all duration-500 cursor-pointer overflow-hidden
                ${isDragging ? 'border-indigo-500 bg-indigo-500/[0.05] scale-[1.01] shadow-2xl' : 'border-white/10 bg-white/[0.01] hover:border-indigo-500/30 hover:bg-white/[0.02]'}
              `}
            >
              <input 
                type="file" 
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />
              
              <div className="flex flex-col items-center justify-center text-center px-10 relative z-20 pointer-events-none">
                <div className={`w-24 h-24 rounded-[2rem] mb-8 flex items-center justify-center transition-all duration-700 ${isDragging ? 'bg-indigo-600 text-white rotate-12 shadow-[0_0_30px_#6366f1]' : 'bg-slate-900 text-slate-500 group-hover:text-indigo-400 group-hover:rotate-6 shadow-xl shadow-black/30'}`}>
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-white mb-3 uppercase tracking-tight">
                   {isDragging ? 'Analyze Ready' : 'Drop Talent Vectors'}
                </h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.25em] mb-6">PDF & DOCX Protocols</p>
                <div className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-auto group-hover:bg-indigo-600 group-hover:text-white transition-all">
                   Browse Files
                </div>
              </div>

              {/* Subtler Atmospheric Accents */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_100%)] opacity-40"></div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></div>
                {error}
              </motion.div>
            )}

            {/* 📋 SELECTED REPOSITORY 📋 */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                   <div className="flex items-center justify-between px-3">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Extraction Queue ({files.length})
                     </h4>
                     <button type="button" onClick={() => setFiles([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest transition-colors">Abort All</button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {files.map((file, idx) => (
                        <div key={idx} className="glass-card p-4 flex items-center justify-between border-white/5 hover:bg-white/[0.02] transition-all">
                           <div className="flex items-center gap-4 overflow-hidden">
                             <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-indigo-400">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 0 01.707.293l5.414 5.414a1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                             </div>
                             <span className="text-xs font-bold text-slate-300 truncate">{file.name}</span>
                           </div>
                           <button type="button" onClick={() => removeFile(idx)} className="text-slate-600 hover:text-rose-500 transition-colors p-2">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                        </div>
                      ))}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 📊 UPLOAD STATUS FEED 📊 */}
            <AnimatePresence>
              {uploadStatus.length > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-950/40 border border-white/5 rounded-[2.5rem] p-10 space-y-6 shadow-2xl">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-5">Extraction Protocol Log</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {uploadStatus.map((item, idx) => (
                      <div key={idx} className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
                        item.status === 'success' ? 'bg-indigo-600/5 border-emerald-500/20 text-emerald-400' :
                        item.status === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                        'bg-indigo-600/5 border-indigo-500/20 text-indigo-400'
                      }`}>
                         <div className="flex items-center gap-5 overflow-hidden">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.status === 'uploading' ? 'animate-spin border-2 border-indigo-400 border-t-transparent' : ''}`}>
                               {item.status === 'success' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                               {item.status === 'error' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>}
                            </div>
                            <div className="truncate">
                               <p className="text-sm font-bold uppercase tracking-tight truncate">{item.name}</p>
                               <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{item.message || item.status}</span>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                  {uploadStatus.some(s => s.status === 'success') && (
                    <button onClick={() => navigate('/candidates')} className="w-full py-5 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all">Proceed to Talent Index</button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 🔥 ACTION BUTTON 🔥 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || files.length === 0}
                className={`w-full py-6 rounded-2xl text-sm font-bold uppercase tracking-[0.25em] transition-all relative overflow-hidden shadow-2xl active:scale-[0.98] ${loading || files.length === 0 ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'}`}
              >
                {loading ? 'Executing Extraction...' : `Commence Vetting [${files.length} Assets]`}
                {loading && <div className="absolute inset-0 bg-white/5 animate-pulse"></div>}
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-8 mt-16 py-10 border-t border-white/5">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest opacity-60">Distributed Extraction Node Active</p>
                <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
                    <button onClick={() => navigate('/gmail-import')} className="group flex items-center gap-3 text-indigo-500 hover:text-white transition-all">
                       <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 transition-all font-bold text-[10px]">G</div>
                       <span className="text-xs font-bold uppercase tracking-widest">Deploy Google Cloud Sink</span>
                    </button>
                    <div className="w-[1px] h-4 bg-white/10 hidden md:block"></div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Encrypted SSL/TLS Protocols Enabled</p>
                </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadResume;
