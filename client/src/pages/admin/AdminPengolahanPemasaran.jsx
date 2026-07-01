import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { Plus, Loader2, ArrowLeft, CheckCircle, XCircle, Edit, Trash2, Download, Search, ChevronUp, ChevronDown } from 'lucide-react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as XLSX from 'xlsx';
import { useAuthStore } from '@/store/authStore';

// ─── Daftar Kabupaten/Kota Jawa Timur ─────────────────────────────────────────
const KABUPATEN_KOTA_OPTIONS = [
  'KAB. PACITAN', 'KAB. PONOROGO', 'KAB. TRENGGALEK', 'KAB. TULUNGAGUNG',
  'KAB. BLITAR', 'KAB. KEDIRI', 'KAB. MALANG', 'KAB. LUMAJANG',
  'KAB. JEMBER', 'KAB. BANYUWANGI', 'KAB. BONDOWOSO', 'KAB. SITUBONDO',
  'KAB. PROBOLINGGO', 'KAB. PASURUAN', 'KAB. SIDOARJO', 'KAB. MOJOKERTO',
  'KAB. JOMBANG', 'KAB. NGANJUK', 'KAB. MADIUN', 'KAB. MAGETAN',
  'KAB. NGAWI', 'KAB. BOJONEGORO', 'KAB. TUBAN', 'KAB. LAMONGAN',
  'KAB. GRESIK', 'KAB. BANGKALAN', 'KAB. SAMPANG', 'KAB. PAMEKASAN',
  'KAB. SUMENEP', 'KOTA KEDIRI', 'KOTA BLITAR', 'KOTA MALANG',
  'KOTA PROBOLINGGO', 'KOTA PASURUAN', 'KOTA MOJOKERTO', 'KOTA MADIUN',
  'KOTA SURABAYA', 'KOTA BATU',
];

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, alasan }) {
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
        <span className="text-xs text-rose-500 cursor-help" title={`Alasan: ${alasan}`}>(?)</span>
      )}
    </div>
  );
}

