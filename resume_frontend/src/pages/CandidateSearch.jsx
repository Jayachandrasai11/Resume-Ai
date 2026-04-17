import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ActiveSessionBanner from '../components/ActiveSessionBanner';
import ResumeViewer from '../components/ResumeViewer';
import { asList, http } from '../services/api';

const CandidateSearch = () => {
  const [query, setQuery] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobSessionId, setJobSessionId] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);

  useEffect(() => {
    const sessionId = localStorage.getItem('job_session_id');
    setJobSessionId(sessionId);
    // Passing sessionId directly to avoid race condition with state update
    fetchCandidates('', '', '', sessionId);
  }, []);

  const fetchCandidates = async (searchQuery = '', expFilter = '', eduFilter = '', sessionIdOverride = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const activeSessionId = sessionIdOverride !== null ? sessionIdOverride : jobSessionId;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (expFilter) params.append('experience', expFilter);
      if (eduFilter) params.append('education', eduFilter);
      if (activeSessionId) params.append('job_session_id', activeSessionId);

      const response = await http.get(`/candidates/search/?${params.toString()}`);
      setCandidates(asList(response.data));
    } catch (err) {
      console.error('Error searching candidates:', err);
      setError('Failed to search candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCandidates(query, experience, education);
  };

  const handleClear = () => {
    setQuery('');
    setExperience('');
    setEducation('');
    fetchCandidates('', '', '');
  };

  return (
    <div className="space-y-6">
      <ActiveSessionBanner />
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Candidate Search & Filters</h1>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name or Skill</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, skills..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Experience Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. Senior, 5 years..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Education Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="e.g. Bachelor, Master..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                'Search Candidates'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Results</h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {candidates.length} Found
          </span>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 border-b border-red-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Skills</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Experience/Education</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
                      Fetching candidates...
                    </div>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic">
                    No candidates found matching your criteria.
                  </td>
                </tr>
              ) : (
                candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link 
                          to={`/candidates/${candidate.id}`}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {candidate.name || 'Unnamed Candidate'}
                        </Link>
                        <span className="text-xs text-gray-500">{candidate.email || 'No email'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {candidate.extracted_skills && candidate.extracted_skills.length > 0 ? (
                          candidate.extracted_skills.slice(0, 5).map((skill, index) => (
                            <span key={index} className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded border border-blue-100">
                              {skill}
                            </span>
                          ))
                        ) : candidate.skills && Array.isArray(candidate.skills) ? (
                          candidate.skills.slice(0, 5).map((skill, index) => (
                            <span key={index} className="bg-gray-50 text-gray-700 text-[10px] px-1.5 py-0.5 rounded border border-gray-100">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">N/A</span>
                        )}
                        {(candidate.extracted_skills?.length > 5 || candidate.skills?.length > 5) && (
                          <span className="text-[10px] text-gray-400">+{Math.max(0, (candidate.extracted_skills?.length || 0) - 5, (candidate.skills?.length || 0) - 5)} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 space-y-1">
                        {candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0 && (
                          <div className="flex items-start">
                            <span className="font-semibold mr-1">Exp:</span>
                            <span className="truncate max-w-[150px]">
                              {candidate.experience[0].role || candidate.experience[0].company || 'N/A'}
                            </span>
                          </div>
                        )}
                        {candidate.education && Array.isArray(candidate.education) && candidate.education.length > 0 && (
                          <div className="flex items-start">
                            <span className="font-semibold mr-1">Edu:</span>
                            <span className="truncate max-w-[150px]">
                              {candidate.education[0].degree || candidate.education[0].institution || 'N/A'}
                            </span>
                          </div>
                        )}
                        {(!candidate.experience?.length && !candidate.education?.length) && (
                          <span className="text-gray-400 italic">No details available</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/candidates/${candidate.id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </Link>
                        {candidate.resumes?.[0]?.file && (
                          <button
                            onClick={() => setPreviewResume({ url: candidate.resumes[0].file, name: candidate.name })}
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Quick Preview"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                        <Link
                          to={`/candidates/${candidate.id}/resume`}
                          className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                          title="View Resume"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Preview Modal */}
      {previewResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">
                Resume Preview: <span className="text-blue-600">{previewResume.name}</span>
              </h3>
              <button 
                onClick={() => setPreviewResume(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4 bg-gray-100 overflow-hidden">
              <ResumeViewer url={previewResume.url} title={`${previewResume.name}'s Resume`} className="h-full" />
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button 
                onClick={() => setPreviewResume(null)}
                className="px-6 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateSearch;
