import React, { useState } from 'react';

const RefreshButton = ({ onClick, loading, className = '' }) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAction = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || showSuccess) return;
    
    try {
      await onClick();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Refresh click failed:', err);
    }
  };

  return (
    <button 
      onClick={handleAction}
      disabled={loading || showSuccess}
      className={`p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-brand-text-secondary hover:text-white disabled:opacity-50 group flex items-center justify-center ${showSuccess ? 'border-emerald-500/50 text-emerald-400' : ''} ${className}`}
      title={showSuccess ? 'Data updated' : 'Refresh data'}
    >
      {showSuccess ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg 
          className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
    </button>
  );
};

export default RefreshButton;
