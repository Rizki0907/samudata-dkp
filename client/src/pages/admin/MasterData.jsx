import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { Plus, Trash2, Edit2, Loader2, Save, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_MAP = {
  'Perikanan Tangkap': [
    { value: 'KOMODITAS_TANGKAP_LAUT', label: 'Komoditas Tangkap Laut' },
    { value: 'KOMODITAS_TANGKAP_PUD', label: 'Komoditas Tangkap PUD' },
    { value: 'ALAT_TANGKAP', label: 'Alat Tangkap' },
    { value: 'PELABUHAN', label: 'Pelabuhan' },
    { value: 'WPP', label: 'Wilayah Pengelolaan Perikanan (WPP)' }
  ],
  'Perikanan Budidaya': [
    { value: 'KOMODITAS_BUDIDAYA', label: 'Komoditas Budidaya' },
    { value: 'JENIS_WADAH', label: 'Jenis Wadah' }
  ],
  'Pengolahan & Pemasaran': [
    { value: 'JENIS_PENGOLAHAN', label: 'Jenis Pengolahan' },
    { value: 'JENIS_PEMASARAN', label: 'Jenis Pemasaran' },
    { value: 'KOMODITAS_SEGAR_OLAHAN', label: 'Komoditas Segar / Olahan' },
    { value: 'BENTUK_PRODUK', label: 'Bentuk Produk' },
    { value: 'KATEGORI_SKALA_USAHA', label: 'Skala Usaha' }
  ],
  'Ekspor': [
    { value: 'KOMODITAS_EKSPOR', label: 'Komoditas Ekspor' },
    { value: 'KATEGORI_KOMODITAS_EKSPOR', label: 'Kategori Komoditas Ekspor' },
    { value: 'NEGARA_TUJUAN', label: 'Negara Tujuan' },
    { value: 'SATUAN_VOLUME', label: 'Satuan Volume' }
  ],
  'Garam': [
    { value: 'JENIS_GARAM', label: 'Jenis Garam' },
    { value: 'KATEGORI_PETAMBAK', label: 'Kategori Petambak' }
  ],
  'Global / Umum': [
    { value: 'KAB_KOTA', label: 'Kabupaten/Kota' },
    { value: 'PROVINSI', label: 'Provinsi' }
  ]
};

// Flatten to easy lookup
const ALL_CATEGORIES = Object.values(CATEGORY_MAP).flat();
const getCategoryLabel = (val) => ALL_CATEGORIES.find(c => c.value === val)?.label || val;

export default function MasterData() {
  const { user } = useAuthStore();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBidang, setSelectedBidang] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters for Data Table
  const [filterBidang, setFilterBidang] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Update category options based on Bidang selected
  useEffect(() => {
    setCategoryInput('');
  }, [selectedBidang]);

  useEffect(() => {
    setFilterCategory('');
  }, [filterBidang]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/master-data');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data master');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!categoryInput.trim() || !valueInput.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await api.post('/master-data', {
        category: categoryInput.trim(),
        value: valueInput.trim(),
      });
      if (res.data?.success) {
        alert('Berhasil menambah master data');
        setValueInput('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal menambah data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus master data ini? Jika data ini dipakai, maka tidak akan muncul lagi di dropdown.')) return;

    try {
      const res = await api.delete(`/master-data/${id}`);
      if (res.data?.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal menghapus data');
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      let pass = true;
      if (filterCategory) {
        pass = item.category === filterCategory;
      } else if (filterBidang) {
        // Find all valid categories for this bidang
        const validCats = CATEGORY_MAP[filterBidang].map(c => c.value);
        pass = validCats.includes(item.category);
      }
      return pass;
    });
  }, [data, filterBidang, filterCategory]);

  if (user?.role !== 'admin_pusat') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold text-foreground">Akses Ditolak</h2>
        <p className="text-muted-foreground mt-2">Hanya Admin Pusat yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Master Data</h1>
        <p className="text-muted-foreground mt-1">
          Tambahkan opsi-opsi data yang akan muncul di setiap *dropdown* form input bidang.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Tambah Data Baru</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Pilih Bidang</label>
            <select
              value={selectedBidang}
              onChange={(e) => setSelectedBidang(e.target.value)}
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="">-- Pilih Bidang --</option>
              {Object.keys(CATEGORY_MAP).map(bidang => (
                <option key={bidang} value={bidang}>{bidang}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Pilih Kategori Form Input</label>
            <select
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
              disabled={!selectedBidang}
            >
              <option value="">-- Pilih Kategori --</option>
              {selectedBidang && CATEGORY_MAP[selectedBidang].map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nama Data (Opsi)</label>
            <input
              type="text"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              placeholder="Contoh: Kerapu"
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !categoryInput || !valueInput}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Tambahkan Data
            </button>
          </div>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" /> Daftar Master Data
          </h2>
          <div className="flex gap-2">
            <select
              value={filterBidang}
              onChange={(e) => setFilterBidang(e.target.value)}
              className="rounded-lg bg-background border border-border px-3 py-1.5 text-sm focus:outline-none"
            >
              <option value="">Semua Bidang</option>
              {Object.keys(CATEGORY_MAP).map(bidang => (
                <option key={bidang} value={bidang}>{bidang}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-lg bg-background border border-border px-3 py-1.5 text-sm focus:outline-none"
              disabled={!filterBidang}
            >
              <option value="">Semua Kategori</option>
              {filterBidang && CATEGORY_MAP[filterBidang].map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold">Kategori / Form</th>
                <th className="px-6 py-3 font-semibold">Opsi Master</th>
                <th className="px-6 py-3 font-semibold">Terakhir Diperbarui</th>
                <th className="px-6 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada master data.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {getCategoryLabel(row.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{row.value}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(row.updated_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
