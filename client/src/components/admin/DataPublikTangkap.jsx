import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { Edit2, RotateCcw, AlertCircle, CheckCircle, Save, X, Download, FileText } from 'lucide-react';
import { formatRupiah } from '@/utils/formatRupiah';
import { KOMODITAS_OPTIONS, KOMODITAS_PUD_OPTIONS } from '@/utils/constants';

export function DataPublikTangkap({ filterTahun, filterCabang, filterWilayah, filterKomoditas }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({ volume: 0, nilai: 0, hargaRataRata: 0 });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchVolumePct, setBatchVolumePct] = useState('');

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

  const handleEditClick = (item) => {
    setEditingRow(item.id);
    const hargaRata = Number(item.volume) > 0 ? Number(item.nilai) / Number(item.volume) : 0;
    setEditForm({ volume: item.volume, nilai: item.nilai, hargaRataRata: hargaRata });
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
    if (!batchVolumePct) return alert("Masukkan persentase koreksi Volume!");
    try {
      setSubmitLoading(true);

      // Extract real IDs from aggregated keys
      let realIds = [];
      selectedIds.forEach(key => {
        const aggrItem = aggregatedData.find(a => a.id === key);
        if (aggrItem) {
          realIds.push(...aggrItem.tangkapan.map(t => t.id));
        }
      });

      if (realIds.length === 0) return alert("Tidak ada data validasi yang dipilih");

      await api.post('/bulanan-tangkap/batch-target', {
        ids: realIds,
        volumePercentage: Number(batchVolumePct || 0),
        nilaiPercentage: Number(batchVolumePct || 0)
      });
      clearSelection();
      setBatchMode(false);
      setBatchVolumePct('');
      fetchData();
    } catch (err) {
      console.error('Error batch update:', err);
      alert("Gagal melakukan koreksi massal");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleExport = (isRiil) => {
    // Generate headers
    const headerRow1 = ['Bulan / Tahun', 'Cabang Sumber', 'Wilayah / Lokasi', 'Total Volume (Kg)', 'Total Nilai Produksi (Rp)'];
    const headerRow2 = ['', '', '', '', ''];

    const komoditasArray = [...new Set([...KOMODITAS_OPTIONS, ...KOMODITAS_PUD_OPTIONS])];
    komoditasArray.forEach(kom => {
      headerRow1.push(kom, '', '');
      headerRow2.push('Volume (Kg)', 'Harga (Rp)', 'Nilai (Rp)');
    });

    const dataRows = aggregatedData.map(row => {
      const blnParts = row.bulan.split('-');
      const blnFormatted = row.bulan === 'Unknown' ? 'Unknown' : `${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][parseInt(blnParts[1], 10) - 1]} ${blnParts[0]}`;
      
      let cabangStr = row.sumber_data;
      if (cabangStr === 'KAB_KOTA') cabangStr = 'Non Pelabuhan';
      if (cabangStr === 'PELABUHAN') cabangStr = 'Pelabuhan';
      if (cabangStr === 'PUD') cabangStr = 'PUD';

      const rowVolume = isRiil ? row.tangkapan.reduce((acc, curr) => acc + (Number(curr.original_volume) || 0), 0) : row.volume;
      const rowNilai = isRiil ? row.tangkapan.reduce((acc, curr) => acc + (Number(curr.original_nilai) || 0), 0) : row.nilai;

      const baseRow = [
        blnFormatted,
        cabangStr,
        row.pelabuhan,
        rowVolume,
        rowNilai
      ];

      const komMap = {};
      row.tangkapan.forEach(t => { 
        const v = isRiil ? t.original_volume : t.volume;
        const n = isRiil ? t.original_nilai : t.nilai;
        komMap[t.komoditas] = { 
          vol: v, 
          nilai: n, 
          harga: v > 0 ? (n / v) : 0 
        }; 
      });

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
          ws[cellRef].s = C > 4 ? komoditasHeaderStyle : headerStyle;
        } else if (R === 1) {
          ws[cellRef].s = C > 4 ? subHeaderStyle : headerStyle;
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
    for (let i = 0; i <= 4; i++) {
      merges.push({ s: { r: 0, c: i }, e: { r: 1, c: i } });
    }
    
    let currentCol = 5;
    komoditasArray.forEach(() => {
      merges.push({ s: { r: 0, c: currentCol }, e: { r: 0, c: currentCol + 2 } });
      currentCol += 3;
    });
    ws['!merges'] = merges;

    const colWidths = [{ wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }];
    komoditasArray.forEach(() => {
      colWidths.push({ wch: 12 }, { wch: 12 }, { wch: 15 });
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    const sheetName = isRiil ? "Data_Riil" : "Data_Validasi";
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `Data_Publik_Tangkap_${sheetName}_${filterTahun || 'All'}.xlsx`);
  };

  const renderCustomBatchActions = (selectedIds, clearSelection) => {
    if (batchMode) {
      return (
        <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border border-border">
          <span className="text-xs font-medium text-muted-foreground mr-1">Naikkan/Turunkan Volume & Nilai:</span>
          <div className="relative">
            <input 
              type="number" 
              placeholder="Persentase (mis: 10)" 
              value={batchVolumePct}
              onChange={e => setBatchVolumePct(e.target.value)}
              className="w-36 pl-2 pr-6 py-1 text-xs border border-border bg-background rounded outline-none focus:ring-1 focus:ring-primary" 
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
            onClick={() => { setBatchMode(false); setBatchVolumePct(''); }}
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
      header: 'Bulan / Tahun',
      accessorKey: 'bulan',
      cell: ({ row }) => {
        const val = row.original.bulan;
        if(val === 'Unknown') return val;
        const parts = val.split('-');
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${monthNames[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
      }
    },
    { 
      header: 'Cabang', 
      accessorKey: 'sumber_data',
      cell: ({ row }) => {
        const val = row.original.sumber_data;
        if (val === 'KAB_KOTA') return <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">Non Pelabuhan</span>;
        if (val === 'PELABUHAN') return <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">Pelabuhan</span>;
        return <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">PUD</span>;
      }
    },
    { header: 'Wilayah / Lokasi', accessorKey: 'pelabuhan' },
    {
      header: 'Total Volume (Kg)',
      accessorKey: 'volume',
      cell: ({ row }) => <span className="font-medium">{row.original.volume.toLocaleString('id-ID')}</span>
    },
    {
      header: 'Total Nilai Produksi (Rp)',
      accessorKey: 'nilai',
      cell: ({ row }) => <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatRupiah(row.original.nilai)}</span>
    }
  ], []);

  const handleExportLaporanPelabuhanBulanan = () => {
    if (!filterWilayah) return;
    const pelabuhanName = filterWilayah.toUpperCase();
    const dateStr = filterTahun ? filterTahun : 'Semua Waktu';
    
    const row0 = [`REKAPITULASI DATA BULANAN PELABUHAN ${pelabuhanName}`];
    const row1 = [`Tahun : ${dateStr}`];
    const row2 = [];
    const row3 = ['1. PRODUKSI PELABUHAN'];
    
    const row4 = ['NO', 'BULAN / TAHUN', 'CABANG SUMBER', 'WILAYAH / LOKASI', 'Total Produksi', '', 'I k a n'];
    const row5 = ['', '', '', '', '', ''];
    const row6 = ['', '', '', '', 'Volume', 'Nilai'];
    
    const komoditasArray = [...KOMODITAS_OPTIONS];

    let grandTotalVolume = 0;
    let grandTotalNilai = 0;
    const komoditasTotalMap = {};
    komoditasArray.forEach(k => komoditasTotalMap[k] = { vol: 0, nilai: 0 });

    const dataRows = aggregatedData.map((row, index) => {
      const blnParts = row.bulan.split('-');
      const blnFormatted = row.bulan === 'Unknown' ? 'Unknown' : `${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][parseInt(blnParts[1], 10) - 1]} ${blnParts[0]}`;
      
      let cabangStr = row.sumber_data;
      if (cabangStr === 'KAB_KOTA') cabangStr = 'Non Pelabuhan';
      if (cabangStr === 'PELABUHAN') cabangStr = 'Pelabuhan';
      if (cabangStr === 'PUD') cabangStr = 'PUD';

      grandTotalVolume += Number(row.volume) || 0;
      grandTotalNilai += Number(row.nilai) || 0;

      const baseRow = [
        index + 1,
        blnFormatted,
        cabangStr,
        row.pelabuhan,
        row.volume,
        row.nilai
      ];

      const komMap = {};
      row.tangkapan.forEach(t => { 
        komMap[t.komoditas] = { vol: t.volume, nilai: t.nilai };
        if (komoditasTotalMap[t.komoditas]) {
          komoditasTotalMap[t.komoditas].vol += Number(t.volume) || 0;
          komoditasTotalMap[t.komoditas].nilai += Number(t.nilai) || 0;
        }
      });

      komoditasArray.forEach(kom => {
        if (komMap[kom]) {
          baseRow.push(komMap[kom].vol, komMap[kom].nilai);
        } else {
          baseRow.push(0, 0);
        }
      });

      return baseRow;
    });

    komoditasArray.forEach(kom => {
      row4.push('', '');
      row5.push(kom, '');
      row6.push('Volume', 'Nilai');
    });

    const totalRow = ['TOTAL PENDARATAN IKAN SELURUH WAKTU', '', '', '', grandTotalVolume, grandTotalNilai];
    komoditasArray.forEach(kom => {
      totalRow.push(komoditasTotalMap[kom].vol, komoditasTotalMap[kom].nilai);
    });
    dataRows.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet([row0, row1, row2, row3, row4, row5, row6, ...dataRows]);

    const borderStyle = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    const headerStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: borderStyle, fill: { fgColor: { rgb: "C9DAF8" } } };
    const komoditasHeaderStyle = { ...headerStyle, fill: { fgColor: { rgb: "D9EAD3" } } };
    const dataStyle = { alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle };
    const titleStyle = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'left', vertical: 'center' } };
    const totalStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, fill: { fgColor: { rgb: "FCE5CD" } } };

    const totalRowIndex = 7 + aggregatedData.length;

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

        if (R < 4) {
          if (C === 0) ws[cellRef].s = titleStyle;
        } else if (R >= 4 && R <= 6) {
          ws[cellRef].s = C > 5 ? komoditasHeaderStyle : headerStyle;
        } else if (R === totalRowIndex) {
          ws[cellRef].s = totalStyle;
          if (typeof ws[cellRef].v === 'number') {
            if (ws[cellRef].v === 0) {
              ws[cellRef].v = '-';
              ws[cellRef].t = 's';
            } else {
              ws[cellRef].z = '#,##0';
            }
          }
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

    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 10 } },
      { s: { r: 4, c: 0 }, e: { r: 6, c: 0 } },
      { s: { r: 4, c: 1 }, e: { r: 6, c: 1 } },
      { s: { r: 4, c: 2 }, e: { r: 6, c: 2 } },
      { s: { r: 4, c: 3 }, e: { r: 6, c: 3 } },
      { s: { r: 4, c: 4 }, e: { r: 5, c: 5 } },
      { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 3 } }
    ];
    
    let currentCol = 6;
    komoditasArray.forEach(() => {
      merges.push({ s: { r: 5, c: currentCol }, e: { r: 5, c: currentCol + 1 } });
      currentCol += 2;
    });
    
    merges.push({ s: { r: 4, c: 6 }, e: { r: 4, c: currentCol - 1 } });
    ws['!merges'] = merges;

    const colWidths = [{ wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }];
    komoditasArray.forEach(() => colWidths.push({ wch: 10 }, { wch: 12 }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produksi_Bulanan");
    XLSX.writeFile(wb, `Laporan_Bulanan_${pelabuhanName}_${dateStr}.xlsx`);
  };

  const renderSubComponent = ({ row }) => {
    const tangkapan = row.original.tangkapan || [];
    if (tangkapan.length === 0) return <div className="p-4 text-center text-muted-foreground text-sm">Belum ada detail tangkapan</div>;
    
    return (
      <div className="p-4 bg-muted/10 border-l-4 border-primary">
        <h4 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
          Rincian Komoditas & Koreksi (Agregat Bulanan)
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-border rounded-lg overflow-hidden">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Komoditas</th>
                <th className="px-4 py-2 font-medium">Total Volume (Kg)</th>
                <th className="px-4 py-2 font-medium text-right">Total Nilai Produksi (Rp)</th>
                <th className="px-4 py-2 font-medium">Status Data</th>
                <th className="px-4 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {tangkapan.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50">
                  <td className="px-4 py-2 font-medium">{item.komoditas}</td>
                  <td className="px-4 py-2">
                    {editingRow === item.id ? (
                      <input 
                        type="number" 
                        value={editForm.volume}
                        onChange={(e) => {
                          const newVol = e.target.value;
                          setEditForm({ ...editForm, volume: newVol, nilai: newVol * editForm.hargaRataRata });
                        }}
                        className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : item.volume.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-2 font-medium text-right text-emerald-600 dark:text-emerald-400">
                    {editingRow === item.id ? (
                      <input 
                        type="number" 
                        value={editForm.nilai}
                        disabled
                        className="w-32 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed opacity-80"
                      />
                    ) : formatRupiah(item.nilai)}
                  </td>
                  <td className="px-4 py-2">
                    {item.is_adjusted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <AlertCircle className="w-3.5 h-3.5" /> Validasi Khusus
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3.5 h-3.5" /> Sistem (Default)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingRow === item.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleSaveEdit(item.id)} disabled={submitLoading} className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded hover:bg-emerald-500/20 transition" title="Simpan Validasi"><Save className="w-4 h-4" /></button>
                        <button onClick={handleCancelEdit} disabled={submitLoading} className="p-1.5 bg-slate-500/10 text-slate-600 rounded hover:bg-slate-500/20 transition" title="Batal"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditClick(item)} className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition"><Edit2 className="w-3.5 h-3.5" /> Koreksi</button>
                        {item.is_adjusted && (
                          <button onClick={() => handleReset(item.id)} className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-medium hover:bg-rose-500/20 transition"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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

  const aggregatedData = useMemo(() => {
    const map = {};
    filteredData.forEach(row => {
      const bln = row.bulan || 'Unknown';
      const pel = row.pelabuhan || 'Lainnya';
      const cabang = row.sumber_data || 'PELABUHAN';
      
      const key = `${bln}_${cabang}_${pel}`;
      if(!map[key]) {
        map[key] = { id: key, bulan: bln, pelabuhan: pel, sumber_data: cabang, volume: 0, nilai: 0, tangkapan: [] };
      }
      
      map[key].volume += Number(row.volume) || 0;
      map[key].nilai += Number(row.nilai) || 0;
      
      map[key].tangkapan.push({
        id: row.id,
        komoditas: row.komoditas,
        volume: Number(row.volume) || 0,
        nilai: Number(row.nilai) || 0,
        original_volume: Number(row.original_volume) || 0,
        original_nilai: Number(row.original_nilai) || 0,
        is_adjusted: row.is_adjusted
      });
    });
    return Object.values(map).sort((a, b) => b.bulan.localeCompare(a.bulan));
  }, [filteredData]);

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  const totalVolume = aggregatedData.reduce((acc, curr) => acc + (Number(curr.volume) || 0), 0);
  const totalNilai = aggregatedData.reduce((acc, curr) => acc + (Number(curr.nilai) || 0), 0);

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Data Tervalidasi Publik
            <span className="text-xs font-normal px-2 py-1 bg-primary/10 text-primary rounded-full">Total {aggregatedData.length} Data Bulanan</span>
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
        data={aggregatedData}
        exportName={`Data_Validasi_Bidang_${filterTahun || 'All'}`}
        defaultPageSize={50}
        customBatchActions={renderCustomBatchActions}
        renderSubComponent={renderSubComponent}
        hideDefaultExport={true}
        customExportButton={
          <div className="flex gap-2">
            {filterWilayah && filterCabang === 'PELABUHAN' && (
              <button
                onClick={handleExportLaporanPelabuhanBulanan}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
                title="Unduh Laporan Pelabuhan berformat bulanan"
              >
                <FileText className="w-4 h-4" />
                Unduh Laporan Pelabuhan
              </button>
            )}
            <button
              onClick={() => handleExport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-500/10 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-500/20 transition-colors text-sm font-medium"
              title="Unduh data asli sebelum divalidasi"
            >
              <Download className="w-4 h-4" />
              Unduh Data Riil
            </button>
            <button
              onClick={() => handleExport(false)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
              title="Unduh data yang sudah divalidasi admin"
            >
              <Download className="w-4 h-4" />
              Unduh Data Validasi
            </button>
          </div>
        }
      />
    </div>
  );
}
