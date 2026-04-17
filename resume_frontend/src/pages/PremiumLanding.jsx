import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// 🧭 ELEGANT NAVIGATION 🧭
const PremiumNavigation = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass-card !rounded-none !border-x-0 !border-t-0 py-3 bg-slate-950/90 backdrop-blur-xl' : 'py-5'}`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Recruiter <span className="text-indigo-400">AI</span></span>
        </div>
        
        <div className="hidden lg:flex items-center gap-8">
          {['Features', 'Deployment', 'Intel', 'Pricing'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-semibold text-slate-400 hover:text-white transition-all">{item}</a>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('/login')} className="text-sm font-semibold text-slate-400 hover:text-white transition-all">Log In</button>
          <button onClick={() => onNavigate('/signup')} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95">Get Started</button>
        </div>
      </div>
    </motion.nav>
  );
};

// 🚀 ELEGANT HERO 🚀
const PremiumHero = ({ onNavigate }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#020617]">
      <motion.div style={{ y, opacity }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[70%] h-[70%] bg-indigo-600/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[60%] bg-violet-600/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff08 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </motion.div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-32 pb-20 relative z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center space-y-10"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-xl">
             <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
             </span>
             <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Enhanced with Dual Gemini Engines</span>
          </div>
          
          <div className="space-y-6">
             <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.1]">
                Hire <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Faster.</span> <br />
                Scale <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600">Smarter.</span>
             </h1>
             <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                Experience the world's most precise AI screening engine. Find your next hire with semantic intelligence that understands achievement, not just keywords.
             </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button onClick={() => onNavigate('/signup')} className="px-10 py-4.5 bg-indigo-600 text-white rounded-2xl text-base font-bold shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-[1.03] transition-all active:scale-95">Start Free Trial</button>
          </div>

          <div className="mt-20 relative px-4 md:px-10 max-w-6xl mx-auto">
             <div className="p-2 rounded-[2.8rem] bg-gradient-to-b from-white/10 to-transparent shadow-2xl">
                <div className="bg-[#0b0f19] rounded-[2.5rem] overflow-hidden border border-white/5">
                   <HeroSimulation />
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const HeroSimulation = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s + 1) % 4), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[400px] md:h-[500px] relative flex items-center justify-center p-12">
      <div className="absolute top-8 left-8 flex gap-2">
        <div className="w-3 h-3 rounded-full bg-rose-500/30" />
        <div className="w-3 h-3 rounded-full bg-amber-500/30" />
        <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.5 }} className="w-full max-w-md text-center">
            {step === 0 && <SimulationStep icon="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" title="Source Indexing" desc="Scanning resume assets for professional DNA." color="text-indigo-400" />}
            {step === 1 && <SimulationStep icon="M13 10V3L4 14h7v7l9-11h-7z" title="Intelligence Layer" desc="Extracting verified skill vectors and tenure data." color="text-violet-400" />}
            {step === 2 && <SimulationStep icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" title="Neural Rank" desc="Calculating role-specific compatibility scores." color="text-emerald-400" />}
            {step === 3 && <ResultsMock />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const SimulationStep = ({ icon, title, desc, color }) => (
  <div className="space-y-6">
    <div className={`w-20 h-20 mx-auto rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center ${color} shadow-inner`}>
       <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} /></svg>
    </div>
    <div className="space-y-2">
       <h3 className="text-2xl font-bold text-white uppercase tracking-tight">{title}</h3>
       <p className="text-sm font-medium text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const ResultsMock = () => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-tight">Top Selection Hub</h3>
    <div className="space-y-3">
       {[
         { name: 'Sarah Johnson', score: 98, role: 'Senior Architect', color: 'from-indigo-600 to-indigo-400' },
         { name: 'Michael Chen', score: 94, role: 'Product Lead', color: 'from-violet-600 to-violet-400' }
       ].map((c, i) => (
         <div key={i} className="glass-card p-4 flex items-center justify-between border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-4">
               <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${c.color} flex items-center justify-center font-bold text-white shadow-lg`}>{c.name[0]}</div>
               <div className="text-left">
                  <p className="text-sm font-bold text-white">{c.name}</p>
                  <p className="text-xs font-medium text-slate-500">{c.role}</p>
               </div>
            </div>
            <div className="text-right">
               <div className="text-indigo-400 font-bold text-sm">{c.score}%</div>
               <div className="w-20 h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${c.score}%` }} /></div>
            </div>
         </div>
       ))}
    </div>
  </div>
);

const SocialProof = () => (
  <section className="py-20 bg-[#0b0f19] border-y border-white/5 overflow-hidden">
    <div className="max-w-7xl mx-auto px-10">
      <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-12">Scaling Recruitment for Engineering Teams</p>
      <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24 opacity-30 grayscale saturate-0 contrast-50">
        {['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix'].map(c => <span key={c} className="text-2xl md:text-3xl font-bold text-white tracking-tighter">{c}</span>)}
      </div>
    </div>
  </section>
);

