import React from 'react';
import { motion } from 'framer-motion';

const Features = () => {
  return (
    <section id="features" className="py-24 bg-brand-dark text-white px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <h2 className="text-brand-primary font-black tracking-widest uppercase text-sm mb-4">Core Capabilities</h2>
          <h3 className="text-4xl md:text-6xl font-black mb-6">Revolutionary AI Features</h3>
          <p className="text-brand-text-secondary max-w-2xl mx-auto text-xl font-medium">Built on top of cutting-edge LLMs to give you an unfair advantage in hiring.</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: 'Resume Chat', 
              desc: 'Ask questions like "Does this candidate have experience with high-scale systems?" and get instant, cited answers.', 
              icon: '💬',
              glow: 'group-hover:border-brand-primary/50'
            },
            { 
              title: 'AI Semantic Ranking', 
              desc: 'Move beyond keyword matching. Our AI understands context, seniority, and skill relevance for your specific JD.', 
              icon: '🎯',
              glow: 'group-hover:border-blue-500/50'
            },
            { 
              title: 'Automated Extraction', 
              desc: 'Instantly convert messy PDFs and DOCX files into clean, structured JSON with near-perfect accuracy.', 
              icon: '📄',
              glow: 'group-hover:border-indigo-500/50'
            }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className={`group bg-brand-card/40 backdrop-blur-sm border border-brand-border p-10 rounded-[32px] hover:bg-brand-card/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${feature.glow}`}
            >
              <div className="text-5xl mb-8 transform group-hover:scale-105 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-black mb-4 group-hover:text-white transition-colors">{feature.title}</h3>
              <p className="text-brand-text-secondary leading-relaxed text-lg">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
