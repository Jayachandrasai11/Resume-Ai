import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ActiveSessionBanner from '../components/ActiveSessionBanner';
import DashboardLayout from '../layouts/DashboardLayout';
import FunnelChart from '../components/FunnelChart';
import SkillChart from '../components/SkillChart';
import MissingSkillsChart from '../components/MissingSkillsChart';
import AIRecommendations from '../components/AIRecommendations';
import RefreshButton from '../components/RefreshButton';
import { Link, useNavigate } from 'react-router-dom';
import { api, asList } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

function formatPct(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0%';
  return `${v.toFixed(0)}%`;
}

const SelectWithArrow = ({ value, onChange, disabled, className = '', children }) => (
  <div className="relative inline-flex items-center">
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`appearance-none bg-slate-950 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer disabled:opacity-50 shadow-inner ${className}`}
    >
      {children}
    </select>
    <svg className="pointer-events-none absolute right-3 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  </div>
);

const KpiCard = ({ title, value, detail, icon, trend, color, onRefresh, isRefreshing }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4.5 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl hover:bg-white/[0.02] transition-colors group shadow-lg"
  >
    <div className="flex justify-between items-start mb-4">
       <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center text-${color}-400 shadow-xl shadow-${color}-500/10`}>
          <div className="scale-90">{icon}</div>
       </div>
       <button 
         onClick={(e) => { e.stopPropagation(); onRefresh(); }} 
         disabled={isRefreshing}
         className={`p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-lg text-slate-500 hover:text-white transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
       >
          <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
       </button>
    </div>
    <div className="space-y-1">
       <div className="text-2xl font-black text-white tracking-tighter">{value}</div>
       <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{title}</span>
          {detail && (
            <div className={`flex items-center gap-1.5 mt-1.5 text-[9px] font-black uppercase tracking-widest ${trend === 'down' ? 'text-rose-500' : 'text-emerald-500'}`}>
               <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={trend === 'down' ? 'M19 14l-7 7-7-7' : 'M5 10l7-7 7 7'} />
               </svg>
               {detail}
            </div>
          )}
       </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const getSessionId = () => localStorage.getItem('job_session_id') || localStorage.getItem('session_id');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [summary, setSummary] = useState({
    total_candidates: 0,
    total_jobs: 0,
    shortlisted_candidates: 0,
    hired_candidates: 0,
    average_match_score: 0,
    trends: {},
  });

  const [funnel, setFunnel] = useState([]);
  const [skills, setSkills] = useState([]);
  const [missingSkills, setMissingSkills] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMatchType, setSelectedMatchType] = useState('smart');
  const [hiringData, setHiringData] = useState([]);
  const [recentCandidates, setRecentCandidates] = useState([]);
  
  const [matching, setMatching] = useState({
    match_type: 'smart',
    match_type_label: 'Smart',
    average_similarity_score: 0,
    total_matches: 0,
    score_distribution: [],
    top_matches: [],
  });

  const refreshData = useCallback(async () => {
    const sid = getSessionId();
    setRefreshing(true);
    try {
      const [
        summaryRes,
        funnelRes,
        skillsRes,
        matchingRes,
        candidatesRes,
        hiringTrendsRes,
        missingSkillsRes,
        recommendationsRes,
      ] = await Promise.all([
        api.dashboardSummary(sid).catch(() => ({ data: {} })),
        api.dashboardFunnel(sid).catch(() => ({ data: {} })),
        api.dashboardSkills().catch(() => ({ data: [] })),
        api.dashboardMatching(sid, selectedMatchType).catch(() => ({ data: {} })),
        api.listCandidates(sid ? { session_id: sid, page_size: 10 } : { page_size: 10 }).catch(() => ({ data: { results: [] } })),
        api.analyticsHiringTrends(selectedYear || undefined, sid).catch(() => ({ data: {} })),
        api.topMissingSkills().catch(() => ({ data: [] })),
        api.skillRecommendations().catch(() => ({ data: [] })),
      ]);

      setSummary({
        total_candidates: summaryRes.data?.total_candidates || 0,
        total_jobs: summaryRes.data?.total_jobs || 0,
        shortlisted_candidates: summaryRes.data?.shortlisted_candidates || 0,
        hired_candidates: summaryRes.data?.hired_candidates || 0,
        average_match_score: (summaryRes.data?.average_match_score || 0) * 100,
        trends: summaryRes.data?.trends || {},
      });

      const fData = funnelRes.data || {};
      setFunnel(Object.keys(fData).map((s) => ({ status: s, count: fData[s] || 0 })));
      setSkills(Array.isArray(skillsRes.data) ? skillsRes.data : []);
      setMissingSkills(Array.isArray(missingSkillsRes.data) ? missingSkillsRes.data : []);
      setRecommendations(Array.isArray(recommendationsRes.data) ? recommendationsRes.data : []);
      
      const hRes = hiringTrendsRes?.data || {};
      setHiringData((hRes.hiring_data || []).map(item => ({ period: item.period, count: item.count })));

      setMatching({
        match_type: matchingRes.data?.match_type || selectedMatchType,
        match_type_label: matchingRes.data?.match_type_label || 'Smart',
        average_similarity_score: (matchingRes.data?.average_similarity_score || 0) * 100,
        total_matches: matchingRes.data?.total_matches || 0,
        score_distribution: matchingRes.data?.score_distribution || [],
        top_matches: matchingRes.data?.top_matches || [],
      });

      setRecentCandidates(asList(candidatesRes.data).slice(0, 10));
    } catch (err) {
      console.error('Refresh Failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [selectedYear, selectedMatchType]);

  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    initFetch();
  }, [refreshData]);

  if (loading) return (
    <DashboardLayout>
       <div className="flex flex-col items-center justify-center h-[80vh]">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="mt-8 text-xs font-bold text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing Intelligence Center...</p>
       </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-12 space-y-12 bg-[#020617] min-h-screen">
        
        {/* ✨ ELITE HEADER ✨ */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">Intelligence <span className="text-indigo-500">Center</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse" />
               Live Protocol: Analyzing {summary.total_jobs} Mandates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RefreshButton loading={refreshing} onClick={refreshData} />
            <Link to="/upload" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
               Acquire Talent
            </Link>
          </div>
        </div>

        <ActiveSessionBanner />

        {/* 🚀 PRIMARY KPI HUB 🚀 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <KpiCard 
             title="Talent Pool" 
             value={summary.total_candidates} 
             detail={summary.trends?.candidates?.trend} 
             trend={summary.trends?.candidates?.direction}
             icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0" /></svg>}
             color="indigo"
             onRefresh={refreshData}
             isRefreshing={refreshing}
           />
           <KpiCard 
             title="Open Roles" 
             value={summary.total_jobs} 
             detail={summary.trends?.jobs?.trend} 
             trend={summary.trends?.jobs?.direction}
             icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
             color="violet"
             onRefresh={refreshData}
             isRefreshing={refreshing}
           />
           <KpiCard 
             title="Shortlisted" 
             value={summary.shortlisted_candidates} 
             detail={summary.trends?.shortlisted?.trend} 
             trend={summary.trends?.shortlisted?.direction}
             icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
             color="emerald"
             onRefresh={refreshData}
             isRefreshing={refreshing}
           />
           <KpiCard 
             title="Avg match" 
             value={formatPct(summary.average_match_score)} 
             detail={summary.trends?.match_score?.trend} 
             trend={summary.trends?.match_score?.direction}
             icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
             color="amber"
             onRefresh={refreshData}
             isRefreshing={refreshing}
           />
        </div>

        {/* 🗺️ ANALYTICS MAP 🗺️ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
               <div className="flex justify-between items-end mb-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white tracking-tight uppercase">Acquisition Radar</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volume tracking across deployment periods</p>
                  </div>
                  <SelectWithArrow value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    <option value="" className="bg-slate-950 text-white">Full History</option>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-slate-950 text-white">{y}</option>)}
                  </SelectWithArrow>
               </div>
               <ResponsiveContainer width="100%" height={340}>
                  <RechartsLineChart data={hiringData}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="period" stroke="#475569" fontSize={10} fontWeight={700} tickMargin={15} />
                    <YAxis stroke="#475569" fontSize={10} fontWeight={700} tickMargin={15} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '15px' }}
                      itemStyle={{ color: '#6366f1', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={5} dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3 }} />
                  </RechartsLineChart>
               </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <MissingSkillsChart skills={missingSkills} />
               <AIRecommendations recommendations={recommendations} />
            </div>
          </div>

          <div className="space-y-8">
             <SkillChart skills={skills} />
             <FunnelChart title="Pipeline stages" stages={funnel} />
          </div>
        </div>

        {/* 📋 ACTIVITY REGISTRY & MATCHING 📋 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           
           {/* Recent Acquires */}
           <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-white/5 flex justify-between items-end bg-white/[0.01]">
                 <div>
                    <h3 className="text-[15px] font-black text-white uppercase tracking-tight">Recent Acquires</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Latest talent injections</p>
                 </div>
                 <Link to="/candidates" className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-white transition-colors pb-1 border-b border-indigo-500/20">See Full Registry →</Link>
              </div>
              <div className="px-6 py-3 border-b border-white/5 grid grid-cols-12 gap-4">
                 <div className="col-span-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Candidate Assets</div>
                 <div className="col-span-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Status</div>
                 <div className="col-span-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-right">Date</div>
              </div>
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto scrollbar-thin">
                 {recentCandidates.map(c => (
                   <div key={c.id} className="px-6 py-3.5 grid grid-cols-12 gap-4 items-center hover:bg-white/[0.03] transition-colors group">
                      <div className="col-span-6 flex items-center gap-5">
                         <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-white group-hover:bg-indigo-600 transition-all">
                            {c.name?.charAt(0) || 'C'}
                         </div>
                         <div className="truncate">
                            <p className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors truncate">{c.name}</p>
                            <p className="text-[10px] text-slate-600 truncate">{c.email}</p>
                         </div>
                      </div>
                      <div className="col-span-3">
                         <span className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-indigo-400">
                            {c.status || 'Active'}
                         </span>
                      </div>
                      <div className="col-span-3 text-right text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                         {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                      </div>
                   </div>
                 ))}
                 {recentCandidates.length === 0 && <p className="p-16 text-center text-xs font-bold text-slate-600 uppercase tracking-widest">Registry Empty</p>}
              </div>
           </div>

           {/* AI Matching Hub */}
           <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-white/5 flex justify-between items-end bg-white/[0.01]">
                 <div>
                    <h3 className="text-[15px] font-black text-white uppercase tracking-tight">AI Matching</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Neural score analysis</p>
                 </div>
                 <SelectWithArrow value={selectedMatchType} onChange={(e) => setSelectedMatchType(e.target.value)}>
                    <option value="smart" className="bg-slate-950 text-white">Smart Match</option>
                    <option value="deep" className="bg-slate-950 text-white">Deep Sense</option>
                    <option value="exact" className="bg-slate-950 text-white">Exact Match</option>
                 </SelectWithArrow>
              </div>
              <div className="px-6 py-3 border-b border-white/5 grid grid-cols-12 gap-4">
                 <div className="col-span-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Score</div>
                 <div className="col-span-7 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Candidate Assets / Skills</div>
                 <div className="col-span-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-right">Strategy</div>
              </div>
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto scrollbar-thin">
                 {(matching.top_matches || []).map(m => (
                   <div key={m.id} className="px-6 py-3.5 grid grid-cols-12 gap-4 items-center hover:bg-white/[0.03] transition-colors group">
                      <div className="col-span-2">
                         <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {formatPct(m.match_score || 0)}
                         </div>
                      </div>
                      <div className="col-span-7 overflow-hidden">
                         <p className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-violet-400 transition-colors truncate">{m.candidate_name}</p>
                         <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest truncate">{m.skills || 'No Intel Tags'}</p>
                      </div>
                      <div className="col-span-3 text-right">
                         <span className="px-3 py-1 bg-violet-600/5 border border-violet-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-violet-400">
                            {m.match_type || 'Smart'}
                         </span>
                      </div>
                   </div>
                 ))}
                 {(!matching.top_matches || matching.top_matches.length === 0) && <p className="p-16 text-center text-xs font-bold text-slate-600 uppercase tracking-widest">No Matches Identified</p>}
              </div>
           </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
