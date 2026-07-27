import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PerikananTangkapForm } from '@/components/admin/PerikananTangkapForm';
import { DataPublikTangkap } from '@/components/admin/DataPublikTangkap';
import SearchableMultiSelect from '@/components/shared/SearchableMultiSelect';
import SearchableSelect from '@/components/shared/SearchableSelect';
import {  
  Plus, Loader2, Database, TrendingUp, Ship, Anchor, 
  Fish, MapPin, LineChart, FileText, Filter, BarChart3, AlertCircle,
  Clock, Download, Calendar, Map, Layers, ChevronDown, Droplet, Search, Trash2, Edit, Save, X, Eye, CheckCircle, XCircle, Scale, FileSpreadsheet
} from 'lucide-react';
import { formatDate } from '@/utils/dateHelper';
import { formatRupiah } from '@/utils/formatRupiah';
import * as XLSX from 'xlsx-js-style';
import { PERBEKALAN_OPTIONS, KOMODITAS_OPTIONS, PELABUHAN_OPTIONS, KOMODITAS_PUD_OPTIONS, KOMODITAS_LAUT_OPTIONS, KAB_KOTA_OPTIONS, PELABUHAN_TO_KABKOTA, PERAIRAN_OPTIONS } from '@/utils/constants';
import ReactECharts from 'echarts-for-react';
import { useAuthStore } from '@/store/authStore';

const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());
const BULAN_OPTIONS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const formatLogistikText = (val) => {
  if (!val) return '-';
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) {
      return parsed.map(p => `${p.nama} (${p.jumlah} ${p.satuan})`).join(', ');
    }
    return val;
  } catch (e) {
    return val;
  }
};

