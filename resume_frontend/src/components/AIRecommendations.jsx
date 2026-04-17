import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import LearningPathCard from '../features/ai-recommendations/components/LearningPathCard';
import PredictiveInsight from '../features/ai-recommendations/components/PredictiveInsight';
import { SkeletonLoader, ErrorState, EmptyState } from '../features/ai-recommendations/components/FeedbackStates';

// Main Component
const AIRecommendations = ({ 
  recommendations = [], 
  loading, 
  error, 
  onRetry,
  title = "AI Recommendations",
  showPredictiveInsights = true,
  showLearningPaths = true
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'learning' | 'forecast'
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRetry?.();
    setTimeout(() => setIsRefreshing(false), 500);
  };
  
  // Process recommendations to extract different types
  const processRecommendations = () => {
    const insights = [];
    const learningPaths = [];
    const forecasts = [];
    
    recommendations.forEach((rec, index) => {
      if (typeof rec === 'string') {
        insights.push({ message: rec, type: 'insight' });
      } else if (rec.type === 'learning' || rec.category === 'learning') {
        learningPaths.push(rec);
      } else if (rec.type === 'forecast' || rec.category === 'forecast') {
        forecasts.push({ ...rec, type: 'forecast' });
      } else {
        insights.push({ 
          ...rec, 
          message: rec.text || rec.message || rec.recommendation || `Recommendation ${index + 1}`,
          type: rec.severity === 'high' ? 'warning' : 'insight'
        });
      }
    });
    
    return { insights, learningPaths, forecasts };
  };
  
  const { insights, learningPaths, forecasts } = processRecommendations();
  
  // Loading state
  if (loading || isRefreshing) {
    return <SkeletonLoader />;
  }
  
  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRefresh} />;
  }
  
  // Empty state
  if (!recommendations || recommendations.length === 0) {
    return <EmptyState />;
  }
  
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4.5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div>
          <h3 className="text-[15px] font-black text-white uppercase tracking-tight">{title}</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Neural hiring insights & intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      
      {/* Tab Navigation */}
      <div className="px-5 border-b border-white/5">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'insights' 
                ? 'border-brand-primary text-brand-primary' 
                : 'border-transparent text-brand-text-secondary hover:text-white'
            }`}
          >
            Insights ({insights.length})
          </button>
          {showLearningPaths && learningPaths.length > 0 && (
            <button
              onClick={() => setActiveTab('learning')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'learning' 
                  ? 'border-brand-primary text-brand-primary' 
                  : 'border-transparent text-brand-text-secondary hover:text-white'
              }`}
            >
              Learning ({learningPaths.length})
            </button>
          )}
          {showPredictiveInsights && forecasts.length > 0 && (
            <button
              onClick={() => setActiveTab('forecast')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'forecast' 
                  ? 'border-brand-primary text-brand-primary' 
                  : 'border-transparent text-brand-text-secondary hover:text-white'
              }`}
            >
              Forecasts ({forecasts.length})
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'insights' && (
              <div className="space-y-3">
                {insights.slice(0, 5).map((insight, index) => (
                  <PredictiveInsight 
                    key={`insight-${index}`} 
                    insight={insight} 
                    type={insight.type}
                  />
                ))}
                {insights.length > 5 && (
                  <button className="w-full py-2 text-sm text-brand-primary hover:text-brand-primary/80 font-medium">
                    View all {insights.length} insights →
                  </button>
                )}
              </div>
            )}
            
            {activeTab === 'learning' && (
              <div className="space-y-3">
                {learningPaths.slice(0, 5).map((path, index) => (
                  <LearningPathCard key={`learning-${index}`} path={path} index={index} />
                ))}
              </div>
            )}
            
            {activeTab === 'forecast' && (
              <div className="space-y-3">
                {forecasts.slice(0, 5).map((forecast, index) => (
                  <PredictiveInsight 
                    key={`forecast-${index}`} 
                    insight={forecast} 
                    type="forecast"
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Footer Stats */}
      <div className="px-5 py-4 bg-white/3 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-brand-text-secondary">
          <span>Last updated: Just now</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Real-time updates
          </span>
        </div>
      </div>
    </div>
  );
};

export default memo(AIRecommendations);
