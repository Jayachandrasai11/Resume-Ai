import React, { useState } from 'react';

// Skeleton Loader
export const SkeletonLoader = () => (
  <div className="glass-card rounded-2xl p-6">
    <div className="animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-5 bg-white/10 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-white/10 rounded-full"></div>
      </div>
      <div className="space-y-3">
        <div className="h-20 bg-white/10 rounded-xl"></div>
        <div className="h-20 bg-white/10 rounded-xl"></div>
        <div className="h-20 bg-white/10 rounded-xl"></div>
      </div>
    </div>
  </div>
);

// Error State
export const ErrorState = ({ error, onRetry }) => {
  const [retryCount, setRetryCount] = useState(0);
  
  return (
    <div className="glass-card rounded-2xl border-red-500/30 p-6">
      <div className="flex flex-col items-center justify-center text-center py-6">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">Unable to Load AI Insights</h3>
        <p className="text-xs text-brand-text-secondary mb-4">{error || 'Failed to fetch recommendations'}</p>
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
export const EmptyState = () => (
  <div className="glass-card rounded-2xl p-6">
    <div className="flex flex-col items-center justify-center text-center py-8">
      <div className="w-16 h-16 bg-brand-primary/20 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">🤖</span>
      </div>
      <h3 className="text-base font-semibold text-white mb-2">AI Insights Coming Soon</h3>
      <p className="text-sm text-brand-text-secondary">Upload candidates and jobs to get AI-powered recommendations.</p>
    </div>
  </div>
);
