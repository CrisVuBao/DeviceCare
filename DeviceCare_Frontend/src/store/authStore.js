import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      updateUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
      logout: () => set({ user: null, token: null, isAuthenticated: false })
    }),
    {
      name: 'devicecare-auth',
      // Chỉ lưu thông tin user và trạng thái vào local storage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

export default useAuthStore;
