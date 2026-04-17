import React from 'react';
import { motion } from 'framer-motion';

const Benefits = () => {
  return (
    <section id="benefits" className="py-24 bg-brand-dark text-white px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black mb-10 leading-tight">Why the best teams choose <span className="text-brand-primary">ResumeIntel</span></h2>
            <div className="space-y-8">
              {[
                { title: '80% Less Screening', desc: 'Stop reading every resume. Let the AI surface the top 5% automatically.', iconColor: 'bg-brand-primary' },
                { title: 'Zero Manual Entry', desc: 'No more spreadsheets. No more copy-pasting. Everything is structured.', iconColor: 'bg-slate-700' },
                { title: 'Unbiased Decisions', desc: 'Rank candidates based on merit and skill relevance, removing human bias.', iconColor: 'bg-indigo-700' }
              ].map((benefit, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start group"
                >
                  <div className={`${benefit.iconColor} p-3 rounded-2xl mr-6 group-hover:scale-110 transition-transform shadow-xl`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-2xl font-black mb-2">{benefit.title}</h4>
                    <p className="text-brand-text-secondary text-lg font-medium">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-brand-card/50 backdrop-blur-xl p-12 rounded-[48px] border border-brand-border shadow-2xl hover:border-brand-primary/30 transition-all duration-300"
          >
            <div className="space-y-12">
              <div className="text-center">
                <div className="text-8xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-indigo-400">90%</div>
                <p className="text-brand-text-secondary text-xl uppercase tracking-[0.2em] font-black opacity-80">Faster Screening</p>
              </div>
              <div className="h-px bg-brand-border"></div>
              <div className="text-center">
                <div className="text-8xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-brand-primary">3.5x</div>
                <p className="text-brand-text-secondary text-xl uppercase tracking-[0.2em] font-black opacity-80">Better Candidate Quality</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
