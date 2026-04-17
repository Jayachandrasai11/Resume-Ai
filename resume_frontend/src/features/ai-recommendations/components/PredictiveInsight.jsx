import React, { memo } from 'react';
import { motion } from 'framer-motion';

export const AnimatedProgress = memo(({ percentage, color = '#4F8CFF' }) => (
  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${percentage}%` }}
      transition={{ duration: 1 }}
      className="h-full rounded-full"
      style={{ backgroundColor: color }}
    />
  </div>
));

const PredictiveInsight = memo(({ insight, type }) => {
  const getIconAndColor = (type) => {
    switch(type) {
      case 'trend':
        return { icon: '📈', bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-400' };
      case 'warning':
        return { icon: '⚠️', bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400' };
      case 'success':
        return { icon: '✅', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400' };
      case 'forecast':
        return { icon: '🔮', bg: 'bg-brand-purple/15', border: 'border-brand-purple/30', text: 'text-brand-purple' };
      default:
        return { icon: '💡', bg: 'bg-white/5', border: 'border-white/10', text: 'text-brand-text-secondary' };
    }
  };
  
  const { icon, bg, border, text } = getIconAndColor(type || 'default');
  
  return (
    <motion.div 
      className={`${bg} rounded-lg p-4 border ${border} transition-all hover:bg-white/10`}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{insight.message || insight.text || insight}</p>
          {insight.confidence && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-brand-text-secondary">Confidence:</span>
              <AnimatedProgress percentage={insight.confidence * 100} />
              <span className="text-xs font-medium text-white">{(insight.confidence * 100).toFixed(0)}%</span>
            </div>
          )}
          {insight.timeline && (
            <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-white/5 rounded-full border border-white/10 text-brand-text-secondary">
              ⏱️ {insight.timeline}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default PredictiveInsight;
