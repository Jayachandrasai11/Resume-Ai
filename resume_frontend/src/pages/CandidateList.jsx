import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, asList } from '../services/api';

const CandidateList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const jobSessionId = localStorage.getItem('job_session_id');
        const response = await api.listCandidates({ session_id: jobSessionId });
        setCandidates(asList(response.data));
      } catch (err) {
        console.error('Error fetching candidates:', err);
        setError('Failed to load candidates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

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
          <h1 className="text-2xl font-bold text-gray-800">Candidate List</h1>
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {candidates.length} Total
          </span>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/gmail-import"
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Import from Gmail
          </Link>
          <Link
            to="/upload"
            className="flex items-center px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Candidate
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Skills</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Experience</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500 italic">
                  No candidates found for this session.
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {candidate.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {candidate.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      candidate.status === 'hired' ? 'bg-green-100 text-green-800' :
                      candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      candidate.status === 'interview' ? 'bg-purple-100 text-purple-800' :
                      candidate.status === 'offered' ? 'bg-indigo-100 text-indigo-800' :
                      candidate.status === 'screening' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {candidate.status ? candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1) : 'Applied'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills ? (
                        Array.isArray(candidate.skills) ? (
                          candidate.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-600">{candidate.skills}</span>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                      {Array.isArray(candidate.skills) && candidate.skills.length > 3 && (
                        <span className="text-xs text-gray-400">+{candidate.skills.length - 3} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {candidate.experience && candidate.experience.length > 0 ? (
                      <div>
                        <div className="font-medium">{candidate.experience[0].role}</div>
                        <div className="text-xs text-gray-500">{candidate.experience[0].company}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {candidate.id ? (
                      <Link
                        to={`/candidate/${candidate.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-sm font-semibold">No ID</span>
                    )}
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

export default CandidateList;
