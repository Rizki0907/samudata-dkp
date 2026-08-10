import { create } from 'zustand';
import api from '../services/api';
import {
  PELABUHAN_OPTIONS,
  KAB_KOTA_OPTIONS,
  KOMODITAS_OPTIONS,
  KOMODITAS_LAUT_OPTIONS,
  ALAT_TANGKAP_LAUT_OPTIONS,
  PERBEKALAN_OPTIONS,
  KOMODITAS_PUD_OPTIONS,
  ALAT_TANGKAP_PUD_OPTIONS,
  PUD_JENIS_PERAHU_OPTIONS,
  PERAIRAN_OPTIONS
} from '../utils/constants';

const GT_KAPAL_DEFAULT = ['GT < 5', 'GT 6 - 10', 'GT 11 - 20', 'GT 21 - 30', 'GT > 30'];
const WPP_DEFAULT = ['711', '712', '713', '714', '715', '716', '717', '718', '571', '572', '573'];

const FALLBACK_MAP = {
  'PELABUHAN': PELABUHAN_OPTIONS,
  'KAB_KOTA': KAB_KOTA_OPTIONS,
  'KOMODITAS_TANGKAP_LAUT': KOMODITAS_OPTIONS,
  'KOMODITAS_TANGKAP_NON_PELABUHAN': KOMODITAS_LAUT_OPTIONS,
  'ALAT_TANGKAP_LAUT': ALAT_TANGKAP_LAUT_OPTIONS,
  'ALAT_TANGKAP_NON_PELABUHAN': ALAT_TANGKAP_LAUT_OPTIONS,
  'GT_KAPAL_LAUT': GT_KAPAL_DEFAULT,
  'GT_KAPAL_NON_PELABUHAN': GT_KAPAL_DEFAULT,
  'WPP': WPP_DEFAULT,
  'WPP_NON_PELABUHAN': WPP_DEFAULT,
  'PERBEKALAN': PERBEKALAN_OPTIONS.map(p => typeof p === 'string' ? p : p.nama),
  'PERBEKALAN_NON_PELABUHAN': PERBEKALAN_OPTIONS.map(p => typeof p === 'string' ? p : p.nama),
  'KOMODITAS_TANGKAP_PUD': KOMODITAS_PUD_OPTIONS,
  'ALAT_TANGKAP_PUD': ALAT_TANGKAP_PUD_OPTIONS,
  'JENIS_PERAHU_PUD': PUD_JENIS_PERAHU_OPTIONS,
  'JENIS_PERAIRAN': PERAIRAN_OPTIONS
};

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

  // Helper untuk mendapatkan array opsi berdasarkan category, dengan fallback otomatis
  getOptions: (category) => {
    const currentData = get().data;
    const items = currentData.filter((item) => item.category === category);
    
    // Jika data dari DB kosong, gunakan fallback
    if (items.length === 0 && FALLBACK_MAP[category]) {
      return FALLBACK_MAP[category];
    }
    
    return items.map((item) => item.value);
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
