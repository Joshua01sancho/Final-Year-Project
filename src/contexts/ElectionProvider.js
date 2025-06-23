import React, { createContext, useContext } from 'react';
import { create } from 'zustand';

const useElectionStore = create((set) => ({
  currentElection: null,
  elections: [],
  results: null,
  isLoading: false,
  error: null,

  setCurrentElection: (election) => set({ currentElection: election }),
  setElections: (elections) => set({ elections }),
  setResults: (results) => set({ results }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

const ElectionContext = createContext(undefined);

export const ElectionProvider = ({ children }) => {
  const election = useElectionStore();

  return (
    <ElectionContext.Provider value={{ election }}>
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = () => {
  const context = useContext(ElectionContext);
  if (context === undefined) {
    throw new Error('useElection must be used within an ElectionProvider');
  }
  return context.election;
};

export default useElectionStore; 