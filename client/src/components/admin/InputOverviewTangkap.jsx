import { useState, useEffect } from 'react';
import api from '@/services/api';
 
 
// eslint-disable-next-line no-unused-vars
import { Plus, Trash2, Edit2, Loader2, Save, X, AlertCircle, CheckCircle2, Database, Fish } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line no-unused-vars
import { cn } from '@/lib/utils';
import ActionDialog from '@/components/shared/ActionDialog';

export default function InputOverviewTangkap({ showToast, onDataChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    tahun: new Date().getFullYear(),
    produksi_tangkap: '',
    kapal_perikanan: '',
    pelabuhan: '',
    nelayan: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionDialog, setActionDialog] = useState(null);
  const closeActionDialog = () => setActionDialog(null);

  useEffect(() => {
    fetchOverviewTangkap();
  }, []);

  const fetchOverviewTangkap = async () => {
    try {
      setLoading(true);
      const res = await api.get('/master-data/OVERVIEW_TANGKAP');
      if (res.data?.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load OVERVIEW_TANGKAP', err);
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
      produksi_tangkap: '',
      kapal_perikanan: '',
      pelabuhan: '',
      nelayan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormData({
      tahun: item.value || '',
      produksi_tangkap: item.metadata?.produksi_tangkap ?? '',
      kapal_perikanan: item.metadata?.kapal_perikanan ?? '',
      pelabuhan: item.metadata?.pelabuhan ?? '',
      nelayan: item.metadata?.nelayan ?? ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setActionDialog({
      open: true,
      theme: 'DELETE',
      title: 'Hapus Data',
      message: 'Apakah Anda yakin ingin menghapus data overview tangkap ini?',
      kind: 'delete-overview',
      targetId: id
    });
  };

  const executeDelete = async (id) => {
    try {
      setActionDialog(prev => ({ ...prev, loading: true }));
      const res = await api.delete(`/master-data/${id}`);
      if (res.data?.success) {
        showToast && showToast('Data overview tangkap berhasil dihapus');
        fetchOverviewTangkap();
        onDataChange && onDataChange();
      }
      closeActionDialog();
    } catch (err) {
      setActionDialog(prev => ({ ...prev, loading: false, error: err.response?.data?.message || 'Gagal menghapus data' }));
      showToast && showToast(err.response?.data?.message || 'Gagal menghapus data', 'error');
    }
  };

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
      category: 'OVERVIEW_TANGKAP',
      value: String(formData.tahun),
      metadata: {
        tahun: Number(formData.tahun),
        produksi_tangkap: Number(formData.produksi_tangkap || 0),
        kapal_perikanan: Number(formData.kapal_perikanan || 0),
        pelabuhan: Number(formData.pelabuhan || 0),
        nelayan: Number(formData.nelayan || 0)
      }
    };

    try {
      setIsSubmitting(true);
      if (isEditing) {
        const res = await api.put(`/master-data/${editId}`, payload);
        if (res.data?.success) {
          showToast && showToast('Data overview tangkap berhasil diperbarui');
        }
      } else {
        const res = await api.post('/master-data', payload);
        if (res.data?.success) {
          showToast && showToast('Data overview tangkap berhasil ditambahkan');
        }
      }
      setIsModalOpen(false);
      fetchOverviewTangkap();
      onDataChange && onDataChange();
    } catch (err) {
      showToast && showToast(err.response?.data?.message || 'Gagal menyimpan data overview tangkap', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Fish className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Input Overview Perikanan Tangkap</h2>
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
              Silakan klik tombol "Tambah Overview" untuk memasukkan data ringkasan Perikanan Tangkap.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-4 px-6 text-center">Tahun</th>
                  <th className="py-4 px-6 text-center">Produksi Tangkap (Ton)</th>
                  <th className="py-4 px-6 text-center">Kapal Perikanan (Unit)</th>
                  <th className="py-4 px-6 text-center">Pelabuhan (Unit)</th>
                  <th className="py-4 px-6 text-center">Nelayan (Orang)</th>
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
                        {meta.produksi_tangkap !== undefined && meta.produksi_tangkap !== ''
                          ? `${Number(meta.produksi_tangkap).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton`
                          : '-'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {meta.kapal_perikanan !== undefined && meta.kapal_perikanan !== ''
                          ? `${Number(meta.kapal_perikanan).toLocaleString('id-ID')} Unit`
                          : '-'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {meta.pelabuhan !== undefined && meta.pelabuhan !== ''
                          ? `${Number(meta.pelabuhan).toLocaleString('id-ID')} Unit`
                          : '-'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {meta.nelayan !== undefined && meta.nelayan !== ''
                          ? `${Number(meta.nelayan).toLocaleString('id-ID')} Orang`
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
                  {isEditing ? 'Edit Overview Perikanan Tangkap' : 'Tambah Overview Perikanan Tangkap'}
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

                {/* 1.5 Produksi Tangkap */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Produksi Tangkap (Ton) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.produksi_tangkap}
                    onChange={(e) => setFormData({ ...formData, produksi_tangkap: e.target.value })}
                    placeholder="Contoh: 111.26"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                {/* 2. Kapal Perikanan */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Kapal Perikanan (Unit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.kapal_perikanan}
                    onChange={(e) => setFormData({ ...formData, kapal_perikanan: e.target.value })}
                    placeholder="Contoh: 52211"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                {/* 3. Pelabuhan */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Pelabuhan (Unit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.pelabuhan}
                    onChange={(e) => setFormData({ ...formData, pelabuhan: e.target.value })}
                    placeholder="Contoh: 22"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                {/* 4. Nelayan */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Nelayan (Orang) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.nelayan}
                    onChange={(e) => setFormData({ ...formData, nelayan: e.target.value })}
                    placeholder="Contoh: 217209"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
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

      {actionDialog && (
        <ActionDialog
          dialog={actionDialog}
          value={actionDialog.value || ''}
          setValue={(val) => setActionDialog(prev => ({ ...prev, value: val }))}
          onClose={closeActionDialog}
          onSubmit={async () => {
            if (actionDialog.kind === 'delete-overview') {
              await executeDelete(actionDialog.targetId);
            } else {
              closeActionDialog();
            }
          }}
        />
      )}
    </div>
  );
}
