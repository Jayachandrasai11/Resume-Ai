import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useJobStore = create(
  persist(
    (set, get) => ({
      jobs: [],
      selectedJob: null,
      matches: [],
      isViewingMatches: false,
      lastAction: "list",
      // NEW: Search Results state (Smart Match / Deep Search)
      searchResults: [],
      isSearchMode: false,
      searchType: null, // "smart" | "deep" | null

      // Recruitment Funnel state
      funnelData: {},
      selectedCandidates: [],
      selectedStage: 'applied',

      _hasHydrated: false,

      setJobs: (jobs) => { console.log('Store: setJobs', jobs?.length); set({ jobs }); },
      setSelectedJob: (job) => { console.log('Store: setSelectedJob', job?.title); set({ selectedJob: job }); },
      setMatches: (matches) => { 
        console.log('Store: setMatches', matches?.length); 
        set({ matches }); 
        // Debug: verify persistence immediately after set
        setTimeout(() => {
          const stored = localStorage.getItem('job-match-store');
          console.log('Store: localStorage after setMatches:', stored ? 'EXISTS' : 'EMPTY');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              console.log('Store: persisted matches count:', parsed.state?.matches?.length || 0);
            } catch(e) { console.error('Parse error:', e); }
          }
        }, 100);
      },
      setViewingMatches: (flag) => { console.log('Store: setViewingMatches', flag); set({ isViewingMatches: flag }); },
      setLastAction: (action) => { console.log('Store: setLastAction', action); set({ lastAction: action }); },
      setHasHydrated: (flag) => { console.log('Store: setHasHydrated', flag); set({ _hasHydrated: flag }); },
      
      // NEW: Search Results setters
      setSearchResults: (results) => { 
        console.log('Store: setSearchResults', results?.length); 
        set({ searchResults: results }); 
        setTimeout(() => {
          const stored = localStorage.getItem('job-match-store');
          console.log('Store: localStorage after setSearchResults:', stored ? 'EXISTS' : 'EMPTY');
        }, 100);
      },
      setIsSearchMode: (flag) => { console.log('Store: setIsSearchMode', flag); set({ isSearchMode: flag }); },
      setSearchType: (type) => { console.log('Store: setSearchType', type); set({ searchType: type }); },

      // Funnel setters
      setFunnelData: (data) => set({ funnelData: data }),
      setSelectedStage: (stage) => {
        console.log('[Store] setSelectedStage:', stage);
        set({ selectedStage: stage });
      },
      setSelectedCandidates: (candidates) => {
        // Ensure selectedCandidates is always an array
        const validCandidates = Array.isArray(candidates) ? candidates : [];
        set({ selectedCandidates: validCandidates });
      },

      // For compatibility with existing code
      viewMatches: (job, matches) => {
        set({ selectedJob: job, matches: matches, isViewingMatches: true, lastAction: "matches" });
      },

      resetMatches: () => set({
        matches: [],
        isViewingMatches: false,
        lastAction: "list"
      }),

      clearMatches: () => set({
        selectedJob: null,
        matches: [],
        isViewingMatches: false,
        lastAction: "list"
      }),

      resetMatchState: () => set({
        selectedJob: null,
        matches: [],
        isViewingMatches: false,
        lastAction: "list"
      }),
      
      // NEW: Reset search state
      resetSearchState: () => set({
        searchResults: [],
        isSearchMode: false,
        searchType: null
      }),

      // Funnel reset
      resetFunnelState: () => set({
        funnelData: {},
        selectedCandidates: [],
        selectedStage: 'applied'
      }),
      
      // NEW: Combined reset for all match/search state
      resetAllMatchState: () => set({
        selectedJob: null,
        matches: [],
        isViewingMatches: false,
        lastAction: "list",
        searchResults: [],
        isSearchMode: false,
        searchType: null,
        funnelData: {},
        selectedCandidates: []
      }),
    }),
    {
      name: 'job-match-store', // unique name for this store
      storage: createJSONStorage(() => localStorage), // Changed from sessionStorage to localStorage for persistence across tabs
       // Only persist these fields
       partialize: (state) => ({
         // ✅ Only persist what's absolutely necessary for back button
         selectedJob: state.selectedJob,
         searchResults: state.searchResults.slice(0, 50), // Limit size
         isSearchMode: state.isSearchMode,
         searchType: state.searchType,
       }),
      onRehydrateStorage: () => (state) => {
        console.log('Store: onRehydrateStorage called, state:', state);
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);
