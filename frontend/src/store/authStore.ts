import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string | null;
  gateway_type: 'student' | 'agency' | 'institution' | 'affiliate' | string;
  status: 'pending' | 'active' | 'suspended';
  affiliate_code?: string;
  roles?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  gateway_type: string;
  affiliate_code?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { user, token, roles } = res.data;
          localStorage.setItem('tensai_token', token);
          set({ user: { ...user, roles: roles ?? [] }, token, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', data);
          const { user, token, roles } = res.data;
          localStorage.setItem('tensai_token', token);
          set({ user: { ...user, roles: roles ?? [] }, token, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        localStorage.removeItem('tensai_token');
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: { ...res.data.user, roles: res.data.roles ?? [] } });
        } catch (e: unknown) {
          const err = e as { response?: { status?: number } };
          if (err.response?.status === 401) {
            localStorage.removeItem('tensai_token');
            set({ user: null, token: null });
          }
          throw e;
        }
      },
    }),
    { name: 'tensai-auth', partialize: (state) => ({ user: state.user, token: state.token }), skipHydration: true }
  )
);
