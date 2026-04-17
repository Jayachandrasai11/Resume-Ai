import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import RefreshButton from './RefreshButton';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const FunnelChart = ({ title = 'Recruitment Funnel', stages, loading, onRefresh }) => {
  const data = Array.isArray(stages) ? stages : [];

  const max = useMemo(
    () => Math.max(1, ...data.map((d) => Number(d?.count) || 0)),
    [data]
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
      <div className="p-6 space-y-3">
        {data.length === 0 ? (
          <p className="text-center text-brand-text-secondary text-sm py-6">No data available.</p>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
          >
            {data.map((stage, idx) => {
              const value = Number(stage?.count) || 0;
              const pct = clamp((value / max) * 100, 0, 100);
              return (
                <motion.div key={`${stage.status}-${idx}`} variants={item} className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-brand-text-secondary capitalize">{stage.status}</span>
                    <span className="text-white">{value}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: idx * 0.1 }}
                      className="h-3 rounded-full bg-gradient-to-r from-brand-primary via-brand-purple to-emerald-400"
                    />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FunnelChart;
