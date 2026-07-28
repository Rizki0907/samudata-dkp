import { create } from 'zustand';
import api from '../services/api';

export const useMasterDataStore = create((set, get) => ({
  data: [],
  isLoading: false,
  error: null,
  
  // Method untuk mengambil semua master data dan menyimpannya di state
  fetchMasterData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/master-data');
      if (response.data.success) {
        set({ data: response.data.data, isLoading: false });
      } else {
        set({ error: 'Gagal mengambil data master', isLoading: false });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },

  // Helper untuk mendapatkan array opsi berdasarkan category
  getOptions: (category) => {
    const currentData = get().data;
    return currentData
      .filter((item) => item.category === category)
      .map((item) => item.value);
  },

  // Helper untuk mendapatkan full object berdasarkan category (berguna jika butuh metadata/id)
  getItemsByCategory: (category) => {
    return get().data.filter((item) => item.category === category);
  },

  // Helper spesifik untuk filter pelabuhan ke kabkota menggunakan metadata
  getKabKotaByPelabuhan: (pelabuhanName) => {
    const pelabuhanItem = get().data.find(
      (item) => item.category === 'PELABUHAN' && item.value === pelabuhanName
    );
    return pelabuhanItem?.metadata?.kab_kota || null;
  }
}));
