import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { PerikananTangkapForm } from '@/components/admin/PerikananTangkapForm';
import { DataPublikTangkap } from '@/components/admin/DataPublikTangkap';
import { 
  Plus, Loader2, Database, TrendingUp, Ship, Anchor, 
  Fish, MapPin, LineChart, FileText, Filter, BarChart3, AlertCircle 
} from 'lucide-react';
import { formatDate } from '@/utils/dateHelper';
import { formatRupiah } from '@/utils/formatRupiah';
import * as XLSX from 'xlsx-js-style';
import { KOMODITAS_OPTIONS, PELABUHAN_OPTIONS, KOMODITAS_PUD_OPTIONS } from '@/utils/constants';
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
  const [filterTahun, setFilterTahun] = useState(currentYear.toString());
  const [filterBulan, setFilterBulan] = useState('');
  const [filterCabang, setFilterCabang] = useState(''); // PELABUHAN, PUD, KAB_KOTA
  const [filterKomoditas, setFilterKomoditas] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('');

  // Local Chart Filter for Harga
  const [chartHargaKomoditas, setChartHargaKomoditas] = useState(KOMODITAS_OPTIONS[0]);
  const [chartHargaWilayah, setChartHargaWilayah] = useState([]);

  const [stats, setStats] = useState({
    kpi: { total_volume: 0, total_nilai: 0, total_trip: 0, avg_volume_per_trip: 0 },
    komoditas: [],
    pelabuhan: [],
    tren: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dataRes] = await Promise.all([
        api.get(`/perikanan-tangkap/admin`)
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
    if (row.status === 'APPROVED') {
      alert('Data sudah divalidasi sepenuhnya (Program).');
      return;
    }

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
      targetStatus = 'APPROVED_BIDANG';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (row.status === 'APPROVED_BIDANG') {
      promptMsg = 'Data sudah divalidasi Bidang.\nKetik "2" untuk melakukan Validasi Program:';
      const jenis = window.prompt(promptMsg);
      if (jenis !== '2') {
         if (jenis) alert('Pilihan tidak valid.');
         return;
      }
      targetStatus = 'APPROVED';
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
      const invalidRows = selectedRows.filter(row => row.status === 'APPROVED' || row.status === 'APPROVED_BIDANG');
      if (invalidRows.length > 0) {
        alert('Beberapa data yang dipilih sudah divalidasi Bidang/Program! Silakan pilih data yang berstatus PENDING saja.');
        return;
      }
      targetStatus = 'APPROVED_BIDANG';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (jenis === '2') {
      const invalidRows = selectedRows.filter(row => row.status !== 'APPROVED_BIDANG');
      if (invalidRows.length > 0) {
        alert('Validasi Program ditolak! Pastikan SEMUA data yang dipilih sudah divalidasi oleh Bidang (Status: APPROVED_BIDANG) terlebih dahulu.');
        return;
      }
      targetStatus = 'APPROVED';
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

    const total_trip = filteredData.length;
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
    
    filteredData.forEach(row => {
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
  }, [filteredData, chartHargaKomoditas, chartHargaWilayah]);

  const handleExportLaporanPelabuhan = () => {
    if (!filterWilayah) return;
    const pelabuhanName = filterWilayah.toUpperCase();
    const dateStr = filterTahun ? (filterBulan ? `${filterBulan}/${filterTahun}` : filterTahun) : 'Semua Waktu';
    
    let summaryDateStr = dateStr;
    if (filterTahun && filterBulan) {
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
    
    const row4 = ['NO', 'TANGGAL', 'WAKTU LABUH', 'WAKTU BONGKAR', 'Jenis Muatan', 'WPPNRI', 'Nama Kapal', 'Ukuran', 'API', 'Kapal Pengangkut', 'Catatan', 'Total Produksi', '', 'I k a n'];
    const row5 = ['', '', '', '', '', '', '', '', '', '', '', '', ''];
    const row6 = ['', '', '', '', '', '', '', '', '', '', '', 'Volume', 'Nilai'];
    
    const komoditasTotalMap = {};
    const komoditasArray = [...new Set([...KOMODITAS_OPTIONS, ...KOMODITAS_PUD_OPTIONS])];
    komoditasArray.forEach(kom => {
      row5.push(kom, '', '');
      row6.push('Vol', 'Harga', 'Nilai');
      komoditasTotalMap[kom] = { vol: 0, nilai: 0 };
    });

    let totalKeseluruhanVol = 0;
    let totalKeseluruhanNilai = 0;
    const apiSummaryMap = {};

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

    // Baris Total Tangkapan & Nilai di akhir data
    const rowTotal1 = ['TOTAL TANGKAPAN', '', '', '', '', '', '', '', '', '', '', totalKeseluruhanVol, ''];
    const rowTotal2 = ['Nilai', '', '', '', '', '', '', '', '', '', '', '', totalKeseluruhanNilai];
    
    // Padding sisa kolom komoditas agar format border tetap rapi
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

    const allRowsToRender = [
      row0, row1, row2, row3, row4, row5, row6, 
      ...dataRows, 
      rowTotal1, rowTotal2, 
      emptyRow, emptyRow,
      summaryHeader1, summaryHeader2, summaryHeader3,
      ...summaryRows,
      summaryTotalRow
    ];

    const ws = XLSX.utils.aoa_to_sheet(allRowsToRender);

    const borderStyle = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    const boldCenter = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: borderStyle, fill: { fgColor: { rgb: "EFEFEF" } } };
    const normalCenter = { alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle };
    
    // Style khusus untuk baris bawah
    const totalRowStyle1 = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "FFFF00" } } };
    const totalRowStyle2 = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "C9DAF8" } } };
    const summaryHeaderStyle1 = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "FCE5CD" } } };
    const summaryDataStyle = { alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "FCE5CD" } } };
    const summaryTotalStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "E06666" } } }; // Merah redup
    const summaryGreenStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "D9EAD3" } } };

    const summaryStartRowIndex = 7 + dataRows.length + 4; // index 0-based

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

        if (R === 0) ws[cellRef].s = { font: { bold: true, sz: 14 } };
        else if (R === 3) ws[cellRef].s = { font: { bold: true } };
        else if (R >= 4 && R <= 6) ws[cellRef].s = boldCenter;
        else if (R >= 7 && R < 7 + dataRows.length) ws[cellRef].s = normalCenter;
        else if (R === 7 + dataRows.length) {
            // TOTAL TANGKAPAN (Seluruh Kolom)
            ws[cellRef].s = totalRowStyle1; 
        } else if (R === 7 + dataRows.length + 1) {
            // Nilai (Seluruh Kolom)
            ws[cellRef].s = totalRowStyle2;
        } else if (R === summaryStartRowIndex || R === summaryStartRowIndex + 1 || R === summaryStartRowIndex + 2) {
            // SUMMARY HEADER
            if (C <= 5) ws[cellRef].s = summaryHeaderStyle1;
        } else if (R > summaryStartRowIndex + 2 && R < summaryStartRowIndex + 3 + summaryRows.length) {
            // SUMMARY DATA
            if (C <= 5) ws[cellRef].s = summaryDataStyle;
        } else if (R === summaryStartRowIndex + 3 + summaryRows.length) {
            // SUMMARY TOTAL
            if (C <= 5) ws[cellRef].s = summaryTotalStyle;
        }
      }
    }

    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // REKAPITULASI...
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Hari, Tanggal...
      { s: { r: 3, c: 0 }, e: { r: 3, c: 10 } }, // 1. PRODUKSI IKAN
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
      { s: { r: 4, c: 10 }, e: { r: 6, c: 10 } },
      { s: { r: 4, c: 11 }, e: { r: 5, c: 12 } },
      { s: { r: 4, c: 13 }, e: { r: 4, c: 12 + komoditasArray.length * 3 } }
    ];
    
    let currentCol = 13;
    komoditasArray.forEach(() => {
      merges.push({ s: { r: 5, c: currentCol }, e: { r: 5, c: currentCol + 2 } });
      currentCol += 3;
    });

    // Merge TOTAL TANGKAPAN (dari NO ke Catatan)
    merges.push({ s: { r: 7 + dataRows.length, c: 0 }, e: { r: 7 + dataRows.length, c: 10 } });
    // Merge Nilai (dari NO ke Total Produksi Volume)
    merges.push({ s: { r: 7 + dataRows.length + 1, c: 0 }, e: { r: 7 + dataRows.length + 1, c: 11 } });

    // Merges for summary table
    merges.push({ s: { r: summaryStartRowIndex, c: 0 }, e: { r: summaryStartRowIndex, c: 5 } });
    merges.push({ s: { r: summaryStartRowIndex + 1, c: 0 }, e: { r: summaryStartRowIndex + 2, c: 0 } }); // No.
    merges.push({ s: { r: summaryStartRowIndex + 1, c: 1 }, e: { r: summaryStartRowIndex + 2, c: 1 } }); // Alat Penangkapan Ikan
    merges.push({ s: { r: summaryStartRowIndex + 1, c: 2 }, e: { r: summaryStartRowIndex + 1, c: 3 } }); // Pendaratan Langsung
    merges.push({ s: { r: summaryStartRowIndex + 1, c: 4 }, e: { r: summaryStartRowIndex + 1, c: 5 } }); // Alih Muat

    merges.push({ s: { r: summaryStartRowIndex + 3 + summaryRows.length, c: 0 }, e: { r: summaryStartRowIndex + 3 + summaryRows.length, c: 1 } }); // Total Produksi

    ws['!merges'] = merges;

    const colWidths = [{ wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
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
          label = 'APPROVED (PROGRAM)';
        } else if (status === 'APPROVED_BIDANG') {
          colorClass = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
          label = 'APPROVED (BIDANG)';
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
      header: 'Cabang',
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
        return val || row.kabupaten_kota || '-';
      }
    },
    {
      header: 'Nama Kapal / Populasi Alat (PUD)',
      accessorKey: 'nama_kapal',
      cell: info => {
        const row = info.row.original;
        if (row.sumber_data === 'PUD') {
          return <span className="text-emerald-600 font-medium">{row.pud_populasi_alat || '-'} Unit</span>;
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
    const dates = computedStats.tren.map(t => {
      if (!t.date) return '';
      const parts = t.date.split('-');
      if (parts.length < 2) return t.date;
      const [y, m] = parts;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
    });
    const volumes = computedStats.tren.map(t => t.volume);
    const nilais = computedStats.tren.map(t => t.nilai);

    return {
      volume: {
        tooltip: { trigger: 'axis', formatter: (params) => `<b>${params[0].name}</b><br/>Volume: ${params[0].value.toLocaleString('id-ID')} Kg` },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dates, axisLabel: { color: '#f8fafc' } },
        yAxis: { type: 'value', name: 'Volume (Kg)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { color: '#334155' } } },
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
              Log Laporan Cabang
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
                  <option value="KAB_KOTA">Non Pelabuhan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Tahun</option>
                  {TAHUN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              {activeTab === 'data' && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bulan</label>
                  <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Semua Bulan</option>
                    {BULAN_OPTIONS.map((opt, i) => <option key={opt} value={i+1}>{opt}</option>)}
                  </select>
                </div>
              )}
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
                onBatchApprove={handleBatchApprove}
                onBatchReject={handleBatchReject}
                onBatchDelete={handleBatchDelete}
                canBatchApprove={(selectedRows) => selectedRows.some(row => 
                  (user?.role === 'admin_pusat' && row.status === 'APPROVED_BIDANG') || 
                  (user?.role === 'admin_bidang' && row.status === 'PENDING') ||
                  (user?.role === 'admin_pusat' && row.status === 'PENDING')
                )}
                canBatchReject={(selectedRows) => selectedRows.some(row => 
                  (user?.role === 'admin_pusat' && row.status === 'APPROVED_BIDANG') || 
                  (user?.role === 'admin_bidang' && row.status === 'PENDING') ||
                  (user?.role === 'admin_pusat' && row.status === 'PENDING')
                )}
                exportName={`Perikanan_Tangkap_${filterCabang || 'All'}_${filterTahun || 'All'}`}
                renderSubComponent={renderSubComponent}
                onCustomExport={(exportData) => {
                  const komoditasArray = [...new Set([...KOMODITAS_OPTIONS, ...KOMODITAS_PUD_OPTIONS])];

                  const headerRow1 = ['Tanggal', 'Cabang', 'Jam Labuh', 'Jam Bongkar', 'Nama Kapal / Populasi Alat (PUD)', 'Ukuran/GT', 'Alat Tangkap', 'Pelabuhan/Lokasi', 'Catatan/Logistik / Jml Sampel (PUD)', 'Total Volume (Kg)', 'Total Nilai (Rp)'];
                  const headerRow2 = ['', '', '', '', '', '', '', '', '', '', ''];
                  
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
                      row.tanggal ? row.tanggal.split('T')[0] : '-',
                      row.sumber_data === 'PUD' ? 'PUD' : (row.sumber_data === 'KAB_KOTA' ? 'Non Pelabuhan' : 'Pelabuhan'),
                      row.jam_labuh || '-',
                      row.jam_bongkar || '-',
                      row.sumber_data === 'PUD' ? (row.pud_populasi_alat ? `${row.pud_populasi_alat} Unit` : '-') : (row.nama_kapal || '-'),
                      row.sumber_data === 'PUD' ? '-' : (row.gt_kapal || '-'),
                      row.alat_tangkap || '-',
                      row.sumber_data === 'PUD' ? `${row.kabupaten_kota || '-'} (${row.jenis_perairan || '-'})` : (row.pelabuhan || row.kabupaten_kota || '-'),
                      row.sumber_data === 'PUD' ? (row.pud_jumlah_sampel ? `${row.pud_jumlah_sampel} Unit` : '-') : (row.logistik || '-'),
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
                        ws[cellRef].s = C > 9 ? komoditasHeaderStyle : headerStyle;
                      } else if (R === 1) {
                        ws[cellRef].s = C > 9 ? subHeaderStyle : headerStyle;
                      } else {
                        ws[cellRef].s = dataStyle;
                      }
                    }
                  }

                  const merges = [];
                  for (let i = 0; i <= 9; i++) {
                    merges.push({ s: { r: 0, c: i }, e: { r: 1, c: i } });
                  }
                  
                  let currentCol = 10;
                  komoditasArray.forEach(() => {
                    merges.push({ s: { r: 0, c: currentCol }, e: { r: 0, c: currentCol + 2 } });
                    currentCol += 3;
                  });
                  ws['!merges'] = merges;

                  const colWidths = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 20 }];
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

              {/* PERBANDINGAN HARGA KOMODITAS */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Perbandingan Harga Komoditas (Rp/Kg)</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={chartHargaKomoditas} onChange={(e) => setChartHargaKomoditas(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50">
                      {KOMODITAS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    
                    <div className="relative group">
                      <button className="px-3 py-2 border rounded-lg bg-background text-sm flex items-center gap-2 hover:bg-muted transition-colors">
                         Pilih Wilayah ({chartHargaWilayah.length > 0 ? chartHargaWilayah.length : 'Top 10'})
                      </button>
                      <div className="absolute top-full right-0 mt-1 w-64 bg-card border rounded-lg shadow-xl p-2 hidden group-hover:flex flex-col gap-1 max-h-64 overflow-y-auto z-50">
                         {PELABUHAN_OPTIONS.map(opt => (
                            <label key={opt} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer">
                               <input 
                                 type="checkbox" 
                                 className="rounded border-border text-primary focus:ring-primary"
                                 checked={chartHargaWilayah.includes(opt)} 
                                 onChange={(e) => {
                                   if (e.target.checked) {
                                      setChartHargaWilayah(prev => [...prev, opt]);
                                   } else {
                                      setChartHargaWilayah(prev => prev.filter(x => x !== opt));
                                   }
                                 }} 
                               />
                               <span className="text-sm truncate text-foreground">{opt}</span>
                            </label>
                         ))}
                         {chartHargaWilayah.length > 0 && (
                            <button 
                              onClick={() => setChartHargaWilayah([])}
                              className="mt-2 text-xs text-rose-500 hover:text-rose-600 font-medium py-1 border-t"
                            >
                              Reset Wilayah (Kembali ke Top 10)
                            </button>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
                {computedStats.hargaCategories && computedStats.hargaCategories.length > 0 ? (
                  <ReactECharts option={hargaChartOption} style={{ height: '400px', width: '100%' }} />
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                    Belum ada data pelabuhan untuk komoditas ini
                  </div>
                )}
              </div>
            </div>
          )
        )
      )}
    </div>
  );
}