const FeaturesSection = () => (
  <section id="features" className="py-32 bg-[#020617] relative">
    <div className="max-w-7xl mx-auto px-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20 text-left">
        <div className="space-y-4">
          <div className="text-indigo-500 font-bold text-xs uppercase tracking-widest flex items-center gap-3">
            <span className="w-10 h-[2px] bg-indigo-500"></span>
            Intelligence Platform
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
             High Fidelity <br /><span className="text-indigo-400">Analysis.</span>
          </h2>
        </div>
        <p className="text-slate-400 max-w-sm text-base font-medium leading-relaxed">
          The manual screening bottleneck is over. Scale your hiring with objective data and neural evaluation.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { title: 'Neural Parsing', desc: 'Identify 15+ years of experience across 100+ technical categories automatically.' },
          { title: 'Semantic Index', desc: 'Find talent based on professional impact and seniority markers.' },
          { title: 'Mandat Scoring', desc: 'Rank candidates based on your unique role logic with sub-second latency.' },
          { title: 'Talent Concierge', desc: 'Natural language interface to query and filter your entire resume database.' },
          { title: 'Merit Protocol', desc: 'Strict bias-reduction algorithms that favor verified skills and tenure.' },
          { title: 'Seamless Export', desc: 'Connect to your existing ecosystem via CSV, PDF, or API protocols.' }
        ].map((f, i) => (
          <div key={i} className="p-10 glass-card border-white/5 hover:border-indigo-500/20 group transition-all duration-300 bg-white/[0.01]">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{f.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// 🛠️ STRATEGIC DEPLOYMENT OVERHAUL 🛠️
const HowItWorks = () => {
  return (
    <section id="deployment" className="py-40 bg-[#0b0f19] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/[0.02] blur-[150px] rounded-full" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
        <div className="text-center mb-32 space-y-4">
           <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">The Strategic Flow</div>
           <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase leading-none">Modern <span className="text-indigo-500">Deployment.</span></h2>
           <p className="text-slate-500 text-base font-medium max-w-xl mx-auto">Our recruitment protocol is designed for high-frequency hiring cycles with zero friction.</p>
        </div>

        <div className="relative">
          {/* Progress Connector Line */}
          <div className="hidden lg:block absolute top-[120px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
          
          <div className="grid lg:grid-cols-4 gap-12 lg:gap-8">
            {[
              { 
                phase: 'Phase 01', 
                title: 'Data Ingestion', 
                desc: 'Securely sync resume assets from distributed sources via PDF, DOCX or direct API.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )
              },
              { 
                phase: 'Phase 02', 
                title: 'Neural Mapping', 
                desc: 'Gemini transforms raw unstructured text into high-fidelity professionally vetted DNA maps.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              { 
                phase: 'Phase 03', 
                title: 'Strategic Rank', 
                desc: 'Candidates are benchmarked against your role mandate with sub-second semantic scoring.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
                  </svg>
                )
              },
              { 
                phase: 'Phase 04', 
                title: 'Mandate Fill', 
                desc: 'Initiate communication protocols with top talent and fill your roles in record time.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )
              }
            ].map((step, i) => (
              <div key={i} className="relative group">
                 {/* Connection Point */}
                 <div className="hidden lg:flex absolute top-[110px] left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-900 border-2 border-slate-800 items-center justify-center z-20 group-hover:border-indigo-500 transition-colors duration-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-indigo-500" />
                 </div>

                 <div className="glass-card p-10 bg-white/[0.01] border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.02] transition-all duration-500 text-center lg:text-left h-full">
                    <div className="flex flex-col items-center lg:items-start space-y-8">
                       <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xl group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                          {step.icon}
                       </div>
                       <div className="space-y-4">
                          <span className="text-xs font-bold text-indigo-500 uppercase tracking-[0.3em]">{step.phase}</span>
                          <h3 className="text-xl font-bold text-white tracking-tight uppercase">{step.title}</h3>
                          <p className="text-sm font-medium text-slate-500 leading-relaxed">{step.desc}</p>
                       </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const BenefitsSection = () => (
  <section id="intel" className="py-32 bg-[#020617] border-y border-white/5">
    <div className="max-w-7xl mx-auto px-10 grid lg:grid-cols-2 gap-20 items-center">
       <div className="space-y-10 text-left">
          <div className="space-y-4">
             <div className="text-indigo-500 font-bold text-xs uppercase tracking-widest">
                Strategic Advantage
             </div>
             <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-none">Objective <span className="text-indigo-500">Vetting.</span></h2>
          </div>
          <div className="space-y-6">
             {[
               { b: 'Industrial Speed', d: 'Process 5,000+ candidates in minutes, not weeks.' },
               { b: 'Unbiased Intelligence', d: 'AI that focuses on merit, achievement, and ROI potential.' },
               { b: 'Real-time Analytics', d: 'A single source of truth for your entire recruitment mission.' }
             ].map((b, i) => (
               <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 text-sm">
                     <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                  </div>
                  <div className="space-y-1">
                     <p className="text-base font-bold text-white">{b.b}</p>
                     <p className="text-sm font-medium text-slate-500 leading-relaxed">{b.d}</p>
                  </div>
               </div>
             ))}
          </div>
       </div>
       <div className="glass-card p-12 bg-white/[0.01] border-white/10 relative overflow-hidden group rounded-[2.5rem] shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[120px] rounded-full group-hover:bg-indigo-600/10 transition-all duration-1000" />
          <div className="space-y-8 relative z-10">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Processing Unit v2
             </div>
             <p className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">1,000 Resumes <br /> in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">60 Seconds.</span></p>
             <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm">Scale your candidate review capability to unmatched levels without increasing headcount.</p>
          </div>
       </div>
    </div>
  </section>
);

const TestimonialsSection = () => (
  <section className="py-32 bg-[#020617]">
    <div className="max-w-7xl mx-auto px-10">
      <h2 className="text-center text-3xl font-bold text-white mb-20 tracking-tight">Enterprise Trust</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { q: "The first AI tool that actually understands engineering experience correctly.", a: "Marcus V.", r: "Talent Lead, Stripe" },
          { q: "We've halved our sourcing time and doubled our interview conversion rate.", a: "Elena Vostok", r: "Head of Talent, Notion" },
          { q: "Absolutely indispensable for technical recruiting at scale.", a: "Arthur Dent", r: "Global Recruiter, Linear" }
        ].map((t, i) => (
          <div key={i} className="glass-card p-10 space-y-6 bg-white/[0.01] border-white/10 hover:border-indigo-500/20 transition-all duration-500 group rounded-[2rem]">
             <div className="text-4xl text-indigo-500/20 font-black tracking-tight group-hover:text-indigo-500/40 transition-colors">"</div>
             <p className="text-base font-medium text-white leading-relaxed italic">{t.q}</p>
             <div className="pt-8 border-t border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-xs font-bold text-slate-500">{t.a[0]}</div>
                <div>
                   <p className="text-sm font-bold text-white">{t.a}</p>
                   <p className="text-xs font-medium text-slate-600">{t.r}</p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CTASection = ({ onNavigate }) => (
  <section className="py-40 bg-slate-950 flex justify-center items-center text-center relative border-t border-white/5 overflow-hidden">
     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 blur-[200px] rounded-full" />
     <div className="space-y-12 relative z-10 max-w-3xl px-6">
        <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-none">Scale Your <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Human Capital.</span></h2>
        <p className="text-base md:text-lg font-medium text-slate-400 max-w-xl mx-auto leading-relaxed">Join 150+ innovative teams already using our recruitment protocol to find world-class talent.</p>
        <button onClick={() => onNavigate('/signup')} className="px-14 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl text-lg font-bold shadow-2xl shadow-indigo-600/40 hover:scale-[1.03] transition-all active:scale-95">Initialize Mission</button>
     </div>
  </section>
);

const Footer = () => (
  <footer className="py-20 bg-[#020617] border-t border-white/5">
    <div className="max-w-7xl mx-auto px-10 text-left">
      <div className="grid md:grid-cols-4 gap-20 mb-20">
        <div className="col-span-2 space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
             <span className="text-xl font-bold text-white tracking-tight">Recruiter <span className="text-indigo-400">AI</span></span>
          </div>
          <p className="text-sm font-medium text-slate-600 max-w-sm leading-relaxed">The trusted intelligence layer for high-frequency recruitment deployments across the global tech ecosystem.</p>
        </div>
        {[
          { h: 'Platform', l: ['Features', 'Security', 'Status', 'API Docs'] },
          { h: 'Company', l: ['Legal', 'Privacy', 'Compliance', 'Contact'] }
        ].map(c => (
          <div key={c.h} className="space-y-8">
             <h4 className="text-sm font-bold text-white uppercase tracking-widest">{c.h}</h4>
             <ul className="space-y-4">
                {c.l.map(link => <li key={link}><a href="#" className="text-sm font-medium text-slate-600 hover:text-white transition-all">{link}</a></li>)}
             </ul>
          </div>
        ))}
      </div>
      <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
         <p className="text-xs font-bold text-slate-700 uppercase tracking-widest leading-none">© 2026 RECRUITER SYSTEM. ALL RIGHTS RESERVED.</p>
         <div className="flex gap-12">
            <a href="#" className="text-xs font-bold text-slate-700 hover:text-white transition-all tracking-[0.2em]">LINKEDIN</a>
            <a href="#" className="text-xs font-bold text-slate-700 hover:text-white transition-all tracking-[0.2em]">TWITTER</a>
         </div>
      </div>
    </div>
  </footer>
);

const PremiumLanding = () => {
  const navigate = useNavigate();
  const { loading } = useAuth();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans scroll-smooth overflow-x-hidden selection:bg-indigo-500/30">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 z-[100] origin-left" style={{ scaleX }} />
      <PremiumNavigation onNavigate={navigate} />
      <PremiumHero onNavigate={navigate} />
      <SocialProof />
      <FeaturesSection />
      <HowItWorks />
      <BenefitsSection />
      <TestimonialsSection />
      <CTASection onNavigate={navigate} />
      <Footer />
    </div>
  );
};

export default PremiumLanding;
