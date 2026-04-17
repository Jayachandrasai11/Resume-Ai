import React, { useState } from 'react';
import { http } from '../services/api';

const GmailImport = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [importedCandidates, setImportedCandidates] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and app password.');
      return;
    }

    const job_session_id = localStorage.getItem('job_session_id');
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setImportedCandidates([]);

      const response = await http.post('/scan-emails/', {
        email_user: email,
        email_pass: password,
        email_host: 'imap.gmail.com',
        job_session_id: job_session_id
      });

      const results = response.data?.results || [];
      const successfulImports = results.filter(r => r.status === 'processed');
      
      setImportedCandidates(successfulImports);
      
      if (successfulImports.length > 0) {
        setSuccess(`Successfully imported ${successfulImports.length} resumes from Gmail!`);
      } else if (results.length > 0) {
        setError('No resumes were successfully imported. Please check the results below.');
      } else {
        setSuccess('Scan completed. No new resumes found.');
      }
      
      // Keep email/password for convenience in case they want to retry or scan another folder
    } catch (err) {
      console.error('Gmail import error:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Failed to import resumes from Gmail. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/3">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center glow-danger">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gmail Resume Import</h1>
              <p className="text-brand-text-secondary mt-1">Import resumes directly from your Gmail inbox using an App Password.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {success && (
            <div className="p-4 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Gmail Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full px-4 py-3"
                placeholder="your-email@gmail.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">App Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full px-4 py-3"
                placeholder="Your 16-character Gmail App Password"
                required
              />
              <p className="text-xs text-brand-text-secondary mt-2">
                Use a Google App Password, not your regular account password. 
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline ml-1">
                  Create one here
                </a>
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className={`btn-primary w-full py-4 ${(loading || !email || !password) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scanning for Resumes...
              </span>
            ) : 'Start Import'}
          </button>
        </form>
      </div>

      {importedCandidates.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/3">
            <h2 className="text-xl font-bold text-white">Imported Candidates</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/3 border-b border-white/5">
                  <th className="px-6 py-3 text-xs font-semibold text-brand-text-secondary uppercase">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-brand-text-secondary uppercase">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold text-brand-text-secondary uppercase">Phone</th>
                  <th className="px-6 py-3 text-xs font-semibold text-brand-text-secondary uppercase">File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {importedCandidates.map((result, idx) => (
                  <tr key={idx} className="table-row">
                    <td className="px-6 py-4 font-medium text-white">{result.parsed?.Name || 'N/A'}</td>
                    <td className="px-6 py-4 text-brand-text-secondary">{result.parsed?.Email || 'N/A'}</td>
                    <td className="px-6 py-4 text-brand-text-secondary">{result.parsed?.Phone || 'N/A'}</td>
                    <td className="px-6 py-4 text-brand-text-secondary text-sm truncate max-w-xs">{result.filename}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GmailImport;
