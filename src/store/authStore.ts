import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { AppUser } from '../types';
import { getUserProfile, onAuthChange } from '../services/authService';

interface AuthStore {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setAppUser: (appUser: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  appUser: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setAppUser: (appUser) => set({ appUser }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ user: null, appUser: null, loading: false }),

  initialize: () => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        set({ user: firebaseUser, loading: true });
        const profile = await getUserProfile(firebaseUser.uid);
        set({ appUser: profile, loading: false, initialized: true });
      } else {
        set({ user: null, appUser: null, loading: false, initialized: true });
      }
    });
    return unsubscribe;
  },
}));
