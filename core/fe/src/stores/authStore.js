import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';

/**
 * Trang thai dang nhap. Chi luu accessToken vao localStorage; user + permissions
 * luon lay moi tu API /auth/me khi load app (de doi quyen co hieu luc ngay).
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      permissions: [],
      isProfileLoaded: false,

      /** @param {{ accessToken: string, user: object }} session */
      setSession: ({ accessToken, user }) => set({ accessToken, user }),

      /** @param {{ user: object, permissions: string[] }} profile */
      setProfile: ({ user, permissions }) => set({ user, permissions, isProfileLoaded: true }),

      logout: () => set({ accessToken: null, user: null, permissions: [], isProfileLoaded: false }),
    }),
    {
      name: STORAGE_KEYS.AUTH,
      partialize: (state) => ({ accessToken: state.accessToken }),
    },
  ),
);
