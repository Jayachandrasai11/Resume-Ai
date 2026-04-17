import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatPct(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0%';
  return `${v.toFixed(v % 1 === 0 ? 0 : 2)}%`;
}

function BarChart({ title, subtitle, data, valueKey, labelKey, color = '#2563eb' }) {
  const max = useMemo(() => {
    const vals = (Array.isArray(data) ? data : []).map((d) => Number(d?.[valueKey]) || 0);
    return Math.max(1, ...vals);
  }, [data, valueKey]);

  const items = Array.isArray(data) ? data : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            {subtitle ? <p className="text-xs text-gray-500 mt-1">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      <div className="p-6">
        {items.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No data available.</p>
        ) : (
          <div className="space-y-3">
            {items.map((d, idx) => {
              const raw = Number(d?.[valueKey]) || 0;
              const pct = clamp((raw / max) * 100, 0, 100);
              const label = String(d?.[labelKey] ?? '');

              return (
                <div key={`${label}-${idx}`} className="flex items-center gap-3">
                  <div className="w-28 text-xs font-medium text-gray-600 truncate">{label || '—'}</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                  <div className="w-14 text-right text-xs font-semibold text-gray-500 tabular-nums">
                    {raw}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PieChart({ title, subtitle, items, labelKey, valueKey }) {
  const data = Array.isArray(items) ? items : [];
  const total = data.reduce((sum, d) => sum + (Number(d?.[valueKey]) || 0), 0) || 0;

  const palette = ['#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#ef4444', '#0ea5e9', '#64748b'];
  const size = 180;
  const r = 70;
  const cx = size / 2;
  const cy = size / 2;

  let acc = 0;
  const slices = total > 0 ? data.map((d, i) => {
    const v = Number(d?.[valueKey]) || 0;
    const start = (acc / total) * Math.PI * 2;
    acc += v;
    const end = (acc / total) * Math.PI * 2;

    const x1 = cx + r * Math.cos(start - Math.PI / 2);
    const y1 = cy + r * Math.sin(start - Math.PI / 2);
    const x2 = cx + r * Math.cos(end - Math.PI / 2);
    const y2 = cy + r * Math.sin(end - Math.PI / 2);
    const largeArc = end - start > Math.PI ? 1 : 0;

    const path = [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    return {
      key: `${String(d?.[labelKey] ?? '')}-${i}`,
      path,
      color: palette[i % palette.length],
      label: String(d?.[labelKey] ?? '') || '—',
      value: v,
      pct: total > 0 ? (v / total) * 100 : 0,
    };
  }) : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {subtitle ? <p className="text-xs text-gray-500 mt-1">{subtitle}</p> : null}
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="flex justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={title} role="img">
            {slices.length === 0 ? (
              <circle cx={cx} cy={cy} r={r} fill="#e5e7eb" />
            ) : (
              slices.map((s) => <path key={s.key} d={s.path} fill={s.color} />)
            )}
            <circle cx={cx} cy={cy} r={42} fill="#fff" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="fill-gray-900">
              <tspan className="text-sm font-bold">{total || 0}</tspan>
              <tspan x={cx} dy="16" className="text-[10px] fill-gray-500">
                total
              </tspan>
            </text>
          </svg>
        </div>

        <div className="space-y-2">
          {data.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No data available.</p>
          ) : (
            slices
              .slice()
              .sort((a, b) => b.value - a.value)
              .map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                    <span className="text-sm text-gray-700 truncate">{s.label}</span>
                  </div>
                  <div className="text-xs font-semibold text-gray-500 tabular-nums">
                    {s.value} ({formatPct(s.pct)})
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

const Analytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [months, setMonths] = useState(6);
  const [period, setPeriod] = useState('monthly');
  const [timeSeriesOverride, setTimeSeriesOverride] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.recruiterComprehensiveAnalytics();
        setData(response.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        const status = err?.response?.status;
        const serverMsg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          (typeof err?.response?.data === 'string' ? err.response.data : null);
        if (!err?.response) {
          setError('Unable to connect to the server. Please start the backend and try again.');
        } else {
          setError(
            `Failed to load analytics data${status ? ` (HTTP ${status})` : ''}${
              serverMsg ? `: ${serverMsg}` : '.'
            }`
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Save state to sessionStorage
  const saveState = () => {
    sessionStorage.setItem("analytics_state", JSON.stringify({
      months,
      period,
      scrollY: window.scrollY
    }));
  };

  // Restore state on mount
  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("analytics_state"));
    if (saved) {
      setMonths(saved.months);
      setPeriod(saved.period);
      setTimeout(() => {
        window.scrollTo(0, saved.scrollY);
      }, 100);
    }
  }, []);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem("scrollY", window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.recruiterComprehensiveAnalytics();
      setData(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      const status = err?.response?.status;
      const serverMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? err.response.data : null);
      if (!err?.response) {
        setError('Unable to connect to the server. Please start the backend and try again.');
      } else {
        setError(
          `Failed to load analytics data${status ? ` (HTTP ${status})` : ''}${
            serverMsg ? `: ${serverMsg}` : '.'
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTimeSeries = async () => {
      try {
        const res = await api.recruiterTimeSeries({ period, months });
        setTimeSeriesOverride(res.data);
      } catch (err) {
        console.error('Error fetching time series:', err);
        // Keep existing comprehensive time_series as fallback
        setTimeSeriesOverride(null);
      }
    };

    fetchTimeSeries();
  }, [period, months]);

  const {
    overview = {},
    pipeline_distribution = { distribution: [] },
    top_skills = { top_skills: [] },
    recruitment_funnel = { funnel: [] },
    resume_sources = { sources: [] },
    time_series = { data: [] },
    candidates_per_job = { jobs: [] }
  } = data || {};

  // Backend may return a "safe wrapper" object for some sections:
  // { error, detail, data: <original_section_data> }
  const unwrap = (section) => {
    if (section && typeof section === 'object' && Object.prototype.hasOwnProperty.call(section, 'data')) {
      return section.data;
    }
    return section;
  };

  const overviewU = unwrap(overview) || {};
  const pipelineU = unwrap(pipeline_distribution) || { distribution: [], summary: {} };
  const topSkillsU = unwrap(top_skills) || { top_skills: [] };
  const funnelU = unwrap(recruitment_funnel) || { funnel: [] };
  const sourcesU = unwrap(resume_sources) || { sources: [] };
  const timeSeriesU = unwrap(time_series) || { data: [] };
  const jobsU = unwrap(candidates_per_job) || { jobs: [] };

  const effectiveTimeSeries = timeSeriesOverride || timeSeriesU || {};
  const timeSeries = Array.isArray(effectiveTimeSeries?.data) ? effectiveTimeSeries.data : [];
  const topSkills = Array.isArray(topSkillsU?.top_skills) ? topSkillsU.top_skills : [];
  const pipelineDist = Array.isArray(pipelineU?.distribution) ? pipelineU.distribution : [];
  const resumeSources = Array.isArray(sourcesU?.sources) ? sourcesU.sources : [];
  const sessionJobs = Array.isArray(jobsU?.jobs) ? jobsU.jobs : [];

  const trendBars = useMemo(() => {
    // Show last N periods (months/points) and use short labels.
    const points = timeSeries.slice(-Math.max(1, Number(months) || 6));
    return points.map((p) => ({
      label: (p?.period || '').slice(0, 7) || p?.period || '—',
      candidates: Number(p?.candidates) || 0,
      resumes: Number(p?.resumes) || 0,
    }));
  }, [timeSeries, months]);

  // IMPORTANT: all hooks above this point must run on every render.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-start justify-between gap-4">
        <div>{error}</div>
        <button
          type="button"
          onClick={handleRetry}
          className="shrink-0 px-3 py-2 bg-white border border-red-200 rounded-lg text-xs font-bold text-red-700 hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div className="flex flex-col items-start md:items-start">
          <button
            onClick={() => {
              const saved = sessionStorage.getItem("analytics_state");
              if (saved) {
                navigate("/analytics");
              } else {
                navigate(-1);
              }
            }}
            className="mb-2 px-1 py-0.5 bg-slate-600 text-white rounded text-xs hover:bg-slate-700 transition-all duration-200 shadow-sm flex items-center gap-0.5"
            >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Recruitment Analytics</h1>
          <div className="text-sm text-gray-500">
            Last updated: {data?.generated_at ? new Date(data.generated_at).toLocaleString() : 'N/A'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Period</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Points</span>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={12}>12</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Candidates</p>
            <p className="text-2xl font-bold text-gray-900">{overviewU.total_candidates || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Open Jobs</p>
            <p className="text-2xl font-bold text-gray-900">{overviewU.total_jobs || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Pipelines</p>
            <p className="text-2xl font-bold text-gray-900">{overviewU.active_pipelines || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conversion Rate</p>
            <p className="text-2xl font-bold text-gray-900">{pipelineU.summary?.conversion_rate || 0}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800">Candidate Pipeline</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {pipelineDist.map((stage) => (
                <div key={stage.stage}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{stage.stage_display}</span>
                    <span className="text-xs text-gray-500 font-semibold">{stage.count} candidates ({stage.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {pipelineDist.length === 0 && (
                <p className="text-center text-gray-500 py-4">No pipeline data available.</p>
              )}
            </div>
          </div>
        </div>

        <BarChart
          title="Skill Analytics (Top Skills)"
          subtitle="Share of candidates that mention each skill."
          data={topSkills.slice(0, 10).map((s) => ({ label: s?.name, value: Number(s?.candidate_count) || 0 }))}
          labelKey="label"
          valueKey="value"
          color="#16a34a"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Hiring Trend (Candidates over time)"
          subtitle={`From ${effectiveTimeSeries?.start_date || '—'} to ${effectiveTimeSeries?.end_date || '—'} (${effectiveTimeSeries?.period || period})`}
          data={trendBars.map((p) => ({ label: p.label, value: p.candidates }))}
          labelKey="label"
          valueKey="value"
          color="#2563eb"
        />

        <PieChart
          title="Resume Sources"
          subtitle="Where resumes are coming from."
          items={resumeSources.map((s) => ({
            label: s?.source_display || s?.source,
            value: Number(s?.count) || 0,
          }))}
          labelKey="label"
          valueKey="value"
        />
      </div>

      {/* Recruitment Funnel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Recruitment Funnel</h2>
          <span className="text-sm text-gray-500 italic">Total Applications: {funnelU.total_applications || 0}</span>
        </div>
        <div className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 md:space-x-4">
            {(Array.isArray(funnelU.funnel) ? funnelU.funnel : []).map((item, index) => (
              <React.Fragment key={item.stage}>
                <div className="flex flex-col items-center flex-1 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg mb-3 ${
                    index === 0 ? 'bg-blue-600' : 
                    index === (Array.isArray(funnelU.funnel) ? funnelU.funnel.length - 1 : -1) ? 'bg-red-500' :
                    index === (Array.isArray(funnelU.funnel) ? funnelU.funnel.length - 2 : -1) ? 'bg-green-600' :
                    'bg-gray-400'
                  }`}>
                    {item.count}
                  </div>
                  <p className="text-sm font-bold text-gray-800">{item.stage_display}</p>
                  {item.conversion_rate !== null && (
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      {item.conversion_rate}% conv.
                    </p>
                  )}
                </div>
                {index < (Array.isArray(funnelU.funnel) ? funnelU.funnel.length - 1 : 0) && (
                  <div className="hidden md:block">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Candidates per Session"
          subtitle="Number of candidates applied for each session/job."
          data={sessionJobs.slice(0, 10).map((j) => ({ label: j.title, value: j.total_candidates }))}
          labelKey="label"
          valueKey="value"
          color="#7c3aed"
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-center p-8 text-center">
          <div className="mb-4">
            <div className="text-4xl font-bold text-blue-600">{funnelU.overall_conversion_rate || 0}%</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Overall Conversion Rate</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 border-t border-gray-100 pt-6">
            <div>
              <div className="text-xl font-bold text-gray-900">{overviewU.active_pipelines || 0}</div>
              <div className="text-xs text-gray-500">Active Pipelines</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{overviewU.offered_candidates || 0}</div>
              <div className="text-xs text-gray-500">Total Offers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Insights (Jobs) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Session Insights</h2>
          <span className="text-sm text-gray-500">Active Recruitment Sessions: {jobsU.jobs_with_candidates || 0}</span>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold border-b border-gray-100">Job Role</th>
                <th className="px-6 py-3 font-semibold border-b border-gray-100">Location</th>
                <th className="px-6 py-3 font-semibold border-b border-gray-100 text-center">Total</th>
                <th className="px-6 py-3 font-semibold border-b border-gray-100 text-center">Active</th>
                <th className="px-6 py-3 font-semibold border-b border-gray-100 text-center text-green-600">Offered</th>
                <th className="px-6 py-3 font-semibold border-b border-gray-100 text-center text-red-600">Rejected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessionJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500 text-sm">
                    No active recruitment sessions found.
                  </td>
                </tr>
              ) : (
                sessionJobs.map((job) => (
                  <tr key={job.job_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{job.title}</div>
                      <div className="text-xs text-gray-500">{job.employment_type} • Created {new Date(job.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.location || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {job.total_candidates}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-gray-700">{job.active_candidates}</td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-green-600">{job.offered}</td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-red-600">{job.rejected}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Power BI Dashboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800">Interactive Reports</h2>
        </div>
        <div className="p-0 h-[600px] w-full bg-gray-100">
          <iframe
            title="Power BI Dashboard"
            className="w-full h-full border-0"
            src="https://app.powerbi.com/view?r=eyJrIjoiNjA3YmU3NjItYTViMi00YjVmLThmNmUtNjY5ZDM0ZDY0YmE0IiwidCI6IjQ5YzUzNDY3LWJhYTgtNDg2Ny1hMDUzLWVkMDQ4YzY3OTgxMSIsImMiOjEwfQ%3D%3D"
            allowFullScreen={true}
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
