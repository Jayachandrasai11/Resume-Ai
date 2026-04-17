import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
  const navigate = useNavigate();
  const { user, refreshUserProfile } = useAuth();
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [meError, setMeError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [saving, setSaving] = useState(false);

  const fullName = me?.full_name || user?.full_name || user?.display_name || 'Recruiter';
  const role = me?.role || user?.role || 'recruiter';
  
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Sync with Auth
  useEffect(() => {
    if (user) {
      setMe(user);
      setEditForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoadingMe(true);
        const [meRes, sessionRes, summaryRes, funnelRes] = await Promise.all([
          api.me().catch(() => ({ data: user })),
          api.getJobSession(localStorage.getItem('job_session_id')).catch(() => ({ data: null })),
          api.dashboardSummary().catch(() => ({ data: {} })),
          api.dashboardFunnel().catch(() => ({ data: {} }))
        ]);

        setMe(meRes.data);
        setActiveSession(sessionRes.data);
        
        const funnelData = funnelRes.data || {};
        setStats({
          resumesProcessed: summaryRes.data?.total_candidates || 0,
          rankingsGenerated: summaryRes.data?.total_candidates || 0,
          interviewsScheduled: funnelData.interview || 0,
          activeJobs: summaryRes.data?.total_jobs || 0
        });
      } catch (err) {
        console.error('Profile refresh error:', err);
      } finally {
        setLoadingMe(false);
        setSessionLoading(false);
        setStatsLoading(false);
      }
    };
    fetchProfileData();
  }, [user]);

  const [stats, setStats] = useState({
    resumesProcessed: 0,
    rankingsGenerated: 0,
    interviewsScheduled: 0,
    activeJobs: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.updateMe(editForm);
      await refreshUserProfile();
      setMe(res.data);
      setIsEditing(false);
    } catch (err) {
      setMeError('Synchronization failed. Check connection.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
     if (!name) return 'U';
     return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-10 transition-all duration-500">
      
      {/* Header Strategy */}
      <div className="flex justify-between items-end">
         <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Profile <span className="text-indigo-500">Intelligence</span></h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-3 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
               Account Role: {role}
            </p>
         </div>
         <button 
           onClick={() => navigate(-1)}
           className="px-5 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all active:scale-95"
         >
           ← Exit Terminal
         </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        
        {/* Identity Cluster */}
        <div className="xl:col-span-1 space-y-8">
           <div className="flex-1 glass-card p-8 border-white/5">
              <div className="flex flex-col items-center text-center">
                 <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-indigo-600 to-violet-600 p-[2px] mb-6 shadow-2xl shadow-indigo-500/30">
                    <div className="w-full h-full bg-slate-950 rounded-[1.9rem] flex items-center justify-center text-2xl font-black text-white p-2">
                       {getInitials(fullName)}
                    </div>
                 </div>

                 <AnimatePresence mode="wait">
                 {!isEditing ? (
                    <motion.div 
                      key="view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                       <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{fullName}</h2>
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">{role} Authority</p>
                       <button 
                         onClick={() => setIsEditing(true)}
                         className="px-8 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all mt-4"
                       >
                         Edit Profile
                       </button>
                    </motion.div>
                 ) : (
                    <motion.form 
                      key="edit"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onSubmit={handleSaveProfile} 
                      className="w-full space-y-4 pt-4"
                    >
                       <div className="text-left space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">First ID</label>
                          <input 
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-indigo-500/50 outline-none"
                            value={editForm.first_name}
                            onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                          />
                       </div>
                       <div className="text-left space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Second ID</label>
                          <input 
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-indigo-500/50 outline-none"
                            value={editForm.last_name}
                            onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                          />
                       </div>
                       <div className="flex gap-4 pt-4">
                          <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">{saving ? 'Saving...' : 'Save'}</button>
                          <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                       </div>
                    </motion.form>
                 )}
                 </AnimatePresence>

                 {meError && <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest mt-6">{meError}</p>}
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Email Address</span>
                    <span className="text-[11px] font-black text-white lowercase tracking-tight">{loadingMe ? '...' : (me?.email || '—')}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Account Status</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${me?.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                       {me?.is_active ? 'Active' : 'Disabled'}
                    </span>
                 </div>
              </div>
           </div>

           <div className="glass-card p-6 border-violet-500/10">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4">
                 <button onClick={() => navigate('/setup')} className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-indigo-500/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Create Job Session</span>
                 </button>
                 <button onClick={() => navigate('/upload')} className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-violet-500/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Upload Resumes</span>
                 </button>
              </div>
           </div>
        </div>

        {/* Tactical Feed */}
        <div className="xl:col-span-2 space-y-12">
            
            {/* Session Monitor */}
            <div className="glass-card overflow-hidden border-indigo-500/20">
               <div className="px-8 py-5 bg-indigo-600/10 border-b border-indigo-500/20 flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-tight flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                     Active Job Tracking
                  </h3>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Live Updates</span>
               </div>
               <div className="p-8">
                  {sessionLoading ? (
                     <div className="h-24 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full" /></div>
                  ) : activeSession ? (
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                        <div className="space-y-4">
                           <h4 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{activeSession.company_name}</h4>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed max-w-lg">{activeSession.job_role || activeSession.job_title}</p>
                           <div className="flex gap-8 pt-4">
                              <div>
                                 <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Mandate Start</p>
                                 <p className="text-xs font-black text-white">{new Date(activeSession.created_at).toLocaleDateString()}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Talent Load</p>
                                 <p className="text-xs font-black text-indigo-400">{activeSession.resume_count || 0} Entities</p>
                              </div>
                           </div>
                        </div>
                        <button onClick={() => navigate('/sessions')} className="px-10 py-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all">View Analytics Detail</button>
                     </div>
                  ) : (
                     <div className="text-center py-12 space-y-8">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">No Active Job Detected</p>
                        <button onClick={() => navigate('/sessions')} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95">Start Hiring Session</button>
                     </div>
                  )}
               </div>
            </div>

            {/* Performance Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {[
                  { label: 'Total Resumes', value: stats.resumesProcessed, color: 'indigo' },
                  { label: 'Rankings Generated', value: stats.rankingsGenerated, color: 'violet' },
                  { label: 'Interviews Scheduled', value: stats.interviewsScheduled, color: 'amber' },
                  { label: 'Active Jobs', value: stats.activeJobs, color: 'emerald' }
               ].map((stat, idx) => (
                  <div key={idx} className="glass-card p-6 group hover:translate-y-[-4px] transition-all duration-300">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">{stat.label}</p>
                     <div className="flex items-end justify-between">
                        <h3 className="text-4xl font-black text-white tracking-tighter">{statsLoading ? '...' : stat.value}</h3>
                        <div className={`w-10 h-1 rounded-full bg-${stat.color}-500 group-hover:w-20 transition-all duration-500`} />
                     </div>
                  </div>
               ))}
            </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
