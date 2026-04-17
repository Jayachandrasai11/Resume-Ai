import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      selectedJob: null,
      matches: [],
      isViewingMatches: false,
      _hasHydrated: false,

      setSelectedJob: (job) => set({ selectedJob: job }),

      setMatches: (job, matches) => set({
        selectedJob: job,
        matches: matches,
        isViewingMatches: true
      }),

      // To match Jobs.jsx usage if it was named viewMatches
      viewMatches: (job, matches) => set({
        selectedJob: job,
        matches: matches,
        isViewingMatches: true
      }),

      clearMatches: () => set({
        selectedJob: null,
        matches: [],
        isViewingMatches: false
      }),

      clearViewingMatches: () => set({
        selectedJob: null,
        matches: [],
        isViewingMatches: false
      }),

      setIsViewingMatches: (value) => set({ isViewingMatches: value }),
      setHasHydrated: (flag) => set({ _hasHydrated: flag }),
    }),
    {
      name: 'match-store', // unique name for this store
      // Only persist these fields
      partialize: (state) => ({
        selectedJob: state.selectedJob,
        matches: state.matches,
        isViewingMatches: state.isViewingMatches,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useStore;
