import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Login = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, logout, isAuthenticated } = useAuth();
  
  const successMessage = location.state?.message;

  // 🔄 REDIRECT IF ALREADY AUTHENTICATED 🔄
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/sessions', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await logout();
      const response = await api.login(email, password);
      const token = response.data.access || response.data.token;
      const refreshToken = response.data.refresh;
      const userData = response.data.user;
      
      if (token && userData) {
        await login(userData, token, rememberMe, refreshToken);
        navigate('/sessions', { replace: true });
      } else {
        setError('Authorization incomplete.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex overflow-hidden selection:bg-indigo-500/30">
      
      {/* 🌌 ATMOSPHERIC BACKDROP 🌌 */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/5 blur-[120px] rounded-full" />
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
                Neural Sourcing Intelligence
             </div>
            <h1 className="text-6xl font-black text-white tracking-tighter leading-[0.9] uppercase">
               Analyze <br /><span className="text-indigo-500">Potential.</span>
            </h1>
             <p className="text-slate-400 text-base font-medium max-w-md leading-relaxed">
                Deploy high-fidelity talent indexing and neural cross-referencing to find the best candidates at scale with Recruiter AI.
             </p>
         </div>

         <div className="flex items-center gap-6 py-8 border-t border-white/5 font-bold text-xs">
            <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 uppercase tracking-widest shadow-lg">Enterprise Ready</div>
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 uppercase tracking-widest shadow-lg">SOC-2 Verified</div>
         </div>
      </div>

      {/* 🔐 AUTH TERMINAL 🔐 */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
         <motion.div 
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-sm space-y-10"
         >
            <div className="text-center space-y-3">
               <h2 className="text-3xl font-black text-white tracking-tight uppercase">Login</h2>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Establish secure recruiter link</p>
            </div>

            <AnimatePresence>
               {(error || successMessage) && (
                  <motion.div 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className={`p-4 rounded-xl border text-xs font-bold uppercase tracking-widest text-center shadow-lg ${error ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}
                   >
                     {error || successMessage}
                  </motion.div>
               )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Recruiter ID (Email)</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-white text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                    placeholder="protocol@agency.ai"
                  />
               </div>

               <div className="space-y-2">
                  <div className="flex justify-between px-1">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Access Key</label>
                     <button type="button" className="text-xs font-bold text-indigo-500 uppercase tracking-widest hover:text-white transition-colors">Recovery</button>
                  </div>
                  <div className="relative">
                     <input 
                       type={showPassword ? "text" : "password"} 
                       required 
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-white text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                       placeholder="••••••••"
                     />
                     <button 
                       type="button" 
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
                     >
                        {showPassword ? 'Hide' : 'Show'}
                     </button>
                  </div>
               </div>

               <div className="flex items-center gap-3 px-1">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-slate-900 text-indigo-500 focus:ring-0 transition-colors"
                  />
                  <label htmlFor="remember" className="text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none">Maintain Persistence</label>
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
               >
                  {loading ? 'Initializing...' : 'Authorize Access'}
               </button>
            </form>

            <p className="text-center text-xs font-bold text-slate-600 uppercase tracking-[0.2em] pt-8 border-t border-white/5">
                Unregistered? <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">Signup</Link>
            </p>
         </motion.div>
      </div>
   </div>
  );
};

export default Login;
