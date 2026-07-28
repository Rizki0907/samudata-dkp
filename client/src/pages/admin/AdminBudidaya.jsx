import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, MapPin, TrendingUp, Box, LineChart, Fish, Filter, X, Download, FileText, Clock } from 'lucide-react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import BudidayaForm from '@/components/admin/BudidayaForm';
import { BudidayaTahunanForm } from '@/components/admin/BudidayaTahunanForm';
import SearchableMultiSelect from '@/components/shared/SearchableMultiSelect';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import geoJsonData from '@/assets/jawa_timur.json';
import { useThemeStore } from '@/store/themeStore';

echarts.registerMap('jawa_timur', geoJsonData);
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const TwBadge = ({ tw }) => {
  const twStr = String(tw).startsWith('TW') ? String(tw) : `TW ${tw}`;
  const colorMap = {
    'TW 1': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'TW 2': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'TW 3': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'TW 4': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };
  const cls = colorMap[twStr] ?? 'bg-muted text-muted-foreground border-border';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cls}`}>{twStr}</span>;
};

export default function AdminBudidaya() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const chartText = isDark ? '#e2e8f0' : '#0f172a';
  const chartSubText = isDark ? '#cbd5e1' : '#1e293b';
  const chartAxisLabel = isDark ? '#94a3b8' : '#334155';
  const chartGridLine = isDark ? '#334155' : '#cbd5e1';

  const [data, setData] = useState([]);
  const [dataTahunan, setDataTahunan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTahunanFormOpen, setIsTahunanFormOpen] = useState(false);
  const [isSelectTypeModalOpen, setIsSelectTypeModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('data');
  const [barFilter, setBarFilter] = useState('produksi');

  const [filterKomoditas, setFilterKomoditas] = useState([]);
  const [filterKabupaten, setFilterKabupaten] = useState([]);
  const [filterWadah, setFilterWadah] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const [filterBulan, setFilterBulan] = useState([]);
  const [filterTahun, setFilterTahun] = useState([]);
  const [filterModul, setFilterModul] = useState([]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState('wadah');
  const [exportYear, setExportYear] = useState(new Date().getFullYear().toString());

  const komoditasOptions = useMemo(() => [...new Set(data.map(d => d.komoditas))].filter(Boolean).sort(), [data]);
  const kabupatenOptions = useMemo(() => [...new Set([...data.map(d => d.kabupaten_kota), ...dataTahunan.map(d => d.kabupaten_kota)])].filter(Boolean).sort(), [data, dataTahunan]);
  const wadahOptions = useMemo(() => [...new Set(data.map(d => d.jenis_wadah))].filter(Boolean).sort(), [data]);
  const bulanOptions = useMemo(() => [...new Set(data.map(d => d.bulan))].filter(Boolean).sort(), [data]);
  const tahunOptions = useMemo(() => [...new Set([...data.map(d => d.tahun), ...dataTahunan.map(d => d.tahun)])].filter(Boolean).sort(), [data, dataTahunan]);
  const modulOptions = useMemo(() => [...new Set(dataTahunan.map(d => d.modul_id))].filter(Boolean).sort(), [dataTahunan]);

  const matchMultiFilter = (filterArr, val, isCaseInsensitive = false) => {
    if (!filterArr || (Array.isArray(filterArr) && filterArr.length === 0)) return true;
    if (!Array.isArray(filterArr)) {
      return isCaseInsensitive
        ? String(filterArr).toUpperCase() === String(val || '').toUpperCase()
        : String(filterArr) === String(val);
    }
    return isCaseInsensitive
      ? filterArr.some(f => String(f).toUpperCase() === String(val || '').toUpperCase())
      : filterArr.some(f => String(f) === String(val));
  };

  const filteredDataTahunan = useMemo(() => {
    return dataTahunan.filter(item => {
      if (!matchMultiFilter(filterKabupaten, item.kabupaten_kota)) return false;
      if (!matchMultiFilter(filterTahun, item.tahun?.toString())) return false;
      if (!matchMultiFilter(filterModul, item.modul_id)) return false;
      return true;
    }).sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
  }, [dataTahunan, filterKabupaten, filterTahun, filterModul]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (!matchMultiFilter(filterStatus, item.status, true)) return false;
      if (!matchMultiFilter(filterKomoditas, item.komoditas)) return false;
      if (!matchMultiFilter(filterKabupaten, item.kabupaten_kota)) return false;
      if (!matchMultiFilter(filterWadah, item.jenis_wadah)) return false;
      if (!matchMultiFilter(filterBulan, item.bulan)) return false;
      if (!matchMultiFilter(filterTahun, item.tahun?.toString())) return false;
      return true;
    }).sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
  }, [data, filterStatus, filterKomoditas, filterKabupaten, filterWadah, filterBulan, filterTahun]);

  const lastUpdated = useMemo(() => {
    const list = activeTab === 'tahunan' ? filteredDataTahunan : filteredData;
    if (!list || list.length === 0) return null;
    let maxDate = new Date(0);
    list.forEach(row => {
      if (row.updated_at || row.created_at) {
        const dt = new Date(row.updated_at || row.created_at);
        if (dt > maxDate) maxDate = dt;
      }
    });
    if (maxDate.getTime() === 0) return null;
    return maxDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + maxDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }, [activeTab, filteredData, filteredDataTahunan]);


  const fetchData = async () => {
    try {
      setLoading(true);
      const [response, tahRes] = await Promise.all([
        api.get('/budidaya/admin'),
        api.get('/budidaya-tahunan')
      ]);
      if (response.data.success) {
        setData(response.data.data);
      }
      if (tahRes.data.success) {
        setDataTahunan(tahRes.data.data);
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
    setIsTahunanFormOpen(false);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditTahunan = (row) => {
    setEditingData(row);
    setIsFormOpen(false);
    setIsTahunanFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApproveTahunan = async (row) => {
    let promptMsg = 'Pilih jenis validasi (Ketik angka):\n1. Validasi Bidang\n2. Validasi Program';
    if (row.status === 'APPROVED') {
      promptMsg = 'Data ini sudah disetujui Bidang.\nKetik "2" untuk melanjutkan Validasi Program:';
    } else if (row.status === 'PENDING') {
      promptMsg = 'Data berstatus PENDING.\nKetik "1" untuk Validasi Bidang\nKetik "2" untuk Validasi Program';
    }

    const jenis = window.prompt(promptMsg);
    if (!jenis) return;

    let targetStatus = '';
    let namaValidasi = '';
    let expectedKeyword = '';

    if (jenis === '1') {
      if (row.status === 'APPROVED') {
        alert('Data sudah divalidasi oleh Bidang sebelumnya!');
        return;
      }
      targetStatus = 'APPROVED';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (jenis === '2') {
      targetStatus = 'VERIFIED';
      namaValidasi = 'PROGRAM';
      expectedKeyword = 'SETUJU';
    } else {
      alert('Pilihan tidak valid. Proses dibatalkan.');
      return;
    }

    const confirmText = window.prompt(`Ketik "${expectedKeyword}" (huruf kapital) untuk menyelesaikan Validasi ${namaValidasi}:`);
    if (confirmText !== expectedKeyword) {
      alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
      return;
    }

    try {
      await api.put(`/budidaya-tahunan/${row.id}/status`, { status: targetStatus });
      fetchData();
    } catch (error) {
      alert('Gagal menyetujui data');
    }
  };

  const handleRejectTahunan = async (row) => {
    const alasan = window.prompt('Masukkan alasan penolakan:');
    if (alasan) {
      try {
        await api.put(`/budidaya-tahunan/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
        fetchData();
      } catch (error) {
        alert('Gagal menolak data');
      }
    }
  };

  const handleDeleteTahunan = async (row) => {
    if (window.confirm(`Yakin ingin menghapus data tahunan ${row.modul_id}?`)) {
      try {
        await api.delete(`/budidaya-tahunan/${row.id}`);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus data');
      }
    }
  };

  const handleApprove = async (row) => {
    let promptMsg = 'Pilih jenis validasi (Ketik angka):\n1. Validasi Bidang\n2. Validasi Program';
    if (row.status === 'APPROVED') {
      promptMsg = 'Data ini sudah disetujui Bidang.\nKetik "2" untuk melanjutkan Validasi Program:';
    } else if (row.status === 'PENDING') {
      promptMsg = 'Data berstatus PENDING.\nKetik "1" untuk Validasi Bidang\nKetik "2" untuk Validasi Program';
    }

    const jenis = window.prompt(promptMsg);
    if (!jenis) return;

    let targetStatus = '';
    let namaValidasi = '';
    let expectedKeyword = '';

    if (jenis === '1') {
      if (row.status === 'APPROVED') {
        alert('Data sudah divalidasi oleh Bidang sebelumnya!');
        return;
      }
      targetStatus = 'APPROVED';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (jenis === '2') {
      targetStatus = 'VERIFIED';
      namaValidasi = 'PROGRAM';
      expectedKeyword = 'ACC';
    } else {
      alert('Pilihan tidak valid. Proses dibatalkan.');
      return;
    }

    const confirmText = window.prompt(`Ketik "${expectedKeyword}" (huruf kapital) untuk menyelesaikan Validasi ${namaValidasi}:`);
    if (confirmText !== expectedKeyword) {
      alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
      return;
    }

    try {
      await api.put(`/budidaya/${row.id}/status`, { status: targetStatus });
      fetchData();
    } catch (error) {
      console.error('Error approving data:', error);
      alert(`Gagal menyetujui data: ${error?.response?.data?.message || error.message}`);
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

  const handleBatchApprove = async (ids) => {
    const promptMsg = 'Pilih jenis validasi massal (Ketik angka):\n1. Validasi Bidang\n2. Validasi Program';
    const jenis = window.prompt(promptMsg);
    if (!jenis) return;

    let targetStatus = '';
    let namaValidasi = '';
    let expectedKeyword = '';

    if (jenis === '1') {
      targetStatus = 'APPROVED';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (jenis === '2') {
      targetStatus = 'VERIFIED';
      namaValidasi = 'PROGRAM';
      expectedKeyword = 'ACC';
    } else {
      alert('Pilihan tidak valid. Proses dibatalkan.');
      return;
    }

    const confirmText = window.prompt(`Anda akan menyetujui ${ids.length} data.\nKetik "${expectedKeyword}" (huruf kapital) untuk menyelesaikan Validasi ${namaValidasi}:`);
    if (confirmText !== expectedKeyword) {
      alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
      return;
    }

    try {
      await api.post(`/budidaya/batch-status`, { ids, status: targetStatus });
      fetchData();
    } catch (error) {
      console.error('Error batch approve:', error);
      alert(`Gagal menyetujui data secara massal: ${error?.response?.data?.message || error.message}`);
    }
  };

  const handleBatchReject = async (ids) => {
    const alasan = window.prompt(`Masukkan alasan penolakan untuk ${ids.length} data:`);
    if (alasan === null) return;
    if (!alasan.trim()) {
      alert('Alasan penolakan wajib diisi!');
      return;
    }
    try {
      await api.post(`/budidaya/batch-status`, { ids, status: 'REJECTED', alasan_penolakan: alasan });
      fetchData();
    } catch (error) {
      console.error('Error batch reject:', error);
      alert('Gagal menolak data secara massal');
    }
  };

  const handleBatchDelete = async (ids) => {
    if (window.confirm(`Yakin ingin menghapus ${ids.length} data ini?`)) {
      try {
        await api.post(`/budidaya/batch-delete`, { ids });
        fetchData();
      } catch (error) {
        console.error('Error batch delete:', error);
        alert('Gagal menghapus data secara massal');
      }
    }
  };

  const handleBatchApproveTahunan = async (ids) => {
    const promptMsg = 'Pilih jenis validasi massal (Ketik angka):\n1. Validasi Bidang\n2. Validasi Program';
    const jenis = window.prompt(promptMsg);
    if (!jenis) return;

    let targetStatus = '';
    let namaValidasi = '';
    let expectedKeyword = '';

    if (jenis === '1') {
      targetStatus = 'APPROVED';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (jenis === '2') {
      targetStatus = 'VERIFIED';
      namaValidasi = 'PROGRAM';
      expectedKeyword = 'SETUJU';
    } else {
      alert('Pilihan tidak valid');
      return;
    }

    const confirmText = window.prompt(`Ketik "${expectedKeyword}" untuk mengonfirmasi validasi ${namaValidasi} untuk ${ids.length} data:`);
    if (confirmText !== expectedKeyword) {
      alert('Validasi dibatalkan karena teks konfirmasi tidak sesuai.');
      return;
    }

    try {
      await api.post(`/budidaya-tahunan/batch-status`, { ids, status: targetStatus });
      fetchData();
    } catch (error) {
      console.error('Error batch approve tahunan:', error);
      alert('Gagal menyetujui data secara massal');
    }
  };

  const handleBatchRejectTahunan = async (ids) => {
    const alasan = window.prompt(`Masukkan alasan penolakan untuk ${ids.length} data:`);
    if (alasan === null) return;
    if (!alasan.trim()) {
      alert('Alasan penolakan wajib diisi!');
      return;
    }
    try {
      await api.post(`/budidaya-tahunan/batch-status`, { ids, status: 'REJECTED', alasan_penolakan: alasan });
      fetchData();
    } catch (error) {
      console.error('Error batch reject tahunan:', error);
      alert('Gagal menolak data secara massal');
    }
  };

  const handleBatchDeleteTahunan = async (ids) => {
    if (window.confirm(`Yakin ingin menghapus ${ids.length} data tahunan ini?`)) {
      try {
        await api.post(`/budidaya-tahunan/batch-delete`, { ids });
        fetchData();
      } catch (error) {
        console.error('Error batch delete tahunan:', error);
        alert('Gagal menghapus data secara massal');
      }
    }
  };

  const handleCustomExport = () => {
    setIsExportModalOpen(true);
  };

  const executeExport = () => {
    if (!exportYear) {
      alert('Pilih tahun terlebih dahulu');
      return;
    }

    let endpoint = '';
    let fileName = '';

    if (activeTab === 'tahunan') {
      endpoint = '/budidaya-tahunan/export';
      fileName = `Data_Tahunan_Budidaya_${exportYear}.xlsx`;
    } else {
      endpoint = exportType === 'wadah' ? '/budidaya/export-wadah' : '/budidaya/export-komoditas';
      fileName = `Ringkasan_${exportType}_${exportYear}.xlsx`;
    }

    const token = localStorage.getItem('admin_token');

    // Use fetch and blob to include auth headers properly
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${endpoint}?tahun=${exportYear}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        if (!response.ok) throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setIsExportModalOpen(false);
      })
      .catch(err => {
        console.error('Export error:', err);
        alert(`Gagal mengunduh file: ${err.message}. Fetching URL: ${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${endpoint}?tahun=${exportYear}`);
      });
  };

  const computedStats = useMemo(() => {
    let total_volume = 0;
    let total_nilai = 0;
    const komoditasMap = {};
    const kabMap = {};
    const wadahMap = {};
    const heatmapRaw = {};

    filteredData.forEach(item => {
      if (item.status === 'REJECTED') return;
      const vol = Number(item.produksi_kg) || 0;
      const nilai = Number(item.nilai_rp) || 0;

      total_volume += vol;
      total_nilai += nilai;

      if (item.komoditas) {
        komoditasMap[item.komoditas] = (komoditasMap[item.komoditas] || 0) + vol;
      }

      const kab = item.kabupaten_kota || 'Tidak Diketahui';
      if (!kabMap[kab]) kabMap[kab] = { produksi: 0, nilai: 0 };
      kabMap[kab].produksi += vol;
      kabMap[kab].nilai += nilai;

      if (item.jenis_wadah) {
        wadahMap[item.jenis_wadah] = (wadahMap[item.jenis_wadah] || 0) + vol;
      }

      if (!heatmapRaw[kab]) {
        heatmapRaw[kab] = MONTHS.map(b => ({ bulan: b, produksi: 0 }));
      }
      const bIndex = MONTHS.indexOf(item.bulan);
      if (bIndex !== -1) {
        heatmapRaw[kab][bIndex].produksi += vol;
      }
    });

    let top_komoditas = '-';
    let maxKomoditasProd = 0;
    for (const [kom, prod] of Object.entries(komoditasMap)) {
      if (prod > maxKomoditasProd) {
        maxKomoditasProd = prod;
        top_komoditas = kom;
      }
    }

    const produksiPerKabupaten = Object.entries(kabMap)
      .map(([name, stats]) => ({ name, produksi: stats.produksi, nilai: stats.nilai }))
      .sort((a, b) => b.produksi - a.produksi);

    const komposisiWadah = Object.entries(wadahMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const top5Wadah = komposisiWadah.slice(0, 5).map(w => w.name);

    const trenBulanan = MONTHS.map(bulan => {
      const monthData = { bulan, Lainnya: 0 };
      top5Wadah.forEach(w => monthData[w] = 0);
      return monthData;
    });

    filteredData.forEach(item => {
      const bIndex = MONTHS.indexOf(item.bulan);
      if (bIndex === -1) return;

      const vol = Number(item.produksi_kg) || 0;
      if (top5Wadah.includes(item.jenis_wadah)) {
        trenBulanan[bIndex][item.jenis_wadah] += vol;
      } else {
        trenBulanan[bIndex].Lainnya += vol;
      }
    });

    const heatmapData = [];
    Object.keys(heatmapRaw).forEach(kab => {
      const bulanArr = heatmapRaw[kab];
      const maxProd = Math.max(...bulanArr.map(b => b.produksi));
      const minProd = Math.min(...bulanArr.map(b => b.produksi));
      const range = maxProd - minProd;

      bulanArr.forEach(b => {
        let normalized = 0;
        if (range > 0) {
          normalized = (b.produksi - minProd) / range;
        } else if (maxProd > 0) {
          normalized = 1;
        }
        heatmapData.push({
          kabupaten: kab,
          bulan: b.bulan,
          produksi: b.produksi,
          normalized: parseFloat(normalized.toFixed(4))
        });
      });
    });

    return {
      kpi: { total_volume, top_komoditas, total_nilai },
      produksiPerKabupaten,
      komposisiWadah,
      top5Wadah,
      trenBulanan,
      heatmapData
    };
  }, [filteredData]);

  const mapOption = useMemo(() => {
    const mapData = computedStats.produksiPerKabupaten.map(item => ({ name: item.name, value: item.produksi }));
    const maxVal = mapData.length > 0 ? Math.max(...mapData.map(d => d.value)) : 0;
    return {
      title: { text: 'Produksi Budidaya per Kabupaten/Kota', textStyle: { color: chartText, fontSize: 16, fontFamily: 'Inter' }, left: 'center', top: 10 },
      tooltip: { trigger: 'item', formatter: (params) => `${params.name}<br/>Total Produksi: <b>${Number(params.value || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} KG</b>` },
      visualMap: { left: 'right', min: 0, max: maxVal || 100, inRange: { color: isDark ? ['#dc2626', '#f97316', '#facc15', '#a3e635', '#34d399'] : ['#e0f2fe', '#7dd3fc', '#0284c7', '#0369a1', '#0c4a6e'] }, text: ['Tinggi', 'Rendah'], textStyle: { color: chartSubText }, calculable: false },
      series: [{ name: 'Produksi Budidaya', type: 'map', map: 'jawa_timur', roam: true, label: { show: false, color: '#fff' }, emphasis: { label: { show: true, color: '#fff' }, itemStyle: { areaColor: '#f59e0b' } }, itemStyle: { areaColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1' }, data: mapData }]
    };
  }, [computedStats.produksiPerKabupaten, chartText, chartSubText, chartGridLine, isDark]);

  const barOption = useMemo(() => {
    const sortedData = [...computedStats.produksiPerKabupaten].sort((a, b) => b[barFilter] - a[barFilter]);
    const top10 = sortedData.slice(0, 10).reverse();
    const isProduksi = barFilter === 'produksi';
    const seriesName = isProduksi ? 'Produksi (KG)' : 'Nilai Total (Rp)';
    const formatter = isProduksi ? val => Number(val).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' KG' : val => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params) => `${params[0].name}<br/>${seriesName}: <b>${formatter(params[0].value || 0)}</b>` },
      grid: { left: '3%', right: '4%', top: '5%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', splitLine: { lineStyle: { color: chartGridLine, type: 'dashed' } }, axisLabel: { color: chartAxisLabel, formatter: (val) => { if (val >= 1000000000000) return (val / 1000000000000).toFixed(1) + 'T'; if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'M'; if (val >= 1000000) return (val / 1000000).toFixed(1) + 'Jt'; if (val >= 1000) return (val / 1000).toFixed(1) + 'rb'; return val; } } },
      yAxis: { type: 'category', data: top10.map(d => d.name), axisLabel: { color: chartSubText, fontSize: 11 } },
      series: [{ name: seriesName, type: 'bar', data: top10.map(d => d[barFilter]), itemStyle: { color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{ offset: 0, color: isDark ? '#0ea5e9' : '#0284c7' }, { offset: 1, color: isDark ? '#2563eb' : '#1e40af' }]), borderRadius: [0, 4, 4, 0] } }]
    };
  }, [computedStats.produksiPerKabupaten, barFilter, chartGridLine, chartAxisLabel, chartSubText, isDark]);

  const lineOption = useMemo(() => {
    const seriesData = computedStats.top5Wadah.map(wadah => ({ name: wadah, type: 'line', smooth: true, symbolSize: 6, data: computedStats.trenBulanan.map(m => m[wadah] || 0) }));
    seriesData.push({ name: 'Lainnya', type: 'line', smooth: true, lineStyle: { type: 'dashed', width: 2, color: chartAxisLabel }, itemStyle: { color: chartAxisLabel }, symbol: 'none', data: computedStats.trenBulanan.map(m => m.Lainnya || 0) });
    return {
      color: isDark ? undefined : ['#0284c7', '#059669', '#d97706', '#ea580c', '#7c3aed', '#64748b'],
      tooltip: { trigger: 'axis', valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      legend: { data: [...computedStats.top5Wadah, 'Lainnya'], textStyle: { color: chartSubText }, top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: MONTHS, axisLabel: { color: chartAxisLabel, fontSize: 11, rotate: 30 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: chartGridLine, type: 'dashed' } }, axisLabel: { color: chartAxisLabel } },
      series: seriesData
    };
  }, [computedStats.trenBulanan, computedStats.top5Wadah, chartAxisLabel, chartSubText, chartGridLine, isDark]);

  const treemapOption = useMemo(() => {
    const data = computedStats.komposisiWadah.map(w => ({ name: w.name, value: w.value }));
    return {
      tooltip: { formatter: (info) => `<b>${info.name}</b><br/>Total Produksi: ${Number(info.value || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} KG` },
      series: [{ type: 'treemap', width: '100%', height: '100%', top: 0, bottom: 0, left: 0, right: 0, roam: false, nodeClick: false, breadcrumb: { show: false }, label: { show: true, formatter: (params) => `${params.name}\n\n${Number(params.value || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} KG`, color: '#fff', fontWeight: 'bold' }, itemStyle: { borderColor: isDark ? '#0f172a' : '#ffffff', gapWidth: 2 }, data: data, colorMappingBy: 'value', visualMap: { show: false, inRange: { color: isDark ? ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'] : ['#134e4a', '#0f766e', '#0d9488', '#0369a1', '#1d4ed8'] } } }]
    };
  }, [computedStats.komposisiWadah, isDark]);

  const heatmapOption = useMemo(() => {
    const yAxisData = [...new Set(computedStats.heatmapData.map(d => d.kabupaten))].sort();
    const xAxisData = MONTHS;
    const dataPairs = [];
    const tooltipRawData = {};
    computedStats.heatmapData.forEach(item => {
      const xIndex = xAxisData.indexOf(item.bulan);
      const yIndex = yAxisData.indexOf(item.kabupaten);
      if (xIndex !== -1 && yIndex !== -1) {
        dataPairs.push([xIndex, yIndex, item.normalized]);
        tooltipRawData[`${xIndex}-${yIndex}`] = item.produksi;
      }
    });
    return {
      tooltip: { position: 'top', formatter: (params) => { const xIndex = params.data[0]; const yIndex = params.data[1]; const rawValue = tooltipRawData[`${xIndex}-${yIndex}`] || 0; return `<b>${yAxisData[yIndex]}</b><br/>${xAxisData[xIndex]}<br/>Produksi: ${Number(rawValue).toLocaleString('id-ID', { maximumFractionDigits: 2 })} KG`; } },
      grid: { left: '3%', right: '4%', top: '3%', bottom: '5%', containLabel: true },
      xAxis: { type: 'category', data: xAxisData, splitArea: { show: true }, axisLabel: { color: chartSubText, rotate: 45 } },
      yAxis: { type: 'category', data: yAxisData, splitArea: { show: true }, axisLabel: { color: chartSubText, fontSize: 10 } },
      visualMap: { min: 0, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', inRange: { color: isDark ? ['#0f172a', '#2563eb', '#06b6d4', '#facc15', '#22c55e'] : ['#f0f9ff', '#bae6fd', '#0284c7', '#0369a1', '#155e75'] }, textStyle: { color: chartSubText }, formatter: (value) => value.toFixed(1) },
      series: [{ name: 'Heatmap', type: 'heatmap', data: dataPairs, label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } } }]
    };
  }, [computedStats.heatmapData, chartSubText, isDark]);

  const columns = useMemo(() => [
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => {
        const row = info.row.original;

        const contextFields = [
          { label: 'Kabupaten/Kota', value: row.kabupaten_kota },
          { label: 'Komoditas', value: row.komoditas },
          { label: 'Kategori', value: row.kategori_komoditas },
          { label: 'Periode', value: `Tahun ${row.tahun} (Triwulan ${row.triwulan}, Bulan ${row.bulan})` }
        ];

        return (
          <StatusBadge
            row={row}
            onEdit={() => handleEdit(row)}
            contextFields={contextFields}
          />
        );
      }
    },
    { header: 'Tahun', accessorKey: 'tahun' },
    { header: 'Bulan', accessorKey: 'bulan' },
    { header: 'Triwulan', accessorKey: 'triwulan' },
    { header: 'Kabupaten/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-medium text-foreground">{info.getValue()}</p> },
    { header: 'Kategori Komoditas', accessorKey: 'kategori_komoditas' },
    { header: 'Komoditas', accessorKey: 'komoditas' },
    { header: 'Jenis Wadah', accessorKey: 'jenis_wadah' },
    { header: 'Produksi (KG)', accessorKey: 'produksi_kg', cell: info => (info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 }) },
    { header: 'Harga (Rp)', accessorKey: 'harga_rp', cell: info => { const val = info.getValue() || 0; return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val); } },
    { header: 'Nilai Total (Rp)', accessorKey: 'nilai_rp', cell: info => { const val = info.getValue() || 0; return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val); } }
  ], []);

  const hasMapData = useMemo(() => computedStats.produksiPerKabupaten && computedStats.produksiPerKabupaten.some(x => (x.produksi || 0) > 0 || (x.nilai || 0) > 0 || (x.value || 0) > 0), [computedStats.produksiPerKabupaten]);
  const hasBarData = useMemo(() => computedStats.produksiPerKabupaten && computedStats.produksiPerKabupaten.some(x => (x.produksi || 0) > 0 || (x.nilai || 0) > 0 || (x[barFilter] || 0) > 0), [computedStats.produksiPerKabupaten, barFilter]);
  const hasLineData = useMemo(() => {
    if (!computedStats.trenBulanan || !Array.isArray(computedStats.trenBulanan)) return false;
    return computedStats.trenBulanan.some(x => {
      return Object.entries(x).some(([key, val]) => key !== 'bulan' && Number(val || 0) > 0);
    });
  }, [computedStats.trenBulanan]);
  const hasTreemapData = useMemo(() => computedStats.komposisiWadah && computedStats.komposisiWadah.some(x => (x.value || 0) > 0 || (x.produksi || 0) > 0), [computedStats.komposisiWadah]);
  const hasHeatmapData = useMemo(() => {
    if (!computedStats.heatmapData || !Array.isArray(computedStats.heatmapData)) return false;
    return computedStats.heatmapData.some(item => (Number(item.produksi) || 0) > 0 || (Number(item.value) || 0) > 0);
  }, [computedStats.heatmapData]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Data Budidaya</h1>
        </div>

        {!isFormOpen && !isTahunanFormOpen && !isSelectTypeModalOpen && (
          <div className="relative">
            <button
              onClick={() => setIsSelectTypeModalOpen(true)}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              Tambah Data Baru
            </button>
          </div>
        )}
      </div>

      {isSelectTypeModalOpen && (
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm animate-in fade-in duration-300">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-2xl font-bold text-foreground">Pilih Jenis Data Budidaya</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <button
              onClick={() => {
                setIsSelectTypeModalOpen(false);
                setEditingData(null);
                setIsFormOpen(true);
              }}
              className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">Data Bulanan</h3>
              </div>
            </button>

            <button
              onClick={() => {
                setIsSelectTypeModalOpen(false);
                setEditingData(null);
                setIsTahunanFormOpen(true);
              }}
              className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Box className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">Data Tahunan</h3>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <button onClick={() => setIsSelectTypeModalOpen(false)} className="text-sm text-muted-foreground hover:text-foreground font-medium">Batalkan</button>
          </div>
        </div>
      )}

      {isTahunanFormOpen && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <BudidayaTahunanForm
            initialData={editingData}
            onClose={() => {
              setIsTahunanFormOpen(false);
              setEditingData(null);
            }}
            onSuccess={() => {
              setIsTahunanFormOpen(false);
              setEditingData(null);
              fetchData();
            }}
          />
        </div>
      )}

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
        <>
          {/* Tabs Filter & Statistik */}
          {!isFormOpen && !isTahunanFormOpen && !isSelectTypeModalOpen && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <button
                  onClick={() => setActiveTab('data')}
                  className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'data' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  Tabel Data
                </button>
                <button
                  onClick={() => setActiveTab('tahunan')}
                  className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'tahunan' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  Data Tahunan
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-slate-500" />
                    <h3 className="text-lg font-semibold text-foreground">Filter Multi-Dimensi</h3>
                  </div>
                  {activeTab === 'visual' && lastUpdated ? (
                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400 sm:self-auto">
                      <Clock className="h-4 w-4 animate-pulse" />
                      <span>Terakhir Diperbarui: {lastUpdated}</span>
                    </div>
                  ) : null}
                </div>
                {activeTab === 'tahunan' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                      <SearchableMultiSelect
                        options={tahunOptions}
                        value={filterTahun}
                        onChange={setFilterTahun}
                        placeholder="Semua Tahun"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kab/Kota</label>
                      <SearchableMultiSelect
                        options={kabupatenOptions}
                        value={filterKabupaten}
                        onChange={setFilterKabupaten}
                        placeholder="Semua Kab/Kota"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Modul</label>
                      <SearchableMultiSelect
                        options={modulOptions}
                        value={filterModul}
                        onChange={setFilterModul}
                        placeholder="Semua Modul"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                      <SearchableMultiSelect
                        options={[
                          { label: 'Verified', value: 'VERIFIED' },
                          { label: 'Approved', value: 'APPROVED' },
                          { label: 'Reject', value: 'REJECTED' },
                          { label: 'Pending', value: 'PENDING' }
                        ]}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        placeholder="Semua Status"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                      <SearchableMultiSelect
                        options={tahunOptions}
                        value={filterTahun}
                        onChange={setFilterTahun}
                        placeholder="Semua Tahun"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bulan</label>
                      <SearchableMultiSelect
                        options={bulanOptions}
                        value={filterBulan}
                        onChange={setFilterBulan}
                        placeholder="Semua Bulan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kab/Kota</label>
                      <SearchableMultiSelect
                        options={kabupatenOptions}
                        value={filterKabupaten}
                        onChange={setFilterKabupaten}
                        placeholder="Semua Kab/Kota"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Komoditas</label>
                      <SearchableMultiSelect
                        options={komoditasOptions}
                        value={filterKomoditas}
                        onChange={setFilterKomoditas}
                        placeholder="Semua Komoditas"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Jenis Wadah</label>
                      <SearchableMultiSelect
                        options={wadahOptions}
                        value={filterWadah}
                        onChange={setFilterWadah}
                        placeholder="Semua Wadah"
                      />
                    </div>
                  </div>
                )}
                {(filterKomoditas.length > 0 || filterKabupaten.length > 0 || filterWadah.length > 0 || filterStatus.length > 0 || filterBulan.length > 0 || filterTahun.length > 0 || filterModul.length > 0) && (
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterKomoditas([]);
                        setFilterKabupaten([]);
                        setFilterWadah([]);
                        setFilterStatus([]);
                        setFilterBulan([]);
                        setFilterTahun([]);
                        setFilterModul([]);
                      }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Reset Semua Filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          {!isFormOpen && !isTahunanFormOpen && !isSelectTypeModalOpen && (
            activeTab === 'tahunan' ? (
              <div className="bg-card border border-border rounded-2xl shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <DataTable
                  data={filteredDataTahunan}
                  columns={[
                    {
                      header: 'Status',
                      accessorKey: 'status',
                      cell: info => {
                        const row = info.row.original;
                        const contextFields = [
                          { label: 'Kabupaten/Kota', value: row.kabupaten_kota },
                          { label: 'Modul', value: row.modul_id },
                          { label: 'Tahun', value: row.tahun }
                        ];
                        return (
                          <StatusBadge
                            row={row}
                            onEdit={() => handleEditTahunan(row)}
                            contextFields={contextFields}
                          />
                        );
                      }
                    },
                    { header: 'Tahun', accessorKey: 'tahun' },
                    { header: 'Kabupaten/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-medium text-foreground">{info.getValue()}</p> },
                    { header: 'Modul', accessorKey: 'modul_id' },
                    { header: 'Terakhir Diubah', accessorKey: 'updated_at', cell: info => new Date(info.getValue()).toLocaleDateString('id-ID') }
                  ]}
                  onEdit={handleEditTahunan}
                  onDelete={handleDeleteTahunan}
                  onApprove={handleApproveTahunan}
                  onReject={handleRejectTahunan}
                  onBatchApprove={handleBatchApproveTahunan}
                  onBatchReject={handleBatchRejectTahunan}
                  onBatchDelete={handleBatchDeleteTahunan}
                  exportName={`Data_Tahunan_Budidaya_${new Date().toISOString().split('T')[0]}`}
                  customExportButton={
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Rekap Statistik
                    </button>
                  }
                  searchable={true}
                  searchField="kabupaten_kota"
                  renderSubComponent={({ row }) => {
                    const data = row.original.data || {};
                    const formatVal = (val) => {
                      if (val === null || val === undefined || val === '') return '-';
                      if (typeof val === 'number') return val.toLocaleString('id-ID', { maximumFractionDigits: 2 });
                      if (!isNaN(parseFloat(val)) && isFinite(val) && !val.toString().includes('Dummy')) return parseFloat(val).toLocaleString('id-ID', { maximumFractionDigits: 2 });
                      return val;
                    };

                    if (data.items && Array.isArray(data.items)) {
                      return (
                        <div className="p-6 bg-muted/30 border-t border-border">
                          <h4 className="text-sm font-semibold text-primary mb-4">Detail Data Modul: {row.original.modul_id} (Unit Berulang)</h4>
                          <div className="space-y-6">
                            {data.items.map((item, idx) => (
                              <div key={idx} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                                <h5 className="font-medium text-foreground mb-3 text-sm border-b border-border pb-2">Unit {idx + 1}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                  {Object.keys(item).filter(k => k !== 'id').map(sectionTitle => (
                                    <div key={sectionTitle} className="space-y-2">
                                      <h6 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{sectionTitle.replace(/^(MODUL\s*\d+\s*:\s*|Seksi\s*\d+\s*:\s*)/i, '').replace(/\s*[-—]\s*dalam\s+(.+)$/i, ' ($1)')}</h6>
                                      <div className="space-y-3">
                                        {Object.entries(item[sectionTitle] || {}).map(([key, val]) => (
                                          <div key={key}>
                                            <span className="text-[11px] text-muted-foreground block mb-0.5">{key}</span>
                                            <span className="text-sm font-medium text-foreground">{formatVal(val)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="p-6 bg-muted/30 border-t border-border">
                        <h4 className="text-sm font-semibold text-primary mb-4">Detail Data Modul: {row.original.modul_id}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {Object.keys(data).map(sectionTitle => (
                            <div key={sectionTitle} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                              <h6 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 border-b border-border pb-2">{sectionTitle.replace(/^(MODUL\s*\d+\s*:\s*|Seksi\s*\d+\s*:\s*)/i, '').replace(/\s*[-—]\s*dalam\s+(.+)$/i, ' ($1)')}</h6>
                              <div className="space-y-3">
                                {Object.entries(data[sectionTitle] || {}).map(([key, val]) => (
                                  <div key={key}>
                                    <span className="text-[11px] text-muted-foreground block leading-tight mb-0.5">{key}</span>
                                    <span className="text-sm font-medium text-foreground">{formatVal(val)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            ) : activeTab === 'data' ? (
              <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onBatchApprove={handleBatchApprove}
                  onBatchReject={handleBatchReject}
                  onBatchDelete={handleBatchDelete}
                  exportName={`Budidaya_Samudera_${new Date().toISOString().split('T')[0]}`}
                  customExportButton={
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Rekap Statistik
                    </button>
                  }
                  formatExportData={(exportData) => exportData.map(row => ({
                    'Status': row.status || '-',
                    'Tahun': row.tahun || '-',
                    'Bulan': row.bulan || '-',
                    'Triwulan': row.triwulan || '-',
                    'Kabupaten/Kota': row.kabupaten_kota || '-',
                    'Kategori Komoditas': row.kategori_komoditas || '-',
                    'Komoditas': row.komoditas || '-',
                    'Jenis Wadah': row.jenis_wadah || '-',
                    'Produksi (KG)': row.produksi_kg || '-',
                    'Harga (Rp)': row.harga_rp || '-',
                    'Nilai Total (Rp)': row.nilai_rp || '-'
                  }))}
                />
              </div>
            ) : (
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500">
                      <Box className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                      <p className="text-2xl font-bold text-foreground">
                        {computedStats.kpi.total_volume.toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">KG</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-orange-500/10 rounded-xl text-orange-500">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Top Komoditas</p>
                      <p className="text-xl font-bold text-foreground leading-tight">{computedStats.kpi.top_komoditas}</p>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500">
                      <LineChart className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Nilai Budidaya</p>
                      <p className="text-2xl font-bold text-foreground">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(computedStats.kpi.total_nilai)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">Peta Sebaran Produksi</h2>
                    </div>
                    <div className="h-[450px]">
                      {hasMapData ? (
                        <ReactECharts option={mapOption} style={{ height: '100%', width: '100%' }} />
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
                          Tidak ada data
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      Ketuk salah satu kabupaten/kota pada peta untuk melihat rinciannya.
                    </p>
                  </div>
                  <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-semibold">Top 10 Kab/Kota</h2>
                      </div>
                      <select
                        value={barFilter}
                        onChange={(e) => setBarFilter(e.target.value)}
                        className="bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700/50 dark:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-600 text-sm font-medium rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all cursor-pointer shadow-sm"
                      >
                        <option value="produksi" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Produksi (KG)</option>
                        <option value="nilai" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Nilai Total (Rp)</option>
                      </select>
                    </div>
                    <div className="h-[450px]">
                      {hasBarData ? (
                        <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
                          Tidak ada data
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingUp className="w-5 h-5 text-teal-500" />
                      <h2 className="text-lg font-semibold">Tren Produksi Bulanan</h2>
                    </div>
                    <div className="h-[350px]">
                      {hasLineData ? (
                        <ReactECharts option={lineOption} style={{ height: '100%', width: '100%' }} />
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
                          Tidak ada data
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <Fish className="w-5 h-5 text-cyan-500" />
                      <h2 className="text-lg font-semibold">Komposisi Jenis Wadah</h2>
                    </div>
                    <div className="h-[350px]">
                      {hasTreemapData ? (
                        <ReactECharts option={treemapOption} style={{ height: '100%', width: '100%' }} />
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
                          Tidak ada data
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <MapPin className="w-5 h-5 text-rose-500" />
                    <h2 className="text-lg font-semibold">Pola Musiman per Wilayah </h2>
                  </div>
                  <div className="h-[600px]">
                    {hasHeatmapData ? (
                      <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
                        Tidak ada data
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
          {/* Modal Ekspor */}
          {isExportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 relative">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold mb-4">Rekap Statistik Budidaya</h2>
                <div className="space-y-4">
                  {activeTab !== 'tahunan' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Tipe Laporan</label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className={`cursor-pointer px-4 py-3 border rounded-xl flex items-center gap-2 ${exportType === 'wadah' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
                          <input type="radio" name="exportType" value="wadah" checked={exportType === 'wadah'} onChange={() => setExportType('wadah')} className="hidden" />
                          Berdasarkan Wadah
                        </label>
                        <label className={`cursor-pointer px-4 py-3 border rounded-xl flex items-center gap-2 ${exportType === 'komoditas' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
                          <input type="radio" name="exportType" value="komoditas" checked={exportType === 'komoditas'} onChange={() => setExportType('komoditas')} className="hidden" />
                          Berdasarkan Komoditas
                        </label>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">Tahun Laporan</label>
                    <select
                      value={exportYear}
                      onChange={(e) => setExportYear(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                    >
                      <option value="">Pilih Tahun...</option>
                      {tahunOptions.length > 0 ? tahunOptions.map(y => (
                        <option key={y} value={y}>{y}</option>
                      )) : (
                        <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                      )}
                    </select>
                  </div>
                  <button
                    onClick={executeExport}
                    disabled={!exportYear}
                    className="w-full mt-4 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    Unduh Excel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
