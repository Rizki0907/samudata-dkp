import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { Loader2, FileText } from 'lucide-react';


const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());

export default function Ekspor() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [stats, setStats] = useState({
    kpi: { total_volume: 0, total_nilai: 0, total_transaksi: 0 },
    treemap: [],
    top5_names: [],
    monthly_data_raw: [],
    monthly_aggregate: [],
    ranking_komoditas: [],
    negara_tujuan: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const query = selectedYear ? `?tahun=${selectedYear}` : '';
        const [dataRes, statsRes] = await Promise.all([
          api.get(`/ekspor${query}`),
          api.get(`/ekspor/stats${query}`)
        ]);

        if (dataRes.data.success) {
          setData(dataRes.data.data);
        }
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedYear]);

  const columns = useMemo(() => [
    {
      header: 'Bulan',
      accessorKey: 'bulan'
    },
    {
      header: 'Tahun',
      accessorKey: 'tahun'
    },
    {
      header: 'Kategori Komoditas',
      accessorKey: 'kategori_komoditas',
      cell: info => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {info.getValue()}
        </span>
      )
    },
    {
      header: 'Nama Komoditas',
      accessorKey: 'nama_komoditas'
    },
    {
      header: 'Volume',
      accessorKey: 'volume',
      cell: info => info.getValue().toLocaleString('id-ID')
    },
    {
      header: 'Satuan Volume',
      accessorKey: 'satuan_volume'
    },
    {
      header: 'Nilai (USD)',
      accessorKey: 'nilai_usd',
      cell: info => `$${info.getValue().toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    },
    {
      header: 'Negara Tujuan',
      accessorKey: 'negara_tujuan'
    }
  ], []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Menyiapkan Visualisasi Data Ekspor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Statistik Ekspor Perikanan</h1>
          <p className="text-muted-foreground mt-1">
            Visualisasi data kegiatan ekspor hasil kelautan dan perikanan Jawa Timur.
          </p>
        </div>
        <div>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer shadow-sm"
          >
            <option value="">Semua Tahun</option>
            {TAHUN_OPTIONS.map(tahun => (
              <option key={tahun} value={tahun}>{tahun}</option>
            ))}
          </select>
        </div>
      </div>



            {/* Table Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-foreground">Rincian Laporan Ekspor</h3>
          </div>
          <p className="text-sm text-muted-foreground">Tabel di bawah ini dapat dicari, diurutkan, dan diekspor ke Excel.</p>
        </div>

        <DataTable
          columns={columns}
          data={data}
          exportName={`Ekspor_Samudera_${new Date().toISOString().split('T')[0]}`}
          formatExportData={(exportData) => exportData.map(row => ({
            'Bulan': row.bulan,
            'Tahun': row.tahun,
            'Kategori Komoditas': row.kategori_komoditas,
            'Nama Komoditas': row.nama_komoditas,
            'Volume': row.volume,
            'Satuan Volume': row.satuan_volume,
            'Nilai (USD)': row.nilai_usd,
            'Negara Tujuan': row.negara_tujuan
          }))}
        />
      </div>

    </div>
  );
}
