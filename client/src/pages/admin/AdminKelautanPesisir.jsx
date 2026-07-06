import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Loader2, Map, Waves, TreePine, Trash2, X, FlaskConical, Layers,
  BarChart3, CheckCircle, XCircle, FileSpreadsheet, Leaf, Anchor, Globe,
  TableProperties, LineChart as LineChartIcon
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import ReactECharts from 'echarts-for-react';
import api from '@/services/api';
import { KelautanPesisirForm } from '@/components/admin/KelautanPesisirForm';
import { PotensiPerairanForm } from '@/components/admin/PotensiPerairanForm';

// ── KONSTANTA ───────────────────────────────────────────────────────────────────
const NAMA_BULAN_LIST = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const formatBulan = (val) => {
  if (!val && val !== 0) return '-';
  if (typeof val === 'number') return NAMA_BULAN_LIST[val - 1] ?? String(val);
  const asNum = parseInt(val, 10);
  if (!isNaN(asNum) && String(asNum) === String(val)) return NAMA_BULAN_LIST[asNum - 1] ?? val;
  return val;
};

const getTriwulan = (bulan) => {
  const b = bulan?.toLowerCase() ?? '';
  if (['januari','februari','maret'].includes(b)) return 'TW 1';
  if (['april','mei','juni'].includes(b)) return 'TW 2';
  if (['juli','agustus','september'].includes(b)) return 'TW 3';
  if (['oktober','november','desember'].includes(b)) return 'TW 4';
  return '-';
};

// ── SHARED COMPONENTS ───────────────────────────────────────────────────────────
const StatusBadge = ({ status, alasan }) => {
  const styleMap = {
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    APPROVED_BIDANG: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };
  const cls = styleMap[status] ?? styleMap.PENDING;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${cls}`}>{status ?? 'PENDING'}</span>
      {status === 'REJECTED' && alasan && (
        <span className="text-xs text-rose-400 cursor-help" title={`Alasan: ${alasan}`}>(i)</span>
      )}
    </div>
  );
};

const TwBadge = ({ tw }) => {
  const colorMap = {
    'TW 1': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'TW 2': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'TW 3': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'TW 4': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  const cls = colorMap[tw] ?? 'bg-[#152d45] text-[#7fb5d5] border-[#1e3a52]';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cls}`}>{tw ?? '-'}</span>;
};

