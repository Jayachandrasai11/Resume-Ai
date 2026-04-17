import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import RefreshButton from './RefreshButton';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const SkillChart = ({ title = 'Top Skills by Candidates', skills, color = '#10b981', loading, onRefresh }) => {
  const items = Array.isArray(skills) ? skills : [];

  const max = useMemo(() => {
    const vals = items.map((d) => Number(d?.count) || 0);
    return Math.max(1, ...vals);
  }, [items]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4.5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <h2 className="text-[15px] font-black text-white uppercase tracking-tight">{title}</h2>
        {onRefresh && (
        <RefreshButton 
          onClick={onRefresh}
          loading={loading}
        />
        )}
      </div>
      <div className="p-6">
        {items.length === 0 ? (
          <p className="text-center text-brand-text-secondary text-sm py-6">No data available.</p>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {items.map((d, idx) => {
              const raw = Number(d?.count) || 0;
              const pct = clamp((raw / max) * 100, 0, 100);
              const label = String(d?.skill ?? '');
              return (
                <motion.div key={`${label}-${idx}`} variants={item} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-brand-text-secondary w-24 truncate">{label}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-4 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: idx * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white w-8 text-right">{raw}</span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SkillChart;
