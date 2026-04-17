import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Neural keys do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.register({ email, password, full_name: name, role: 'recruiter' });
      if (response.status >= 200 && response.status < 300) {
        navigate('/login', { state: { message: 'Synchronization successful. Please authorize access.' } });
      } else {
        setError('Synchronization failure.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Access denied by security layer.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordState = (pwd) => {
    const p = String(pwd || '');
    return {
      len: p.length >= 8,
      upper: /[A-Z]/.test(p),
      num: /[0-9]/.test(p),
      sym: /[^A-Za-z0-9]/.test(p)
    };
  };

  const pwdState = getPasswordState(password);

  return (
    <div className="min-h-screen bg-[#020617] flex overflow-hidden selection:bg-indigo-500/30">
      
      {/* ATMOSPHERIC BACKDROP */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[150px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      {/* 🏛️ REFINED BRAND SECTION 🏛️ */}
      <div className="hidden lg:flex w-1/2 p-20 flex-col justify-between relative border-r border-white/5 bg-white/[0.01]">
         <Link to="/" className="flex items-center gap-4 group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 group-hover:scale-110 transition-transform">
               <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="text-xl font-black text-white tracking-tighter uppercase">Recruiter <span className="text-indigo-500">AI</span></span>
         </Link>

         <div className="space-y-6">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-[0.4em]">
               <span className="w-12 h-[2px] bg-indigo-500"></span>
               Quantum Talent Acquisition
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter leading-[0.9] uppercase">
               Redefine <br /><span className="text-violet-500">Excellence.</span>
            </h1>
            <p className="text-slate-400 text-base font-medium max-w-md leading-relaxed">
               Join the neural network of recruiters using Recruiter AI to scale their human capital strategic advantage.
            </p>
         </div>

         <div className="flex items-center gap-6 py-8 border-t border-white/5 font-bold text-xs">
            <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 uppercase tracking-widest shadow-lg">Enterprise Ready</div>
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 uppercase tracking-widest shadow-lg">SOC-2 Verified</div>
         </div>
      </div>

      {/* 🧬 ONBOARDING TERMINAL 🧬 */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-y-auto no-scrollbar py-20">
         <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className="w-full max-w-sm space-y-10"
         >
            <div className="text-center space-y-3">
               <h2 className="text-3xl font-black text-white tracking-tight uppercase">Signup</h2>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Establish your digital strategic identity</p>
            </div>

            <AnimatePresence>
               {error && (
                  <motion.div 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-widest text-center shadow-lg"
                  >
                     {error}
                  </motion.div>
               )}
            </AnimatePresence>

            <form onSubmit={handleSignup} className="space-y-5">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Display Identification</label>
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-white text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                    placeholder="Full Legal Name"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Communication Node (Email)</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                    placeholder="name@nexus.ai"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Access Key Configuration</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                    placeholder="••••••••"
                  />
                  <div className="grid grid-cols-4 gap-2 pt-2 px-1">
                     <div className={`h-1 rounded-full transition-all ${pwdState.len ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
                     <div className={`h-1 rounded-full transition-all ${pwdState.upper ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
                     <div className={`h-1 rounded-full transition-all ${pwdState.num ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
                     <div className={`h-1 rounded-full transition-all ${pwdState.sym ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Confirm Authorization</label>
                  <input 
                    type="password" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-white/[0.04] border rounded-xl px-5 py-4 text-white text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-600 shadow-inner ${confirmPassword ? (password === confirmPassword ? 'border-emerald-500/30' : 'border-rose-500/30') : 'border-white/10'}`}
                    placeholder="••••••••"
                  />
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
               >
                  {loading ? 'Synchronizing...' : 'Signup'}
               </button>
            </form>

            <p className="text-center text-xs font-bold text-slate-600 uppercase tracking-[0.2em] pt-8 border-t border-white/5">
               Existing Authority? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Login</Link>
            </p>
         </motion.div>
      </div>
    </div>
  );
};

export default Signup;
