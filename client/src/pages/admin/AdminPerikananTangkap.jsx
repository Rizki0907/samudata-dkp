import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { PerikananTangkapForm } from '@/components/admin/PerikananTangkapForm';
import { Plus, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/dateHelper';
import { formatRupiah } from '@/utils/formatRupiah';

export default function AdminPerikananTangkap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/perikanan-tangkap');
      setData(res.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
        await api.put(`/perikanan-tangkap/${editingData.id}`, formData);
      } else {
        await api.post('/perikanan-tangkap', formData);
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
    if (window.confirm(`Yakin ingin menghapus data kapal ${row.nama_kapal}?`)) {
      try {
        await api.delete(`/perikanan-tangkap/${row.id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting data:', error);
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
        await api.put(`/perikanan-tangkap/${row.id}/status`, { status: 'APPROVED' });
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
      await api.put(`/perikanan-tangkap/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
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
      header: 'Tanggal',
      accessorKey: 'tanggal',
      cell: info => formatDate(info.getValue())
    },
    {
      header: 'Jam Labuh',
      accessorKey: 'jam_labuh'
    },
    {
      header: 'Jam Bongkar',
      accessorKey: 'jam_bongkar'
    },
    {
      header: 'Pelabuhan',
      accessorKey: 'pelabuhan'
    },
    {
      header: 'Nama Kapal',
      accessorKey: 'nama_kapal',
      cell: info => <p className="font-medium">{info.getValue()}</p>
    },
    {
      header: 'GT Kapal',
      accessorKey: 'gt_kapal'
    },
    {
      header: 'Alat Tangkap',
      accessorKey: 'alat_tangkap'
    }
  ], []);

  const renderSubComponent = ({ row }) => {
    const tangkapan = row.original.tangkapan || [];
    if (tangkapan.length === 0) return <div className="p-4 text-center text-muted-foreground text-sm">Belum ada detail tangkapan</div>;
    
    return (
      <div className="p-4 bg-muted/10 border-l-4 border-primary">
        <h4 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
          Detail Komoditas Tangkapan
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-border rounded-lg overflow-hidden">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Komoditas</th>
                <th className="px-4 py-2 font-medium">Volume (Kg)</th>
                <th className="px-4 py-2 font-medium text-right">Harga (Rp/Kg)</th>
                <th className="px-4 py-2 font-medium text-right">Nilai Produksi (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {tangkapan.map((item, index) => (
                <tr key={index} className="hover:bg-muted/50">
                  <td className="px-4 py-2 font-medium">{item.komoditas}</td>
                  <td className="px-4 py-2">{item.volume.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-2 text-right">{formatRupiah(item.harga)}</td>
                  <td className="px-4 py-2 text-right">{formatRupiah(item.nilai)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Perikanan Tangkap</h1>
          <p className="text-muted-foreground mt-1">Input laporan pendaratan ikan harian pelabuhan.</p>
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
          <PerikananTangkapForm
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
          exportName={`Perikanan_Tangkap_${new Date().toISOString().split('T')[0]}`}
          renderSubComponent={renderSubComponent}
          formatExportData={(exportData) => {
            const flattened = [];
            exportData.forEach(row => {
              const baseData = {
                'Sumber Data': row.sumber_data || 'PELABUHAN',
                'Tanggal': row.tanggal ? row.tanggal.split('T')[0] : '',
                'Jam Labuh': row.jam_labuh || '-',
                'Jam Bongkar': row.jam_bongkar || '-',
                'Lokasi': row.pelabuhan || row.kabupaten_kota || '-',
                'Nama Kapal': row.nama_kapal || '-',
                'GT Kapal': row.gt_kapal || '-',
                'Alat Tangkap': row.alat_tangkap || '-',
              };
              if (row.tangkapan && row.tangkapan.length > 0) {
                row.tangkapan.forEach(t => {
                  flattened.push({
                    ...baseData,
                    'Komoditas': t.komoditas,
                    'Volume (Kg)': t.volume,
                    'Harga (Rp/Kg)': t.harga,
                    'Nilai Produksi (Rp)': t.nilai
                  });
                });
              } else {
                flattened.push(baseData);
              }
            });
            return flattened;
          }}
        />
      )}
    </div>
  );
}
