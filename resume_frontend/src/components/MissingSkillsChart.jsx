import React, { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';

// Severity Badge Component
const SeverityBadge = ({ level, count }) => {
  const config = {
    high: {
      color: 'bg-red-500/15 text-red-400 border-red-500/30',
      icon: '🔴',
      label: 'Critical'
    },
    medium: {
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: '🟡',
      label: 'Moderate'
    },
    low: {
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: '🟢',
      label: 'Low'
    }
  };
  
  const { icon, label, color } = config[level] || config.low;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${color}`}>
      {icon} {label}
      {count && <span className="ml-1 opacity-70">({count})</span>}
    </span>
  );
};

// Skill Bar with Animation
const SkillBar = memo(({ skill, count, maxCount, severity, onHover }) => {
  const [isHovered, setIsHovered] = useState(false);
  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
  
  const getBarColor = (sev) => {
    switch(sev) {
      case 'high': return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'medium': return 'bg-gradient-to-r from-amber-500 to-amber-600';
      default: return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
    }
  };
  
  return (
    <motion.div 
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onHover?.(skill)}
      whileHover={{ x: 4 }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate max-w-[140px]">{skill.name || skill.skill}</span>
          <SeverityBadge level={severity} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{count}</span>
          {isHovered && (
            <span className="text-xs text-brand-text-secondary">{percentage.toFixed(0)}%</span>
          )}
        </div>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.7 }}
          className={`h-full rounded-full ${getBarColor(severity)}`}
        />
      </div>
      {isHovered && (
        <div className="mt-1 text-xs text-brand-text-secondary">
          Impact: {skill.impact || 'Missing in candidate profiles'}
        </div>
      )}
    </motion.div>
  );
});

// Skeleton Loader
const SkeletonLoader = () => (
  <div className="glass-card rounded-2xl p-6">
    <div className="animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-5 bg-white/10 rounded w-1/3"></div>
        <div className="h-8 w-20 bg-white/10 rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="h-8 bg-white/10 rounded"></div>
        <div className="h-8 bg-white/10 rounded"></div>
        <div className="h-8 bg-white/10 rounded"></div>
      </div>
    </div>
  </div>
);

// Error State with Retry
const ErrorState = ({ error, onRetry }) => {
  const [retryCount, setRetryCount] = useState(0);
  
  return (
    <div className="glass-card rounded-2xl border-red-500/30 p-6">
      <div className="flex flex-col items-center justify-center text-center py-6">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">Unable to Load Missing Skills</h3>
        <p className="text-xs text-brand-text-secondary mb-4">{error || 'Failed to fetch missing skills data'}</p>
        <button 
          onClick={() => { setRetryCount(prev => prev + 1); onRetry?.(); }}
          className="btn-primary px-4 py-2 text-xs font-medium"
        >
          Retry {retryCount > 0 && `(${retryCount})`}
        </button>
      </div>
    </div>
  );
};

// Empty State
const EmptyState = () => (
  <div className="glass-card rounded-2xl p-6">
    <div className="flex flex-col items-center justify-center text-center py-8">
      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">🎉</span>
      </div>
      <h3 className="text-base font-semibold text-white mb-2">All Skills Matched!</h3>
      <p className="text-sm text-brand-text-secondary">No missing skills detected for the current job requirements.</p>
    </div>
  </div>
);

// Main MissingSkillsChart Component
const MissingSkillsChart = ({ skills = [], loading, error, onRetry, title = "Top Missing Skills" }) => {
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('count'); // 'count' | 'severity' | 'name'
  
  // Handle refresh with animation
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (typeof onRetry === 'function') {
        await onRetry();
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };
  
  // Handle sort change
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };
  
  // Calculate max count for bar scaling
  const maxCount = Math.max(...(skills.map(s => s.count || s.frequency || 0)), 1);
  
  // Determine severity based on count and position
  const getSeverity = (skill, index) => {
    if (skill.severity) return skill.severity;
    if (index === 0 && skill.count > 5) return 'high';
    if (index < 3 && skill.count > 3) return 'medium';
    return 'low';
  };
  
  // Sort skills based on selected criteria - DECLARE BEFORE EARLY RETURNS!
  const sortedSkills = useMemo(() => {
    if (!skills || skills.length === 0) return [];
    const sorted = [...skills];
    
    switch(sortBy) {
      case 'count':
        return sorted.sort((a, b) => (b.count || b.frequency || 0) - (a.count || a.frequency || 0));
      case 'severity':
        return sorted.sort((a, b) => {
          const severityOrder = { high: 0, medium: 1, low: 2 };
          const aSev = a.severity || (skills.indexOf(a) === 0 ? 'high' : 'medium');
          const bSev = b.severity || (skills.indexOf(b) === 0 ? 'high' : 'medium');
          return (severityOrder[aSev] || 2) - (severityOrder[bSev] || 2);
        });
      case 'name':
        return sorted.sort((a, b) => 
          (a.name || a.skill || '').localeCompare(b.name || b.skill || '')
        );
      default:
        return sorted;
    }
  }, [skills, sortBy]);
  
  // Loading state
  if (loading || isRefreshing) {
    return <SkeletonLoader />;
  }
  
  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRefresh} />;
  }
  
  // Empty state
  if (!skills || skills.length === 0) {
    return <EmptyState />;
  }
  
  // Top 10 missing skills
  const displaySkills = sortedSkills.slice(0, 10);
  
  // Calculate aggregate severity
  const getAggregateSeverity = () => {
    const highCount = skills.filter((_, i) => i === 0).length;
    if (highCount > 0) return 'high';
    const mediumCount = skills.filter((_, i) => i < 3).length;
    if (mediumCount > 2) return 'medium';
    return 'low';
  };
  
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4.5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div>
          <h3 className="text-[15px] font-black text-white uppercase tracking-tight">{title}</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Skills gap analysis • {displaySkills.length} neural gaps
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge level={getAggregateSeverity()} count={displaySkills.length} />
          <button 
            onClick={handleRefresh}
            className="p-2 text-brand-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        {displaySkills.length === 0 ? (
          <div className="text-center py-6">
            <span className="text-2xl">✅</span>
            <p className="text-sm text-brand-text-secondary mt-2">No critical skill gaps</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displaySkills.map((skill, index) => (
              <SkillBar
                key={`missing-${index}`}
                skill={skill}
                count={skill.count || skill.frequency || 0}
                maxCount={maxCount}
                severity={getSeverity(skill, index)}
                onHover={(s) => setHoveredSkill(s)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer - Quick Actions */}
      <div className="px-5 py-4 bg-white/3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-brand-text-secondary">
          Hover over skills for details
        </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-text-secondary">Sort:</span>
            <div className="dropdown-wrapper" style={{ display: 'inline-block', width: 'auto', minWidth: '100px' }}>
              <select 
                value={sortBy} 
                onChange={(e) => handleSortChange(e.target.value)}
                className="input-field text-xs px-2 py-1 cursor-pointer"
                style={{ width: '100%' }}
              >
            <option value="count">By Count</option>
            <option value="severity">By Severity</option>
            <option value="name">By Name</option>
          </select>
        </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MissingSkillsChart);
