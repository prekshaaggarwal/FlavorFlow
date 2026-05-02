import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Session = {
  token: string;
  phone: string;
  email?: string;
  name?: string;
  provider?: 'phone' | 'google';
};

type AuthState = {
  session: Session | null;
  setSession: (s: Session | null) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
    }),
    {
      name: 'flavorflow:auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ session: s.session }),
    }
  )
);
