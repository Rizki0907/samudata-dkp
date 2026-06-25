import { create } from 'zustand'

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: null, // { role: 'user' | 'admin_cabang' | 'admin_pusat' }
  token: localStorage.getItem('admin_token'),
  loginAsUser: () => set({ user: { role: 'user' } }),
  loginAsAdmin: (token) => {
    localStorage.setItem('admin_token', token)
    const decoded = parseJwt(token);
    const role = decoded ? decoded.role : 'admin_cabang';
    set({ user: { role }, token })
  },
  logout: () => {
    localStorage.removeItem('admin_token')
    set({ user: null, token: null })
  },
  checkAuth: () => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.role) {
        set({ user: { role: decoded.role }, token })
      } else {
        localStorage.removeItem('admin_token');
        set({ user: null, token: null });
      }
    } else if (window.location.pathname.startsWith('/dashboard')) {
      set({ user: { role: 'user' } })
    }
  }
}))
