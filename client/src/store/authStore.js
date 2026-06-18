import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null, // { role: 'user' | 'admin' }
  token: localStorage.getItem('admin_token'),
  loginAsUser: () => set({ user: { role: 'user' } }),
  loginAsAdmin: (token) => {
    localStorage.setItem('admin_token', token)
    set({ user: { role: 'admin' }, token })
  },
  logout: () => {
    localStorage.removeItem('admin_token')
    set({ user: null, token: null })
  },
  checkAuth: () => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      set({ user: { role: 'admin' }, token })
    } else if (window.location.pathname.startsWith('/dashboard')) {
      // If they refresh on /dashboard but not admin
      set({ user: { role: 'user' } })
    }
  }
}))
