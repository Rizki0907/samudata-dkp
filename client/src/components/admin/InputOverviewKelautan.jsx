import { useState, useEffect } from 'react';
import api from '@/services/api';
 
 
// eslint-disable-next-line no-unused-vars
import { Plus, Trash2, Edit2, Loader2, Save, X, AlertCircle, CheckCircle2, Database, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line no-unused-vars
import { cn } from '@/lib/utils';

/**
 * Komponen InputOverviewKelautan
 * Bertugas mengelola (CRUD) input data Master Data (Kategori: OVERVIEW_KELAUTAN).
 * Data ini kemudian akan digunakan oleh halaman Overview utama sebagai sumber data ringkasan (Garam, dsb).
 */
export default function InputOverviewKelautan({ showToast, onDataChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    tahun: new Date().getFullYear(),
    produksi_garam: '',
    jumlah_petambak: '',
    luas_lahan_garam: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOverviewKelautan();
  }, []);

  // Ambil data overview kelautan dari master-data
  async function fetchOverviewKelautan() {
    try {
      setLoading(true);
      const res = await api.get('/master-data/OVERVIEW_KELAUTAN');
      if (res.data?.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load OVERVIEW_KELAUTAN', err);
      // fallback to empty array
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      tahun: new Date().getFullYear(),
      produksi_garam: '',
      jumlah_petambak: '',
      luas_lahan_garam: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormData({
      tahun: item.value || '',
      produksi_garam: item.metadata?.produksi_garam ?? '',
      jumlah_petambak: item.metadata?.jumlah_petambak ?? '',
      luas_lahan_garam: item.metadata?.luas_lahan_garam ?? ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data overview Kelautan dan Pesisir ini?')) return;
    try {
      const res = await api.delete(`/master-data/${id}`);
      if (res.data?.success) {
        showToast && showToast('Data overview kelautan berhasil dihapus');
        fetchOverviewKelautan();
        onDataChange && onDataChange();
      }
    } catch (err) {
      showToast && showToast(err.response?.data?.message || 'Gagal menghapus data', 'error');
    }
  };

  // Kirim data (Create/Update) ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tahun) {
      showToast && showToast('Tahun wajib diisi', 'error');
      return;
    }

    if (!isEditing && items.some(item => String(item.value) === String(formData.tahun))) {
      showToast && showToast('Data untuk tahun ini sudah ada. Silakan gunakan tombol Edit di tabel aksi.', 'error');
      return;
    }

    const payload = {
      category: 'OVERVIEW_KELAUTAN',
      value: String(formData.tahun),
      metadata: {
        tahun: Number(formData.tahun),
        produksi_garam: formData.produksi_garam !== '' ? Number(formData.produksi_garam) : '',
        jumlah_petambak: formData.jumlah_petambak !== '' ? Number(formData.jumlah_petambak) : '',
        luas_lahan_garam: formData.luas_lahan_garam !== '' ? Number(formData.luas_lahan_garam) : ''
      }
    };

    try {
      setIsSubmitting(true);
      if (isEditing) {
        const res = await api.put(`/master-data/${editId}`, payload);
        if (res.data?.success) {
          showToast && showToast('Data overview kelautan berhasil diperbarui');
        }
      } else {
        const res = await api.post('/master-data', payload);
        if (res.data?.success) {
          showToast && showToast('Data overview kelautan berhasil ditambahkan');
        }
      }
      setIsModalOpen(false);
      fetchOverviewKelautan();
      onDataChange && onDataChange();
    } catch (err) {
      showToast && showToast(err.response?.data?.message || 'Gagal menyimpan data overview kelautan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-500/10 text-slate-600 rounded-xl">
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Input Overview Kelautan dan Pesisir</h2>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-md shadow-primary/20 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Tambah Overview
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Database className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Belum Ada Data Overview</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Silakan klik tombol "Tambah Overview" untuk memasukkan data ringkasan Kelautan dan Pesisir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-4 px-6 text-center">Tahun</th>
                  <th className="py-4 px-6 text-center">Produksi Garam (Ton)</th>
                  <th className="py-4 px-6 text-center">Petambak (Orang)</th>
                  <th className="py-4 px-6 text-center">Luas Lahan Garam (Ha)</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {items.map((item) => {
                  const meta = item.metadata || {};
                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-6 font-semibold text-foreground text-center">{item.value}</td>
                      <td className="py-4 px-6 text-center">
                        {meta.produksi_garam !== undefined && meta.produksi_garam !== ''
                          ? `${Number(meta.produksi_garam).toLocaleString('id-ID')} Ton`
                          : '-'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {meta.jumlah_petambak !== undefined && meta.jumlah_petambak !== ''
                          ? `${Number(meta.jumlah_petambak).toLocaleString('id-ID')} Orang`
                          : '-'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {meta.luas_lahan_garam !== undefined && meta.luas_lahan_garam !== ''
                          ? `${Number(meta.luas_lahan_garam).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha`
                          : '-'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">
                  {isEditing ? 'Edit Overview Kelautan dan Pesisir' : 'Tambah Overview Kelautan dan Pesisir'}
                </h3>
                <button
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* 1. Tahun */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Tahun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.tahun}
                    onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
                    placeholder="Contoh: 2024"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                {/* 2. Produksi Garam */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Produksi Garam (Ton)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.produksi_garam}
                    onChange={(e) => setFormData({ ...formData, produksi_garam: e.target.value })}
                    placeholder="Contoh: 0.00"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* 3. Jumlah Petambak */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Jumlah Petambak (Orang)
                  </label>
                  <input
                    type="number"
                    value={formData.jumlah_petambak}
                    onChange={(e) => setFormData({ ...formData, jumlah_petambak: e.target.value })}
                    placeholder="Contoh: 0"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* 4. Luas Lahan Garam */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Luas Lahan Garam (Ha)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.luas_lahan_garam}
                    onChange={(e) => setFormData({ ...formData, luas_lahan_garam: e.target.value })}
                    placeholder="Contoh:0.00"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
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
                    disabled={isSubmitting || !formData.tahun}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Simpan Data
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
