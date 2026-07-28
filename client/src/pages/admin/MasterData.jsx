import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMasterDataStore } from '@/store/masterDataStore';
import api from '@/services/api';
import { 
  Plus, Trash2, Edit2, Loader2, Save, X, Filter, 
  Database, MapPin, Package, Anchor, Search, AlertCircle, CheckCircle2, ChevronRight, Ship
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_MAP = {
  'Perikanan Tangkap Laut': [
    { value: 'PELABUHAN', label: 'Pelabuhan', icon: MapPin, hasMetadata: 'kab_kota' },
    { value: 'KOMODITAS_TANGKAP_LAUT', label: 'Komoditas Laut', icon: Package },
    { value: 'ALAT_TANGKAP_LAUT', label: 'Alat Tangkap Laut', icon: Anchor },
    { value: 'GT_KAPAL_LAUT', label: 'GT / Ukuran Kapal', icon: Ship },
    { value: 'PERBEKALAN', label: 'Logistik / Perbekalan', icon: Package, hasMetadata: 'satuan' },
    { value: 'WPP', label: 'WPP', icon: Database }
  ],
  'Perikanan Tangkap PUD': [
    { value: 'JENIS_PERAIRAN', label: 'Jenis Perairan PUD', icon: Database },
    { value: 'KOMODITAS_TANGKAP_PUD', label: 'Komoditas PUD', icon: Package },
    { value: 'ALAT_TANGKAP_PUD', label: 'Alat Tangkap PUD', icon: Anchor },
    { value: 'JENIS_PERAHU_PUD', label: 'GT / Jenis Perahu', icon: Ship }
  ],
  'Perikanan Budidaya': [
    { value: 'KOMODITAS_BUDIDAYA', label: 'Komoditas Budidaya', icon: Package },
    { value: 'JENIS_WADAH', label: 'Jenis Wadah', icon: Database }
  ],
  'Pengolahan & Pemasaran': [
    { value: 'JENIS_PENGOLAHAN', label: 'Jenis Pengolahan', icon: Database },
    { value: 'JENIS_PEMASARAN', label: 'Jenis Pemasaran', icon: Database },
    { value: 'KOMODITAS_SEGAR_OLAHAN', label: 'Komoditas Segar / Olahan', icon: Package },
    { value: 'BENTUK_PRODUK', label: 'Bentuk Produk', icon: Package },
    { value: 'KATEGORI_SKALA_USAHA', label: 'Skala Usaha', icon: Database }
  ],
  'Ekspor': [
    { value: 'KOMODITAS_EKSPOR', label: 'Komoditas Ekspor', icon: Package },
    { value: 'KATEGORI_KOMODITAS_EKSPOR', label: 'Kategori Ekspor', icon: Database },
    { value: 'NEGARA_TUJUAN', label: 'Negara Tujuan', icon: MapPin },
    { value: 'SATUAN_VOLUME', label: 'Satuan Volume', icon: Database }
  ],
  'Kelautan dan Pesisir': [
    { value: 'JENIS_GARAM', label: 'Jenis Garam', icon: Package },
    { value: 'KATEGORI_PETAMBAK', label: 'Kategori Petambak', icon: Database }
  ],
  'Global / Umum': [
    { value: 'KAB_KOTA', label: 'Kabupaten/Kota', icon: MapPin },
    { value: 'PROVINSI', label: 'Provinsi', icon: MapPin }
  ]
};

const SATUAN_OPTIONS = ['Kilogram', 'Liter', 'Tabung', 'Ton', 'Kuintal', 'Gram', 'Pcs', 'Unit', 'Paket'];

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default function MasterData() {
  const { user } = useAuthStore();
  const { fetchMasterData: refreshGlobalStore, getOptions } = useMasterDataStore();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeBidang, setActiveBidang] = useState('Perikanan Tangkap Laut');
  const [activeCategory, setActiveCategory] = useState(CATEGORY_MAP['Perikanan Tangkap Laut'][0].value);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ value: '', kab_kota: '', satuan: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const KAB_KOTA_GLOBAL = getOptions('KAB_KOTA');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/master-data');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ value: '', kab_kota: '', satuan: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormData({ 
      value: item.value, 
      kab_kota: item.metadata?.kab_kota || '', 
      satuan: item.metadata?.satuan || '' 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.value.trim()) return;

    const currentCatObj = CATEGORY_MAP[activeBidang].find(c => c.value === activeCategory);
    let metadata = null;

    if (currentCatObj?.hasMetadata === 'kab_kota') {
      if (!formData.kab_kota) {
        showToast('Kab/Kota wajib diisi untuk kategori ini', 'error');
        return;
      }
      metadata = { kab_kota: formData.kab_kota };
    }
    if (currentCatObj?.hasMetadata === 'satuan') {
      if (!formData.satuan) {
        showToast('Satuan wajib diisi untuk kategori ini', 'error');
        return;
      }
      metadata = { satuan: formData.satuan };
    }

    try {
      setIsSubmitting(true);
      const payload = { category: activeCategory, value: formData.value.trim(), metadata };
      
      let res;
      if (isEditing) {
        res = await api.put(`/master-data/${editId}`, payload);
      } else {
        res = await api.post('/master-data', payload);
      }

      if (res.data?.success) {
        showToast(`Berhasil ${isEditing ? 'mengubah' : 'menambah'} data`);
        setIsModalOpen(false);
        fetchData();
        refreshGlobalStore(); // Update the zustand global store
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan data', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus master data ini? Data yang terhapus tidak akan muncul di dropdown.')) return;
    try {
      const res = await api.delete(`/master-data/${id}`);
      if (res.data?.success) {
        showToast('Data berhasil dihapus');
        fetchData();
        refreshGlobalStore();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus data', 'error');
    }
  };

  const activeCategoryObj = CATEGORY_MAP[activeBidang]?.find(c => c.value === activeCategory);
  
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchCat = item.category === activeCategory;
      const matchSearch = item.value.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    }).sort((a, b) => a.value.localeCompare(b.value));
  }, [data, activeCategory, searchQuery]);


  if (user?.role !== 'admin_pusat') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">Akses Terbatas</h2>
        <p className="text-muted-foreground mt-3 max-w-md">Halaman Master Data merupakan area berisiko tinggi. Hanya Admin Pusat yang memiliki wewenang untuk mengelola pengaturan fundamental ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border ${toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary p-8 md:p-10 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-sm font-medium mb-4">
              <Database className="w-4 h-4" /> 
              Super Admin Control
            </div>
            <h1 className="text-4xl font-heading font-extrabold tracking-tight mb-3">Master Data Induk</h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              Pusat kendali seluruh referensi data yang digunakan dalam formulir laporan. Penambahan atau perubahan disini akan otomatis beresonansi ke seluruh sistem dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sticky top-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 px-2">Bidang</h3>
            <div className="space-y-1">
              {Object.keys(CATEGORY_MAP).map(bidang => (
                <button
                  key={bidang}
                  onClick={() => {
                    setActiveBidang(bidang);
                    setActiveCategory(CATEGORY_MAP[bidang][0].value);
                    setSearchQuery('');
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    activeBidang === bidang 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {bidang}
                  {activeBidang === bidang && <ChevronRight className="w-4 h-4 opacity-70" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* Sub Categories Tabs */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-2 flex flex-wrap gap-2">
            {CATEGORY_MAP[activeBidang].map(cat => {
              const Icon = cat.icon || Database;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                    activeCategory === cat.value
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted border border-transparent"
                  )}
                >
                  <Icon className={cn("w-4 h-4", activeCategory === cat.value ? "text-primary" : "text-muted-foreground")} />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Data Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={`Cari ${activeCategoryObj?.label}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah {activeCategoryObj?.label}</span>
            </button>
          </div>

          {/* Data List */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p>Memuat referensi data...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground text-center px-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Tidak ada data ditemukan</h3>
                <p className="text-sm">Belum ada data untuk kategori ini atau pencarian tidak cocok.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-border">
                {filteredData.map((item, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    key={item.id} 
                    className={cn(
                      "group p-5 border-b border-r border-border hover:bg-muted/30 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-full",
                      "first:border-t-0"
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                          {item.value}
                        </h4>
                      </div>
                      
                      {/* Metadata Badges */}
                      {item.metadata?.kab_kota && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 text-xs font-medium border border-blue-500/20">
                          <MapPin className="w-3 h-3" />
                          {item.metadata.kab_kota}
                        </div>
                      )}
                      {item.metadata?.satuan && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-medium border border-emerald-500/20">
                          <Package className="w-3 h-3" />
                          Satuan: {item.metadata.satuan}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/50 rounded-lg shadow-sm transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-background border border-border text-muted-foreground hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/5 rounded-lg shadow-sm transition-all"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => !isSubmitting && setIsModalOpen(false)}
            title={isEditing ? `Edit ${activeCategoryObj?.label}` : `Tambah ${activeCategoryObj?.label}`}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nama {activeCategoryObj?.label} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={`Contoh: ${activeCategory === 'PELABUHAN' ? 'Pelabuhan Perikanan X' : 'Kerapu'}`}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              {activeCategoryObj?.hasMetadata === 'kab_kota' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Terletak di Kabupaten/Kota <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.kab_kota}
                    onChange={(e) => setFormData({ ...formData, kab_kota: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    <option value="">-- Pilih Kabupaten/Kota --</option>
                    {KAB_KOTA_GLOBAL.map(kk => (
                      <option key={kk} value={kk}>{kk}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Ini akan otomatis terpilih di form input jika pelabuhan dipilih.</p>
                </div>
              )}

              {activeCategoryObj?.hasMetadata === 'satuan' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Satuan Ukur <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.satuan}
                    onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    <option value="">-- Pilih Satuan --</option>
                    {SATUAN_OPTIONS.map(sat => (
                      <option key={sat} value={sat}>{sat}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 mt-6 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.value}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Data
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
}
