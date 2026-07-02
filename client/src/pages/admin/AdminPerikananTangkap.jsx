import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { PerikananTangkapForm } from '@/components/admin/PerikananTangkapForm';
import { 
  Plus, Loader2, Database, TrendingUp, Ship, Anchor, 
  Fish, MapPin, LineChart, FileText, Filter, BarChart3, AlertCircle 
} from 'lucide-react';
import { formatDate } from '@/utils/dateHelper';
import { formatRupiah } from '@/utils/formatRupiah';
import * as XLSX from 'xlsx-js-style';
import { KOMODITAS_OPTIONS, PELABUHAN_OPTIONS } from '@/utils/constants';
import ReactECharts from 'echarts-for-react';

const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());
const BULAN_OPTIONS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function AdminPerikananTangkap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('data'); // 'data' or 'visual'
  const [filterTahun, setFilterTahun] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterCabang, setFilterCabang] = useState(''); // PELABUHAN, PUD, KAB_KOTA
  const [filterKomoditas, setFilterKomoditas] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('');

  const [stats, setStats] = useState({
    kpi: { total_volume: 0, total_nilai: 0, total_trip: 0, avg_volume_per_trip: 0 },
    komoditas: [],
    pelabuhan: [],
    tren: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filterTahun) queryParams.append('tahun', filterTahun);
      if (filterBulan) queryParams.append('bulan', filterBulan);
      if (filterCabang) queryParams.append('cabang', filterCabang);
      if (filterKomoditas) queryParams.append('komoditas', filterKomoditas);
      if (filterWilayah) queryParams.append('wilayah', filterWilayah);
      
      const query = `?${queryParams.toString()}`;

      const [dataRes] = await Promise.all([
        api.get(`/perikanan-tangkap/admin${query}`)
      ]);

      setData(dataRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterTahun, filterBulan, filterCabang, filterKomoditas, filterWilayah]);

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

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const itemTahun = item.tanggal ? item.tanggal.substring(0, 4) : '';
      const itemBulan = item.tanggal ? String(parseInt(item.tanggal.substring(5, 7))) : '';
      
      const matchTahun = !filterTahun || itemTahun === filterTahun;
      const matchBulan = !filterBulan || itemBulan === filterBulan;
      const matchCabang = !filterCabang || (item.sumber_data || 'PELABUHAN') === filterCabang;
      const matchWilayah = !filterWilayah || (item.pelabuhan || item.kabupaten_kota || '') === filterWilayah;
      const matchKomoditas = !filterKomoditas || (item.tangkapan && item.tangkapan.some(t => t.komoditas === filterKomoditas));
      
      return matchTahun && matchBulan && matchCabang && matchWilayah && matchKomoditas;
    });
  }, [data, filterTahun, filterBulan, filterCabang, filterWilayah, filterKomoditas]);

  const computedStats = useMemo(() => {
    let total_volume = 0;
    let total_nilai = 0;
    const komoditasMap = {};
    const pelabuhanMap = {};
    const trenMap = {};

    filteredData.forEach(row => {
      const pelabuhan = row.pelabuhan || row.kabupaten_kota || 'Tidak Diketahui';
      const date = row.tanggal ? row.tanggal.split('T')[0] : 'Unknown';

      if (row.tangkapan && Array.isArray(row.tangkapan)) {
        row.tangkapan.forEach(t => {
          const vol = Number(t.volume) || 0;
          const nil = Number(t.nilai) || 0;
          
          total_volume += vol;
          total_nilai += nil;

          if (t.komoditas) {
            if (!komoditasMap[t.komoditas]) komoditasMap[t.komoditas] = 0;
            komoditasMap[t.komoditas] += vol;
          }

          if (!pelabuhanMap[pelabuhan]) pelabuhanMap[pelabuhan] = 0;
          pelabuhanMap[pelabuhan] += vol;

          if (!trenMap[date]) trenMap[date] = 0;
          trenMap[date] += vol;
        });
      }
    });

    const total_trip = filteredData.length;
    const avg_volume_per_trip = total_trip > 0 ? total_volume / total_trip : 0;

    const komoditas = Object.entries(komoditasMap)
      .map(([k, v]) => ({ komoditas: k, _sum: { volume: v } }))
      .sort((a, b) => b._sum.volume - a._sum.volume)
      .slice(0, 10);

    const pelabuhanArr = Object.entries(pelabuhanMap)
      .map(([p, v]) => ({ pelabuhan: p, _sum: { volume: v } }))
      .sort((a, b) => b._sum.volume - a._sum.volume)
      .slice(0, 10);

    const tren = Object.entries(trenMap)
      .map(([d, v]) => ({ date: d, volume: v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      kpi: { total_volume, total_nilai, total_trip, avg_volume_per_trip },
      komoditas,
      pelabuhan: pelabuhanArr,
      tren
    };
  }, [filteredData]);

  const handleExportLaporanPelabuhan = () => {
    if (!filterWilayah) return;
    const pelabuhanName = filterWilayah.toUpperCase();
    const dateStr = filterTahun ? (filterBulan ? `${filterBulan}/${filterTahun}` : filterTahun) : 'Semua Waktu';
    
    // Rows
    const row0 = [`REKAPITULASI DATA LAYANAN PELABUHAN ${pelabuhanName}`];
    const row1 = [`Hari, Tgl / Bln / Thn : ${dateStr}`];
    const row2 = [];
    const row3 = ['1. PRODUKSI PELABUHAN'];
    
    const row4 = ['NO', 'WAKTU LABUH', 'WAKTU BONGKAR', 'Jenis Muatan', 'WPPNRI', 'Nama Kapal', 'Ukuran', 'API', 'Kapal Pengangkut', 'Catatan', 'Total Produksi', '', 'I k a n'];
    const row5 = ['', '', '', '', '', '', '', '', '', '', '', ''];
    const row6 = ['', '', '', '', '', '', '', '', '', '', 'Volume', 'Nilai'];
    
    const komoditasArray = KOMODITAS_OPTIONS;
    komoditasArray.forEach(kom => {
      row5.push(kom, '', '');
      row6.push('Vol', 'Harga', 'Nilai');
    });

    const dataRows = filteredData.map((row, idx) => {
      let totalVol = 0;
      let totalNilai = 0;
      const komMap = {};
      
      if (row.tangkapan && Array.isArray(row.tangkapan)) {
        row.tangkapan.forEach(t => {
          totalVol += Number(t.volume) || 0;
          totalNilai += Number(t.nilai) || 0;
          komMap[t.komoditas] = {
            vol: t.volume,
            harga: t.harga,
            nilai: t.nilai
          };
        });
      }

      const baseRow = [
        idx + 1,
        row.jam_labuh || '-',
        row.jam_bongkar || '-',
        'Hasil Tangkapan',
        '718',
        row.nama_kapal || '-',
        row.gt_kapal || '-',
        row.alat_tangkap || '-',
        '',
        row.logistik || '-',
        totalVol,
        totalNilai
      ];

      komoditasArray.forEach(kom => {
        if (komMap[kom]) {
          baseRow.push(komMap[kom].vol, komMap[kom].harga, komMap[kom].nilai);
        } else {
          baseRow.push('-', '-', '-');
        }
      });
      return baseRow;
    });

    const ws = XLSX.utils.aoa_to_sheet([row0, row1, row2, row3, row4, row5, row6, ...dataRows]);

    const borderStyle = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    const boldCenter = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: borderStyle, fill: { fgColor: { rgb: "EFEFEF" } } };
    const normalCenter = { alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle };

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

        if (R === 0) ws[cellRef].s = { font: { bold: true, sz: 14 } };
        else if (R === 3) ws[cellRef].s = { font: { bold: true } };
        else if (R >= 4 && R <= 6) ws[cellRef].s = boldCenter;
        else if (R >= 7) ws[cellRef].s = normalCenter;
      }
    }

    const merges = [
      { s: { r: 4, c: 0 }, e: { r: 6, c: 0 } },
      { s: { r: 4, c: 1 }, e: { r: 6, c: 1 } },
      { s: { r: 4, c: 2 }, e: { r: 6, c: 2 } },
      { s: { r: 4, c: 3 }, e: { r: 6, c: 3 } },
      { s: { r: 4, c: 4 }, e: { r: 6, c: 4 } },
      { s: { r: 4, c: 5 }, e: { r: 6, c: 5 } },
      { s: { r: 4, c: 6 }, e: { r: 6, c: 6 } },
      { s: { r: 4, c: 7 }, e: { r: 6, c: 7 } },
      { s: { r: 4, c: 8 }, e: { r: 6, c: 8 } },
      { s: { r: 4, c: 9 }, e: { r: 6, c: 9 } },
      { s: { r: 4, c: 10 }, e: { r: 5, c: 11 } },
      { s: { r: 4, c: 12 }, e: { r: 4, c: 11 + komoditasArray.length * 3 } }
    ];
    
    let currentCol = 12;
    komoditasArray.forEach(() => {
      merges.push({ s: { r: 5, c: currentCol }, e: { r: 5, c: currentCol + 2 } });
      currentCol += 3;
    });
    ws['!merges'] = merges;

    const colWidths = [{ wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
    komoditasArray.forEach(() => colWidths.push({ wch: 10 }, { wch: 10 }, { wch: 12 }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produksi_Pelabuhan");
    XLSX.writeFile(wb, `Laporan_${pelabuhanName}_${dateStr.replace('/', '-')}.xlsx`);
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

  const komoditasChartOption = useMemo(() => {
    const categories = computedStats.komoditas.map(item => item.komoditas);
    const values = computedStats.komoditas.map(item => item._sum.volume || 0);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '15%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', name: 'Volume (Kg)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontWeight: 'bold', interval: 0, width: 120, overflow: 'truncate' } },
      series: [{ name: 'Volume', type: 'bar', data: values, itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#ffffff', formatter: '{c} Kg' } }]
    };
  }, [computedStats.komoditas]);

  const pelabuhanChartOption = useMemo(() => {
    const categories = computedStats.pelabuhan.map(item => item.pelabuhan);
    const values = computedStats.pelabuhan.map(item => item._sum.volume || 0);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '15%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', name: 'Volume (Kg)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontWeight: 'bold' } },
      series: [{ name: 'Volume', type: 'bar', data: values, itemStyle: { color: '#10b981', borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#ffffff', formatter: '{c} Kg' } }]
    };
  }, [computedStats.pelabuhan]);

  const trenChartOption = useMemo(() => {
    const dates = computedStats.tren.map(t => t.date);
    const volumes = computedStats.tren.map(t => t.volume);

    return {
      tooltip: { trigger: 'axis', formatter: (params) => `<b>${params[0].name}</b><br/>Volume: ${params[0].value.toLocaleString('id-ID')} Kg` },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: dates, axisLabel: { color: '#f8fafc' } },
      yAxis: { type: 'value', name: 'Volume (Kg)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { color: '#334155' } } },
      dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }],
      series: [{ name: 'Volume', type: 'line', data: volumes, smooth: true, symbolSize: 8, itemStyle: { color: '#8b5cf6' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(139, 92, 246, 0.5)' }, { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }] } } }]
    };
  }, [stats.tren]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Perikanan Tangkap</h1>
          <p className="text-muted-foreground mt-1">Input dan Kelola Laporan Pendaratan Ikan Harian.</p>
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

      {/* Tabs Filter & Statistik */}
      {!isFormOpen && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-border pb-4">
            <button 
              onClick={() => setActiveTab('data')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'data' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Tabel Data
            </button>
            <button 
              onClick={() => setActiveTab('visual')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'visual' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Visualisasi Statistik
            </button>
          </div>

          {/* Super Filters */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <h3 className="text-lg font-semibold text-foreground">Filter Multi-Dimensi (Eksplorasi & Unduh Data)</h3>
              </div>
              {filterWilayah && filterCabang === 'PELABUHAN' && (
                <button
                  onClick={handleExportLaporanPelabuhan}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Unduh Laporan Pelabuhan
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cabang Sumber</label>
                <select value={filterCabang} onChange={(e) => setFilterCabang(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Cabang</option>
                  <option value="PELABUHAN">Pelabuhan</option>
                  <option value="PUD">PUD</option>
                  <option value="KAB_KOTA">Kab/Kota</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Tahun</option>
                  {TAHUN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bulan</label>
                <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Bulan</option>
                  {BULAN_OPTIONS.map((opt, i) => <option key={opt} value={i+1}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Wilayah / Pelabuhan</label>
                <select value={filterWilayah} onChange={(e) => setFilterWilayah(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Wilayah</option>
                  {PELABUHAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Komoditas</label>
                <select value={filterKomoditas} onChange={(e) => setFilterKomoditas(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Komoditas</option>
                  {KOMODITAS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area Based on Active Tab */}
      {!isFormOpen && (
        loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          activeTab === 'data' ? (
            <div className="bg-card border border-border rounded-2xl shadow-sm">
              <DataTable
                columns={columns}
                data={filteredData}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onApprove={handleApprove}
                onReject={handleReject}
                exportName={`Perikanan_Tangkap_${filterCabang || 'All'}_${filterTahun || 'All'}`}
                renderSubComponent={renderSubComponent}
                onCustomExport={(exportData) => {
                  const komoditasArray = KOMODITAS_OPTIONS;

                  const headerRow1 = ['Nama Kapal', 'Ukuran/GT', 'Alat Tangkap', 'Pelabuhan/Lokasi', 'Catatan/Logistik', 'Total Volume (Kg)', 'Total Nilai (Rp)'];
                  const headerRow2 = ['', '', '', '', '', '', ''];
                  
                  komoditasArray.forEach(kom => {
                    headerRow1.push(kom, '', '');
                    headerRow2.push('Volume (Kg)', 'Harga', 'Nilai (Rp)');
                  });

                  const dataRows = exportData.map(row => {
                    let totalVol = 0;
                    let totalNilai = 0;
                    const komMap = {};
                    
                    if (row.tangkapan && Array.isArray(row.tangkapan)) {
                      row.tangkapan.forEach(t => {
                        totalVol += Number(t.volume) || 0;
                        totalNilai += Number(t.nilai) || 0;
                        komMap[t.komoditas] = {
                          vol: t.volume,
                          harga: t.harga,
                          nilai: t.nilai
                        };
                      });
                    }

                    const baseRow = [
                      row.nama_kapal || '-',
                      row.gt_kapal || '-',
                      row.alat_tangkap || '-',
                      row.pelabuhan || row.kabupaten_kota || '-',
                      row.logistik || '-',
                      totalVol,
                      totalNilai
                    ];

                    komoditasArray.forEach(kom => {
                      if (komMap[kom]) {
                        baseRow.push(komMap[kom].vol, komMap[kom].harga, komMap[kom].nilai);
                      } else {
                        baseRow.push('-', '-', '-');
                      }
                    });

                    return baseRow;
                  });

                  const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...dataRows]);

                  const borderStyle = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
                  const headerStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: borderStyle, fill: { fgColor: { rgb: "FFFF00" } } };
                  const komoditasHeaderStyle = { ...headerStyle, fill: { fgColor: { rgb: "D9EAD3" } } };
                  const subHeaderStyle = { ...headerStyle, fill: { fgColor: { rgb: "C9DAF8" } } };
                  const dataStyle = { alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle };

                  const range = XLSX.utils.decode_range(ws['!ref']);
                  for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                      const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

                      if (R === 0) {
                        ws[cellRef].s = C > 6 ? komoditasHeaderStyle : headerStyle;
                      } else if (R === 1) {
                        ws[cellRef].s = C > 6 ? subHeaderStyle : headerStyle;
                      } else {
                        ws[cellRef].s = dataStyle;
                      }
                    }
                  }

                  const merges = [];
                  for (let i = 0; i <= 6; i++) {
                    merges.push({ s: { r: 0, c: i }, e: { r: 1, c: i } });
                  }
                  
                  let currentCol = 7;
                  komoditasArray.forEach(() => {
                    merges.push({ s: { r: 0, c: currentCol }, e: { r: 0, c: currentCol + 2 } });
                    currentCol += 3;
                  });
                  ws['!merges'] = merges;

                  const colWidths = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 20 }];
                  komoditasArray.forEach(() => {
                    colWidths.push({ wch: 12 }, { wch: 12 }, { wch: 15 });
                  });
                  ws['!cols'] = colWidths;

                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Perikanan_Tangkap");
                  XLSX.writeFile(wb, `Perikanan_Tangkap_${new Date().toISOString().split('T')[0]}.xlsx`);
                }}
              />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500"><Database className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                    <p className="text-2xl font-bold text-foreground">{computedStats.kpi.total_volume.toLocaleString('id-ID')} <span className="text-sm font-normal text-muted-foreground">Kg</span></p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500"><TrendingUp className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Nilai Produksi</p>
                    <p className="text-2xl font-bold text-foreground">{formatRupiah(computedStats.kpi.total_nilai)}</p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-4 bg-orange-500/10 rounded-xl text-orange-500"><Ship className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pendaratan</p>
                    <p className="text-2xl font-bold text-foreground">{computedStats.kpi.total_trip.toLocaleString('id-ID')} <span className="text-sm font-normal text-muted-foreground">Trip</span></p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-4 bg-purple-500/10 rounded-xl text-purple-500"><Anchor className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rata-rata Volume</p>
                    <p className="text-2xl font-bold text-foreground">{computedStats.kpi.avg_volume_per_trip.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-muted-foreground">Kg/Trip</span></p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4"><Fish className="w-5 h-5 text-blue-500" /><h3 className="text-lg font-semibold">Volume Berdasarkan Komoditas</h3></div>
                  {computedStats.komoditas.length > 0 ? <ReactECharts option={komoditasChartOption} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-pink-500" /><h3 className="text-lg font-semibold">Volume Berdasarkan Pelabuhan</h3></div>
                  {computedStats.pelabuhan.length > 0 ? <ReactECharts option={pelabuhanChartOption} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4"><LineChart className="w-5 h-5 text-emerald-500" /><h3 className="text-lg font-semibold">Tren Pendaratan Harian</h3></div>
                {computedStats.tren.length > 0 ? <ReactECharts option={trenChartOption} style={{ height: '400px', width: '100%' }} /> : <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
              </div>
            </div>
          )
        )
      )}
    </div>
  );
}
