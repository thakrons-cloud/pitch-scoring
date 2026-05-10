import { create } from 'zustand';

interface AppState {
  sessionId: string | null;
  deviceHash: string | null;
  setSessionId: (id: string) => void;
  setDeviceHash: (hash: string) => void;
}

export const useStore = create<AppState>((set) => ({
  sessionId: null,
  deviceHash: null,
  setSessionId: (id) => set({ sessionId: id }),
  setDeviceHash: (hash) => set({ deviceHash: hash }),
}));
