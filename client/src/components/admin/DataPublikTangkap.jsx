import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { Edit2, RotateCcw, AlertCircle, CheckCircle, Save, X } from 'lucide-react';
import { formatRupiah } from '@/utils/formatRupiah';

export function DataPublikTangkap({ filterTahun, filterCabang, filterWilayah, filterKomoditas }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({ volume: 0, nilai: 0 });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchVolumePct, setBatchVolumePct] = useState('');
  const [batchNilaiPct, setBatchNilaiPct] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bulanan-tangkap/admin');
      setData(res.data.data || []);
    } catch (error) {
      console.error('Error fetching data bulanan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (row) => {
    setEditingRow(row.id);
    setEditForm({ volume: row.volume, nilai: row.nilai });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
  };

  const handleSaveEdit = async (id) => {
    try {
      setSubmitLoading(true);
      await api.put(`/bulanan-tangkap/${id}/target`, editForm);
      setEditingRow(null);
      fetchData();
    } catch (error) {
      console.error('Error updating target:', error);
      alert('Gagal menyimpan validasi');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = async (id) => {
    if (window.confirm('Yakin ingin mereset data ini ke kalkulasi default sistem?')) {
      try {
        await api.post(`/bulanan-tangkap/${id}/reset`);
        fetchData();
      } catch (error) {
        console.error('Error resetting target:', error);
        alert('Gagal mereset validasi');
      }
    }
  };

  const handleBatchAdjust = async (selectedIds, clearSelection) => {
    if (!batchVolumePct && !batchNilaiPct) return alert("Masukkan persentase koreksi untuk Volume atau Nilai!");
    try {
      setSubmitLoading(true);
      await api.post('/bulanan-tangkap/batch-target', {
        ids: selectedIds,
        volumePercentage: Number(batchVolumePct || 0),
        nilaiPercentage: Number(batchNilaiPct || 0)
      });
      clearSelection();
      setBatchMode(false);
      setBatchVolumePct('');
      setBatchNilaiPct('');
      fetchData();
    } catch (err) {
      console.error('Error batch update:', err);
      alert("Gagal melakukan koreksi massal");
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderCustomBatchActions = (selectedIds, clearSelection) => {
    if (batchMode) {
      return (
        <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border border-border">
          <span className="text-xs font-medium text-muted-foreground mr-1">Taikkan/Turunkan:</span>
          <div className="relative">
            <input 
              type="number" 
              placeholder="Vol (mis: 10)" 
              value={batchVolumePct}
              onChange={e => setBatchVolumePct(e.target.value)}
              className="w-28 pl-2 pr-6 py-1 text-xs border border-border bg-background rounded outline-none focus:ring-1 focus:ring-primary" 
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          </div>
          <div className="relative">
            <input 
              type="number" 
              placeholder="Nilai (mis: 10)" 
              value={batchNilaiPct}
              onChange={e => setBatchNilaiPct(e.target.value)}
              className="w-28 pl-2 pr-6 py-1 text-xs border border-border bg-background rounded outline-none focus:ring-1 focus:ring-primary" 
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          </div>
          <button 
            onClick={() => handleBatchAdjust(selectedIds, clearSelection)}
            disabled={submitLoading}
            className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition disabled:opacity-50"
          >
            Terapkan
          </button>
          <button 
            onClick={() => { setBatchMode(false); setBatchVolumePct(''); setBatchNilaiPct(''); }}
            className="px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded transition"
          >
            Batal
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => setBatchMode(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium shadow-sm"
      >
        <Edit2 className="w-4 h-4"/>
        Koreksi Massal (%)
      </button>
    );
  };

  const columns = useMemo(() => [
    {
      header: 'Bulan',
      accessorKey: 'bulan',
      cell: ({ row }) => {
        const parts = row.original.bulan.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${monthNames[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
      }
    },
    { 
      header: 'Sumber', 
      accessorKey: 'sumber_data',
      cell: ({ row }) => {
        const val = row.original.sumber_data;
        if (val === 'KAB_KOTA') return 'Non Pelabuhan';
        if (val === 'PELABUHAN') return 'Pelabuhan';
        return val;
      }
    },
    { header: 'Pelabuhan/Wilayah', accessorKey: 'pelabuhan' },
    { header: 'Komoditas', accessorKey: 'komoditas' },
    {
      header: 'Total Volume (Kg)',
      accessorKey: 'volume',
      cell: ({ row }) => {
        if (editingRow === row.original.id) {
          return (
            <input 
              type="number" 
              value={editForm.volume}
              onChange={(e) => setEditForm({...editForm, volume: e.target.value})}
              className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          );
        }
        return <span className="font-medium">{row.original.volume.toLocaleString('id-ID')}</span>;
      }
    },
    {
      header: 'Total Nilai (Rp)',
      accessorKey: 'nilai',
      cell: ({ row }) => {
        if (editingRow === row.original.id) {
          return (
            <input 
              type="number" 
              value={editForm.nilai}
              onChange={(e) => setEditForm({...editForm, nilai: e.target.value})}
              className="w-32 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          );
        }
        return <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatRupiah(row.original.nilai)}</span>;
      }
    },
    {
      header: 'Status Data',
      accessorKey: 'is_adjusted',
      cell: ({ row }) => {
        const isAdjusted = row.original.is_adjusted;
        return isAdjusted ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Validasi Khusus
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" /> Sistem (Default)
          </span>
        );
      }
    },
    {
      header: 'Aksi',
      id: 'actions',
      cell: ({ row }) => {
        if (editingRow === row.original.id) {
          return (
            <div className="flex items-center gap-2">
              <button onClick={() => handleSaveEdit(row.original.id)} disabled={submitLoading} className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded hover:bg-emerald-500/20 transition" title="Simpan Validasi">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={handleCancelEdit} disabled={submitLoading} className="p-1.5 bg-slate-500/10 text-slate-600 rounded hover:bg-slate-500/20 transition" title="Batal">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleEditClick(row.original)}
              className="flex items-center gap-1 px-2 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition"
            >
              <Edit2 className="w-3.5 h-3.5" /> Koreksi Manual
            </button>
            {row.original.is_adjusted && (
              <button 
                onClick={() => handleReset(row.original.id)}
                className="flex items-center gap-1 px-2 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-medium hover:bg-rose-500/20 transition"
                title="Batal Koreksi (Reset ke Default)"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        );
      }
    }
  ], [editingRow, editForm, submitLoading]);

  // Apply super filters locally
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchTahun = !filterTahun || row.bulan.startsWith(filterTahun);
      const matchCabang = !filterCabang || row.sumber_data === filterCabang;
      const matchWilayah = !filterWilayah || row.pelabuhan === filterWilayah;
      const matchKomoditas = !filterKomoditas || row.komoditas === filterKomoditas;
      return matchTahun && matchCabang && matchWilayah && matchKomoditas;
    });
  }, [data, filterTahun, filterCabang, filterWilayah, filterKomoditas]);

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  const totalVolume = filteredData.reduce((acc, curr) => acc + (Number(curr.volume) || 0), 0);
  const totalNilai = filteredData.reduce((acc, curr) => acc + (Number(curr.nilai) || 0), 0);

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Data Tervalidasi Publik
            <span className="text-xs font-normal px-2 py-1 bg-primary/10 text-primary rounded-full">Total {filteredData.length} Data Bulanan</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Data pada tabel inilah yang akan ditampilkan ke Halaman Publik pengguna.</p>
        </div>
        
        {/* Ringkasan Inline */}
        <div className="flex items-center gap-6 bg-background px-4 py-2 rounded-lg border border-border">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">Total Volume</span>
            <span className="text-lg font-bold">{totalVolume.toLocaleString('id-ID')} Kg</span>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">Total Nilai</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(totalNilai)}</span>
          </div>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={filteredData}
        exportName={`Data_Validasi_Bidang_${filterTahun || 'All'}`}
        defaultPageSize={50}
        customBatchActions={renderCustomBatchActions}
      />
    </div>
  );
}
