/**
 * Converts JSON data to CSV and triggers a file download.
 * @param {Array<Object>} data - Array of objects to export.
 * @param {string} fileName - Name of the file to be saved (e.g., "candidates.csv").
 */
export const exportCSV = (data, fileName = 'export.csv') => {
  if (!data || !data.length) {
    console.error('No data provided for CSV export');
    return;
  }

  // Extract headers from the keys of the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const val = row[header] !== undefined && row[header] !== null ? row[header] : '';
        // Escape quotes and wrap in quotes if contains comma or quote
        const escaped = String(val).replace(/"/g, '""');
        return (escaped.includes(',') || escaped.includes('"')) ? `"${escaped}"` : escaped;
      }).join(',')
    )
  ];

  // Create Blob and trigger download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
