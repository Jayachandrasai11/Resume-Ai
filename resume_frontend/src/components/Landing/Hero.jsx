import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';

const DashboardPreview = lazy(() => import('./DashboardPreview'));

const Hero = ({ onNavigate }) => {
  return (
    <section className="relative pt-40 pb-24 px-6 overflow-hidden bg-slate-50">
      <div className="max-w-7xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold mb-8">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2"></span>
            New: AI Resume Chat 2.0 is live!
          </div>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1]"
        >
          Hire Smarter with <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
            AI Intelligence
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"
        >
          The world's most advanced AI-powered resume parsing and candidate ranking platform. 
          Find your next 10x developer in seconds, not weeks.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-24"
        >
          <button 
            onClick={() => onNavigate('/login')}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-brand-primary to-blue-600 text-white rounded-3xl text-xl font-black hover:scale-105 hover:shadow-xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center"
          >
            Get Started
            <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
          <button 
            onClick={() => onNavigate('/login')}
            className="w-full sm:w-auto px-10 py-5 bg-white text-slate-700 border-2 border-slate-100 rounded-3xl text-xl font-bold hover:border-indigo-600 hover:scale-105 hover:shadow-xl transition shadow-lg flex items-center justify-center"
          >
            Login
          </button>
        </motion.div>
        
        {/* Optimized Dashboard Preview with Lazy Loading - Reduced blur for performance */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <Suspense fallback={<div className="mt-20 h-[500px] bg-gray-100 rounded-[40px] border border-slate-200 animate-pulse" />}>
            <DashboardPreview />
          </Suspense>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
