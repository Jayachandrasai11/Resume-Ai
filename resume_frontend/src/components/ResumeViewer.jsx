import React from 'react';

/**
 * ResumeViewer component for displaying PDF and DOCX files in the browser.
 * 
 * @param {Object} props
 * @param {string} props.url - The URL of the resume file
 * @param {string} props.title - Optional title for the viewer
 * @param {string} props.className - Additional CSS classes
 */
const ResumeViewer = ({ url, title = 'Resume Preview', className = '' }) => {
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 italic p-12 ${className}`}>
        No resume file provided.
      </div>
    );
  }

  const isDocx = url.toLowerCase().endsWith('.docx') || url.toLowerCase().endsWith('.doc');
  const isPdf = url.toLowerCase().endsWith('.pdf');

  // Use Microsoft Office Online viewer for DOCX if URL is public
  // Otherwise, browsers usually download DOCX
  const docxViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="flex-1 relative">
        {isPdf ? (
          <iframe
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
            title={title}
            className="w-full h-full border-none"
            loading="lazy"
          />
        ) : isDocx ? (
          <iframe
            src={docxViewerUrl}
            title={title}
            className="w-full h-full border-none"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4 p-8 text-center">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p className="text-gray-600 font-medium">Preview not available for this file type.</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeViewer;
