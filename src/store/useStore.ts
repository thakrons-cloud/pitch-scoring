import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
  } | null;
  sessionId: string | null;
  ticketCode: string | null;
  votedTeamIds: string[];
  lastResetTime: number | null;
  setUser: (user: StoreState['user']) => void;
  setSessionId: (id: string) => void;
  setTicketCode: (code: string | null) => void;
  addVotedTeamId: (teamId: string) => void;
  setLastResetTime: (time: number) => void;
  clearState: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      sessionId: null,
      ticketCode: null,
      votedTeamIds: [],
      lastResetTime: null,
      setUser: (user) => set({ user }),
      setSessionId: (id) => set({ sessionId: id }),
      setTicketCode: (code) => set({ ticketCode: code }),
      addVotedTeamId: (teamId) => set((state) => ({ 
        votedTeamIds: [...state.votedTeamIds, teamId] 
      })),
      setLastResetTime: (time) => set({ lastResetTime: time }),
      clearState: () => set({ votedTeamIds: [] }), // Keep user and ticketCode if they are logged in
    }),
    {
      name: "pitch-scoring-storage",
    }
  )
);
