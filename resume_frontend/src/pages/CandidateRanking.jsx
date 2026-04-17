import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { http, asList } from '../services/api';

const CandidateRanking = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(10);

  const fetchRankings = async (selectedLimit) => {
    try {
      setLoading(true);
      const response = await http.post('/ranking/match-by-job/', { 
        job_id: Number(jobId),
        limit: selectedLimit
      });
      console.log('API Response:', response.data);
      const candidates = asList(response.data?.results);
      console.log('Candidates data:', candidates);
      setRankedCandidates(candidates);
    } catch (err) {
      console.error('Error fetching candidate rankings:', err);
      setError('Failed to load candidate rankings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchRankings(limit);
    }
  }, [jobId, limit]);

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/jobs')}
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Candidate Rankings</h1>
        </div>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-600">Show:</label>
          <select 
            value={limit} 
            onChange={handleLimitChange}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 candidates</option>
            <option value={10}>10 candidates</option>
            <option value={20}>20 candidates</option>
            <option value={50}>50 candidates</option>
            <option value={100}>All</option>
          </select>
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {rankedCandidates.length} Candidates
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right">Match %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rankedCandidates.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic">
                  No rankings available for this job.
                </td>
              </tr>
            ) : (
              rankedCandidates.map((candidate, index) => (
                <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{candidate.name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{candidate.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-green-100 text-green-800">
                      {(() => {
                        // Debug: Log candidate data
                        console.log('Candidate:', candidate);
                        
                        // Safely compute the percentage value - handle NaN, Infinity, and missing fields
                        const raw = candidate.match_percentage !== undefined && candidate.match_percentage !== null
                          ? candidate.match_percentage
                          : (candidate.similarity_score !== undefined && candidate.similarity_score !== null
                            ? candidate.similarity_score * 100
                            : (candidate.score !== undefined && candidate.score !== null
                              ? candidate.score * 100
                              : 0));
                        const value = Number(raw);
                        const percent = Number.isFinite(value) ? value : 0;
                        console.log('Raw value:', raw, 'Percent:', percent);
                        return `${percent.toFixed(1)}%`;
                      })()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidateRanking;
