import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import BudidayaForm from '@/components/admin/BudidayaForm';

export default function AdminBudidaya() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/budidaya');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching budidaya:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setSubmitLoading(true);
      if (editingData) {
        await api.put(`/budidaya/${editingData.id}`, formData);
      } else {
        await api.post('/budidaya', formData);
      }
      setIsFormOpen(false);
      setEditingData(null);
      fetchData();
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Gagal menyimpan data');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (row) => {
    if (window.confirm(`Yakin ingin menghapus data budidaya untuk ${row.kabupaten_kota}?`)) {
      try {
        await api.delete(`/budidaya/${row.id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting budidaya:', error);
        alert('Gagal menghapus data');
      }
    }
  };

  const handleEdit = (row) => {
    setEditingData(row);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApprove = async (row) => {
    if (window.confirm(`Yakin ingin menyetujui data ini?`)) {
      try {
        await api.put(`/budidaya/${row.id}/status`, { status: 'APPROVED' });
        fetchData();
      } catch (error) {
        console.error('Error approving data:', error);
        alert('Gagal menyetujui data');
      }
    }
  };

  const handleReject = async (row) => {
    const alasan = window.prompt('Masukkan alasan penolakan:');
    if (alasan === null) return;
    if (!alasan.trim()) {
      alert('Alasan penolakan wajib diisi!');
      return;
    }
    
    try {
      await api.put(`/budidaya/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
      fetchData();
    } catch (error) {
      console.error('Error rejecting data:', error);
      alert('Gagal menolak data');
    }
  };

  const columns = useMemo(() => [
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => {
        const status = info.getValue();
        const alasan = info.row.original.alasan_penolakan;
        let colorClass = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        let label = 'PENDING';
        if (status === 'APPROVED') {
          colorClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
          label = 'APPROVED';
        } else if (status === 'REJECTED') {
          colorClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
          label = 'REJECTED';
        }
        
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colorClass}`}>
              {label}
            </span>
            {status === 'REJECTED' && alasan && (
              <span className="text-xs text-rose-500 cursor-help" title={`Alasan: ${alasan}`}>
                (?)
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Tahun',
      accessorKey: 'tahun'
    },
    {
      header: 'Bulan',
      accessorKey: 'bulan'
    },
    {
      header: 'Triwulan',
      accessorKey: 'triwulan',
      cell: info => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          {info.getValue()}
        </span>
      )
    },
    {
      header: 'Kabupaten/Kota',
      accessorKey: 'kabupaten_kota',
      cell: info => <p className="font-medium text-foreground">{info.getValue()}</p>
    },
    {
      header: 'Jenis Wadah',
      accessorKey: 'jenis_wadah',
      cell: info => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {info.getValue()}
        </span>
      )
    },
    {
      header: 'Produksi (Ton)',
      accessorKey: 'produksi_ton',
      cell: info => info.getValue().toLocaleString('id-ID')
    }
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Data Budidaya</h1>
          <p className="text-muted-foreground mt-1">
            Manajemen data produksi perikanan budidaya per Kabupaten/Kota.
          </p>
        </div>
        
        {!isFormOpen && (
          <button
            onClick={() => {
              setEditingData(null);
              setIsFormOpen(true);
            }}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Tambah Data Baru
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <BudidayaForm
            initialData={editingData}
            isLoading={submitLoading}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingData(null);
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={data}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onApprove={handleApprove}
          onReject={handleReject}
          exportName={`Budidaya_Samudera_${new Date().toISOString().split('T')[0]}`}
          formatExportData={(exportData) => exportData.map(row => ({
            'Tahun': row.tahun,
            'Bulan': row.bulan,
            'Triwulan': row.triwulan,
            'Kabupaten/Kota': row.kabupaten_kota,
            'Jenis Wadah': row.jenis_wadah,
            'Produksi (Ton)': row.produksi_ton
          }))}
        />
      )}
    </div>
  );
}
