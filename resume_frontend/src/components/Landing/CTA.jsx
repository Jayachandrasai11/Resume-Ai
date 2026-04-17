import React from 'react';

const CTA = ({ onNavigate }) => {
  return (
    <section className="py-24 px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]"></div>
      </div>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-black mb-8 text-slate-900 tracking-tight">Start Hiring Smarter with AI</h2>
        <p className="text-2xl text-slate-500 mb-16 leading-relaxed max-w-3xl mx-auto font-medium">
          Join the elite 1% of recruiters who use artificial intelligence to build world-class teams.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          <button 
            onClick={() => onNavigate('/login')}
            className="w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-brand-primary to-blue-600 text-white rounded-3xl text-2xl font-black hover:scale-[1.02] transition-all shadow-lg shadow-brand-primary/20"
          >
            Get Started for Free
          </button>
          <button 
            onClick={() => onNavigate('/login')}
            className="w-full sm:w-auto px-12 py-6 bg-white text-slate-700 border-2 border-slate-100 rounded-3xl text-2xl font-bold hover:border-indigo-600 transition shadow-xl"
          >
            Log in to Account
          </button>
        </div>
        <p className="mt-10 text-slate-400 font-bold text-sm uppercase tracking-widest">No credit card required • Instant setup</p>
      </div>
    </section>
  );
};

export default CTA;
