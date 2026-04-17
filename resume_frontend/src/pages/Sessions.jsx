import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, asList } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ company_name: '', hr_name: '', job_role: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') navigate('/dashboard', { replace: true });
  }, [user?.role, navigate]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await api.listJobSessions();
        setSessions(asList(response.data));
      } catch (err) {
        setError('Mission log corrupted or offline.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleSelectSession = (session) => {
    const sessionId = session.id;
    localStorage.setItem('session_id', sessionId);
    localStorage.setItem('job_session_id', sessionId);
    localStorage.setItem('activeSession', JSON.stringify({
      id: session.id,
      name: session.company_name || session.job_role || session.job_title,
      description: session.job_role || session.job_title,
      created_at: session.created_at,
      resume_count: session.resume_count || 0
    }));
    navigate('/dashboard');
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Terminate this mission?')) return;
    try {
      setDeletingId(id);
      await api.deleteJobSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (localStorage.getItem('session_id') === String(id)) {
        localStorage.removeItem('session_id');
      }
    } catch (err) {
      alert('Mission termination failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.updateJobSession(editing.id, editForm);
      setSessions(prev => prev.map(s => s.id === editing.id ? { ...s, ...res.data } : s));
      setEditing(null);
    } catch (err) {
      alert('Update rejected by core.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden selection:bg-indigo-500/30 font-sans">
      
      {/* HUD Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[20%] w-[60%] h-[60%] bg-indigo-600/5 blur-[150px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] bg-violet-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Strategic Topbar */}
      <nav className="relative z-50 px-10 py-6 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl flex justify-between items-center">
         <Link to="/" className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="text-lg font-black text-white tracking-tighter uppercase">Recruiter <span className="text-indigo-500">AI</span></span>
         </Link>
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400">
                  {user?.email?.charAt(0).toUpperCase()}
               </div>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:block">{user?.email}</span>
            </div>
            <button onClick={logout} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-rose-500 transition-colors">Sign Out</button>
         </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-10 py-20">
         <div className="text-center mb-20 space-y-6">
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
               Establish <span className="text-indigo-500">Mission.</span>
            </h1>
            <p className="text-slate-500 text-sm font-black uppercase tracking-[0.4em]">Select active deployment or initiate new mandate</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* New Mission Card */}
            <button 
              onClick={() => navigate('/setup')}
              className="group p-6 glass-card border-dashed !border-indigo-500/30 flex flex-col items-center justify-center gap-4 hover:!bg-indigo-600/5 transition-all duration-500 min-h-[220px]"
            >
               <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
               </div>
               <div className="space-y-1 text-center">
                  <p className="text-lg font-black text-white uppercase tracking-tight">New Mandate</p>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Initialize Talent Search</p>
               </div>
            </button>

            {/* Existing Missions */}
            {sessions.map((session) => (
               <motion.div
                 key={session.id}
                 layoutId={session.id}
                 onClick={() => handleSelectSession(session)}
                 className="group p-6 glass-card border-white/5 hover:border-indigo-500/30 cursor-pointer flex flex-col justify-between relative overflow-hidden min-h-[220px]"
               >
                  <div>
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={(e) => { e.stopPropagation(); setEditing(session); setEditForm({ company_name: session.company_name, hr_name: session.hr_name, job_role: session.job_role }); }} className="p-2 bg-white/5 rounded-lg text-slate-600 hover:text-white transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                           </button>
                           <button onClick={(e) => handleDelete(e, session.id)} className="p-2 bg-white/5 rounded-lg text-slate-600 hover:text-rose-500 transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </div>
                     </div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-1 group-hover:text-indigo-400 transition-colors truncate">{session.company_name}</h3>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{session.job_role || session.job_title}</p>
                  </div>
                  
                  <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                     <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Talent Load</p>
                        <p className="text-xs font-black text-white">{session.resume_count || 0} Profiles</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Last Match</p>
                        <p className="text-xs font-black text-white">{new Date(session.created_at).toLocaleDateString()}</p>
                     </div>
                  </div>
                  
                  {/* Subtle Progress Bar */}
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
                     <div className="h-full bg-indigo-500/50 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  </div>
               </motion.div>
            ))}
         </div>
      </main>

      <AnimatePresence>
         {editing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" />
               <motion.div layoutId={editing.id} className="relative w-full max-w-sm glass-card p-8 space-y-6 border-white/10 shadow-2xl">
                  <div className="text-center space-y-2">
                     <h3 className="text-xl font-black text-white uppercase tracking-tighter">Modify Mandate</h3>
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Update mission parameters</p>
                  </div>
                  <form onSubmit={handleSaveEdit} className="space-y-5">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Client Identity</label>
                        <input required value={editForm.company_name} onChange={(e) => setEditForm(p => ({...p, company_name: e.target.value}))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold focus:border-indigo-500/50 outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Job Specification</label>
                        <input required value={editForm.job_role} onChange={(e) => setEditForm(p => ({...p, job_role: e.target.value}))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold focus:border-indigo-500/50 outline-none" />
                     </div>
                     <div className="flex gap-4 pt-2">
                        <button type="submit" disabled={saving} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20">{saving ? 'Syncing...' : 'Commit Changes'}</button>
                        <button type="button" onClick={() => setEditing(null)} className="px-6 py-3.5 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Abort</button>
                     </div>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default Sessions;
