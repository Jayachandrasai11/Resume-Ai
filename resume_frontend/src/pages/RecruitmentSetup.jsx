import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const RecruitmentSetup = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    hrName: '',
    jobRole: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (user?.role === 'admin') {
        navigate('/dashboard', { replace: true });
        return;
      }
      const response = await api.createJobSession({
        company_name: formData.companyName,
        hr_name: formData.hrName,
        job_role: formData.jobRole,
      });

      const sessionId = response.data.session_id || response.data.id;
      const sessionData = response.data;
      if (sessionId) {
        localStorage.setItem('job_session_id', sessionId);
        localStorage.setItem('session_id', sessionId);
        localStorage.setItem('activeSession', JSON.stringify({
          id: sessionId,
          name: sessionData?.company_name || formData.companyName,
          description: sessionData?.job_role || formData.jobRole,
          created_at: sessionData?.created_at || new Date().toISOString(),
          resume_count: 0
        }));
        navigate('/dashboard', { replace: true });
      } else {
        setError('Authorization failed. No session sequence generated.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Mission initialization sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-indigo-500/30 font-sans">
      
      {/* 🧭 NAVIGATION HUD 🧭 */}
      <nav className="relative z-50 px-10 py-6 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl flex justify-between items-center">
         <Link to="/" className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="text-lg font-black text-white tracking-tighter uppercase">Recruiter <span className="text-indigo-500">AI</span></span>
         </Link>
         <button onClick={() => navigate('/sessions')} className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Abort Mission</button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden border-white/5 shadow-2xl"
        >
          <div className="p-10 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-4">
              <span className="w-8 h-[2px] bg-indigo-500"></span>
              Session Configuration
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">Mission <span className="text-indigo-500">Briefing</span></h1>
            <p className="text-slate-500 text-sm font-medium mt-2">Specify the parameters for your next recruitment deployment.</p>
          </div>

          <div className="p-12">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-10 p-5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 text-xs font-bold uppercase tracking-widest text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Client Entity</label>
                      <input 
                        type="text" 
                        name="companyName" 
                        required 
                        value={formData.companyName} 
                        onChange={handleChange}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-white text-sm font-bold focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 shadow-inner" 
                        placeholder="e.g. Nexus Technology" 
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Mission Lead</label>
                      <input 
                        type="text" 
                        name="hrName" 
                        required 
                        value={formData.hrName} 
                        onChange={handleChange}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-white text-sm font-bold focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 shadow-inner" 
                        placeholder="e.g. Sarah Connor" 
                      />
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Target Role / Specification</label>
                   <input 
                     type="text" 
                     name="jobRole" 
                     required 
                     value={formData.jobRole} 
                     onChange={handleChange}
                     className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-5 text-white text-xl font-bold tracking-tight focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 shadow-inner" 
                     placeholder="e.g. SOFTWARE ARCHITECT" 
                   />
                </div>

                <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-10">
                   <div className="flex-1">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-relaxed">By establishng mission, you authorize the neural engine to begin indexing resumes against these specifications.</p>
                   </div>
                   <button
                     type="submit"
                     disabled={loading}
                     className="w-full md:w-auto px-14 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
                   >
                     {loading ? 'Initializing Protocol...' : 'Establish Mission'}
                   </button>
                </div>
              </form>
            </div>
          </motion.div>
      </main>
      
      {/* Visual Accents */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none -z-10" />
    </div>
  );
};

export default RecruitmentSetup;
