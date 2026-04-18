import { http, asList } from '../clients/axiosClient';

// Direct utility export that matches the old top-level format
export const deleteResume = (resumeId) => http.delete(`resumes/${resumeId}/`);
export const bulkDeleteResumes = (resumeIds) => http.delete('resumes/bulk-delete/', { data: { resume_ids: resumeIds } });

export const candidateApi = {
  // Candidate listings
  listCandidates: (params) => http.get('candidates/', { params }),
  getCandidate: (id) => http.get(`candidates/${id}/`),
  patchCandidate: (id, payload) => http.patch(`candidates/${id}/`, payload),
  exportCandidates: () => http.get('candidates/export/', { responseType: 'blob' }),
};