export default function AdminPerikananTangkap() {
  const user = useAuthStore(state => state.user);
  const [data, setData] = useState([]);
  const [publikData, setPublikData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('data'); // 'data' or 'visual'
  const [filterTahun, setFilterTahun] = useState([]);
  const [filterBulan, setFilterBulan] = useState([]);
  const [filterCabang, setFilterCabang] = useState([]); // PELABUHAN, PUD, KAB_KOTA
  const [filterKomoditas, setFilterKomoditas] = useState([]);
  const [filterWilayah, setFilterWilayah] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportModalPerairan, setExportModalPerairan] = useState('');
  const [exportModalJenis, setExportModalJenis] = useState('');
  const [exportModalTahun, setExportModalTahun] = useState('');
  const [exportModalBulan, setExportModalBulan] = useState('');
  const [exportModalWilayah, setExportModalWilayah] = useState('');
  const [exportModalJenisPerairan, setExportModalJenisPerairan] = useState('');


  // Local Chart Filter for Harga
  const [chartHargaKomoditas, setChartHargaKomoditas] = useState(KOMODITAS_OPTIONS[0]);
  const [chartHargaWilayah, setChartHargaWilayah] = useState([]);
  const [filterKabKotaChart, setFilterKabKotaChart] = useState([]);

  const [stats, setStats] = useState({
    kpi: { total_volume: 0, total_nilai: 0, total_trip: 0, avg_volume_per_trip: 0 },
    komoditas: [],
    pelabuhan: [],
    tren: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dataRes, publikRes] = await Promise.all([
        api.get(`/perikanan-tangkap/admin`),
        api.get(`/bulanan-tangkap/admin`)
      ]);

      setData(dataRes.data.data || []);
      setPublikData(publikRes.data.data || []);
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
    

    let promptMsg = '';
    let targetStatus = '';
    let namaValidasi = '';
    let expectedKeyword = '';

    if (row.status === 'PENDING' || row.status === 'REJECTED') {
      promptMsg = 'Data saat ini belum divalidasi Bidang.\nKetik "1" untuk melakukan Validasi Bidang:';
      const jenis = window.prompt(promptMsg);
      if (jenis !== '1') {
         if (jenis === '2') alert('Validasi Program ditolak! Data harus divalidasi Bidang terlebih dahulu.');
         else if (jenis) alert('Pilihan tidak valid.');
         return;
      }
      targetStatus = 'APPROVED';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (row.status === 'APPROVED') {
      promptMsg = 'Data sudah divalidasi Bidang.\nKetik "2" untuk melakukan Validasi Program:';
      const jenis = window.prompt(promptMsg);
      if (jenis !== '2') {
         if (jenis) alert('Pilihan tidak valid.');
         return;
      }
      targetStatus = 'VERIFIED';
      namaValidasi = 'PROGRAM';
      expectedKeyword = 'ACC';
    }

    const confirmText = window.prompt(`Ketik "${expectedKeyword}" (huruf kapital) untuk menyelesaikan Validasi ${namaValidasi}:`);
    if (confirmText !== expectedKeyword) {
      alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
      return;
    }

    try {
      await api.put(`/perikanan-tangkap/${row.id}/status`, { status: targetStatus });
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
      await api.put(`/perikanan-tangkap/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
      fetchData();
    } catch (error) {
      console.error('Error rejecting data:', error);
      alert('Gagal menolak data');
    }
  };

  const handleBatchApprove = async (ids) => {
    const selectedRows = data.filter(row => ids.includes(row.id));
    
    const promptMsg = 'Pilih jenis validasi massal (Ketik angka):\n1. Validasi Bidang\n2. Validasi Program';
    const jenis = window.prompt(promptMsg);
    if (!jenis) return;

    let targetStatus = '';
    let namaValidasi = '';
    let expectedKeyword = '';

    if (jenis === '1') {
      const invalidRows = selectedRows.filter(row => row.status === 'VERIFIED' || row.status === 'APPROVED');
      if (invalidRows.length > 0) {
        alert('Beberapa data yang dipilih sudah divalidasi Bidang/Program! Silakan pilih data yang berstatus PENDING saja.');
        return;
      }
      targetStatus = 'APPROVED';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (jenis === '2') {
      const invalidRows = selectedRows.filter(row => row.status !== 'APPROVED');
      if (invalidRows.length > 0) {
        alert('Validasi Program ditolak! Pastikan SEMUA data yang dipilih sudah divalidasi oleh Bidang (Status: APPROVED) terlebih dahulu.');
        return;
      }
      targetStatus = 'VERIFIED';
      namaValidasi = 'PROGRAM';
      expectedKeyword = 'ACC';
    } else {
      alert('Pilihan tidak valid.');
      return;
    }

    const confirmText = window.prompt(`Anda akan menyetujui ${ids.length} data.\nKetik "${expectedKeyword}" (huruf kapital) untuk menyelesaikan Validasi ${namaValidasi}:`);
    if (confirmText !== expectedKeyword) {
      alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
      return;
    }

    try {
      await api.post(`/perikanan-tangkap/batch-status`, { ids, status: targetStatus });
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
      await api.post(`/perikanan-tangkap/batch-status`, { ids, status: 'REJECTED', alasan_penolakan: alasan });
      fetchData();
    } catch (error) {
      console.error('Error batch reject:', error);
      alert('Gagal menolak data secara massal');
    }
  };

  const handleBatchDelete = async (ids) => {
    if (window.confirm(`Yakin ingin menghapus ${ids.length} data ini?`)) {
      try {
        await api.post(`/perikanan-tangkap/batch-delete`, { ids });
        fetchData();
      } catch (error) {
        console.error('Error batch delete:', error);
        alert('Gagal menghapus data secara massal');
      }
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const itemTahun = item.tanggal ? item.tanggal.substring(0, 4) : '';
      const itemBulan = item.tanggal ? String(parseInt(item.tanggal.substring(5, 7))) : '';
      
      const matchTahun = filterTahun.length === 0 || filterTahun.includes(itemTahun);
      const matchBulan = filterBulan.length === 0 || filterBulan.includes(itemBulan);
      const matchCabang = filterCabang.length === 0 || filterCabang.includes(item.sumber_data || 'PELABUHAN');
      const matchWilayah = filterWilayah.length === 0 || filterWilayah.includes(item.pelabuhan || item.kabupaten_kota || '');
      const matchKomoditas = filterKomoditas.length === 0 || (item.tangkapan && item.tangkapan.some(t => filterKomoditas.includes(t.komoditas)));
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(item.status);
      
      return matchTahun && matchBulan && matchCabang && matchWilayah && matchKomoditas && matchStatus;
    });
    }, [data, filterTahun, filterBulan, filterCabang, filterWilayah, filterKomoditas, filterStatus]);

  const verifiedFilteredData = useMemo(() => {
    return filteredData.filter(item => item.status === 'VERIFIED');
  }, [filteredData]);

    const lastUpdated = useMemo(() => {
      if (!filteredData || filteredData.length === 0) return null;
      let maxDate = new Date(0);
      filteredData.forEach(row => {
        if (row.updated_at) {
          const dt = new Date(row.updated_at);
          if (dt > maxDate) maxDate = dt;
        }
      });
      if (maxDate.getTime() === 0) return null;
      
      return maxDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + maxDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }, [filteredData]);
    
  const computedStats = useMemo(() => {
    let total_volume = 0;
    let total_nilai = 0;
    const komoditasMap = {};
    const pelabuhanMap = {};
    const trenMap = {};

    verifiedFilteredData.forEach(row => {
      const pelabuhan = row.pelabuhan || row.kabupaten_kota || 'Tidak Diketahui';
      const date = row.tanggal ? row.tanggal.substring(0, 7) : 'Unknown';

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

          if (!trenMap[date]) trenMap[date] = { volume: 0, nilai: 0 };
          trenMap[date].volume += vol;
          trenMap[date].nilai += nil;
        });
      }
    });

    // Injeksi Delta dari Data Validasi Publik (Jika Admin melakukan penyesuaian)
    publikData.forEach(adj => {
      if (!adj.is_adjusted) return;
      
      const adjTahun = adj.bulan.substring(0, 4);
      const adjBulan = String(parseInt(adj.bulan.substring(5, 7)));
      
      const matchTahun = filterTahun.length === 0 || filterTahun.includes(adjTahun);
      const matchBulan = filterBulan.length === 0 || filterBulan.includes(adjBulan);
      const matchCabang = filterCabang.length === 0 || filterCabang.includes(adj.sumber_data || 'PELABUHAN');
      const matchWilayah = filterWilayah.length === 0 || filterWilayah.includes(adj.pelabuhan || '');
      const matchKomoditas = filterKomoditas.length === 0 || filterKomoditas.includes(adj.komoditas);

      if (matchTahun && matchBulan && matchCabang && matchWilayah && matchKomoditas) {
        const dV = Number(adj.volume) - Number(adj.original_volume || 0);
        const dN = Number(adj.nilai) - Number(adj.original_nilai || 0);
        
        total_volume += dV;
        total_nilai += dN;
        
        const k = adj.komoditas;
        const p = adj.pelabuhan || 'Lainnya';
        const tgl = adj.bulan;
        
        if (k) {
          if (!komoditasMap[k]) komoditasMap[k] = 0;
          komoditasMap[k] += dV;
        }
        
        if (!pelabuhanMap[p]) pelabuhanMap[p] = 0;
        pelabuhanMap[p] += dV;
        
        if (!trenMap[tgl]) trenMap[tgl] = { volume: 0, nilai: 0 };
        trenMap[tgl].volume += dV;
        trenMap[tgl].nilai += dN;
      }
    });

    const total_trip = verifiedFilteredData.length;
    const avg_volume_per_trip = total_trip > 0 ? total_volume / total_trip : 0;

    const komoditas = Object.entries(komoditasMap)
      .map(([k, v]) => ({ komoditas: k, _sum: { volume: v } }))
      .sort((a, b) => b._sum.volume - a._sum.volume)
      .slice(0, 6); // Limit to top 6

    const pelabuhanArr = Object.entries(pelabuhanMap)
      .map(([p, v]) => ({ pelabuhan: p, _sum: { volume: v } }))
      .sort((a, b) => b._sum.volume - a._sum.volume)
      .slice(0, 6); // Limit to top 6

    const tren = Object.entries(trenMap)
      .map(([d, v]) => ({ date: d, volume: v.volume, nilai: v.nilai }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Perhitungan rata-rata harga untuk 1 Komoditas spesifik di Pelabuhan yang dipilih
    let targetPelabuhan = chartHargaWilayah;
    
    // Jika user belum memilih wilayah spesifik, ambil Top 10 pelabuhan dengan volume tertinggi sebagai default
    if (targetPelabuhan.length === 0) {
      targetPelabuhan = Object.entries(pelabuhanMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10).map(p => p[0]);
    }
    
    const hargaMap = {};
    targetPelabuhan.forEach(p => {
       hargaMap[p] = { vol: 0, nilai: 0 };
    });
    
    verifiedFilteredData.forEach(row => {
       const pel = row.pelabuhan || row.kabupaten_kota || 'Tidak Diketahui';
       if (hargaMap[pel]) {
          if (row.tangkapan) {
             row.tangkapan.forEach(t => {
                if (t.komoditas === chartHargaKomoditas) {
                   hargaMap[pel].vol += Number(t.volume) || 0;
                   hargaMap[pel].nilai += Number(t.nilai) || 0;
                }
             });
          }
       }
    });

    const hargaSeries = [{
       name: chartHargaKomoditas,
       type: 'bar',
       data: targetPelabuhan.map(pel => {
          const stat = hargaMap[pel];
          return stat.vol > 0 ? Math.round(stat.nilai / stat.vol) : 0;
       }),
       itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
       label: { show: true, position: 'top', color: '#ffffff', formatter: (p) => 'Rp ' + (p.value/1000) + 'k' }
    }];

    return {
      kpi: { total_volume, total_nilai, total_trip, avg_volume_per_trip },
      komoditas,
      pelabuhan: pelabuhanArr,
      tren,
      hargaCategories: targetPelabuhan,
      hargaSeries
    };
  }, [verifiedFilteredData, chartHargaKomoditas, chartHargaWilayah]);

  const lautVsPudData = useMemo(() => {
    let totalPelabuhan = 0;
    let totalPud = 0;
    let totalNonPelabuhan = 0;
    
    verifiedFilteredData.forEach(row => {
      let kabKota = row.kabupaten_kota || row.pelabuhan || '';
      if (row.sumber_data === 'PELABUHAN') {
        kabKota = PELABUHAN_TO_KABKOTA[row.pelabuhan] || 'Lainnya';
      }
      
      if (filterKabKotaChart.length > 0 && !filterKabKotaChart.includes(kabKota)) return;
      
      let vol = 0;
      if (row.tangkapan && Array.isArray(row.tangkapan)) {
        vol = row.tangkapan.reduce((sum, t) => sum + (Number(t.volume) || 0), 0);
      }
      
      if (row.sumber_data === 'PUD') {
        totalPud += vol;
      } else if (row.sumber_data === 'KAB_KOTA') {
        totalNonPelabuhan += vol;
      } else {
        totalPelabuhan += vol;
      }
    });
    
    return {
      pelabuhan: totalPelabuhan,
      pud: totalPud,
      nonPelabuhan: totalNonPelabuhan,
      total: totalPelabuhan + totalPud + totalNonPelabuhan
    };
  }, [verifiedFilteredData, filterKabKotaChart]);

  const topKomoditasUnggulan = useMemo(() => {
    const komoditasMap = {};
    verifiedFilteredData.forEach(row => {
      let kabKota = row.pelabuhan || row.kabupaten_kota || 'Lainnya';
      if (row.sumber_data === 'PELABUHAN') {
        kabKota = PELABUHAN_TO_KABKOTA[row.pelabuhan] || 'Lainnya';
      }
      
      if (row.tangkapan && Array.isArray(row.tangkapan)) {
        row.tangkapan.forEach(t => {
          const kom = t.komoditas;
          const vol = Number(t.volume) || 0;
          if (!komoditasMap[kom]) komoditasMap[kom] = { total: 0, wilayahMap: {} };
          komoditasMap[kom].total += vol;
          
          if (!komoditasMap[kom].wilayahMap[kabKota]) komoditasMap[kom].wilayahMap[kabKota] = 0;
          komoditasMap[kom].wilayahMap[kabKota] += vol;
        });
      }
    });

    const sortedKomoditas = Object.entries(komoditasMap)
      .map(([k, v]) => ({ komoditas: k, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
      
    return sortedKomoditas.map(item => {
      const topWilayah = Object.entries(item.wilayahMap)
        .map(([w, vol]) => ({ wilayah: w, volume: vol }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);
        
      return {
        komoditas: item.komoditas,
        total: item.total,
        topWilayah
      };
    });
  }, [verifiedFilteredData]);

  const lautVsPudChartOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => { return params.map(p => `${p.marker} <b>${p.name}</b>: ${p.value.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Ton`).join('<br/>'); }
      },
      grid: { left: '5%', right: '5%', bottom: '10%', top: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['Pelabuhan', 'Non Pelabuhan', 'PUD', 'Total'],
        axisLabel: { color: '#f8fafc', fontWeight: 'bold', fontSize: 12, interval: 0 },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: {
        type: 'value',
        name: 'Volume (Ton)',
        nameTextStyle: { color: '#94a3b8', padding: [0, 0, 0, 20] },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { type: 'dashed', color: '#1e293b' } }
      },
      series: [
        {
          name: 'Volume Produksi',
          type: 'bar',
          barWidth: '50%',
          data: [
            {
              value: lautVsPudData.pelabuhan,
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1e3a8a' }]
                },
                borderRadius: [8, 8, 0, 0]
              }
            },
            {
              value: lautVsPudData.nonPelabuhan,
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#b45309' }]
                },
                borderRadius: [8, 8, 0, 0]
              }
            },
            {
              value: lautVsPudData.pud,
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#064e3b' }]
                },
                borderRadius: [8, 8, 0, 0]
              }
            },
            {
              value: lautVsPudData.total,
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [{ offset: 0, color: '#8b5cf6' }, { offset: 1, color: '#4c1d95' }]
                },
                borderRadius: [8, 8, 0, 0]
              }
            }
          ]
        }
      ]
    };
  }, [lautVsPudData]);



  
  const handleExportLMPelabuhan = (exportData, tahun, bulan, wilayah) => {
    if (!wilayah) {
       alert("Pilih Pelabuhan terlebih dahulu untuk ekspor Laporan Monitoring.");
       return;
    }
    const pelabuhanName = wilayah.toUpperCase();
    let kotaName = '-';
    // PELABUHAN_TO_KABKOTA might not map the exact string depending on spacing, so let's do a safe lookup
    Object.keys(PELABUHAN_TO_KABKOTA).forEach(k => {
        if (k.toUpperCase() === pelabuhanName) {
            kotaName = PELABUHAN_TO_KABKOTA[k].toUpperCase();
        }
    });
    
    let totalVol = 0;
    let totalNilai = 0;
    const logistikSummaryMap = {};
    const apiToKomoditasMap = {};
    const bentukIkanMap = {};

    exportData.forEach(row => {
      // Logistik
      if (row.logistik) {
        try {
          const parsed = JSON.parse(row.logistik);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              const val = parseFloat(item.jumlah) || 0;
              logistikSummaryMap[item.nama] = (logistikSummaryMap[item.nama] || 0) + val;
            });
          }
        } catch(e) {}
      }

      // Komoditas
      const apiName = (row.alat_tangkap || 'TIDAK DIKETAHUI').toUpperCase();
      if (!apiToKomoditasMap[apiName]) {
        apiToKomoditasMap[apiName] = {};
      }
      
      if (row.tangkapan && Array.isArray(row.tangkapan)) {
        row.tangkapan.forEach(t => {
          const kName = t.komoditas.toUpperCase();
          const v = parseFloat(t.volume) || 0;
          const n = parseFloat(t.nilai) || 0;
          
          if (!apiToKomoditasMap[apiName][kName]) {
             apiToKomoditasMap[apiName][kName] = { vol: 0, nilai: 0 };
          }
          apiToKomoditasMap[apiName][kName].vol += v;
          apiToKomoditasMap[apiName][kName].nilai += n;
          
          totalVol += v;
          totalNilai += n;

          const bentuk = t.bentuk_ikan || 'Segar';
          if (bentuk === 'Segar' || bentuk === 'Beku') {
             const bKey = kName + '||' + bentuk;
             if (!bentukIkanMap[bKey]) bentukIkanMap[bKey] = 0;
             bentukIkanMap[bKey] += v;
          }
        });
      }
    });

    const rows = [];
    
    // HEADER
    rows.push(['LAPORAN MONITORING PELABUHAN PERIKANAN (PP)', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '']);
    rows.push(['LAPORAN BULANAN (12 X 1 TAHUN)', '', '', 'KODE LAPORAN', ': ', '']);
    rows.push(['', '', '', 'PROVINSI', ': JAWA TIMUR', '']);
    rows.push(['LAPORAN MONITORING', '', '', 'KOTA', `: ${kotaName}`, '']);
    rows.push(['PELABUHAN PERIKANAN (PP)', '', '', 'PPP', `: ${pelabuhanName}`, '']);
    rows.push(['', '', '', 'TAHUN', `: ${tahun || 'Semua'}`, '']);
    
    let namaBulan = 'Semua';
    if (bulan) {
       const blnInt = parseInt(bulan);
       if (blnInt >= 1 && blnInt <= 12) {
          namaBulan = BULAN_OPTIONS[blnInt - 1].toUpperCase();
       }
    }
    rows.push(['', '', '', 'BULAN', `: ${namaBulan}`, '']);
    rows.push(['', '', '', '', '', '']);
    
    // TABEL 1 
    rows.push(['No', 'Uraian', 'Jumlah', 'Satuan', 'Keterangan', '']);
    rows.push(['1', 'Nelayan', '', '', '', '']);
    rows.push(['', ' - Nelayan Utama', '', 'Orang', '', '']);
    rows.push(['', ' - Nelayan Sambilan', '', 'Orang', '', '']);
    rows.push(['2', 'Armada Perikanan', '', '', '', '']);
    rows.push(['', 'a. Kapal Motor', '', 'Unit', '', '']);
    rows.push(['', '* < 5 GT', '', 'Unit', '', '']);
    rows.push(['', '* 6 - 10 GT', '', 'Unit', '', '']);
    rows.push(['', '* 11 - 20 GT', '', 'Unit', '', '']);
    rows.push(['', '* 21 - 30 GT', '', 'Unit', '', '']);
    rows.push(['', '* 31 - 50 GT', '', 'Unit', '', '']);
    rows.push(['', '* 51 - 100 GT', '', 'Unit', '', '']);
    rows.push(['', '*101 - 200 GT', '', 'Unit', '', '']);
    rows.push(['', '*201 - 300 GT', '', 'Unit', '', '']);
    rows.push(['', '*301 - 500 GT', '', 'Unit', '', '']);
    rows.push(['', '* > 500 GT', '', 'Unit', '', '']);
    rows.push(['', 'b.  Motor Tempel', '', 'Unit', '', '']);
    rows.push(['', '* < 5 GT', '', 'Unit', '', '']);
    rows.push(['', '* 6 - 10 GT', '', 'Unit', '', '']);
    rows.push(['', '* 11 - 20 GT', '', 'Unit', '', '']);
    rows.push(['', '* 21 - 30 GT', '', 'Unit', '', '']);
    rows.push(['', '* > 30 GT', '', 'Unit', '', '']);
    rows.push(['', 'c. Perahu Tanpa Motor', '', 'Unit', '', '']);
    rows.push(['', '   -  Perahu Papan Kecil', '', 'Unit', '', '']);
    rows.push(['', '   -  Perahu Papan Sedang', '', 'Unit', '', '']);
    rows.push(['', '   -  Perahu Papan Besar', '', 'Unit', '', '']);
    rows.push(['', 'd. Jukung', '', 'Unit', '', '']);
    
    // TABEL (Lanjutan 1)
    rows.push(['3', 'Alat Penangkap Ikan (unit)', '', '', '', '']);
    rows.push(['', '* Jaring lingkar bertali kerut (Purse Seine)', '', 'Unit', '', '']);
    rows.push(['', '* Pancing Ulur Tuna', '', 'Unit', '', '']);
    rows.push(['', '* Tonda', '', 'Unit', '', '']);
    rows.push(['', '* Rawai Dasar', '', 'Unit', '', '']);
    rows.push(['', '* Payang', '', 'Unit', '', '']);
    rows.push(['', '* Jaring Insang Hanyut/J. insang oseanik', '', 'Unit', '', '']);
    rows.push(['', '* Lain-2', '', 'Unit', '', '']);
    
    rows.push(['4', 'Kapal Pengangkut', '', 'Unit', '', '']);
    rows.push(['5', 'Bakul / Pedagang (orang)', '', 'Orang', '', '']);
    rows.push(['6', 'Pengolah (unit)', '', 'Unit', '', '']);
    rows.push(['', '* (harap disesuaikan dengan alat tangkap masing masing di pelabuhan)', '', '', '', '']);
    rows.push(['', '', '', '', '', '']);
    
    // TABEL 2 (Data Kapal)
    rows.push(['2.    Data Kapal yang bersandar', '', '', '', '', '']);
    rows.push(['No', 'Kategori Kapal', 'Jumlah (Unit)', 'Frekuensi (Kali)', 'Rata-Rata Periode Operasi (Hari)', 'Keterangan']);
    rows.push(['1.', 'Kapal Motor', '', '', '', '']);
    rows.push(['', '* < 5 GT', '', '', '', '']);
    rows.push(['', '* 6 - 10 GT', '', '', '', '']);
    rows.push(['', '* 11 - 20 GT', '', '', '', '']);
    rows.push(['', '* 21 - 30 GT', '', '', '', '']);
    rows.push(['', '* 31 - 50 GT', '', '', '', '']);
    rows.push(['', '* 51 - 100 GT', '', '', '', '']);
    rows.push(['', '*101 - 200 GT', '', '', '', '']);
    rows.push(['', '*201 - 300 GT', '', '', '', '']);
    rows.push(['', '*301 - 500 GT', '', '', '', '']);
    rows.push(['', '* > 500 GT', '', '', '', '']);
    rows.push(['2.', 'Motor Tempel', '', '', '', '']);
    rows.push(['', '* < 5 GT', '', '', '', '']);
    rows.push(['', '* 6 - 10 GT', '', '', '', '']);
    rows.push(['', '* 11 - 20 GT', '', '', '', '']);
    rows.push(['', '* 21 - 30 GT', '', '', '', '']);
    rows.push(['', '* > 30 GT', '', '', '', '']);
    rows.push(['3.', 'Perahu Tanpa Motor', '', '', '', '']);
    rows.push(['', '   -  Perahu Papan Kecil', '', '', '', '']);
    rows.push(['', '   -  Perahu Papan Sedang', '', '', '', '']);
    rows.push(['', '   -  Perahu Papan Besar', '', '', '', '']);
    rows.push(['4.', 'Jukung', '', '', '', '']);
    rows.push(['Jumlah', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '']);
    
    // TABEL 3 (Operasional)
    rows.push(['3.    Data Operasional Kapal Perikanan dan ABK', '', '', '', '', '']);
    rows.push(['No.', 'Uraian Kegiatan', 'Jumlah', 'Satuan', 'Keterangan', '']);
    rows.push(['1', 'Jumlah Kapal', '', '', '', '']);
    rows.push(['', '* Melaut', '', 'Kapal', '', '']);
    rows.push(['', '* Tidak Melaut', '', 'Kapal', '', '']);
    rows.push(['', '* dI Daerah Lain', '', 'Kapal', '', '']);
    rows.push(['2', 'Jumlah ABK', '', '', '', '']);
    rows.push(['', '* Melaut', '', 'Orang', '', '']);
    rows.push(['', '* Tidak Melaut', '', 'Orang', '', '']);
    rows.push(['', '', '', '', '', '']);
    
    // TABEL 4 (Produksi)
    rows.push(['4.    Produksi, Nilai Produksi serta Retribusi Lelang', '', '', '', '', '']);
    rows.push(['No.', 'Uraian Data', 'Jumlah', 'Satuan', 'Keterangan', '']);
    rows.push(['1', 'Produksi Ikan', totalVol, 'Kilogram', '', '']);
    rows.push(['2', 'Nilai Produksi', totalNilai, 'Rupiah', '', '']);
    rows.push(['3', 'Retribusi Lelang', '', 'Rupiah', '', '']);
    rows.push(['', '', '', '', '', '']);
    
    // TABEL 5 (Alat Tangkap)
    rows.push(['5.    Jenis Ikan dan Alat Tangkap yang Digunakan', '', '', '', '', '']);
    
    let counter5 = 1;
    Object.keys(apiToKomoditasMap).sort().forEach(api => {
       rows.push([`5.${counter5} ${api}`, '', '', '', '', '']);
       rows.push(['No.', 'Jenis Ikan', 'Volume (Kg)', 'Harga (Rp)', 'Nilai (Rp)', 'Keterangan']);
       
       let subCounter = 1;
       let subTotalVol = 0;
       let subTotalNilai = 0;
       
       Object.keys(apiToKomoditasMap[api]).sort().forEach(kom => {
           const valObj = apiToKomoditasMap[api][kom];
           const hargaRata = valObj.vol > 0 ? (valObj.nilai / valObj.vol) : 0;
           subTotalVol += valObj.vol;
           subTotalNilai += valObj.nilai;
           
           rows.push([subCounter++, kom, valObj.vol, hargaRata, valObj.nilai, '']);
       });
       
       rows.push(['', 'TOTAL', subTotalVol, '', subTotalNilai, '']);
       rows.push(['', '', '', '', '', '']);
       counter5++;
    });
    
    // TABEL 6
    rows.push(['6.    Daerah Pemasaran dan Tujuan Pemasaran Ikan', '', '', '', '', '']);
    rows.push(['No.', 'Wilayah', 'Kota', 'Jumlah', 'Keterangan', '']);
    rows.push(['1', 'Dalam Kota', '', '', '', '']);
    rows.push(['2', 'Luar Kota', '', '', '', '']);
    rows.push(['3', 'Luar Provinsi', '', '', '', '']);
    rows.push(['4', 'Luar Negeri', '', '', '', '']);
    rows.push(['', '', '', '', '', '']);
    
    // TABEL 7
    rows.push(['7.    Bentuk Ikan yang Dipasarkan', '', '', '', '', '']);
    rows.push(['No.', 'Jenis Ikan', 'Segar/Beku', 'Jumlah (Kg)', 'Keterangan', '']);
    
    let table7Total = 0;
    let counter7 = 1;
    const sortedKeys = Object.keys(bentukIkanMap).sort();
    sortedKeys.forEach(key => {
       const volume = bentukIkanMap[key];
       if (volume > 0) {
          const [jenis, bentuk] = key.split('||');
          rows.push([counter7++, jenis, bentuk, volume, '', '']);
          table7Total += volume;
       }
    });
    
    if (counter7 === 1) {
       rows.push(['1', '-', '-', 0, '', '']);
    }
    
    rows.push(['', 'TOTAL', '', table7Total, '', '']);
    rows.push(['', '', '', '', '', '']);
    
    // TABEL 8
    rows.push(['8.    Perbekalan Kapal', '', '', '', '', '']);
    rows.push(['No.', 'Perbekalan', 'Jumlah', 'Satuan', 'Keterangan', '']);
    
    PERBEKALAN_OPTIONS.forEach((pb, idx) => {
        const val = logistikSummaryMap[pb.nama] || '';
        rows.push([idx + 1, pb.nama, val, pb.satuan, '', '']);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(rows);

    const merges = [];
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
    merges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: 1 } });
    merges.push({ s: { r: 5, c: 0 }, e: { r: 5, c: 1 } });
    merges.push({ s: { r: 6, c: 0 }, e: { r: 6, c: 1 } });
    ws['!merges'] = merges;

    const range = XLSX.utils.decode_range(ws['!ref']);
    
    let activeEndCol = 5;
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const firstCell = rows[R] ? rows[R][0] : '';
      
      let isRowEmpty = true;
      for (let C = 0; C <= 5; ++C) {
         if (rows[R] && rows[R][C] !== '') {
             isRowEmpty = false;
         }
      }
      
      if (isRowEmpty) {
         activeEndCol = 0;
         continue;
      }

      const isMainTableTitle = typeof firstCell === 'string' && firstCell.match(/^[0-9]+\.\s+/);
      const isSubTableTitle = typeof firstCell === 'string' && firstCell.match(/^[0-9]+\.[0-9]+/);
      const isTableTitle = isMainTableTitle || isSubTableTitle;
      const isTableHeader = firstCell === 'No' || firstCell === 'No.';
      
      if (isTableHeader) {
         let maxCol = 0;
         for (let C = 0; C <= 5; ++C) {
            if (rows[R][C] !== '') maxCol = C;
         }
         activeEndCol = maxCol;
      }

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

        if (typeof ws[cellRef].v === 'number') {
            if (ws[cellRef].v === 0) {
               ws[cellRef].v = '-';
               ws[cellRef].t = 's';
            } else {
               ws[cellRef].z = '#,##0';
            }
        }

        if (R === 0) {
           ws[cellRef].s = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center', vertical: 'center' } };
        } else if (R >= 3 && R <= 8) {
           ws[cellRef].s = { font: { bold: true } };
        } else if (R >= 10 && !isRowEmpty) {
           if (isTableTitle) {
              if (C === 0) {
                 ws[cellRef].s = { 
                    font: { bold: true, sz: 11, color: { rgb: "1E293B" } }, 
                    fill: { fgColor: { rgb: "F1F5F9" } },
                    alignment: { vertical: 'center' }
                 };
                 if (!ws['!merges']) ws['!merges'] = [];
                 ws['!merges'].push({ s: { r: R, c: 0 }, e: { r: R, c: 5 } });
              }
           } else if (C <= activeEndCol) {
               const borderStyle = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
               ws[cellRef].s = { border: borderStyle, alignment: { vertical: 'center' } };
               
               if (isTableHeader) {
                  ws[cellRef].s.font = { bold: true, color: { rgb: "FFFFFF" } };
                  ws[cellRef].s.fill = { fgColor: { rgb: "3B82F6" } };
                  ws[cellRef].s.alignment = { horizontal: 'center', vertical: 'center' };
               } else {
                  if (C === 0 && typeof ws[cellRef].v === 'string' && ws[cellRef].v.match(/^[0-9]\.$/)) {
                     ws[cellRef].s.font = { bold: true };
                  }
                  if (rows[R][1] === 'TOTAL' || rows[R][0] === 'Jumlah') {
                     ws[cellRef].s.font = { bold: true };
                     ws[cellRef].s.fill = { fgColor: { rgb: "F8FAFC" } };
                  }
               }
           }
        }
      }
    }

    const colWidths = [{ wch: 8 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 25 }];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan_Monitoring");
    XLSX.writeFile(wb, `LM_${pelabuhanName}_${namaBulan}_${tahun || ''}.xlsx`);
  };

  const handleExportLaporanPUD = async (exportData, tahun, bulan, wilayah, jenisPerairan) => {
    try {
      const pudData = exportData;
      if (pudData.length === 0) {
        alert("Tidak ada data untuk diekspor pada filter ini.");
        return;
      }

      const ids = pudData.map(d => d.id);
      
      const response = await api.post('/perikanan-tangkap/export-pud', {
        ids,
        tahun: tahun,
        bulan: bulan,
        wilayah: wilayah,
        jenis_perairan: jenisPerairan
      }, { responseType: 'blob' });

      const namaBulanMap = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const fileBulan = bulan ? namaBulanMap[Number(bulan)] : 'AllBulan';
      const fileWilayah = wilayah || 'Semua';
      const fileJenis = jenisPerairan || 'PUD';
      const fileTahun = tahun || 'All';
      
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PUHIT_${fileJenis}_${fileWilayah}_${fileBulan}_${fileTahun}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert("Gagal melakukan export PUD: " + err.message);
    }
  };

  const handleExportLaporanNonPelabuhan = async (exportData, tahun, bulan, wilayah) => {
    try {
      const npData = exportData;
      if (npData.length === 0) {
        alert("Tidak ada data untuk diekspor pada filter ini.");
        return;
      }

      const ids = npData.map(d => d.id);
      
      const response = await api.post('/perikanan-tangkap/export-non-pelabuhan', {
        ids,
        tahun: tahun,
        bulan: bulan,
        wilayah: wilayah
      }, { responseType: 'blob' });

      const namaBulanMap = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const fileBulan = bulan ? namaBulanMap[Number(bulan)] : 'AllBulan';
      const fileWilayah = wilayah || 'Semua';
      const fileTahun = tahun || 'All';
      
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PRODUKSI_LHIT_${fileWilayah}_${fileBulan}_${fileTahun}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert("Gagal melakukan export Non Pelabuhan: " + err.message);
    }
  };

    const handleExportLaporanPelabuhan = (exportData, tahun, bulan, wilayah) => {
    if (!wilayah) {
       alert("Pilih Pelabuhan terlebih dahulu untuk ekspor Laporan Rekap.");
       return;
    }
    const pelabuhanName = wilayah.toUpperCase();
    const dateStr = tahun ? (bulan ? `${bulan}/${tahun}` : tahun) : 'Semua Waktu';
    
    let summaryDateStr = dateStr;
    if (tahun && bulan) {
       summaryDateStr = 'BULAN INI';
    } else if (filterTahun) {
       summaryDateStr = 'TAHUN INI';
    } else {
       summaryDateStr = 'SELURUH WAKTU';
    }
    
    // Rows
    const row0 = [`REKAPITULASI DATA LAYANAN PELABUHAN ${pelabuhanName}`];
    const row1 = [`Hari, Tgl / Bln / Thn : ${dateStr}`];
    const row2 = [];
    const row3 = ['1. PRODUKSI PELABUHAN'];
    
    const row4 = ['NO', 'TANGGAL', 'WAKTU LABUH', 'WAKTU BONGKAR', 'Jenis Muatan', 'WPPNRI', 'Nama Kapal', 'Ukuran', 'API', 'Kapal Pengangkut', 'Logistik / Perbekalan'];
    for (let i = 0; i < PERBEKALAN_OPTIONS.length - 1; i++) row4.push('');
    row4.push('Total Produksi', '', 'I k a n');
    
    const row5 = ['', '', '', '', '', '', '', '', '', ''];
    const row6 = ['', '', '', '', '', '', '', '', '', ''];
    
    PERBEKALAN_OPTIONS.forEach(pb => {
      row5.push(`${pb.nama} (${pb.satuan})`);
      row6.push('');
    });
    
    row5.push('', '');
    row6.push('Volume', 'Nilai');
    
    const komoditasTotalMap = {};
    const komoditasArray = [...KOMODITAS_OPTIONS];
    komoditasArray.forEach(kom => {
      row5.push(kom, '', '');
      row6.push('Vol', 'Harga', 'Nilai');
      komoditasTotalMap[kom] = { vol: 0, nilai: 0 };
    });

    let totalKeseluruhanVol = 0;
    let totalKeseluruhanNilai = 0;
    const apiSummaryMap = {};
    const logistikSummaryMap = {};

    const dataRows = exportData.map((row, idx) => {
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
          
          if (komoditasTotalMap[t.komoditas]) {
            komoditasTotalMap[t.komoditas].vol += Number(t.volume) || 0;
            komoditasTotalMap[t.komoditas].nilai += Number(t.nilai) || 0;
          }
        });
      }

      totalKeseluruhanVol += totalVol;
      totalKeseluruhanNilai += totalNilai;

      const apiName = row.alat_tangkap || 'Tidak Diketahui';
      if (!apiSummaryMap[apiName]) apiSummaryMap[apiName] = { vol: 0, nilai: 0 };
      apiSummaryMap[apiName].vol += totalVol;
      apiSummaryMap[apiName].nilai += totalNilai;

      const baseRow = [
        idx + 1,
        row.tanggal ? formatDate(row.tanggal) : '-',
        row.jam_labuh || '-',
        row.jam_bongkar || '-',
        'Hasil Tangkapan',
        '', // WPPNRI dikosongkan sesuai permintaan
        row.nama_kapal || '-',
        row.gt_kapal || '-',
        row.alat_tangkap || '-',
        ''
      ];
      
      const logistikData = {};
      if (row.logistik) {
        try {
          const parsed = JSON.parse(row.logistik);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => { 
                const val = parseFloat(item.jumlah) || 0;
                logistikData[item.nama] = val; 
                logistikSummaryMap[item.nama] = (logistikSummaryMap[item.nama] || 0) + val;
              });
          }
        } catch(e) {}
      }
      PERBEKALAN_OPTIONS.forEach(pb => {
        baseRow.push(logistikData[pb.nama] || '');
      });

      baseRow.push(totalVol, totalNilai);

      komoditasArray.forEach(kom => {
        if (komMap[kom]) {
          baseRow.push(komMap[kom].vol, komMap[kom].harga, komMap[kom].nilai);
        } else {
          baseRow.push('-', '-', '-');
        }
      });
      return baseRow;
    });

    const rowTotal1 = ['TOTAL TANGKAPAN', '', '', '', '', '', '', '', '', ''];
    const rowTotal2 = ['Nilai', '', '', '', '', '', '', '', '', ''];
    
    PERBEKALAN_OPTIONS.forEach(() => {
        rowTotal1.push('');
        rowTotal2.push('');
    });
    rowTotal1.push(totalKeseluruhanVol, '');
    rowTotal2.push('', totalKeseluruhanNilai);
    
    komoditasArray.forEach(kom => {
      const tot = komoditasTotalMap[kom];
      if (tot.vol > 0 || tot.nilai > 0) {
        rowTotal1.push(tot.vol, '', '');
        rowTotal2.push('', '', tot.nilai);
      } else {
        rowTotal1.push('-', '-', '-');
        rowTotal2.push('-', '-', '-');
      }
    });

    const emptyRow = [];
    
    // Tabel TOTAL PENDARATAN IKAN API
    const summaryHeader1 = [`TOTAL PENDARATAN IKAN ${summaryDateStr}`];
    const summaryHeader2 = ['No.', 'Alat Penangkapan Ikan', 'Pendaratan Langsung', '', 'Alih Muat', ''];
    const summaryHeader3 = ['', '', 'Volume (Kg)', 'Nilai (Rp)', 'Volume (Kg)', 'Nilai (Rp)'];
    
    const summaryRows = [];
    let summaryIndex = 1;
    Object.keys(apiSummaryMap).sort().forEach(apiName => {
      summaryRows.push([
        summaryIndex++,
        apiName.toUpperCase(),
        apiSummaryMap[apiName].vol,
        apiSummaryMap[apiName].nilai,
        '-',
        '-'
      ]);
    });
    
    const summaryTotalRow = ['Total Produksi', '', totalKeseluruhanVol, totalKeseluruhanNilai, '-', '-'];

    
    const operasionalHeader = ['2. OPERASIONAL PELABUHAN'];
    const operasionalRows = [
      ['1', 'Jumlah kapal yang terlayani', '', '', '', '', '', '', '', ''],
      ['', 'a. Di dalam Kolam Labuh', '', '', '', '', '', '', 'Unit', ''],
      ['', 'b. Di luar kolam (Area WKOPP)', '', '', '', '', '', '', 'Unit', ''],
      ['', 'c. Diluar kolam (luar area WKOPP)', '', '', '', '', '', '', 'Unit', ''],
      ['2', 'Trip Kapal', '', '', '', '', '', '', 'Trip', ''],
      ['3', 'STBLKK', '', '', '', '', '', '', '', ''],
      ['', 'a. Keberangkatan', '', '', '', '', '', '', 'Dokumen', ''],
      ['', 'b. Kedatangan', '', '', '', '', '', '', 'Dokumen', ''],
      ['4', 'Rekomendasi BBM Subsidi', '', '', '', '', '', '', 'Dokumen', ''],
      ['5', 'Rekomendasi BBM Non Subsidi', '', '', '', '', '', '', 'Dokumen', ''],
      ['6', 'Penerbitan SPB', '', '', '', '', '', '', 'Dokumen', ''],
      ['7', 'Penerbitan CPIB', '', '', '', '', '', '', 'Dokumen', ''],
      ['8', 'Penerimaan Logbook', '', '', '', '', '', '', 'Dokumen', ''],
      ['9', 'Penerbitan SHTI', '', '', '', '', '', '', 'Dokumen', ''],
      ['10', 'Penerbitan ICCAT', '', '', '', '', '', '', 'Dokumen', ''],
      ['11', 'Data Logistik :', '', '', '', '', '', '', '', '']
    ];

    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    PERBEKALAN_OPTIONS.forEach((pb, idx) => {
        const logistikTotalValue = logistikSummaryMap[pb.nama] || 0;
        const letter = alphabet[idx] || '';
        operasionalRows.push(['', `${letter}. ${pb.nama}`, '', '', '', '', logistikTotalValue > 0 ? logistikTotalValue : '-', '', pb.satuan, '']);
    });

    const allRowsToRender = [
      row0, row1, row2, row3, row4, row5, row6, 
      ...dataRows, 
      rowTotal1, rowTotal2, 
      emptyRow, emptyRow,
      summaryHeader1, summaryHeader2, summaryHeader3,
      ...summaryRows,
      summaryTotalRow,
      emptyRow, emptyRow,
      operasionalHeader,
      ...operasionalRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(allRowsToRender);

    const borderStyle = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    const boldCenter = { font: { bold: true, color: { rgb: "000000" } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: borderStyle, fill: { fgColor: { rgb: "EFEFEF" } } };
    const normalCenter = { alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle };
    
    const totalRowStyle1 = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "FFFF00" } } };
    const totalRowStyle2 = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "C9DAF8" } } };
    const summaryHeaderStyle1 = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "FCE5CD" } } };
    const summaryDataStyle = { alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "FCE5CD" } } };
    const summaryTotalStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "E06666" } } };
    const summaryGreenStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "D9EAD3" } } };

    const summaryStartRowIndex = 7 + dataRows.length + 4; // index 0-based

    
    const operasionalStartIndex = allRowsToRender.indexOf(operasionalHeader);

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

        if (R === 0) ws[cellRef].s = { font: { bold: true, sz: 14 } };
        else if (R === 3) ws[cellRef].s = { font: { bold: true } };
        else if (R >= 4 && R <= 6) ws[cellRef].s = boldCenter;
        else if (R >= 7 && R < 7 + dataRows.length) {
            ws[cellRef].s = normalCenter;
            if (typeof ws[cellRef].v === 'number') {
              if (ws[cellRef].v === 0) { ws[cellRef].v = '-'; ws[cellRef].t = 's'; }
              else ws[cellRef].z = '#,##0';
            }
        } else if (R === 7 + dataRows.length) {
            ws[cellRef].s = totalRowStyle1; 
            if (typeof ws[cellRef].v === 'number') {
              if (ws[cellRef].v === 0) { ws[cellRef].v = '-'; ws[cellRef].t = 's'; }
              else ws[cellRef].z = '#,##0';
            }
        } else if (R === 7 + dataRows.length + 1) {
            ws[cellRef].s = totalRowStyle2;
            if (typeof ws[cellRef].v === 'number') {
              if (ws[cellRef].v === 0) { ws[cellRef].v = '-'; ws[cellRef].t = 's'; }
              else ws[cellRef].z = '#,##0';
            }
        } else if (R === summaryStartRowIndex || R === summaryStartRowIndex + 1 || R === summaryStartRowIndex + 2) {
            if (C <= 5) ws[cellRef].s = summaryHeaderStyle1;
        } else if (R > summaryStartRowIndex + 2 && R < summaryStartRowIndex + 3 + summaryRows.length) {
            if (C <= 5) {
              ws[cellRef].s = summaryDataStyle;
              if (typeof ws[cellRef].v === 'number') {
                if (ws[cellRef].v === 0) { ws[cellRef].v = '-'; ws[cellRef].t = 's'; }
                else ws[cellRef].z = '#,##0';
              }
            }
        } else if (R === summaryStartRowIndex + 3 + summaryRows.length) {
            if (C <= 5) {
              ws[cellRef].s = summaryTotalStyle;
              if (typeof ws[cellRef].v === 'number') {
                if (ws[cellRef].v === 0) { ws[cellRef].v = '-'; ws[cellRef].t = 's'; }
                else ws[cellRef].z = '#,##0';
              }
            }
        } else if (R === operasionalStartIndex) {
            if (C <= 9) ws[cellRef].s = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "E69138" } } };
        } else if (R > operasionalStartIndex && R <= operasionalStartIndex + operasionalRows.length) {
            if (C <= 9) {
               ws[cellRef].s = { alignment: { vertical: 'center' }, border: borderStyle };
               if (C === 0) ws[cellRef].s.alignment.horizontal = 'center'; // No.
               if (C === 6) ws[cellRef].s.alignment.horizontal = 'center'; // Value
               if (C === 8) ws[cellRef].s.alignment.horizontal = 'center'; // Unit
               if (C === 6 && typeof ws[cellRef].v === 'number') {
                  ws[cellRef].z = '#,##0';
               }
            }
        }
      }
    }

    const totalBaseCols = 10 + PERBEKALAN_OPTIONS.length + 2;
    const totalCols = totalBaseCols + (komoditasArray.length * 3);
    const totalColStart = 10 + PERBEKALAN_OPTIONS.length;
    const ikanColStart = totalColStart + 2;
    
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: totalCols - 1 } }
    ];
    
    for (let i = 0; i < 10; i++) {
      merges.push({ s: { r: 4, c: i }, e: { r: 6, c: i } });
    }
    
    merges.push({ s: { r: 4, c: 10 }, e: { r: 4, c: 10 + PERBEKALAN_OPTIONS.length - 1 } });
    for (let i = 0; i < PERBEKALAN_OPTIONS.length; i++) {
      merges.push({ s: { r: 5, c: 10 + i }, e: { r: 6, c: 10 + i } });
    }
    
    merges.push({ s: { r: 4, c: totalColStart }, e: { r: 5, c: totalColStart + 1 } });
    merges.push({ s: { r: 4, c: ikanColStart }, e: { r: 4, c: totalCols - 1 } });
    
    let currentCol = ikanColStart;
    komoditasArray.forEach(() => {
      merges.push({ s: { r: 5, c: currentCol }, e: { r: 5, c: currentCol + 2 } });
      currentCol += 3;
    });

    // Merge TOTAL TANGKAPAN (dari NO ke ujung Logistik)
    merges.push({ s: { r: 7 + dataRows.length, c: 0 }, e: { r: 7 + dataRows.length, c: totalColStart - 1 } });
    // Merge Nilai (dari NO ke Total Produksi Volume)
    merges.push({ s: { r: 7 + dataRows.length + 1, c: 0 }, e: { r: 7 + dataRows.length + 1, c: totalColStart } });

    
    // Merges for summary table
    merges.push({ s: { r: summaryStartRowIndex, c: 0 }, e: { r: summaryStartRowIndex, c: 5 } });
    merges.push({ s: { r: summaryStartRowIndex + 1, c: 0 }, e: { r: summaryStartRowIndex + 2, c: 0 } }); // No.
    merges.push({ s: { r: summaryStartRowIndex + 1, c: 1 }, e: { r: summaryStartRowIndex + 2, c: 1 } }); // Alat Penangkapan Ikan
    merges.push({ s: { r: summaryStartRowIndex + 1, c: 2 }, e: { r: summaryStartRowIndex + 1, c: 3 } }); // Pendaratan Langsung
    merges.push({ s: { r: summaryStartRowIndex + 1, c: 4 }, e: { r: summaryStartRowIndex + 1, c: 5 } }); // Alih Muat
    merges.push({ s: { r: summaryStartRowIndex + 3 + summaryRows.length, c: 0 }, e: { r: summaryStartRowIndex + 3 + summaryRows.length, c: 1 } }); // Total Produksi

    // Merges for Operasional table
    merges.push({ s: { r: operasionalStartIndex, c: 0 }, e: { r: operasionalStartIndex, c: 9 } });
    for (let rIdx = 0; rIdx < operasionalRows.length; rIdx++) {
       const actRow = operasionalStartIndex + 1 + rIdx;
       merges.push({ s: { r: actRow, c: 1 }, e: { r: actRow, c: 5 } }); // Nama item (cols 1-5)
       merges.push({ s: { r: actRow, c: 6 }, e: { r: actRow, c: 7 } }); // Value (cols 6-7)
       merges.push({ s: { r: actRow, c: 8 }, e: { r: actRow, c: 9 } }); // Unit (cols 8-9)
    }

    ws['!merges'] = merges;

    const colWidths = [{ wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];
    for (let i = 0; i < PERBEKALAN_OPTIONS.length; i++) colWidths.push({ wch: 15 });
    colWidths.push({ wch: 15 }, { wch: 20 }); // Total Produksi Vol & Nilai
    
    komoditasArray.forEach(() => colWidths.push({ wch: 10 }, { wch: 10 }, { wch: 12 }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produksi_Pelabuhan");
    XLSX.writeFile(wb, `Laporan_${pelabuhanName}_${dateStr.replace('/', '-')}.xlsx`);
  };

  
  const handleModalExport = () => {
    // Filter by status if selected, otherwise all
    let dataToExport = data;
    if (filterStatus && filterStatus.length > 0) {
      dataToExport = dataToExport.filter(d => filterStatus.includes(d.status));
    }
    
    if (exportModalPerairan) {
      dataToExport = dataToExport.filter(d => d.sumber_data === exportModalPerairan);
    }
    
    if (exportModalTahun) {
      dataToExport = dataToExport.filter(d => {
        if (!d.tanggal) return false;
        const dYear = new Date(d.tanggal).getFullYear().toString();
        return dYear === exportModalTahun;
      });
    }
    
    if (exportModalBulan) {
      dataToExport = dataToExport.filter(d => {
        if (!d.tanggal) return false;
        const dMonth = String(new Date(d.tanggal).getMonth() + 1);
        return dMonth === exportModalBulan || dMonth.padStart(2, '0') === exportModalBulan;
      });
    }
    
    if (exportModalWilayah) {
        dataToExport = dataToExport.filter(d => {
           const matchesPelabuhan = (d.pelabuhan || '').toUpperCase() === exportModalWilayah.toUpperCase();
           const matchesKabKota = (d.kabupaten_kota || '').toUpperCase() === exportModalWilayah.toUpperCase();
           return matchesPelabuhan || matchesKabKota;
        });
      }

      if (exportModalPerairan === 'PUD' && exportModalJenisPerairan) {
        dataToExport = dataToExport.filter(d => d.jenis_perairan === exportModalJenisPerairan);
      }
    
    if (exportModalPerairan === 'PELABUHAN' && exportModalJenis === 'LM') {
      handleExportLMPelabuhan(dataToExport, exportModalTahun, exportModalBulan, exportModalWilayah);
      setIsExportModalOpen(false);
      return;
    }
    
      if (exportModalPerairan === 'PELABUHAN') {
        handleExportLaporanPelabuhan(dataToExport, exportModalTahun, exportModalBulan, exportModalWilayah);
      } else if (exportModalPerairan === 'PUD') {
        handleExportLaporanPUD(dataToExport, exportModalTahun, exportModalBulan, exportModalWilayah, exportModalJenisPerairan);
      } else if (exportModalPerairan === 'KAB_KOTA') {
        handleExportLaporanNonPelabuhan(dataToExport, exportModalTahun, exportModalBulan, exportModalWilayah);
      } else {
        alert('Pilih Sumber Perairan terlebih dahulu.');
      }
    setIsExportModalOpen(false);
  };

const columns = useMemo(() => [
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => {
        const row = info.row.original;
        const pelabuhanText = row.pelabuhan || row.kabupaten_kota || '-';

        const contextFields = [
          { label: 'Perairan / Wilayah', value: pelabuhanText },
          { label: 'Nama Kapal / Populasi Alat', value: row.sumber_data === 'PELABUHAN' ? row.nama_kapal : (row.pud_populasi_alat + ' Unit') },
          { label: 'Alat Tangkap', value: row.alat_tangkap },
          { label: 'Tanggal Input', value: formatDate(row.tanggal) }
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
    {
      header: 'Tanggal',
      accessorKey: 'tanggal',
      cell: info => formatDate(info.getValue())
    },
    {
      header: 'Perairan',
      accessorKey: 'sumber_data',
      cell: info => {
        const val = info.getValue() || 'PELABUHAN';
        if (val === 'PUD') return <span className="text-emerald-500 font-medium">PUD</span>;
        if (val === 'KAB_KOTA') return <span className="text-orange-500 font-medium">Non Pelabuhan</span>;
        return <span className="text-blue-500 font-medium">Pelabuhan</span>;
      }
    },
    {
      header: 'Pelabuhan/Wilayah',
      accessorKey: 'pelabuhan',
      cell: info => {
        const val = info.getValue();
        const row = info.row.original;
        if (row.sumber_data === 'PUD') {
          return `${row.kabupaten_kota || '-'} (${row.jenis_perairan || 'PUD'})`;
        }
        if (row.sumber_data === 'KAB_KOTA') {
          return `${row.kabupaten_kota || '-'} (${row.pelabuhan || '-'}, WPP ${row.jenis_perairan || '-'})`;
        }
        return val || row.kabupaten_kota || '-';
      }
    },
    {
      header: 'Nama Kapal / Populasi Alat (PUD/KAB)',
      accessorKey: 'nama_kapal',
      cell: info => {
        const row = info.row.original;
        if (row.sumber_data === 'PUD' || row.sumber_data === 'KAB_KOTA') {
          const color = row.sumber_data === 'PUD' ? 'text-emerald-600' : 'text-orange-600';
          return <span className={`${color} font-medium`}>{row.pud_populasi_alat || '-'} Unit</span>;
        }
        return row.nama_kapal || '-';
      }
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
    const values = computedStats.komoditas.map(item => (item._sum.volume || 0) / 1000);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '15%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', name: 'Volume (Ton)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontWeight: 'bold', interval: 0, width: 120, overflow: 'truncate' } },
      series: [{ name: 'Volume', type: 'bar', data: values, itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#ffffff', formatter: (p) => p.value.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' Ton' } }]
    };
  }, [computedStats.komoditas]);

  const pelabuhanChartOption = useMemo(() => {
    const categories = computedStats.pelabuhan.map(item => item.pelabuhan);
    const values = computedStats.pelabuhan.map(item => (item._sum.volume || 0) / 1000);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '15%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', name: 'Volume (Ton)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontWeight: 'bold' } },
      series: [{ name: 'Volume', type: 'bar', data: values, itemStyle: { color: '#10b981', borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#ffffff', formatter: (p) => p.value.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' Ton' } }]
    };
  }, [computedStats.pelabuhan]);

  const trenChartOption = useMemo(() => {
    const dates = computedStats.tren.map(t => {
      if (!t.date) return '';
      const parts = t.date.split('-');
      if (parts.length < 2) return t.date;
      const [y, m] = parts;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
    });
    const volumes = computedStats.tren.map(t => t.volume / 1000);
    const nilais = computedStats.tren.map(t => t.nilai);

    return {
      volume: {
        tooltip: { trigger: 'axis', formatter: (params) => `<b>${params[0].name}</b><br/>Volume: ${params[0].value.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Ton` },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dates, axisLabel: { color: '#f8fafc' } },
        yAxis: { type: 'value', name: 'Volume (Ton)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { color: '#334155' } } },
        dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }],
        series: [{ name: 'Volume', type: 'line', data: volumes, smooth: true, symbolSize: 8, itemStyle: { color: '#8b5cf6' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(139, 92, 246, 0.5)' }, { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }] } } }]
      },
      nilai: {
        tooltip: { trigger: 'axis', formatter: (params) => `<b>${params[0].name}</b><br/>Nilai: Rp ${params[0].value.toLocaleString('id-ID')}` },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dates, axisLabel: { color: '#f8fafc' } },
        yAxis: { type: 'value', name: 'Nilai Produksi (Rp)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc', formatter: (v) => 'Rp ' + (v/1000000) + 'M' }, splitLine: { lineStyle: { color: '#334155' } } },
        dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }],
        series: [{ name: 'Nilai', type: 'line', data: nilais, smooth: true, symbolSize: 8, itemStyle: { color: '#10b981' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16, 185, 129, 0.5)' }, { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }] } } }]
      }
    };
  }, [computedStats.tren]);

  const hargaChartOption = useMemo(() => {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { show: false },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: computedStats.hargaCategories,
        axisLabel: { color: '#f8fafc', interval: 0, width: 90, overflow: 'break' }
      },
      yAxis: { 
        type: 'value', 
        name: 'Harga Rata-rata (Rp)', 
        nameTextStyle: { color: '#f8fafc' }, 
        axisLabel: { color: '#f8fafc', formatter: (value) => 'Rp ' + (value/1000) + 'k' }, 
        splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } 
      },
      dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100, bottom: 0 }],
      series: computedStats.hargaSeries
    };
  }, [computedStats.hargaCategories, computedStats.hargaSeries]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Perikanan Tangkap</h1>
        </div>
        
        {!isFormOpen && (
          <div className="flex items-center gap-2">
            {(user?.role === 'admin_pusat' || user?.role === 'admin_bidang') && (
              <button
                onClick={() => {
                    setExportModalPerairan('');
                    setExportModalJenis('');
                    setExportModalTahun('');
                    setExportModalBulan('');
                    setExportModalWilayah('');
                    setIsExportModalOpen(true);
                  }}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <FileText className="w-5 h-5" />
                Ekspor Laporan
              </button>
            )}
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
        </div>
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
              Log Laporan Perairan
            </button>
            <button 
              onClick={() => setActiveTab('publik')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'publik' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Data Validasi Publik
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
                <h3 className="text-lg font-semibold text-foreground">Filter Multidimensi</h3>
              </div>
              <div className="flex items-center gap-2">
                
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sumber Perairan</label>
                <SearchableMultiSelect 
                  value={filterCabang} 
                  onChange={(val) => {
                    setFilterCabang(val);
                    setFilterWilayah([]);
                    setFilterKomoditas([]);
                  }} 
                  options={[
                    { label: 'Pelabuhan', value: 'PELABUHAN' },
                    { label: 'PUD', value: 'PUD' },
                    { label: 'Non Pelabuhan', value: 'KAB_KOTA' }
                  ]}
                  placeholder="Semua Perairan"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                <SearchableMultiSelect 
                  value={filterTahun} 
                  onChange={setFilterTahun} 
                  options={TAHUN_OPTIONS}
                  placeholder="Semua Tahun"
                />
              </div>
              {activeTab === 'data' && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bulan</label>
                  <SearchableMultiSelect 
                    value={filterBulan} 
                    onChange={setFilterBulan} 
                    options={BULAN_OPTIONS.map((b, i) => ({ label: b, value: String(i+1) }))}
                    placeholder="Semua Bulan"
                  />
                </div>
              )}
              {filterCabang.length > 0 && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kab/Kota / Pelabuhan</label>
                    <SearchableMultiSelect 
                      value={filterWilayah} 
                      onChange={setFilterWilayah} 
                      options={
                        [...new Set([
                          ...(filterCabang.includes('PELABUHAN') ? PELABUHAN_OPTIONS : []),
                          ...(filterCabang.includes('PUD') || filterCabang.includes('KAB_KOTA') ? KAB_KOTA_OPTIONS : [])
                        ])]
                      }
                      placeholder="Semua Wilayah"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Komoditas</label>
                    <SearchableMultiSelect 
                      value={filterKomoditas} 
                      onChange={setFilterKomoditas} 
                      options={
                        [...new Set([
                          ...(filterCabang.includes('PELABUHAN') || filterCabang.includes('KAB_KOTA') ? KOMODITAS_OPTIONS : []),
                          ...(filterCabang.includes('PUD') ? KOMODITAS_PUD_OPTIONS : [])
                        ])]
                      }
                      placeholder="Semua Komoditas"
                    />
                  </div>
                </>
              )}
              <div>
                {activeTab === 'data' && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                    <SearchableMultiSelect 
                      value={filterStatus} 
                      onChange={setFilterStatus} 
                      options={[
                        { label: 'Verified', value: 'VERIFIED' },
                        { label: 'Pending', value: 'PENDING' },
                        { label: 'Rejected', value: 'REJECTED' }
                      ]}
                      placeholder="Semua Status"
                    />
                  </div>
                )}
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
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <DataTable
                columns={columns}
                data={filteredData}
                onEdit={handleEdit}
                canEditRow={(row) => {
                  if (user?.role === 'admin_pusat' || user?.role === 'admin_bidang') return true;
                  return row.status === 'REJECTED';
                }}
                searchable={true}
                exportable={user?.role === 'admin_pusat' || user?.role === 'admin_bidang'}
                onDelete={user?.role === 'admin_pusat' || user?.role === 'admin_bidang' ? handleDelete : undefined}
                onApprove={handleApprove}
                onReject={handleReject}
                onBatchApprove={handleBatchApprove}
                onBatchReject={handleBatchReject}
                onBatchDelete={user?.role === 'admin_pusat' || user?.role === 'admin_bidang' ? handleBatchDelete : undefined}
                canBatchApprove={(selectedRows) => selectedRows.some(row => 
                  (user?.role === 'admin_pusat' && ['APPROVED', 'VERIFIED'].includes(row.status)) || 
                  (user?.role === 'admin_bidang' && row.status === 'PENDING') ||
                  (user?.role === 'admin_pusat' && row.status === 'PENDING')
                )}
                canBatchReject={(selectedRows) => selectedRows.some(row => 
                    (user?.role === 'admin_pusat' && ['APPROVED', 'VERIFIED', 'PENDING'].includes(row.status)) || 
                    (user?.role === 'admin_bidang' && row.status === 'PENDING')
                  )}
                exportName={`Perikanan_Tangkap_${filterCabang && filterCabang.length > 0 ? filterCabang.join('_') : 'All'}_${filterTahun && filterTahun.length > 0 ? filterTahun.join('_') : 'All'}`}
                renderSubComponent={renderSubComponent}
                customExportButton={null}
                onCustomExport={(exportData) => {
                    let komoditasArray = [];
                    if (!filterCabang || filterCabang.length === 0) {
                      komoditasArray = [...new Set([...KOMODITAS_OPTIONS, ...KOMODITAS_LAUT_OPTIONS, ...KOMODITAS_PUD_OPTIONS])];
                    } else if (filterCabang.includes('PUD') && filterCabang.length === 1) {
                      komoditasArray = [...KOMODITAS_PUD_OPTIONS];
                    } else if (filterCabang.includes('KAB_KOTA') && filterCabang.length === 1) {
                      komoditasArray = [...KOMODITAS_LAUT_OPTIONS];
                    } else {
                      komoditasArray = [...KOMODITAS_OPTIONS];
                    }

                  const showLogistikCols = !filterCabang || filterCabang.length === 0 || filterCabang.includes('PELABUHAN');

                  const headerRow1 = ['Status', 'Tanggal', 'Perairan', 'Jenis Perairan (Khusus PUD)', 'Jam Labuh', 'Jam Bongkar', 'Nama Kapal / Populasi Alat (PUD)', 'Ukuran/GT', 'Alat Tangkap', 'Pelabuhan/Lokasi', 'Jumlah Sampel'];
                  const headerRow2 = ['', '', '', '', '', '', '', '', '', '', ''];
                  
                  if (showLogistikCols) {
                    headerRow1.push('Logistik / Perbekalan');
                    headerRow2.push(`${PERBEKALAN_OPTIONS[0].nama} (${PERBEKALAN_OPTIONS[0].satuan})`);
                    for (let i = 1; i < PERBEKALAN_OPTIONS.length; i++) {
                      headerRow1.push('');
                      headerRow2.push(`${PERBEKALAN_OPTIONS[i].nama} (${PERBEKALAN_OPTIONS[i].satuan})`);
                    }
                  }

                  headerRow1.push('Total Volume (Kg)', 'Total Nilai (Rp)');
                  headerRow2.push('', '');

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
                      row.status || '-',
                      row.tanggal ? row.tanggal.split('T')[0] : '-',
                      row.sumber_data === 'PUD' ? 'Perairan PUD' : (row.sumber_data === 'KAB_KOTA' ? 'Perairan Non Pelabuhan' : 'Perairan Pelabuhan'),
                      row.sumber_data === 'PUD' ? (row.jenis_perairan || '-') : '-',
                      row.jam_labuh || '-',
                      row.jam_bongkar || '-',
                      row.sumber_data === 'PUD' ? (row.pud_populasi_alat ? `${row.pud_populasi_alat} Unit` : '-') : (row.nama_kapal || '-'),
                      row.sumber_data === 'PUD' ? '-' : (row.gt_kapal || '-'),
                      row.alat_tangkap || '-',
                      row.pelabuhan || row.kabupaten_kota || '-',
                      row.sumber_data === 'PUD' ? (row.pud_jumlah_sampel ? `${row.pud_jumlah_sampel} Unit` : '-') : '-'
                    ];

                    if (showLogistikCols) {
                      const logistikData = {};
                      if (row.logistik && row.sumber_data === 'PELABUHAN') {
                        try {
                          const parsed = JSON.parse(row.logistik);
                          if (Array.isArray(parsed)) {
                            parsed.forEach(item => {
                              logistikData[item.nama] = parseFloat(item.jumlah) || '';
                            });
                          }
                        } catch(e) {}
                      }
                      PERBEKALAN_OPTIONS.forEach(pb => {
                        baseRow.push(logistikData[pb.nama] || '');
                      });
                    }

                    baseRow.push(totalVol, totalNilai);

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
                  
                  const logistikHeaderStyle = { ...headerStyle, fill: { fgColor: { rgb: "EAD1DC" } } };

                  const totalBaseCols = 11;
                  const totalLogistikCols = showLogistikCols ? PERBEKALAN_OPTIONS.length : 0;
                  const totalTotalsCols = 2; // Total Volume, Total Nilai
                  
                  const logistikStartCol = totalBaseCols;
                  const totalsStartCol = totalBaseCols + totalLogistikCols;
                  const komoditasStartCol = totalsStartCol + totalTotalsCols;

                  const range = XLSX.utils.decode_range(ws['!ref']);
                  for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                      const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

                      if (R === 0) {
                        if (C >= komoditasStartCol) ws[cellRef].s = komoditasHeaderStyle;
                        else if (showLogistikCols && C >= logistikStartCol && C < totalsStartCol) ws[cellRef].s = logistikHeaderStyle;
                        else ws[cellRef].s = headerStyle;
                      } else if (R === 1) {
                        if (C >= komoditasStartCol) ws[cellRef].s = subHeaderStyle;
                        else if (showLogistikCols && C >= logistikStartCol && C < totalsStartCol) ws[cellRef].s = subHeaderStyle;
                        else ws[cellRef].s = headerStyle;
                      } else {
                        ws[cellRef].s = dataStyle;
                        if (typeof ws[cellRef].v === 'number') {
                          if (ws[cellRef].v === 0) {
                            ws[cellRef].v = '-';
                            ws[cellRef].t = 's';
                          } else {
                            ws[cellRef].z = '#,##0';
                          }
                        }
                      }
                    }
                  }

                  const merges = [];
                  // Base columns merged vertically
                  for (let i = 0; i < totalBaseCols; i++) {
                    merges.push({ s: { r: 0, c: i }, e: { r: 1, c: i } });
                  }
                  
                  if (showLogistikCols) {
                    // Logistik main header merged horizontally
                    merges.push({ s: { r: 0, c: logistikStartCol }, e: { r: 0, c: totalsStartCol - 1 } });
                  }
                  
                  // Totals merged vertically
                  merges.push({ s: { r: 0, c: totalsStartCol }, e: { r: 1, c: totalsStartCol } });
                  merges.push({ s: { r: 0, c: totalsStartCol + 1 }, e: { r: 1, c: totalsStartCol + 1 } });
                  
                  let currentCol = komoditasStartCol;
                  komoditasArray.forEach(() => {
                    merges.push({ s: { r: 0, c: currentCol }, e: { r: 0, c: currentCol + 2 } });
                    currentCol += 3;
                  });
                  ws['!merges'] = merges;

                  const colWidths = [
                      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, 
                      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 15 }
                    ];
                    if (showLogistikCols) {
                      PERBEKALAN_OPTIONS.forEach(() => colWidths.push({ wch: 15 }));
                    }
                    colWidths.push({ wch: 20 }, { wch: 20 });
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
          ) : activeTab === 'publik' ? (
            <DataPublikTangkap 
               filterTahun={filterTahun}
               filterCabang={filterCabang}
               filterWilayah={filterWilayah}
               filterKomoditas={filterKomoditas}
            />
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-end mb-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded-full text-sm font-semibold border border-purple-200 dark:border-purple-500/20 shadow-sm">
                  <Clock className="w-4 h-4 animate-pulse" />
                  Terakhir Diperbarui: {lastUpdated || '-'}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500"><Database className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                    <p className="text-2xl font-bold text-foreground">{(computedStats.kpi.total_volume / 1000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">Ton</span></p>
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

                {/* Row 2: Charts (Laut vs PUD + Komoditas) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Laut vs PUD Comparison Chart */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-border pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <BarChart3 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Perbandingan Produksi</h3>
                          <p className="text-sm text-muted-foreground">Berdasarkan Jenis Perairan</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-48">
                          <SearchableMultiSelect 
                            value={filterKabKotaChart} 
                            onChange={setFilterKabKotaChart} 
                            options={KAB_KOTA_OPTIONS}
                            placeholder="Semua Kab/Kota"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {verifiedFilteredData.length > 0 ? (
                      <ReactECharts option={lautVsPudChartOption} style={{ height: '350px', width: '100%' }} />
                    ) : (
                      <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                        Belum ada data
                      </div>
                    )}
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-border pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Fish className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Komoditas Terbanyak</h3>
                          <p className="text-sm text-muted-foreground">Total Keseluruhan</p>
                        </div>
                      </div>
                    </div>
                    {computedStats.komoditas.length > 0 ? <ReactECharts option={komoditasChartOption} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
                  </div>
                </div>

                {/* Row 3: Komoditas Unggulan & Wilayah Penghasil */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Komoditas Unggulan & Top 5 Wilayah Penghasil</h3>
                      <p className="text-sm text-muted-foreground mt-1">Distribusi kabupaten/kota dengan produksi tertinggi untuk masing-masing komoditas.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {topKomoditasUnggulan.map((item, idx) => (
                      <div key={idx} className="bg-muted/10 border border-border rounded-xl p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-foreground">{item.komoditas}</h4>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Total Produksi</p>
                            <p className="text-xl font-black text-amber-500 mt-1">{Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.total / 1000)} <span className="text-sm font-normal">Ton</span></p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <Fish className="w-5 h-5" />
                          </div>
                        </div>
                        
                        <div className="space-y-3 mt-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top 5 Wilayah</div>
                          {item.topWilayah.map((w, i) => {
                            const percent = Math.min(100, Math.round((w.volume / item.topWilayah[0].volume) * 100));
                            return (
                              <div key={i} className="relative">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium truncate max-w-[60%]">{w.wilayah}</span>
                                  <span className="text-muted-foreground">{Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(w.volume / 1000)} Ton</span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percent}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                          {item.topWilayah.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-4">Belum ada wilayah</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {topKomoditasUnggulan.length === 0 && (
                      <div className="col-span-3 text-center py-8 text-muted-foreground">Belum ada data komoditas</div>
                    )}
                  </div>
                </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4"><LineChart className="w-5 h-5 text-emerald-500" /><h3 className="text-lg font-semibold">Tren Volume Pendaratan</h3></div>
                  {computedStats.tren.length > 0 ? <ReactECharts option={trenChartOption.volume} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
                </div>
                
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4"><LineChart className="w-5 h-5 text-emerald-500" /><h3 className="text-lg font-semibold">Tren Nilai Produksi</h3></div>
                  {computedStats.tren.length > 0 ? <ReactECharts option={trenChartOption.nilai} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
                </div>
              </div>


            </div>
          )
        )
      )}
    
      {/* Modal Ekspor Laporan */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-background rounded-3xl w-full max-w-lg shadow-2xl border border-border animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-t-3xl overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-sm">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Ekspor Laporan</h3>
                    <p className="text-blue-100 text-sm mt-0.5">Unduh data berdasarkan parameter</p>
                  </div>
                </div>
                <button onClick={() => setIsExportModalOpen(false)} className="p-2 text-blue-100 hover:text-white hover:bg-white/20 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-7 space-y-5 bg-gradient-to-b from-background to-muted/10">
              {/* Sumber Perairan */}
              <div className="bg-card border border-border p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                  <Map className="w-4 h-4 text-blue-500" />
                  Sumber Perairan
                </label>
                <div className="relative">
                  <select 
                    value={exportModalPerairan} 
                    onChange={(e) => {
                      setExportModalPerairan(e.target.value);
                      setExportModalJenis('');
                      setExportModalTahun('');
                      setExportModalBulan('');
                      setExportModalWilayah('');
                      setExportModalJenisPerairan('');
                    }} 
                    className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none transition-all cursor-pointer hover:border-blue-500/50"
                  >
                    <option value="" disabled>Pilih Sumber Perairan...</option>
                    <option value="PELABUHAN">Pelabuhan</option>
                    <option value="PUD">PUD</option>
                    <option value="KAB_KOTA">Non Pelabuhan</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Jenis Laporan */}
              {exportModalPerairan === 'PELABUHAN' && (
                <div className="bg-card border border-border p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 hover:shadow-md transition-shadow">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    Jenis Laporan
                  </label>
                  <div className="relative">
                    <select 
                      value={exportModalJenis} 
                      onChange={(e) => {
                        setExportModalJenis(e.target.value);
                        setExportModalTahun('');
                        setExportModalBulan('');
                        setExportModalWilayah('');
                      }} 
                      className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all cursor-pointer hover:border-indigo-500/50"
                    >
                      <option value="" disabled>Pilih Jenis Laporan...</option>
                      <option value="REKAP">Rekap Statistik</option>
                      <option value="LM">Laporan Monitoring (LM)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Jenis Perairan (Khusus PUD) */}
              {exportModalPerairan === 'PUD' && (
                <div className="bg-card border border-border p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 hover:shadow-md transition-shadow">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                    <Droplet className="w-4 h-4 text-cyan-500" />
                    Jenis Perairan PUD
                  </label>
                  <div className="relative">
                    <SearchableSelect 
                      placement="top"
                      value={exportModalJenisPerairan} 
                      onChange={(e) => setExportModalJenisPerairan(e.target.value)} 
                      options={PERAIRAN_OPTIONS.map(opt => ({ value: opt, label: opt }))}
                      placeholder="Pilih Jenis Perairan..."
                    />
                  </div>
                </div>
              )}

              {/* Tahun & Bulan */}
              {((exportModalPerairan === 'PELABUHAN' && exportModalJenis) || 
                (exportModalPerairan && exportModalPerairan !== 'PELABUHAN')) && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="bg-card border border-border p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      Tahun
                    </label>
                      <div className="relative">
                        <SearchableSelect 
                          placement="top"
                          value={exportModalTahun} 
                          onChange={(e) => {
                            setExportModalTahun(e.target.value);
                            setExportModalWilayah('');
                          }} 
                          options={TAHUN_OPTIONS.map(opt => ({ value: String(opt), label: String(opt) }))}
                          placeholder="Tahun..."
                        />
                      </div>
                  </div>
                  <div className="bg-card border border-border p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      Bulan
                    </label>
                    <div className="relative">
                      <SearchableSelect 
                        placement="top"
                        value={exportModalBulan} 
                        onChange={(e) => {
                          setExportModalBulan(e.target.value);
                          setExportModalWilayah('');
                        }} 
                        options={BULAN_OPTIONS.map((opt, i) => ({ value: String(i+1), label: opt }))}
                        placeholder="Bulan..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Wilayah */}
              {exportModalTahun && exportModalBulan && (
                <div className="bg-card border border-border p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 hover:shadow-md transition-shadow">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    {exportModalPerairan === 'PELABUHAN' ? 'Pilih Pelabuhan' : 'Wilayah / Kabupaten Kota'}
                  </label>
                  <div className="relative">
                      <SearchableSelect 
                        placement="top"
                        value={exportModalWilayah} 
                        onChange={(e) => setExportModalWilayah(e.target.value)} 
                        options={exportModalPerairan === 'PELABUHAN' ? PELABUHAN_OPTIONS.map(opt => ({ value: opt, label: opt })) : KAB_KOTA_OPTIONS.map(opt => ({ value: opt, label: opt }))}
                        placeholder="Pilih lokasi..."
                      />
                    </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3 rounded-b-3xl">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="px-6 py-2.5 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleModalExport}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg hover:shadow-indigo-500/20 flex items-center gap-2 group"
              >
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                Unduh Laporan
              </button>
            </div>
          </div>
        </div>
      )}

</div>
  );
}
