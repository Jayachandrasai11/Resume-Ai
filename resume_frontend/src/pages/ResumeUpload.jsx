import React, { useState } from 'react';
import { http } from '../services/api';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a resume file to upload.');
      return;
    }

    const job_session_id = localStorage.getItem('job_session_id');
    const formData = new FormData();
    formData.append('resume_file', file);
    if (job_session_id) {
      formData.append('job_session_id', job_session_id);
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await http.post('/resumes/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Resume uploaded successfully!');
      setFile(null);
      // Reset file input manually
      e.target.reset();
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Failed to upload resume. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50/50">
          <h1 className="text-2xl font-bold text-gray-800">Upload Resume</h1>
          <p className="text-gray-600 mt-1">Submit candidate resumes for analysis and ranking.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {success && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Resume File (PDF or DOCX)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-600 font-semibold">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">Only PDF, DOCX files accepted</p>
                  {file && <p className="mt-4 text-sm font-medium text-blue-600">Selected: {file.name}</p>}
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className={`w-full py-4 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95 ${
              loading || !file 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : 'Upload Resume'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResumeUpload;
