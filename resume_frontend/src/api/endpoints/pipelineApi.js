import { http } from '../clients/axiosClient';

export const pipelineApi = {
  // Update candidate pipeline stage
  updateStage: (candidateId, jobId, currentStage, notes = '') => 
    http.post('/pipeline/update-stage/', { 
      candidate_id: candidateId, 
      job_id: jobId, 
      current_stage: currentStage, 
      notes 
    }),

  // Get pipelines mapped by stage
  getByStage: (stage) => http.get('/pipeline/by_stage/', { params: stage ? { stage } : {} }),

  // Get available stages
  getStages: () => http.get('/pipeline/stages/'),

  // Get pipelines for a specific candidate
  getByCandidate: (candidateId) => http.get('/pipeline/by_candidate/', { params: { candidate_id: candidateId } }),

  // Get pipelines for a specific job
  getByJob: (jobId) => http.get('/pipeline/by_job/', { params: { job_id: jobId } })
};
