import React, { useState } from 'react';
import { http } from '../services/api';

const CandidateExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const jobSessionId = localStorage.getItem('job_session_id');
      
      const response = await http.get('/candidates/export/', {
        params: { session_id: jobSessionId },
        responseType: 'blob', // Important for file downloads
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from content-disposition header if available, otherwise use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'candidates_export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(true);
    } catch (err) {
      console.error('Error exporting candidates:', err);
      setError('Failed to export candidates. Please ensure a job session is active and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50/50">
          <h1 className="text-2xl font-bold text-gray-800">Export Candidate Data</h1>
          <p className="text-gray-600 mt-2">
            Download candidate details for the current active session in CSV format.
          </p>
        </div>

        <div className="p-8 flex flex-col items-center justify-center space-y-6">
          <div className="bg-blue-50 p-6 rounded-full">
            <svg 
              className="w-16 h-16 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Ready to Export</h3>
            <p className="text-sm text-gray-500 mt-1">
              The CSV will include candidate names, emails, skills, and experience details.
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="w-full bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              Export successful! Your download should have started.
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={loading}
            className={`w-full max-w-xs py-3 px-6 rounded-lg font-semibold text-white transition-all shadow-sm flex items-center justify-center space-x-2 ${
              loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download CSV</span>
              </>
            )}
          </button>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Note:</h4>
          <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
            <li>Make sure you have an active session from the Recruitment Setup page.</li>
            <li>The export will contain data for all candidates processed in the current session.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CandidateExport;