// ── DATA TABLE ──────────────────────────────────────────────────────────────────
const DataTable = ({ columns, data, onEdit, onDelete, onApprove, onReject, renderSubComponent, exportName, onCustomExport }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  return (
    <div className="rounded-xl border border-[#1e3a52] overflow-hidden">
      {exportName && onCustomExport && (
        <div className="flex justify-end px-4 py-2.5 bg-[#152d45] border-b border-[#1e3a52]">
          <button
            onClick={() => onCustomExport(data)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#152d45] text-[#7fb5d5] border-b border-[#1e3a52]">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3.5 font-semibold whitespace-nowrap tracking-wider text-xs uppercase">{col.header}</th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3.5 font-semibold text-right tracking-wider text-xs uppercase">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e3a52]">
            {data.map((row, i) => (
              <React.Fragment key={i}>
                <tr
                  className={`cursor-pointer transition-colors hover:bg-[#152d45]/60 ${expandedRow === i ? 'bg-[#152d45]/40' : 'bg-[#0f2236]'}`}
                  onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                >
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-3 whitespace-nowrap text-[#c8dff0]">
                      {col.cell
                        ? col.cell({ getValue: () => col.accessorFn ? col.accessorFn(row) : row[col.accessorKey], row: { original: row } })
                        : row[col.accessorKey]}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        {row.status === 'PENDING' && onApprove && (
                          <button onClick={(e) => { e.stopPropagation(); onApprove(row); }} className="text-emerald-400 hover:text-emerald-300 transition-colors" title="Setujui">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {row.status === 'PENDING' && onReject && (
                          <button onClick={(e) => { e.stopPropagation(); onReject(row); }} className="text-rose-400 hover:text-rose-300 transition-colors" title="Tolak">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(row); }} className="text-cyan-400 font-medium hover:text-cyan-200 transition-colors text-xs">Edit</button>}
                        {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(row); }} className="text-rose-400 font-medium hover:text-rose-300 transition-colors text-xs">Hapus</button>}
                      </div>
                    </td>
                  )}
                </tr>
                {expandedRow === i && renderSubComponent && (
                  <tr className="bg-[#0b1929]/80">
                    <td colSpan={columns.length + 1} className="p-0 border-b border-[#1e3a52]">
                      <div className="animate-in slide-in-from-top-2 duration-200">
                        {renderSubComponent({ row: { original: row } })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="p-16 text-center text-[#7fb5d5] bg-[#0f2236]">
                  <Waves className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Belum ada data tersedia.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── EXCEL EXPORT HELPERS ────────────────────────────────────────────────────────
const borderThin = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
const cellStyle = (opts = {}) => ({
  font: { bold: opts.bold ?? false, sz: opts.sz ?? 11, color: opts.fontColor ? { rgb: opts.fontColor } : undefined },
  alignment: { horizontal: opts.align ?? 'center', vertical: 'center', wrapText: true },
  border: borderThin,
  fill: opts.fill ? { fgColor: { rgb: opts.fill } } : undefined,
});

const exportGaramExcel = (data) => {
  const title = 'REKAPITULASI DATA PRODUKSI GARAM JAWA TIMUR';
  const subtitle = `Tahun Data: ${new Date().getFullYear()}`;

  const h1 = ['No', 'Kab/Kota', 'L Total (Ha)', 'Σ Pok', 'Σ Petambak',
    'Produksi (Ton)', '', '', 'Σ Prod (Ton)',
    'Stok (Ton)', '', '', 'Σ Stok (Ton)',
    'Harga (Rp/Kg)', '', '',
    'Produktivitas\n(Ton/Ha)'];
  const h2 = ['', '', '', '', '', 'K1', 'K2', 'K3', '', 'K1', 'K2', 'K3', '', 'K1', 'K2', 'K3', ''];

  let totalProduksi = 0, totalStok = 0, totalLuas = 0, totalPok = 0, totalPetambak = 0;
  let sumHargaK1 = 0, sumHargaK2 = 0, sumHargaK3 = 0;
  let countHargaK1 = 0, countHargaK2 = 0, countHargaK3 = 0;

  const dataRows = data.map((row, i) => {
    totalProduksi += row.total_produksi_ton || 0;
    totalStok += row.total_stok_ton || 0;
    totalLuas += row.luas_total_ha || 0;
    totalPok += row.jumlah_kelompok || 0;
    totalPetambak += row.jumlah_petambak || 0;
    if (row.harga_k1_rp > 0) { sumHargaK1 += row.harga_k1_rp; countHargaK1++; }
    if (row.harga_k2_rp > 0) { sumHargaK2 += row.harga_k2_rp; countHargaK2++; }
    if (row.harga_k3_rp > 0) { sumHargaK3 += row.harga_k3_rp; countHargaK3++; }
    return [
      i + 1,
      row.kabupaten_kota,
      row.luas_total_ha?.toLocaleString('id-ID') ?? 0,
      row.jumlah_kelompok ?? 0,
      row.jumlah_petambak ?? 0,
      row.produksi_k1_ton?.toLocaleString('id-ID') ?? 0,
      row.produksi_k2_ton?.toLocaleString('id-ID') ?? 0,
      row.produksi_k3_ton?.toLocaleString('id-ID') ?? 0,
      row.total_produksi_ton?.toLocaleString('id-ID') ?? 0,
      row.stok_k1_ton?.toLocaleString('id-ID') ?? 0,
      row.stok_k2_ton?.toLocaleString('id-ID') ?? 0,
      row.stok_k3_ton?.toLocaleString('id-ID') ?? 0,
      row.total_stok_ton?.toLocaleString('id-ID') ?? 0,
      row.harga_k1_rp?.toLocaleString('id-ID') ?? 0,
      row.harga_k2_rp?.toLocaleString('id-ID') ?? 0,
      row.harga_k3_rp?.toLocaleString('id-ID') ?? 0,
      row.produktivitas?.toLocaleString('id-ID', { maximumFractionDigits: 3 }) ?? 0,
    ];
  });

  const avgK1 = countHargaK1 > 0 ? (sumHargaK1 / countHargaK1).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '-';
  const avgK2 = countHargaK2 > 0 ? (sumHargaK2 / countHargaK2).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '-';
  const avgK3 = countHargaK3 > 0 ? (sumHargaK3 / countHargaK3).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '-';

  const totalRow = [
    'TOTAL', '',
    totalLuas.toLocaleString('id-ID'),
    totalPok,
    totalPetambak,
    '', '', '',
    totalProduksi.toLocaleString('id-ID', { maximumFractionDigits: 2 }),
    '', '', '',
    totalStok.toLocaleString('id-ID', { maximumFractionDigits: 2 }),
    avgK1, avgK2, avgK3, ''
  ];

  const aoa = [
    [title], [subtitle], [],
    h1, h2,
    ...dataRows,
    totalRow
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const refTitle = XLSX.utils.encode_cell({ c: 0, r: 0 });
  ws[refTitle].s = { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center' } };
  const refSub = XLSX.utils.encode_cell({ c: 0, r: 1 });
  ws[refSub].s = { font: { bold: false, sz: 11 }, alignment: { horizontal: 'center' } };

  const hStyle1 = cellStyle({ bold: true, fill: '1F4E79', fontColor: 'FFFFFF', align: 'center' });
  const hStyle2 = cellStyle({ bold: true, fill: '2E75B6', fontColor: 'FFFFFF', align: 'center' });
  const hProdStyle = cellStyle({ bold: true, fill: '375623', fontColor: 'FFFFFF', align: 'center' });
  const hStokStyle = cellStyle({ bold: true, fill: 'BF8F00', fontColor: 'FFFFFF', align: 'center' });
  const hProdukStyle = cellStyle({ bold: true, fill: '1F4E79', fontColor: 'FFFFFF', align: 'center' });
  const dataStyle = cellStyle({ align: 'center' });
  const dataLeftStyle = cellStyle({ align: 'left' });
  const totalStyle = cellStyle({ bold: true, fill: 'FFFF00', align: 'center' });
  const totalSumStyle = cellStyle({ bold: true, fill: 'F4B942', align: 'center' });

  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const r3 = XLSX.utils.encode_cell({ c: C, r: 3 });
    const r4 = XLSX.utils.encode_cell({ c: C, r: 4 });
    if (!ws[r3]) ws[r3] = { t: 's', v: '' };
    if (!ws[r4]) ws[r4] = { t: 's', v: '' };
    if (C <= 4) { ws[r3].s = hStyle1; ws[r4].s = hStyle1; }
    else if (C >= 5 && C <= 8) { ws[r3].s = hProdStyle; ws[r4].s = hProdStyle; }
    else if (C >= 9 && C <= 12) { ws[r3].s = hStokStyle; ws[r4].s = hStokStyle; }
    else if (C >= 13 && C <= 15) { ws[r3].s = hStyle2; ws[r4].s = hStyle2; }
    else { ws[r3].s = hProdukStyle; ws[r4].s = hProdukStyle; }
  }

  const dataStart = 5;
  const totalRowIdx = dataStart + dataRows.length;
  for (let R = dataStart; R < totalRowIdx; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const ref = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = C === 1 ? dataLeftStyle : dataStyle;
    }
  }

  for (let C = range.s.c; C <= range.e.c; C++) {
    const ref = XLSX.utils.encode_cell({ c: C, r: totalRowIdx });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = (C === 8 || C === 12) ? totalSumStyle : totalStyle;
  }

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } },
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
    { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } },
    { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } },
    { s: { r: 3, c: 5 }, e: { r: 3, c: 7 } },
    { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } },
    { s: { r: 3, c: 9 }, e: { r: 3, c: 11 } },
    { s: { r: 3, c: 12 }, e: { r: 4, c: 12 } },
    { s: { r: 3, c: 13 }, e: { r: 3, c: 15 } },
    { s: { r: 3, c: 16 }, e: { r: 4, c: 16 } },
    { s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 4 } },
    { s: { r: totalRowIdx, c: 13 }, e: { r: totalRowIdx, c: 13 } },
  ];

  ws['!cols'] = [
    { wch: 5 }, { wch: 18 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
  ];
  ws['!rows'] = [{ hpt: 20 }, { hpt: 16 }, { hpt: 8 }, { hpt: 40 }, { hpt: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produksi_Garam');
  XLSX.writeFile(wb, `Rekapitulasi_Garam_${new Date().toISOString().split('T')[0]}.xlsx`);
};

const exportPotensiExcel = (data) => {
  const title = 'REKAPITULASI POTENSI PERAIRAN JAWA TIMUR';
  const h1 = ['No', 'Kab/Kota', 'Tahun', 'Luas Wilayah Laut (km²)',
    'Panjang Garis Pantai (km)', '', '', '', 'Total Pantai (km)',
    'Luas Perairan (km²)', 'Pulau Kecil', 'Berpenghuni', 'Tdk Berpenghuni',
    'Desa Pesisir', 'Konservasi (Ha)', 'Potensi (Ton/Th)', 'Keterangan'];
  const h2 = ['', '', '', '', 'Utara', 'Selatan', 'Timur', 'Barat', '', '', '', '', '', '', '', '', ''];
  const dataRows = data.map((row, i) => {
    const tp = (row.panjang_pantai_utara_km || 0) + (row.panjang_pantai_selatan_km || 0) +
      (row.panjang_pantai_timur_km || 0) + (row.panjang_pantai_barat_km || 0);
    return [i + 1, row.kabupaten_kota, row.tahun_data,
      row.luas_wilayah_laut_km2?.toLocaleString('id-ID') ?? 0,
      row.panjang_pantai_utara_km ?? 0, row.panjang_pantai_selatan_km ?? 0,
      row.panjang_pantai_timur_km ?? 0, row.panjang_pantai_barat_km ?? 0,
      tp.toLocaleString('id-ID', { maximumFractionDigits: 2 }),
      row.luas_perairan_km2?.toLocaleString('id-ID') ?? 0,
      row.jumlah_pulau_kecil ?? 0, row.pulau_berpenghuni ?? 0, row.pulau_tidak_berpenghuni ?? 0,
      row.desa_pesisir ?? 0,
      row.luas_kawasan_konservasi_ha?.toLocaleString('id-ID') ?? 0,
      row.potensi_perikanan_ton_th?.toLocaleString('id-ID') ?? 0,
      row.keterangan ?? ''];
  });
  const aoa = [[title], [], h1, h2, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const hStyle = cellStyle({ bold: true, fill: '1F4E79', fontColor: 'FFFFFF' });
  const range = XLSX.utils.decode_range(ws['!ref']);
  ws[XLSX.utils.encode_cell({ c: 0, r: 0 })].s = { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center' } };
  for (let C = range.s.c; C <= range.e.c; C++) {
    const r2 = XLSX.utils.encode_cell({ c: C, r: 2 });
    const r3 = XLSX.utils.encode_cell({ c: C, r: 3 });
    if (!ws[r2]) ws[r2] = { t: 's', v: '' };
    if (!ws[r3]) ws[r3] = { t: 's', v: '' };
    ws[r2].s = hStyle; ws[r3].s = hStyle;
  }
  for (let R = 4; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const ref = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = cellStyle({ align: C <= 1 || C === 16 ? 'left' : 'center' });
    }
  }
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } },
    { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
    { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
    { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
    { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } },
    { s: { r: 2, c: 4 }, e: { r: 2, c: 7 } },
    { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } },
    { s: { r: 2, c: 9 }, e: { r: 3, c: 9 } },
    { s: { r: 2, c: 10 }, e: { r: 3, c: 10 } },
    { s: { r: 2, c: 11 }, e: { r: 3, c: 11 } },
    { s: { r: 2, c: 12 }, e: { r: 3, c: 12 } },
    { s: { r: 2, c: 13 }, e: { r: 3, c: 13 } },
    { s: { r: 2, c: 14 }, e: { r: 3, c: 14 } },
    { s: { r: 2, c: 15 }, e: { r: 3, c: 15 } },
    { s: { r: 2, c: 16 }, e: { r: 3, c: 16 } },
  ];
  ws['!cols'] = [{ wch: 5 }, { wch: 18 }, { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Potensi_Perairan');
  XLSX.writeFile(wb, `Potensi_Perairan_Jatim_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ── CHART OPTION HELPERS ────────────────────────────────────────────────────────
const darkTheme = {
  backgroundColor: 'transparent',
  textStyle: { color: '#7fb5d5', fontFamily: 'inherit' },
};

const makeBarOption = (title, categories, series, color = '#22d3ee') => ({
  ...darkTheme,
  title: { text: title, textStyle: { color: '#c8dff0', fontSize: 13, fontWeight: 'bold' } },
  tooltip: { trigger: 'axis', backgroundColor: '#0f2236', borderColor: '#1e3a52', textStyle: { color: '#c8dff0' } },
  grid: { left: '3%', right: '4%', bottom: 60, containLabel: true },
  xAxis: { type: 'category', data: categories, axisLabel: { color: '#7fb5d5', rotate: 35, fontSize: 11 }, axisLine: { lineStyle: { color: '#1e3a52' } } },
  yAxis: { type: 'value', axisLabel: { color: '#7fb5d5' }, splitLine: { lineStyle: { color: '#1e3a52' } } },
  series: Array.isArray(series) ? series : [{ data: series, type: 'bar', itemStyle: { color, borderRadius: [4, 4, 0, 0] } }],
});

const makeHBarOption = (title, categories, values, color = '#22d3ee') => ({
  ...darkTheme,
  title: { text: title, textStyle: { color: '#c8dff0', fontSize: 13, fontWeight: 'bold' } },
  tooltip: { trigger: 'axis', backgroundColor: '#0f2236', borderColor: '#1e3a52', textStyle: { color: '#c8dff0' } },
  grid: { left: 120, right: 20, top: 40, bottom: 20 },
  xAxis: { type: 'value', axisLabel: { color: '#7fb5d5' }, splitLine: { lineStyle: { color: '#1e3a52' } } },
  yAxis: { type: 'category', data: categories, axisLabel: { color: '#7fb5d5', fontSize: 11 } },
  series: [{ data: values, type: 'bar', itemStyle: { color, borderRadius: [0, 4, 4, 0] } }],
});

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────────
const DATA_TABS = [
  { key: 'garam',            label: 'Data Garam',       icon: <Map className="w-4 h-4" /> },
  { key: 'mangrove',         label: 'Data Mangrove',    icon: <TreePine className="w-4 h-4" /> },
  { key: 'terumbu_karang',   label: 'Terumbu Karang',   icon: <Waves className="w-4 h-4" /> },
  { key: 'lamun',            label: 'Padang Lamun',     icon: <Leaf className="w-4 h-4" /> },
  { key: 'potensi_perairan', label: 'Potensi Perairan', icon: <Globe className="w-4 h-4" /> },
];

const MAIN_TABS = [
  { key: 'tabel', label: 'Tabel Data', icon: <TableProperties className="w-4 h-4" /> },
  { key: 'visualisasi', label: 'Visualisasi Statistik', icon: <LineChartIcon className="w-4 h-4" /> },
];

export default function AdminKelautanPesisir() {
  const [mainTab, setMainTab] = useState('tabel');
  const [activeTab, setActiveTab] = useState('garam');
  const [dataGaram, setDataGaram] = useState([]);
  const [dataPotensiPerairan, setDataPotensiPerairan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch garam data
  const fetchGaram = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/kelautan-pesisir/garam');
      setDataGaram(res.data.data || []);
    } catch (err) {
      console.error('Gagal memuat data garam:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch potensi perairan data
  const fetchPotensi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/kelautan-pesisir/potensi-perairan');
      setDataPotensiPerairan(res.data.data || []);
    } catch (err) {
      console.error('Gagal memuat data potensi perairan:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats for visualization
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/kelautan-pesisir/stats');
      setStatsData(res.data.data);
    } catch (err) {
      console.error('Gagal memuat statistik:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGaram();
    fetchPotensi();
  }, [fetchGaram, fetchPotensi]);

  useEffect(() => {
    if (mainTab === 'visualisasi') fetchStats();
  }, [mainTab, fetchStats]);

  const handleCreateOrUpdate = async (formData) => {
    setSubmitLoading(true);
    try {
      if (activeTab === 'garam') {
        if (editingData) {
          await api.put(`/kelautan-pesisir/garam/${editingData.id}`, formData);
        } else {
          await api.post('/kelautan-pesisir/garam', formData);
        }
        await fetchGaram();
      } else if (activeTab === 'potensi_perairan') {
        if (editingData) {
          await api.put(`/kelautan-pesisir/potensi-perairan/${editingData.id}`, formData);
        } else {
          await api.post('/kelautan-pesisir/potensi-perairan', formData);
        }
        await fetchPotensi();
      }
    } catch (err) {
      console.error('Gagal menyimpan data:', err);
      alert('Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setSubmitLoading(false);
      setIsFormOpen(false);
      setEditingData(null);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (activeTab === 'garam') {
        await api.delete(`/kelautan-pesisir/garam/${itemToDelete.id}`);
        await fetchGaram();
      } else if (activeTab === 'potensi_perairan') {
        await api.delete(`/kelautan-pesisir/potensi-perairan/${itemToDelete.id}`);
        await fetchPotensi();
      }
    } catch (err) {
      console.error('Gagal menghapus data:', err);
      alert('Gagal menghapus data.');
    } finally {
      setItemToDelete(null);
    }
  };

  const handleApprove = async (row) => {
    if (!window.confirm(`Setujui data ${row.kabupaten_kota}?`)) return;
    try {
      if (activeTab === 'garam') {
        await api.patch(`/kelautan-pesisir/garam/${row.id}/status`, { status: 'APPROVED', alasan_penolakan: null });
        await fetchGaram();
      } else if (activeTab === 'potensi_perairan') {
        await api.patch(`/kelautan-pesisir/potensi-perairan/${row.id}/status`, { status: 'APPROVED', alasan_penolakan: null });
        await fetchPotensi();
      }
    } catch (err) { console.error(err); }
  };

  const handleReject = async (row) => {
    const alasan = window.prompt('Masukkan alasan penolakan:');
    if (!alasan?.trim()) return;
    try {
      if (activeTab === 'garam') {
        await api.patch(`/kelautan-pesisir/garam/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
        await fetchGaram();
      } else if (activeTab === 'potensi_perairan') {
        await api.patch(`/kelautan-pesisir/potensi-perairan/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
        await fetchPotensi();
      }
    } catch (err) { console.error(err); }
  };

  // ── COLUMNS ─────────────────────────────────────────────────────────────────
  const columnsGaram = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => <StatusBadge status={info.getValue()} alasan={info.row.original.alasan_penolakan} /> },
    { header: 'Bulan', accessorKey: 'bulan', cell: info => <span className="text-[#c8dff0]">{formatBulan(info.getValue())}</span> },
    { header: 'TW', accessorKey: 'triwulan', cell: info => <TwBadge tw={info.getValue()} /> },
    { header: 'Tahun', accessorKey: 'tahun', cell: info => <span className="font-bold text-[#c8dff0] bg-[#152d45] px-2.5 py-1 rounded-md text-xs">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-bold text-cyan-300">{info.getValue()}</p> },
    { header: 'Total Produksi', accessorKey: 'total_produksi_ton', cell: info => <span className="font-bold text-emerald-400">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span> },
    { header: 'Total Stok', accessorKey: 'total_stok_ton', cell: info => <span className="font-bold text-amber-400">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span> },
    { header: 'Produktivitas', accessorKey: 'produktivitas', cell: info => <span className="text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-md text-xs">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} Ton/Ha</span> },
  ], []);

  const columnsPotensi = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => <StatusBadge status={info.getValue()} alasan={info.row.original.alasan_penolakan} /> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-bold text-cyan-300">{info.getValue()}</p> },
    { header: 'Tahun', accessorKey: 'tahun_data', cell: info => <span className="text-xs bg-[#152d45] px-2 py-1 rounded text-[#7fb5d5] font-semibold">{info.getValue()}</span> },
    { header: 'L. Wilayah Laut (km²)', accessorKey: 'luas_wilayah_laut_km2', cell: info => <span className="text-[#c8dff0] font-medium">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</span> },
    {
      header: 'Total Pantai (km)', accessorKey: 'total_garis_pantai',
      accessorFn: row => (row.panjang_pantai_utara_km || 0) + (row.panjang_pantai_selatan_km || 0) + (row.panjang_pantai_timur_km || 0) + (row.panjang_pantai_barat_km || 0),
      cell: info => <span className="font-bold text-cyan-400">{info.getValue().toLocaleString('id-ID', { maximumFractionDigits: 2 })} km</span>
    },
    { header: 'Pulau Kecil', accessorKey: 'jumlah_pulau_kecil', cell: info => <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs">{info.getValue()} pulau</span> },
    { header: 'Desa Pesisir', accessorKey: 'desa_pesisir', cell: info => <span className="text-[#c8dff0]">{info.getValue() || 0}</span> },
    { header: 'Konservasi (Ha)', accessorKey: 'luas_kawasan_konservasi_ha', cell: info => <span className="text-emerald-400 font-medium">{(info.getValue() || 0).toLocaleString('id-ID')}</span> },
  ], []);

  // ── SUB-ROWS ─────────────────────────────────────────────────────────────────
  const renderSubGaram = ({ row }) => {
    const d = row.original;
    return (
      <div className="p-6 bg-[#0b1929]/70 border-l-4 border-cyan-500">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 pb-5 border-b border-[#1e3a52] text-sm">
          {[
            { label: 'Luas Total', value: `${(d.luas_total_ha || 0).toLocaleString('id-ID')} Ha`, cls: 'text-[#c8dff0]', border: 'border-[#1e3a52]' },
            { label: 'Luas Produksi', value: `${(d.luas_produksi_ha || 0).toLocaleString('id-ID')} Ha`, cls: 'text-[#c8dff0]', border: 'border-[#1e3a52]' },
            { label: 'Produktivitas Lahan', value: `${(d.produktivitas || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} Ton/Ha`, cls: 'text-emerald-300', border: 'border-emerald-500/30' },
            { label: 'Jml Petambak', value: `${d.jumlah_petambak || 0} Org`, cls: 'text-[#c8dff0]', border: 'border-[#1e3a52]' },
          ].map(s => (
            <div key={s.label} className={`bg-[#0f2236] p-3.5 rounded-xl border ${s.border}`}>
              <span className="text-[#7fb5d5] text-xs font-semibold block mb-1 uppercase tracking-wider">{s.label}</span>
              <span className={`font-bold text-xl ${s.cls}`}>{s.value}</span>
            </div>
          ))}
        </div>
        <h4 className="text-xs font-bold text-[#7fb5d5] mb-4 tracking-widest uppercase flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" /> Rincian per Kualitas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'KUALITAS 1', badge: 'Tinggi', produksi: d.produksi_k1_ton, stok: d.stok_k1_ton, harga: d.harga_k1_rp, borderCls: 'border-cyan-500/20', accentCls: 'bg-cyan-500', headCls: 'text-cyan-300', badgeCls: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
            { label: 'KUALITAS 2', badge: 'Menengah', produksi: d.produksi_k2_ton, stok: d.stok_k2_ton, harga: d.harga_k2_rp, borderCls: 'border-amber-500/20', accentCls: 'bg-amber-500', headCls: 'text-amber-300', badgeCls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'KUALITAS 3', badge: 'Rendah', produksi: d.produksi_k3_ton, stok: d.stok_k3_ton, harga: d.harga_k3_rp, borderCls: 'border-[#1e3a52]', accentCls: 'bg-[#7fb5d5]/40', headCls: 'text-[#7fb5d5]', badgeCls: 'text-[#7fb5d5] bg-[#152d45] border-[#1e3a52]' },
          ].map(k => (
            <div key={k.label} className={`bg-[#0f2236] p-4 rounded-xl border ${k.borderCls} relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${k.accentCls}`}></div>
              <h5 className={`font-bold ${k.headCls} mb-3 flex items-center justify-between`}>
                {k.label}
                <span className={`text-xs font-normal px-2 py-0.5 rounded-full border ${k.badgeCls}`}>{k.badge}</span>
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between text-[#7fb5d5]"><span>Produksi:</span><span className="font-semibold text-[#c8dff0]">{(k.produksi || 0).toLocaleString('id-ID')} Ton</span></div>
                <div className="flex justify-between text-[#7fb5d5]"><span>Stok:</span><span className="font-semibold text-[#c8dff0]">{(k.stok || 0).toLocaleString('id-ID')} Ton</span></div>
                <div className="flex justify-between pt-2 border-t border-[#1e3a52] mt-2"><span className="text-[#7fb5d5] text-xs">Harga</span><span className="font-bold text-[#c8dff0]">Rp {(k.harga || 0).toLocaleString('id-ID')}/kg</span></div>
                <div className="flex justify-between"><span className="text-[#7fb5d5] text-xs">Nilai Produksi</span><span className="font-bold text-[#c8dff0]">{((k.produksi || 0) * (k.harga || 0)).toLocaleString('id-ID')}</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-[#1e3a52]">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
            <span className="text-xs text-emerald-400/70 uppercase tracking-wider">Total Produksi</span>
            <span className="font-bold text-emerald-400">{(d.total_produksi_ton || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
            <span className="text-xs text-amber-400/70 uppercase tracking-wider">Total Stok</span>
            <span className="font-bold text-amber-400">{(d.total_stok_ton || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSubPotensi = ({ row }) => {
    const d = row.original;
    const totalPantai = (d.panjang_pantai_utara_km || 0) + (d.panjang_pantai_selatan_km || 0) +
      (d.panjang_pantai_timur_km || 0) + (d.panjang_pantai_barat_km || 0);
    return (
      <div className="p-6 bg-[#0b1929]/70 border-l-4 border-cyan-500">
        <h4 className="text-xs font-bold text-[#7fb5d5] mb-4 tracking-widest uppercase flex items-center gap-2">
          <Anchor className="w-3.5 h-3.5" /> Rincian Garis Pantai per Segmen
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Pantai Utara', value: `${(d.panjang_pantai_utara_km || 0).toLocaleString('id-ID')} km` },
            { label: 'Pantai Selatan', value: `${(d.panjang_pantai_selatan_km || 0).toLocaleString('id-ID')} km` },
            { label: 'Pantai Timur', value: `${(d.panjang_pantai_timur_km || 0).toLocaleString('id-ID')} km` },
            { label: 'Pantai Barat', value: `${(d.panjang_pantai_barat_km || 0).toLocaleString('id-ID')} km` },
            { label: 'Total Garis Pantai', value: `${totalPantai.toLocaleString('id-ID', { maximumFractionDigits: 2 })} km`, highlight: true },
          ].map(s => (
            <div key={s.label} className={`p-3.5 rounded-xl border ${s.highlight ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-[#1e3a52] bg-[#0f2236]'}`}>
              <span className={`text-xs font-semibold block mb-1 uppercase tracking-wider ${s.highlight ? 'text-cyan-400' : 'text-[#7fb5d5]'}`}>{s.label}</span>
              <span className={`font-bold text-lg ${s.highlight ? 'text-cyan-300' : 'text-[#c8dff0]'}`}>{s.value}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Pulau Berpenghuni', value: `${d.pulau_berpenghuni || 0} pulau`, cls: 'text-emerald-400', border: 'border-emerald-500/20' },
            { label: 'Pulau Tdk Berpenghuni', value: `${d.pulau_tidak_berpenghuni || 0} pulau`, cls: 'text-[#7fb5d5]', border: 'border-[#1e3a52]' },
            { label: 'Desa Pesisir', value: `${d.desa_pesisir || 0} desa`, cls: 'text-cyan-400', border: 'border-cyan-500/20' },
            { label: 'Potensi Perikanan', value: `${(d.potensi_perikanan_ton_th || 0).toLocaleString('id-ID')} Ton/Th`, cls: 'text-amber-400', border: 'border-amber-500/20' },
          ].map(s => (
            <div key={s.label} className={`bg-[#0f2236] p-3.5 rounded-xl border ${s.border}`}>
              <span className="text-[#7fb5d5] text-xs font-semibold block mb-1 uppercase tracking-wider">{s.label}</span>
              <span className={`font-bold text-xl ${s.cls}`}>{s.value}</span>
            </div>
          ))}
        </div>
        {d.keterangan && (
          <div className="mt-4 p-3 bg-[#152d45] rounded-lg border border-[#1e3a52]">
            <span className="text-xs text-[#7fb5d5] font-semibold uppercase tracking-wider block mb-1">Keterangan</span>
            <p className="text-sm text-[#c8dff0]">{d.keterangan}</p>
          </div>
        )}
      </div>
    );
  };

  // ── VISUALISASI ──────────────────────────────────────────────────────────────
  const renderVisualisasi = () => {
    if (statsLoading) {
      return (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="text-[#7fb5d5] text-sm">Memuat data visualisasi...</p>
        </div>
      );
    }
    if (!statsData) return (
      <div className="h-64 flex items-center justify-center text-[#7fb5d5] text-sm">Belum ada data visualisasi.</div>
    );

    const { garamPerKota = [], potensiPerKota = [] } = statsData;
    const garamSorted = [...garamPerKota].sort((a, b) => b.produksi - a.produksi);
    const potensiSorted = [...potensiPerKota].sort((a, b) => b.garis_pantai - a.garis_pantai);

    const garamKota = garamSorted.map(d => d.name);
    const garamProduksi = garamSorted.map(d => parseFloat(d.produksi.toFixed(2)));
    const garamLahan = garamSorted.map(d => parseFloat(d.luas_lahan.toFixed(2)));
    const garamPetambak = garamSorted.map(d => d.petambak);
    const garamKelompok = garamSorted.map(d => d.kelompok);

    const potensiKota = potensiSorted.map(d => d.name);
    const potensiPantai = potensiSorted.map(d => parseFloat(d.garis_pantai.toFixed(2)));
    const potensiPulau = potensiSorted.map(d => d.pulau_kecil);
    const potensiDesa = potensiSorted.map(d => d.desa_pesisir);

    return (
      <div className="space-y-8">
        {/* ── Garam Charts ── */}
        <div>
          <h3 className="text-base font-bold text-[#c8dff0] mb-4 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-cyan-400" /> Garam
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0f2236] border border-[#1e3a52] rounded-xl p-4">
              {garamKota.length > 0
                ? <ReactECharts option={makeBarOption('Volume Produksi Garam per Kab/Kota (Ton)', garamKota, garamProduksi, '#22d3ee')} style={{ height: '300px' }} />
                : <div className="h-[300px] flex items-center justify-center text-[#7fb5d5] text-sm">Belum ada data</div>}
            </div>
            <div className="bg-[#0f2236] border border-[#1e3a52] rounded-xl p-4">
              {garamKota.length > 0
                ? <ReactECharts option={makeBarOption('Luas Lahan Garam per Kab/Kota (Ha)', garamKota, garamLahan, '#10b981')} style={{ height: '300px' }} />
                : <div className="h-[300px] flex items-center justify-center text-[#7fb5d5] text-sm">Belum ada data</div>}
            </div>
            <div className="bg-[#0f2236] border border-[#1e3a52] rounded-xl p-4">
              {garamKota.length > 0
                ? <ReactECharts option={makeHBarOption('Jumlah Petambak Garam per Kab/Kota', garamKota, garamPetambak, '#f59e0b')} style={{ height: '300px' }} />
                : <div className="h-[300px] flex items-center justify-center text-[#7fb5d5] text-sm">Belum ada data</div>}
            </div>
            <div className="bg-[#0f2236] border border-[#1e3a52] rounded-xl p-4">
              {garamKota.length > 0
                ? <ReactECharts option={makeHBarOption('Jumlah Kelompok Garam per Kab/Kota', garamKota, garamKelompok, '#a78bfa')} style={{ height: '300px' }} />
                : <div className="h-[300px] flex items-center justify-center text-[#7fb5d5] text-sm">Belum ada data</div>}
            </div>
          </div>
        </div>

        {/* ── Potensi Perairan Charts ── */}
        <div>
          <h3 className="text-base font-bold text-[#c8dff0] mb-4 flex items-center gap-2">
            <Anchor className="w-4 h-4 text-cyan-400" /> Potensi Perairan
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0f2236] border border-[#1e3a52] rounded-xl p-4">
              {potensiKota.length > 0
                ? <ReactECharts option={makeBarOption('Panjang Garis Pantai per Kab/Kota (km)', potensiKota, potensiPantai, '#06b6d4')} style={{ height: '300px' }} />
                : <div className="h-[300px] flex items-center justify-center text-[#7fb5d5] text-sm">Belum ada data</div>}
            </div>
            <div className="bg-[#0f2236] border border-[#1e3a52] rounded-xl p-4">
              {potensiKota.length > 0
                ? <ReactECharts option={makeHBarOption('Jumlah Pulau Kecil per Kab/Kota', potensiKota, potensiPulau, '#f97316')} style={{ height: '300px' }} />
                : <div className="h-[300px] flex items-center justify-center text-[#7fb5d5] text-sm">Belum ada data</div>}
            </div>
            <div className="bg-[#0f2236] border border-[#1e3a52] rounded-xl p-4 lg:col-span-2">
              {potensiKota.length > 0
                ? <ReactECharts option={makeBarOption('Jumlah Desa Pesisir per Kab/Kota', potensiKota, potensiDesa, '#34d399')} style={{ height: '300px' }} />
                : <div className="h-[300px] flex items-center justify-center text-[#7fb5d5] text-sm">Belum ada data</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── ACTIVE DATA / COLUMNS / SUB-ROW ─────────────────────────────────────────
  const activeData = activeTab === 'garam' ? dataGaram : activeTab === 'potensi_perairan' ? dataPotensiPerairan : [];
  const activeColumns = activeTab === 'garam' ? columnsGaram : activeTab === 'potensi_perairan' ? columnsPotensi : [];
  const activeSubRow = activeTab === 'garam' ? renderSubGaram : activeTab === 'potensi_perairan' ? renderSubPotensi : undefined;

  const handleCustomExport = (data) => {
    if (activeTab === 'garam') return exportGaramExcel(data);
    if (activeTab === 'potensi_perairan') return exportPotensiExcel(data);
  };

  // ── FORM RENDERER ─────────────────────────────────────────────────────────────
  const renderForm = () => {
    if (activeTab === 'garam') {
      return (
        <KelautanPesisirForm
          initialData={editingData}
          isLoading={submitLoading}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setIsFormOpen(false); setEditingData(null); }}
        />
      );
    }
    if (activeTab === 'potensi_perairan') {
      return (
        <PotensiPerairanForm
          initialData={editingData}
          isLoading={submitLoading}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setIsFormOpen(false); setEditingData(null); }}
        />
      );
    }
    return (
      <div className="bg-[#0f2236] border border-[#1e3a52] p-12 rounded-2xl text-center">
        <p className="text-[#7fb5d5] text-sm">Form untuk {DATA_TABS.find(t => t.key === activeTab)?.label} sedang disiapkan.</p>
        <button onClick={() => setIsFormOpen(false)} className="mt-4 px-6 py-2 border border-[#1e3a52] rounded-lg hover:bg-[#152d45] font-medium text-sm text-[#c8dff0]">Kembali</button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 bg-[#0b1929] min-h-screen text-[#c8dff0]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-cyan-400/70 uppercase tracking-widest mb-1.5">Dinas Kelautan &amp; Perikanan — Jawa Timur</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bidang Kelautan &amp; Pesisir</h1>
          <p className="text-[#7fb5d5] mt-1.5 text-sm">Kelola laporan Garam, Mangrove, Terumbu Karang, Lamun, dan Potensi Perairan.</p>
        </div>
        {mainTab === 'tabel' && !isFormOpen && (activeTab === 'garam' || activeTab === 'potensi_perairan') && (
          <button
            onClick={() => { setEditingData(null); setIsFormOpen(true); }}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-700/30 text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tambah {DATA_TABS.find(t => t.key === activeTab)?.label}
          </button>
        )}
      </div>

      {/* Delete Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f2236] border border-[#1e3a52] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-rose-400"><Trash2 className="w-5 h-5" /><h3 className="text-lg font-bold">Konfirmasi Hapus</h3></div>
            <p className="text-[#7fb5d5] text-sm mb-6">Yakin ingin menghapus data <strong className="text-[#c8dff0]">{itemToDelete.kabupaten_kota}</strong>?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setItemToDelete(null)} className="px-4 py-2 rounded-lg font-medium bg-[#152d45] text-[#7fb5d5] hover:bg-[#1e3a52] text-sm">Batal</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-500 text-white text-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs (Tabel / Visualisasi) */}
      <div className="flex overflow-x-auto border-b border-[#1e3a52] gap-1">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setMainTab(tab.key); setIsFormOpen(false); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-medium transition-colors text-sm whitespace-nowrap border-b-2 ${
              mainTab === tab.key
                ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-[#7fb5d5] hover:bg-[#152d45]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {mainTab === 'tabel' ? (
        <>
          {/* Data Sub-Tabs */}
          {!isFormOpen && (
            <div className="flex overflow-x-auto gap-1 border-b border-[#1e3a52]">
              {DATA_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium transition-colors text-xs whitespace-nowrap border-b-2 ${
                    activeTab === tab.key
                      ? 'border-[#7fb5d5] text-[#c8dff0] bg-[#152d45]'
                      : 'border-transparent text-[#7fb5d5] hover:bg-[#152d45]/60'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          )}

          {isFormOpen ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              {renderForm()}
            </div>
          ) : (
            <div className="bg-[#0f2236] rounded-2xl border border-[#1e3a52] overflow-hidden shadow-xl shadow-black/20">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                  <p className="text-[#7fb5d5] text-sm">Memuat data...</p>
                </div>
              ) : (activeTab === 'garam' || activeTab === 'potensi_perairan') ? (
                <DataTable
                  columns={activeColumns}
                  data={activeData}
                  onEdit={(row) => { setEditingData(row); setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  onDelete={(row) => setItemToDelete(row)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  renderSubComponent={activeSubRow}
                  exportName={`Data_${activeTab}`}
                  onCustomExport={handleCustomExport}
                />
              ) : (
                <div className="p-16 text-center text-[#7fb5d5]">
                  <Waves className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Tabel data untuk {DATA_TABS.find(t => t.key === activeTab)?.label} sedang disiapkan.</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Visualisasi Tab */
        <div className="bg-[#0f2236] rounded-2xl border border-[#1e3a52] p-6 shadow-xl shadow-black/20">
          {renderVisualisasi()}
        </div>
      )}
    </div>
  );
}