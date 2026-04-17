import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LearningPathCard = memo(({ path, index }) => {
  const [expanded, setExpanded] = useState(false);
  const durationMap = {
    'beginner': '4-6 weeks',
    'intermediate': '6-8 weeks',
    'advanced': '8-12 weeks'
  };
  
  return (
    <motion.div 
      className="bg-gradient-to-br from-brand-primary/10 to-brand-purple/10 rounded-xl p-4 border border-brand-primary/20 hover:border-brand-primary/40 transition-all cursor-pointer"
      onClick={() => setExpanded(!expanded)}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
            {index + 1}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{path.skill || path.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded-full">
                {path.level || 'Intermediate'}
              </span>
              <span className="text-xs text-brand-text-secondary">
                {durationMap[path.level?.toLowerCase()] || '4-6 weeks'}
              </span>
            </div>
          </div>
        </div>
        <motion.svg 
          animate={{ rotate: expanded ? 180 : 0 }}
          className="w-5 h-5 text-brand-text-secondary"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </div>
      
      <AnimatePresence>
        {expanded && path.resources && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-brand-primary/20 overflow-hidden"
          >
            <h5 className="text-xs font-semibold text-brand-primary mb-2">Resources</h5>
            <div className="space-y-2">
              {path.resources.slice(0, 3).map((res, idx) => (
                <a 
                  key={idx}
                  href={res.url || res.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-brand-primary hover:text-brand-primary/80 hover:underline"
                >
                  <span className="w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
                  {res.title || res.name}
                  <span className="text-brand-text-secondary">• {res.platform || 'Online'}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default LearningPathCard;
