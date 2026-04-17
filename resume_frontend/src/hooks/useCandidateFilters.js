import { useState, useCallback, useEffect } from 'react';
import { api, asList } from '../services/api';

export function useCandidateFilters() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    name: '',
    status: '',
    skills: '',
    experience: '',
  });

  const statusChoices = [
    { value: '', label: 'All Phases' },
    { value: 'applied', label: 'Applied' },
    { value: 'screening', label: 'Screening' },
    { value: 'interview', label: 'Interview' },
    { value: 'offered', label: 'Offered' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'hired', label: 'Hired' },
  ];

  const fetchCandidates = useCallback(async (customFilters = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = customFilters || filters;
      const params = new URLSearchParams();
      if (currentFilters.name) params.append('name', currentFilters.name);
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.skills) params.append('skills', currentFilters.skills);
      if (currentFilters.experience) params.append('experience', currentFilters.experience);

      const jobSessionId = localStorage.getItem('job_session_id') || localStorage.getItem('session_id');
      
      if (!jobSessionId) {
        setCandidates([]);
        setLoading(false);
        return;
      }

      params.append('session_id', jobSessionId);

      const response = await api.listCandidates(Object.fromEntries(params.entries()));
      setCandidates(asList(response.data));
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Failed to load candidate directory.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCandidates();
  }, []); // Initial load only, manually triggered searches otherwise

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSearch = useCallback((e) => {
    if (e) e.preventDefault();
    fetchCandidates();
  }, [fetchCandidates]);

  const handleClear = useCallback(() => {
    const emptyFilters = { name: '', status: '', skills: '', experience: '' };
    setFilters(emptyFilters);
    fetchCandidates(emptyFilters);
  }, [fetchCandidates]);

  return {
    candidates,
    loading,
    error,
    filters,
    statusChoices,
    handleInputChange,
    handleSearch,
    handleClear,
  };
}
