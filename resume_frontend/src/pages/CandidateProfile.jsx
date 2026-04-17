import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ResumeViewer from '../components/ResumeViewer';
import { api } from '../services/api';

const CandidateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResume, setShowResume] = useState(true);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const response = await api.getCandidate(id);
        setCandidate(response.data);
      } catch (err) {
        console.error('Error fetching candidate details:', err);
        setError('Failed to load candidate details. They may not exist or the link is invalid.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCandidate();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold text-lg">{error}</span>
          </div>
          <button 
            onClick={() => {
              const returnTo = sessionStorage.getItem('return_to_match');
              if (returnTo) {
                navigate(returnTo);
              } else {
                navigate(-1);
              }
            }} 
            className="text-sm font-semibold hover:underline flex items-center"
          >
            &larr; Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  const resumeFile = candidate.resumes?.[0]?.file;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => {
                const returnTo = sessionStorage.getItem('return_to_match');
                if (returnTo) {
                  navigate(returnTo);
                } else {
                  navigate(-1);
                }
              }}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-xs sm:max-w-md">
              Candidate Profile: {candidate.name}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {resumeFile && (
              <a
                href={resumeFile}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-semibold items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Resume
              </a>
            )}
            <button
              onClick={() => setShowResume(!showResume)}
              className={`px-4 py-2 ${showResume ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'} rounded-lg hover:bg-blue-100 transition-all text-sm font-semibold flex items-center border border-transparent`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {showResume ? 'Hide Viewer' : 'Show Viewer'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className={`grid grid-cols-1 ${showResume ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* Profile Card Column */}
          <div className="space-y-6">
            {/* Main Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
              <div className="px-8 pb-8">
                <div className="relative flex justify-between items-end -mt-12 mb-6">
                  <div className="p-1 bg-white rounded-2xl shadow-lg inline-block">
                    <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-blue-600 font-bold text-3xl border-2 border-white">
                      {candidate.name?.charAt(0) || 'C'}
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${
                    candidate.status === 'hired' ? 'bg-green-50 text-green-700 border-green-100' :
                    candidate.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                    'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {candidate.status?.toUpperCase() || 'APPLIED'}
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
                  <p className="text-gray-500 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {candidate.email}
                  </p>
                  {candidate.phone && (
                    <p className="text-gray-500 font-medium flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {candidate.phone}
                    </p>
                  )}
                  {candidate.location && (
                    <p className="text-gray-500 font-medium flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {candidate.location}
                    </p>
                  )}
                  {candidate.experience_years !== undefined && (
                    <p className="text-gray-500 font-medium flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {candidate.experience_years} Years Experience
                    </p>
                  )}
                </div>

                {candidate.summary && (
                  <div className="py-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Professional Summary</h3>
                    <p className="text-gray-700 leading-relaxed italic">"{candidate.summary}"</p>
                  </div>
                )}

                <div className="py-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Core Competencies</h3>
                  <div className="flex flex-wrap gap-2">
                    {(candidate.extracted_skills?.length > 0 ? candidate.extracted_skills : candidate.skills)?.length > 0 ? (
                      (candidate.extracted_skills?.length > 0 ? candidate.extracted_skills : candidate.skills).map((skill, index) => (
                        <span key={index} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-semibold border border-indigo-100">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">No skills analyzed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Experience Card */}
            {candidate.experience?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Professional Experience
                </h3>
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {candidate.experience.map((exp, index) => (
                    <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-gray-100 group-[.is-active]:bg-blue-600 text-gray-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-gray-200 bg-white shadow">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-gray-900">{exp.role}</div>
                          <time className="font-medium text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded">{exp.duration}</time>
                        </div>
                        <div className="text-gray-500 font-medium text-sm mb-2">{exp.company}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education & Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidate.education?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                    Education
                  </h3>
                  <div className="space-y-4">
                    {candidate.education.map((edu, index) => (
                      <div key={index}>
                        <div className="font-bold text-gray-900 text-sm">{edu.degree}</div>
                        <div className="text-gray-500 text-xs">{edu.institution} • {edu.year}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {candidate.projects?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Projects
                  </h3>
                  <div className="space-y-4">
                    {candidate.projects.slice(0, 3).map((proj, index) => (
                      <div key={index}>
                        <div className="font-bold text-gray-900 text-sm">{proj.title}</div>
                        <div className="text-gray-500 text-xs line-clamp-1">{proj.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resume Viewer Column */}
          {showResume && (
            <div className="lg:sticky lg:top-24 h-[calc(100vh-8rem)]">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <span className="text-sm font-bold text-gray-700 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    RESUME_PREVIEW.PDF
                  </span>
                  {resumeFile && (
                    <a href={resumeFile} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wider">
                      Open Full Screen
                    </a>
                  )}
                </div>
                <div className="flex-1 bg-gray-800 relative">
                  {resumeFile ? (
                    <ResumeViewer url={resumeFile} title={`${candidate.name}'s Resume`} />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                      <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No resume file available</p>
                      <p className="text-sm opacity-60">Candidate data was imported without a source document</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;
