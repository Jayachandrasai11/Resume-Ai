import React, { useState, useEffect } from 'react';
import { api, asList } from '../services/api';

const CandidateStatus = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const statusOptions = [
    { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
    { value: 'screening', label: 'Screening', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800' },
    { value: 'offered', label: 'Offered', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'hired', label: 'Hired', color: 'bg-green-100 text-green-800' },
  ];

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await api.listCandidates();
      setCandidates(asList(response.data));
      setError(null);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Failed to load candidates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (candidateId, newStatus) => {
    try {
      setUpdatingId(candidateId);
      await api.patchCandidate(candidateId, { status: newStatus });
      
      // Update local state
      setCandidates(prev => prev.map(c => 
        c.id === candidateId ? { ...c, status: newStatus } : c
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update candidate status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (statusValue) => {
    const option = statusOptions.find(o => o.value === statusValue) || statusOptions[0];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${option.color}`}>
        {option.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Recruitment Pipeline</h1>
        <button 
          onClick={fetchCandidates}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-6">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Update Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                  No candidates found in the system.
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{candidate.name || 'Unnamed'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(candidate.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={candidate.status || 'applied'}
                      onChange={(e) => handleStatusChange(candidate.id, e.target.value)}
                      disabled={updatingId === candidate.id}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {candidate.email || 'N/A'}
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

export default CandidateStatus;