// ─── Tabel ─────────────────────────────────────────────────────────────────────
function LocalDataTable({ columns, data, onEdit, onDelete, onApprove, onReject, exportName, formatExportData }) {
  const { user } = useAuthStore();
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [tahunFilter, setTahunFilter] = useState('');

  const filteredData = useMemo(() => {
    let d = data;
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      d = d.filter(row => String(row.kabupaten_kota ?? '').toLowerCase().includes(q));
    }
    if (tahunFilter) {
      d = d.filter(row => String(row.tahun ?? '').includes(tahunFilter));
    }
    return d;
  }, [data, globalFilter, tahunFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  const handleExport = () => {
    let exportData = filteredData.map(row => {
      const newRow = { ...row };
      delete newRow.id; delete newRow.created_at; delete newRow.updated_at;
      return newRow;
    });
    if (formatExportData) exportData = formatExportData(exportData);
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${exportName || 'Export'}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari kabupaten/kota..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
          <div className="relative w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari tahun..."
              value={tahunFilter}
              onChange={e => setTahunFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Ekspor Excel
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-4 font-medium whitespace-nowrap cursor-pointer select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: <ChevronUp className="w-4 h-4" />, desc: <ChevronDown className="w-4 h-4" /> }[header.column.getIsSorted()] ?? null}
                      </div>
                    </th>
                  ))}
                  {(onEdit || onDelete || onApprove || onReject) && (
                    <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Aksi</th>
                  )}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    {(onEdit || onDelete || onApprove || onReject) && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          {user?.role === 'admin_pusat' && row.original.status !== 'APPROVED' && onApprove && (
                            <button onClick={() => onApprove(row.original)} title="Setujui"
                              className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {user?.role === 'admin_pusat' && row.original.status !== 'REJECTED' && onReject && (
                            <button onClick={() => onReject(row.original)} title="Tolak"
                              className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {onEdit && (user?.role === 'admin_pusat' || row.original.status !== 'APPROVED') && (
                            <button onClick={() => onEdit(row.original)} title="Edit"
                              className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (user?.role === 'admin_pusat' || row.original.status !== 'APPROVED') && (
                            <button onClick={() => onDelete(row.original)} title="Hapus"
                              className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Menampilkan{' '}
          {filteredData.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} sampai{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            filteredData.length
          )}{' '}
          dari {filteredData.length} entri
        </div>
        <div className="flex gap-2">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 rounded-xl border border-border hover:bg-muted disabled:opacity-50 transition-colors">
            Sebelumnya
          </button>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
            className="px-4 py-2 rounded-xl border border-border hover:bg-muted disabled:opacity-50 transition-colors">
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Form Tambah / Edit ────────────────────────────────────────────────────────
function FormPage({ initialData, isLoading, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    tahun: initialData?.tahun ?? new Date().getFullYear(),
    kabupaten_kota: initialData?.kabupaten_kota ?? '',
    fermentasi: initialData?.fermentasi ?? '',
    pelumatan_daging_ikan: initialData?.pelumatan_daging_ikan ?? '',
    pembekuan: initialData?.pembekuan ?? '',
    pemindangan: initialData?.pemindangan ?? '',
    penanganan_produk_segar: initialData?.penanganan_produk_segar ?? '',
    pengalengan: initialData?.pengalengan ?? '',
    pengasapan_pemanggangan: initialData?.pengasapan_pemanggangan ?? '',
    pereduksian_ekstraksi: initialData?.pereduksian_ekstraksi ?? '',
    penggaraman_pengeringan: initialData?.penggaraman_pengeringan ?? '',
    pengolahan_lainnya: initialData?.pengolahan_lainnya ?? '',
    pengecer: initialData?.pengecer ?? '',
    pengumpul_pedagang_besar_distributor: initialData?.pengumpul_pedagang_besar_distributor ?? '',
  });

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const numField = (label, key) => (
    <div key={key} className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={form[key]}
        onChange={set(key)}
        placeholder="0"
        className="bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-sm"
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {initialData ? 'Edit Data' : 'Tambah Data Baru'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Pengolahan &amp; Pemasaran</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        {/* Tahun & Kabupaten */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tahun</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.tahun}
              onChange={set('tahun')}
              className="bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kabupaten/Kota</label>
            <div className="relative">
              <select
                value={form.kabupaten_kota}
                onChange={set('kabupaten_kota')}
                className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-primary transition-colors text-sm cursor-pointer"
              >
                <option value="">Pilih Kabupaten/Kota</option>
                {KABUPATEN_KOTA_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Data Pengolahan */}
        <div>
          <h3 className="text-sm font-semibold text-primary mb-3">Data Pengolahan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numField('Fermentasi', 'fermentasi')}
            {numField('Pelumatan Daging Ikan', 'pelumatan_daging_ikan')}
            {numField('Pembekuan', 'pembekuan')}
            {numField('Pemindangan', 'pemindangan')}
            {numField('Penanganan Produk Segar', 'penanganan_produk_segar')}
            {numField('Pengalengan', 'pengalengan')}
            {numField('Pengasapan / Pemanggangan', 'pengasapan_pemanggangan')}
            {numField('Pereduksian / Ekstraksi', 'pereduksian_ekstraksi')}
            {numField('Penggaraman / Pengeringan', 'penggaraman_pengeringan')}
            {numField('Pengolahan Lainnya', 'pengolahan_lainnya')}
          </div>
        </div>

        {/* Data Pemasaran */}
        <div>
          <h3 className="text-sm font-semibold text-primary mb-3">Data Pemasaran</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numField('Pengecer', 'pengecer')}
            {numField('Pengumpul / Pedagang Besar / Distributor', 'pengumpul_pedagang_besar_distributor')}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium">
          Batal
        </button>
        <button onClick={() => onSubmit(form)} disabled={isLoading}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60 text-sm">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Simpan Data
        </button>
      </div>
    </div>
  );
}

// ─── Halaman Utama ─────────────────────────────────────────────────────────────
export default function AdminPengolahan() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('list');
  const [editingData, setEditingData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pengolahan');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pengolahan-pemasaran/admin');
      setData(res.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setSubmitLoading(true);
      if (editingData) {
        await api.put(`/pengolahan-pemasaran/${editingData.id}`, formData);
      } else {
        await api.post('/pengolahan-pemasaran', formData);
      }
      setPage('list');
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
    if (window.confirm(`Yakin ingin menghapus data ${row.kabupaten_kota}?`)) {
      try {
        await api.delete(`/pengolahan-pemasaran/${row.id}`);
        fetchData();
      } catch { alert('Gagal menghapus data'); }
    }
  };

  const handleEdit = (row) => {
    setEditingData(row);
    setPage('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApprove = async (row) => {
    if (window.confirm('Yakin ingin menyetujui data ini?')) {
      try {
        await api.put(`/pengolahan-pemasaran/${row.id}/status`, { status: 'APPROVED' });
        fetchData();
      } catch { alert('Gagal menyetujui data'); }
    }
  };

  const handleReject = async (row) => {
    const alasan = window.prompt('Masukkan alasan penolakan:');
    if (alasan === null) return;
    if (!alasan.trim()) { alert('Alasan penolakan wajib diisi!'); return; }
    try {
      await api.put(`/pengolahan-pemasaran/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
      fetchData();
    } catch { alert('Gagal menolak data'); }
  };

  // Kolom dasar (selalu ada)
  const baseColumns = [
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => <StatusBadge status={info.getValue()} alasan={info.row.original.alasan_penolakan} />,
    },
    {
      header: 'No',
      id: 'no',
      cell: ({ row }) => <span className="text-muted-foreground">{row.index + 1}</span>,
    },
    {
      header: 'Kabupaten/Kota',
      accessorKey: 'kabupaten_kota',
      cell: info => <p className="font-medium">{info.getValue()}</p>,
    },
  ];

  // Kolom tab Kegiatan Pengolahan
  const pengolahanColumns = useMemo(() => [
    ...baseColumns,
    { header: 'Fermentasi', accessorKey: 'fermentasi' },
    { header: 'Pelumatan Daging Ikan', accessorKey: 'pelumatan_daging_ikan' },
    { header: 'Pembekuan', accessorKey: 'pembekuan' },
    { header: 'Pemindangan', accessorKey: 'pemindangan' },
    { header: 'Penanganan Produk Segar', accessorKey: 'penanganan_produk_segar' },
    { header: 'Pengalengan', accessorKey: 'pengalengan' },
    { header: 'Pengasapan/Pemanggangan', accessorKey: 'pengasapan_pemanggangan' },
    { header: 'Pereduksian/Ekstraksi', accessorKey: 'pereduksian_ekstraksi' },
    { header: 'Penggaraman/Pengeringan', accessorKey: 'penggaraman_pengeringan' },
    { header: 'Pengolahan Lainnya', accessorKey: 'pengolahan_lainnya' },
  ], []);

  // Kolom tab Kegiatan Pemasaran
  const pemasaranColumns = useMemo(() => [
    ...baseColumns,
    { header: 'Pengecer', accessorKey: 'pengecer' },
    { header: 'Pengumpul/Pedagang Besar/Distributor', accessorKey: 'pengumpul_pedagang_besar_distributor' },
  ], []);

  // Kolom tab Unit Usaha — semua kolom dari Tabel 1
  const unitUsahaColumns = useMemo(() => [
    ...baseColumns,
    { header: 'Fermentasi', accessorKey: 'fermentasi' },
    { header: 'Pelumatan Daging Ikan', accessorKey: 'pelumatan_daging_ikan' },
    { header: 'Pembekuan', accessorKey: 'pembekuan' },
    { header: 'Pemindangan', accessorKey: 'pemindangan' },
    { header: 'Penanganan Produk Segar', accessorKey: 'penanganan_produk_segar' },
    { header: 'Pengalengan', accessorKey: 'pengalengan' },
    { header: 'Pengasapan/Pemanggangan', accessorKey: 'pengasapan_pemanggangan' },
    { header: 'Pereduksian/Ekstraksi', accessorKey: 'pereduksian_ekstraksi' },
    { header: 'Penggaraman/Pengeringan', accessorKey: 'penggaraman_pengeringan' },
    { header: 'Pengolahan Lainnya', accessorKey: 'pengolahan_lainnya' },
    { header: 'Pengecer', accessorKey: 'pengecer' },
    { header: 'Pengumpul/Pedagang Besar/Distributor', accessorKey: 'pengumpul_pedagang_besar_distributor' },
  ], []);

  const activeColumns =
    activeTab === 'pengolahan' ? pengolahanColumns
    : activeTab === 'pemasaran' ? pemasaranColumns
    : unitUsahaColumns;

  const tabs = [
    { id: 'pengolahan', label: 'Kegiatan Pengolahan' },
    { id: 'pemasaran', label: 'Kegiatan Pemasaran' },
    { id: 'unit_usaha', label: 'Unit Usaha' },
  ];

  // ── Render form page ──────────────────────────────────────────────────────────
  if (page === 'form') {
    return (
      <FormPage
        initialData={editingData}
        isLoading={submitLoading}
        onSubmit={handleCreateOrUpdate}
        onCancel={() => { setPage('list'); setEditingData(null); }}
      />
    );
  }

  // ── Render list page ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Kelola Data Pengolahan &amp; Pemasaran
          </h1>
          <p className="text-muted-foreground mt-1">
            Manajemen data statistik unit usaha pengolahan dan pemasaran hasil perikanan per tahun.
          </p>
        </div>
        <button
          onClick={() => { setEditingData(null); setPage('form'); }}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Tambah Data Baru
        </button>
      </div>

      {/* Tab buttons */}
      <div className="flex items-center gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <LocalDataTable
          key={activeTab}
          columns={activeColumns}
          data={data}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onApprove={handleApprove}
          onReject={handleReject}
          exportName={`Pengolahan_Pemasaran_${activeTab}_${new Date().toISOString().split('T')[0]}`}
        />
      )}
    </div>
  );
}