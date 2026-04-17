import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CandidateCard = ({ candidate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const candidateId = candidate.candidate_id || candidate.id;
  const candidateName = candidate.name || 'Unnamed Candidate';
  const candidateEmail = candidate.email || 'N/A';
  const candidateStatus = candidate.status || 'applied';
  const candidateSkills = candidate.extracted_skills || candidate.skills || [];
  const matchScore = candidate.match_percentage || (candidate.similarity_score ? Math.round(candidate.similarity_score * 100) : null);

  const statusColors = {
    applied: 'badge-info',
    screening: 'badge-warning',
    interview: 'badge-purple',
    offered: 'badge-success',
    hired: 'badge-success',
    rejected: 'badge-danger',
  };

  const statusLabels = {
    applied: 'Applied',
    screening: 'Screening',
    interview: 'Interview',
    offered: 'Offered',
    hired: 'Hired',
    rejected: 'Rejected',
  };

  return (
    <div
   className={`bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ease-out cursor-pointer ${
     isHovered ? 'border-indigo-500/30 transform scale-[1.01]' : ''
   }`}
   style={{
     boxShadow: isHovered 
       ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(99, 102, 241, 0.05)' 
       : '0 4px 15px rgba(0, 0, 0, 0.2)'
   }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-expanded={isHovered}
    >
      {/* Always visible header section */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-0.5">
              <h3 className="text-[17px] font-black text-white tracking-tight truncate">{candidateName}</h3>
              {matchScore && (
                <span className="bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest">{matchScore}%</span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-400 truncate mb-1.5">{candidateEmail}</p>
            <span className={`${statusColors[candidateStatus]} px-2 py-0.5 text-[10px] uppercase font-black tracking-widest rounded-full shadow-sm`}>
              {statusLabels[candidateStatus]}
            </span>
          </div>

          {/* Quick actions - always visible */}
          <div className="flex flex-col gap-2">
            <Link
              to={`/candidates/${candidateId}`}
              onClick={(e) => e.stopPropagation()}
              className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </Link>
          </div>
        </div>

        {/* Expandable section - visible only on hover */}
        <div 
          className={`overflow-hidden transition-all duration-400 ease-out ${
            isHovered ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-3 border-t border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Top Skills
            </p>
            
            <div className="flex flex-wrap gap-1.5 mb-4">
              {candidateSkills.slice(0, 5).map((skill, idx) => (
                <span 
                  key={idx}
                  className="bg-slate-800 text-slate-300 border border-white/5 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase rounded shadow-sm"
                  style={{
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateY(0)' : 'translateY(8px)',
                    transition: `all 0.3s ease ${idx * 50}ms`,
                  }}
                >
                  {skill}
                </span>
              ))}
              {candidateSkills.length > 5 && (
                <span className="text-[10px] font-bold text-slate-500">
                  +{candidateSkills.length - 5} more
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/candidates/${candidateId}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Link>
              
              <Link
                to={`/resume-chat/${candidateId}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 px-4 py-2.5 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8z" />
                </svg>
                Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;