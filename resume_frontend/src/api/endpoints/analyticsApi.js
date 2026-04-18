import { http } from '../clients/axiosClient';

export const analyticsApi = {
  // Analytics
  dashboardAnalytics: () => http.get('analytics/'),
  recruiterComprehensiveAnalytics: () =>
    http.get('recruiter/analytics/comprehensive/'),
  recruiterTimeSeries: ({ period = 'monthly', months = 6 } = {}) =>
    http.get('recruiter/analytics/time-series/', { params: { period, months } }),

  // Dashboard (Power BI-style) analytics
  dashboardSummary: (sessionId) => http.get('dashboard/summary/', { params: sessionId ? { session_id: sessionId } : {} }),
  dashboardFunnel: (sessionId) => http.get('dashboard/funnel/', { params: sessionId ? { session_id: sessionId } : {} }),
  dashboardSkills: () => http.get('dashboard/skills/'),
  dashboardTrends: () => http.get('dashboard/trends/'),
  dashboardMatching: (sessionId, matchType) => {
    const params = {};
    if (sessionId) params.session_id = sessionId;
    if (matchType) params.match_type = matchType;
    return http.get('dashboard/matching/', { params });
  },

  // New Analytics APIs with recharts charts
  analyticsHiringTrends: (year, sessionId) => {
    const params = {};
    if (year) params.year = year;
    if (sessionId) params.session_id = sessionId;
    return http.get('analytics/hiring-trends', { params });
  },
  analyticsMatchDistribution: () => http.get('analytics/match-distribution'),

  // Skill Gap Analysis APIs
  skillGapAnalysis: (jobId) => http.get(`dashboard/skill-gap/${jobId}/`),
  topMissingSkills: () => http.get('dashboard/missing-skills/'),
  skillRecommendations: () => http.get('dashboard/skill-recommendations/'),

  // Admin (metrics + user management)
  adminMetrics: () => http.get('admin/metrics'),
  adminListUsers: () => http.get('users'),
};
