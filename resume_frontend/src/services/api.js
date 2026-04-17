import { http, asList, API_BASE_URL } from '../api/clients/axiosClient';
import { authApi } from '../api/endpoints/authApi';
import { candidateApi, deleteResume, bulkDeleteResumes } from '../api/endpoints/candidateApi';
import { pipelineApi } from '../api/endpoints/pipelineApi';
import { jobApi } from '../api/endpoints/jobApi';
import { analyticsApi } from '../api/endpoints/analyticsApi';

// Re-export specific standalone functions to avoid breaking legacy imports
export { http, deleteResume, bulkDeleteResumes, asList };

// The API God-Object (Modularized)
export const api = {
  baseURL: API_BASE_URL,

  // Modular segments mapped back to legacy interface
  ...authApi,
  ...candidateApi,
  pipeline: pipelineApi, // New pipeline segment
  ...jobApi,
  ...analyticsApi,
};
