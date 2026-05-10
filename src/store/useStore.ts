import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  sessionId: string | null;
  ticketCode: string | null;
  votedTeamIds: string[];
  setSessionId: (id: string) => void;
  setTicketCode: (code: string) => void;
  addVotedTeamId: (teamId: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      sessionId: null,
      ticketCode: null,
      votedTeamIds: [],
      setSessionId: (id) => set({ sessionId: id }),
      setTicketCode: (code) => set({ ticketCode: code }),
      addVotedTeamId: (teamId) => set((state) => ({ 
        votedTeamIds: [...state.votedTeamIds, teamId] 
      })),
    }),
    {
      name: "pitch-scoring-storage",
    }
  )
);
