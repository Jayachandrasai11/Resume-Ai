import { http } from '../clients/axiosClient';

export const jobApi = {
  // Sessions (JD app)
  listJobSessions: () => http.get('jobs/job-sessions/'),
  getJobSession: (id) => http.get(`jobs/job-sessions/${id}/`),
  createJobSession: ({ company_name, hr_name, job_role }) =>
    http.post('jobs/job-sessions/', { company_name, hr_name, job_role }),
  deleteJobSession: (id) => http.delete(`jobs/job-sessions/${id}/`),
  updateJobSession: (id, payload) => http.patch(`jobs/job-sessions/${id}/`, payload),

  // Job Descriptions (JD app)
  listJobDescriptions: (params) => http.get('jobs/', { params }),
  createJobDescription: (payload) => http.post('jobs/create/', payload),
  updateJobDescription: (id, payload) => http.patch(`jobs/update/${id}/`, payload),
  deleteJobDescription: (id) => http.delete(`jobs/${id}/`),

  // Matching & Ranking
  matchByJobId: (jobId, limit = 30, threshold = 0.5, strategy = 'cosine', mode = 'smart') => 
    http.get(`jobs/${jobId}/match/?limit=${limit}&threshold=${threshold}&strategy=${strategy}&mode=${mode}`),
  matchCandidates: (jobId, count = 30) => http.get(`match-candidates?job_id=${jobId}&count=${count}`),
};
