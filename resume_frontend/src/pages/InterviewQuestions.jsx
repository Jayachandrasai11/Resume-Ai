import React, { useState } from 'react';
import { http } from '../services/api';

const InterviewQuestions = () => {
  const [role, setRole] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role.trim() || loading) return;

    setLoading(true);
    setError(null);
    setQuestions([]);

    try {
      const response = await http.post('/interview-questions/', { role_or_skill: role });
      const data = response.data;
      
      // Handle different possible response formats
      const generatedQuestions = data.questions || data.response || (Array.isArray(data) ? data : []);
      setQuestions(generatedQuestions);
    } catch (err) {
      console.error('Error generating interview questions:', err);
      setError('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple to-brand-primary flex items-center justify-center glow-purple">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Interview Question Generator</h1>
            <p className="text-sm text-brand-text-secondary mt-1">Generate tailored interview questions for specific roles or skills.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            className="input-field flex-1 px-4 py-3"
            placeholder="Enter job role or skill (e.g., React Developer, Python, AWS)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className={`btn-primary px-8 py-3 flex items-center justify-center ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              'Generating...'
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Questions
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="glass-card p-4 text-red-400 border border-red-500/20 rounded-xl">
          {error}
        </div>
      )}

      {questions.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/3">
            <h2 className="text-xl font-semibold text-white">Generated Questions for "{role}"</h2>
          </div>
          <div className="p-6">
            <ul className="space-y-4">
              {Array.isArray(questions) ? questions.map((q, index) => (
                <li key={index} className="flex items-start p-4 glass-elevated rounded-xl">
                  <span className="flex-shrink-0 bg-gradient-to-br from-brand-primary to-brand-purple text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4">
                    {index + 1}
                  </span>
                  <div className="text-white leading-relaxed pt-1">
                    {typeof q === 'string' ? q : JSON.stringify(q)}
                  </div>
                </li>
              )) : (
                <div className="whitespace-pre-wrap text-white leading-relaxed glass-elevated p-6 rounded-xl">
                  {questions}
                </div>
              )}
            </ul>
          </div>
        </div>
      )}
      
      {!loading && questions.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-brand-text-secondary">
          <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-brand-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-white/70">No questions generated yet</p>
          <p className="text-sm text-brand-text-secondary">Enter a role above to get started</p>
        </div>
      )}
    </div>
  );
};

export default InterviewQuestions;
