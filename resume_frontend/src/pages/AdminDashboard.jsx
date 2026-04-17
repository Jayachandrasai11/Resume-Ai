import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { api } from '../services/api';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.dashboardAnalytics();
        setData(response.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { 
    candidate_count = 0, 
    job_count = 0, 
    total_resumes = 0,
    total_sessions = 0,
    skill_stats = {},
    resume_sources = [],
    monthly_growth = []
  } = data || {};

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin System Dashboard</h1>
            <p className="mt-1 text-gray-500">Global system metrics, recruitment pipeline, and candidate analytics.</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm">
              Generate Report
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
              Export Data
            </button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-green-600">Total</span>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500 uppercase">Candidates</p>
            <p className="text-3xl font-bold text-gray-900">{candidate_count}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-indigo-600">Files</span>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500 uppercase">Total Resumes</p>
            <p className="text-3xl font-bold text-gray-900">{total_resumes}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-400">Open</span>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500 uppercase">Active Jobs</p>
            <p className="text-3xl font-bold text-gray-900">{job_count}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-green-600">History</span>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500 uppercase">Total Sessions</p>
            <p className="text-3xl font-bold text-gray-900">{total_sessions}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Growth Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Candidate Growth Trend</h2>
            <div className="h-64 flex items-end justify-between space-x-2">
              {monthly_growth.map((item, index) => {
                const maxCount = Math.max(...monthly_growth.map(m => m.count), 1);
                const height = (item.count / maxCount) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full flex justify-center">
                      <div 
                        className="bg-indigo-500 group-hover:bg-indigo-600 w-8 sm:w-12 rounded-t-md transition-all duration-500 ease-in-out"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {item.count} candidates
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-2 rotate-45 sm:rotate-0 origin-top-left sm:origin-center">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resume Sources Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Resume Sources</h2>
            <div className="space-y-4">
              {resume_sources.map((source, index) => {
                const total = resume_sources.reduce((acc, curr) => acc + curr.count, 0);
                const percentage = Math.round((source.count / total) * 100);
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500'];
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 capitalize">{source.source || 'Unknown'}</span>
                      <span className="text-gray-500">{source.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`${colors[index % colors.length]} h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Skills Chart */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Top Candidate Skills</h2>
            <div className="space-y-5">
              {Object.entries(skill_stats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([skill, count]) => {
                  const percentage = Math.round((count / Math.max(candidate_count, 1)) * 100) || 0;
                  return (
                    <div key={skill} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition">{skill}</span>
                        <span className="text-xs font-medium text-gray-400">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-700 ease-out group-hover:bg-indigo-600"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(skill_stats).length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>No skill data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity/Placeholder for more analytics */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Interactive Reports</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">POWER BI</span>
            </div>
            <div className="h-[450px] w-full relative bg-gray-50">
              <iframe
                title="Power BI Dashboard"
                className="w-full h-full border-0"
                src="https://app.powerbi.com/view?r=eyJrIjoiNjA3YmU3NjItYTViMi00YjVmLThmNmUtNjY5ZDM0ZDY0YmE0IiwidCI6IjQ5YzUzNDY3LWJhYTgtNDg2Ny1hMDUzLWVkMDQ4YzY3OTgxMSIsImMiOjEwfQ%3D%3D"
                allowFullScreen={true}
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
