import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, asList } from '../services/api';

/**
 * ActivityTable Component
 * 
 * Shows recent candidates and jobs with tab navigation.
 * 
 * Props:
 * - maxItems: number (default 5) - Maximum items to show per category
 */
const ActivityTable = ({ maxItems = 5 }) => {
  const [activeTab, setActiveTab] = useState('candidates');
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch candidates
      const candidatesResponse = await api.listCandidates({ limit: maxItems });
      const candidatesList = asList(candidatesResponse.data);
      // Sort by most recently added (assuming higher id = newer)
      const sortedCandidates = candidatesList.sort((a, b) => b.id - a.id);
      setCandidates(sortedCandidates.slice(0, maxItems));

      // Fetch job descriptions
      const jobsResponse = await api.listJobDescriptions();
      const jobsList = asList(jobsResponse.data);
      // Sort by most recently added
      const sortedJobs = jobsList.sort((a, b) => b.id - a.id);
      setJobs(sortedJobs.slice(0, maxItems));
      
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      applied: 'bg-blue-100 text-blue-800',
      screening: 'bg-yellow-100 text-yellow-800',
      interview: 'bg-purple-100 text-purple-800',
      offered: 'bg-indigo-100 text-indigo-800',
      rejected: 'bg-red-100 text-red-800',
      hired: 'bg-green-100 text-green-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      draft: 'bg-gray-100 text-gray-600',
    };
    
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'candidates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Recent Candidates
              <span className="ml-1.5 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {candidates.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'jobs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Recent Jobs
              <span className="ml-1.5 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {jobs.length}
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Candidates Table */}
      {activeTab === 'candidates' && (
        <div className="overflow-x-auto">
          {candidates.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No candidates found.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <Link
                          to={`/candidates/${candidate.id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {candidate.name || 'Unnamed'}
                        </Link>
                        <span className="text-xs text-gray-500">
                          {candidate.email || 'No email'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(candidate.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(candidate.created_at || candidate.uploaded_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/candidates/${candidate.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Jobs Table */}
      {activeTab === 'jobs' && (
        <div className="overflow-x-auto">
          {jobs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No jobs found.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="text-sm font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {job.title || job.job_title || 'Untitled'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {job.company_name || job.company || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityTable;
