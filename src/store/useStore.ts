import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  sessionId: string | null;
  ticketCode: string | null;
  votedTeamIds: string[];
  lastResetTime: number | null;
  setSessionId: (id: string) => void;
  setTicketCode: (code: string | null) => void;
  addVotedTeamId: (teamId: string) => void;
  setLastResetTime: (time: number) => void;
  clearState: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      sessionId: null,
      ticketCode: null,
      votedTeamIds: [],
      lastResetTime: null,
      setSessionId: (id) => set({ sessionId: id }),
      setTicketCode: (code) => set({ ticketCode: code }),
      addVotedTeamId: (teamId) => set((state) => ({ 
        votedTeamIds: [...state.votedTeamIds, teamId] 
      })),
      setLastResetTime: (time) => set({ lastResetTime: time }),
      clearState: () => set({ ticketCode: null, votedTeamIds: [] }),
    }),
    {
      name: "pitch-scoring-storage",
    }
  )
);
