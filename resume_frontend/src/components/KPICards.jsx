import React from 'react';
import { motion } from 'framer-motion';

function formatNumber(value) {
  if (value === null || value === undefined) return '0';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

const KPICard = ({ label, value, accentColor, icon, trend, trendDirection = 'up' }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:border-indigo-500/30 shadow-lg group"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1.5">{label}</p>
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-4xl font-black text-white tracking-tighter"
        >
          {typeof value === 'string' ? value : formatNumber(value)}
        </motion.h3>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
            trendDirection === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            <svg 
              className={`w-3 h-3 ${trendDirection === 'down' ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>{trend}</span>
          </div>
        )}
      </div>
      {icon && (
        <motion.div 
          className={`w-12 h-12 rounded-xl ${accentColor || 'bg-brand-primary/10 text-brand-primary'} flex items-center justify-center p-2 group-hover:glow-primary transition-all duration-300`}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          {React.isValidElement(icon) ? (
            <div className="w-full h-full flex items-center justify-center">
              {icon}
            </div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
            </svg>
          )}
        </motion.div>
      )}
    </div>
  </motion.div>
);

const KPICards = ({ items }) => {
  const data = Array.isArray(items) ? items : [];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {data.map((item, idx) => (
        <motion.div key={idx} variants={itemVariants}>
          <KPICard {...item} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default KPICards;
