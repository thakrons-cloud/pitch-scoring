import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  attendeeId: string | null;
  votedTeamIds: string[];
  lastResetTime: number | null;
  isAdmin: boolean;
  setAttendeeId: (id: string | null) => void;
  addVotedTeamId: (teamId: string) => void;
  setLastResetTime: (time: number) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  clearState: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      attendeeId: null,
      votedTeamIds: [],
      lastResetTime: null,
      isAdmin: false,
      setAttendeeId: (id) => set({ attendeeId: id }),
      addVotedTeamId: (teamId) => set((state) => ({ 
        votedTeamIds: [...state.votedTeamIds, teamId] 
      })),
      setLastResetTime: (time) => set({ lastResetTime: time }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      clearState: () => set({ votedTeamIds: [] }), 
    }),
    {
      name: "pitch-scoring-storage",
    }
  )
);
