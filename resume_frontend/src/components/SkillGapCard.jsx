import React, { useState } from 'react';

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="animate-pulse space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-24 bg-gray-200 rounded-lg"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded-full w-20"></div>
          <div className="h-8 bg-gray-200 rounded-full w-24"></div>
          <div className="h-8 bg-gray-200 rounded-full w-16"></div>
        </div>
      </div>
    </div>
  </div>
);

// Error State Component with Retry
const ErrorState = ({ error, onRetry }) => {
  const [retryCount, setRetryCount] = useState(0);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry?.();
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">Unable to Load Skill Gap Analysis</h3>
        <p className="text-sm text-gray-500 mb-4 max-w-xs">{error || 'An unexpected error occurred while fetching skill gap data.'}</p>
        
        <div className="flex gap-3">
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
        
        {retryCount > 0 && (
          <p className="text-xs text-gray-400 mt-3">Retry attempt: {retryCount}</p>
        )}
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ onSelectJob }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Job Selected</h3>
      <p className="text-sm text-gray-500 max-w-xs">Select a job from your pipeline to view the skill gap analysis.</p>
      {onSelectJob && (
        <button 
          onClick={onSelectJob}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Select Job
        </button>
      )}
    </div>
  </div>
);

// Skill Chip with Tooltip
const SkillChip = ({ skill, type = 'missing', priority, description, recommendation }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const baseClasses = "px-3 py-1.5 text-xs font-medium rounded-full cursor-help transition-all duration-200 hover:shadow-md flex items-center gap-1.5";
  const typeClasses = type === 'matched' 
    ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200" 
    : type === 'critical'
    ? "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
    : type === 'high'
    ? "bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200"
    : type === 'medium'
    ? "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200"
    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200";
  
  const priorityBadge = priority ? (
    <span className={`text-[10px] px-1.5 rounded ${
      priority === 'high' ? 'bg-red-200 text-red-800' :
      priority === 'medium' ? 'bg-orange-200 text-orange-800' :
      'bg-gray-200 text-gray-600'
    }`}>
      {priority.toUpperCase()}
    </span>
  ) : null;
  
  return (
    <div className="relative inline-block">
      <span 
        className={`${baseClasses} ${typeClasses}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {skill}
        {priorityBadge}
      </span>
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap max-w-xs">
          {description && <p className="font-medium mb-1">{description}</p>}
          {recommendation && <p className="text-gray-300">{recommendation}</p>}
          {!description && !recommendation && (
            type === 'matched' 
              ? `${skill} is found in candidate profiles` 
              : `${skill} is missing. Consider sourcing candidates with this skill.`
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Progress Ring Component
const ProgressRing = ({ percentage, size = 120, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  const getColor = (p) => {
    if (p >= 70) return '#22c55e';
    if (p >= 40) return '#f59e0b';
    return '#ef4444';
  };
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(percentage)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: getColor(percentage) }}>
          {percentage}%
        </span>
        <span className="text-xs text-gray-500">Match</span>
      </div>
    </div>
  );
};

// TOP MISSING SKILLS SECTION (at top)
const TopMissingSkillsSection = ({ missingSkills, severity }) => {
  if (!missingSkills || missingSkills.length === 0) return null;
  
  const getSeverityConfig = (sev) => {
    switch(sev?.toLowerCase()) {
      case 'high': return { icon: '🔴', label: 'Critical', color: 'text-red-600 bg-red-50' };
      case 'medium': return { icon: '🟡', label: 'Moderate', color: 'text-amber-600 bg-amber-50' };
      case 'low': return { icon: '🟢', label: 'Low', color: 'text-green-600 bg-green-50' };
      default: return { icon: '⚪', label: 'Unknown', color: 'text-gray-600 bg-gray-50' };
    }
  };
  
  const sevConfig = getSeverityConfig(severity);
  
  return (
    <div className="p-5 bg-gradient-to-br from-red-50 to-orange-50 border-t border-gray-100">
      <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-xl">📋</span>
        Top Missing Skills
        <span className={`ml-auto text-xs px-2 py-1 rounded-full flex items-center gap-1 ${sevConfig.color}`}>
          {sevConfig.icon} {sevConfig.label}
        </span>
      </h4>
      
      <div className="space-y-3">
        {missingSkills.slice(0, 5).map((skill, idx) => {
          const priority = idx === 0 ? 'high' : idx < 3 ? 'medium' : 'low';
          return (
            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-red-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  priority === 'high' ? 'bg-red-500 text-white' :
                  priority === 'medium' ? 'bg-amber-500 text-white' :
                  'bg-gray-400 text-white'
                }`}>
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-gray-900">{skill}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                priority === 'high' ? 'bg-red-100 text-red-700' :
                priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {priority === 'high' ? 'Critical' : priority === 'medium' ? 'Important' : 'Standard'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// AI RECOMMENDATIONS SECTION (in the middle)
const AIRecommendationsSection = ({ data }) => {
  if (!data?.recommendations?.length && !data?.learning_resources?.length) {
    return null;
  }
  
  return (
    <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-t border-indigo-100">
      <h4 className="text-sm font-semibold text-indigo-900 mb-4 flex items-center gap-2">
        <span className="text-xl">🤖</span>
        AI-Powered Recommendations
      </h4>
      
      {/* Actionable Recommendations */}
      {data.recommendations?.length > 0 && (
        <div className="space-y-2 mb-4">
          {data.recommendations.slice(0, 4).map((rec, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm border border-indigo-100">
              <span className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-xs text-gray-700">{rec}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Learning Resources */}
      {data.learning_resources?.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-2">
            📚 Learning Resources
          </h5>
          <div className="space-y-2">
            {data.learning_resources.slice(0, 3).map((resource, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 shadow-sm border border-indigo-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-900">{resource.skill}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                    {resource.resources?.length || 0} resources
                  </span>
                </div>
                {resource.resources?.slice(0, 2).map((res, rIdx) => (
                  <a 
                    key={rIdx}
                    href={res.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-xs text-indigo-600 hover:text-indigo-800 hover:underline mt-1"
                  >
                    {res.title} • {res.platform}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// SKILL GAP ANALYSIS SECTION (at bottom)
const SkillGapAnalysisSection = ({ data }) => {
  if (!data) return null;
  
  const { matched_skills, missing_skills, match_percentage, job_title } = data;
  
  return (
    <div className="p-5 bg-gray-50 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-xl">📊</span>
        Skill Gap Analysis Summary
      </h4>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Matched Skills</span>
          <div className="text-2xl font-bold text-green-600 mt-1">{matched_skills?.length || 0}</div>
          <div className="flex flex-wrap gap-1 mt-2">
            {matched_skills?.slice(0, 4).map((skill, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Missing Skills</span>
          <div className="text-2xl font-bold text-red-600 mt-1">{missing_skills?.length || 0}</div>
          <div className="flex flex-wrap gap-1 mt-2">
            {missing_skills?.slice(0, 4).map((skill, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Match Score Visualization */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Overall Match Score</span>
          <span className={`text-lg font-bold ${
            match_percentage >= 70 ? 'text-green-600' :
            match_percentage >= 40 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {match_percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-700 ${
              match_percentage >= 70 ? 'bg-green-500' :
              match_percentage >= 40 ? 'bg-amber-500' :
              'bg-red-500'
            }`}
            style={{ width: `${match_percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Gap Closure Prediction: {
            match_percentage >= 80 ? '🎯 Excellent fit - ready for hiring' :
            match_percentage >= 60 ? '💪 Good fit - minor upskilling needed' :
            match_percentage >= 40 ? '⚠️ Moderate gaps - sourcing recommended' :
            '🚨 Significant gaps - focused strategy required'
          }
        </p>
      </div>
      
      {/* Gap Closure Timeline */}
      {data.gap_closure_timeline && (
        <div className="mt-4 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <span className="text-xs text-gray-500 uppercase tracking-wider">⏱️ Estimated Gap Closure Timeline</span>
          <p className="text-sm text-gray-700 mt-1">{data.gap_closure_timeline}</p>
        </div>
      )}
    </div>
  );
};

// Job Selector Component
const JobSelector = ({ jobs, selectedJobId, onSelectJob, isLoading }) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Select Job Description:</label>
      <select
        value={selectedJobId || ''}
        onChange={(e) => onSelectJob(e.target.value)}
        disabled={isLoading}
        className="flex-1 max-w-md px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
      >
        <option value="">-- Select a Job --</option>
        {jobs.map(job => (
          <option key={job.id} value={job.id}>
            {job.title || job.job_title || `Job #${job.id}`}
          </option>
        ))}
      </select>
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      )}
    </div>
  );
};

// Main Component
const SkillGapCard = ({ 
  data, 
  loading, 
  error, 
  onRefresh,
  jobs = [],
  selectedJobId,
  onSelectJob
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  // Loading State
  if (loading || isRefreshing) {
    return <SkeletonLoader />;
  }

  // Error State
  if (error) {
    return <ErrorState error={error} onRetry={handleRefresh} />;
  }

  // Empty State
  if (!data || !data.job_id) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Job Selector */}
        <JobSelector 
          jobs={jobs} 
          selectedJobId={selectedJobId}
          onSelectJob={onSelectJob}
          isLoading={loading}
        />
        <EmptyState />
      </div>
    );
  }

  const { 
    job_title, 
    match_percentage, 
    total_candidates, 
    matched_skills, 
    missing_skills, 
    severity,
    recommendations,
    learning_resources,
    gap_closure_timeline
  } = data;
  
  const getSeverityInfo = (sev) => {
    switch(sev?.toLowerCase()) {
      case 'high': return { icon: '🔴', label: 'Critical Gap', color: 'text-red-600' };
      case 'medium': return { icon: '🟡', label: 'Moderate Gap', color: 'text-amber-600' };
      case 'low': return { icon: '🟢', label: 'Good Match', color: 'text-green-600' };
      default: return { icon: '⚪', label: 'Unknown', color: 'text-gray-600' };
    }
  };
  
  const severityInfo = getSeverityInfo(severity);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">Skill Gap Analysis</h2>
          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${severityInfo.color} bg-gray-100`}>
            {severityInfo.icon} {severityInfo.label}
          </span>
        </div>
        <button 
          onClick={handleRefresh}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          title="Refresh"
          disabled={isRefreshing}
        >
          <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Job Selector */}
      {jobs.length > 0 && (
        <JobSelector 
          jobs={jobs} 
          selectedJobId={selectedJobId}
          onSelectJob={onSelectJob}
          isLoading={loading}
        />
      )}

      {/* Job Info & Stats */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-4">{job_title}</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
            <ProgressRing percentage={match_percentage} size={80} strokeWidth={6} />
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
            <span className="text-2xl font-bold text-gray-900">{total_candidates}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">Candidates</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-green-600">{matched_skills?.length || 0}</span>
              <span className="text-lg text-gray-400">/</span>
              <span className="text-xl font-bold text-gray-700">{(matched_skills?.length || 0) + (missing_skills?.length || 0)}</span>
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">Skills Matched</span>
          </div>
        </div>
      </div>

      {/* TOP MISSING SKILLS - At Top of Analysis Section */}
      <TopMissingSkillsSection missingSkills={missing_skills} severity={severity} />

      {/* AI RECOMMENDATIONS - Middle Section */}
      <AIRecommendationsSection 
        data={{
          recommendations,
          learning_resources
        }} 
      />

      {/* SKILL GAP ANALYSIS - At Bottom */}
      <SkillGapAnalysisSection data={data} />

      {/* Info Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          <span className="font-medium">📖 How match percentage is calculated:</span> 
          {' '}Match % = (Matched Skills / Total Required Skills) × 100. 
          {' '}Higher percentage means candidates have more required skills.
        </p>
      </div>
    </div>
  );
};

export default SkillGapCard;
