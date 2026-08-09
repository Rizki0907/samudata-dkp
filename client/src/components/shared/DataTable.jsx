import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Search, Download, Trash2, Edit, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx-js-style';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onBatchDelete,
  onBatchApprove,
  onBatchReject,
  canBatchApprove,
  canBatchReject,
  canBatchDelete,
  searchKey = 'nama_kapal',
  exportName,
  formatExportData,
  onCustomExport,
  renderSubComponent,
  customExportButton,
  hideDefaultExport = false,
  hideUpdatedAt = false,
  defaultPageSize = 10,
  customBatchActions,
  approvableStatuses = ['PENDING', 'APPROVED'],
  rejectableStatuses = ['PENDING', 'APPROVED', 'VERIFIED'],
  lockedStatuses = ['APPROVED', 'VERIFIED'],
  selectRowOnClick = false,
  canEditRow,
}) {
  const { user } = useAuthStore();
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expanded, setExpanded] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  const hasBatchActions = !!(onBatchDelete || onBatchApprove || onBatchReject || customBatchActions);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = data.map((row) => row.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Klik pada elemen interaktif tidak boleh ikut mencentang/membatalkan baris.
  // Ini mencegah checkbox dan tombol aksi bekerja dua kali.
  const shouldIgnoreRowClick = (target) =>
    target instanceof Element &&
    Boolean(
      target.closest(
        'button, a, input, select, textarea, [role="button"], [data-stop-row-select="true"]'
      )
    );

  const handleBatchDelete = async () => {
    if (onBatchDelete) await onBatchDelete(selectedIds);
    setSelectedIds([]);
  };

  const handleBatchApprove = async () => {
    if (onBatchApprove) await onBatchApprove(selectedIds);
    setSelectedIds([]);
  };

  const handleBatchReject = async () => {
    if (onBatchReject) await onBatchReject(selectedIds);
    setSelectedIds([]);
  };

  const finalColumns = [...columns];
  if (!hideUpdatedAt && !finalColumns.find(c => c.accessorKey === 'updated_at' || c.id === 'updated_at')) {
    finalColumns.push({
      id: 'updated_at',
      accessorKey: 'updated_at',
      header: 'Terakhir Diperbarui',
      cell: ({ row }) => {
        if (!row.original.updated_at) return '-';
        return formatDistanceToNow(new Date(row.original.updated_at), { addSuffix: true, locale: idLocale });
      }
    });
  }

  const table = useReactTable({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => !!renderSubComponent,
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
    state: {
      sorting,
      globalFilter,
      expanded,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
  });

// Duplicate block removed

  const handleExport = () => {
    const rowsToExport = table.getFilteredRowModel().rows.map(row => row.original);
    
    if (onCustomExport) {
      onCustomExport(rowsToExport);
      return;
    }

    // Exclude 'actions' column when exporting, and only export filtered data
    let exportData = rowsToExport.map(row => {
      const newRow = { ...row };
      delete newRow.id;
      delete newRow.created_at;
      delete newRow.updated_at;
      return newRow;
    });

    if (formatExportData) {
      exportData = formatExportData(exportData);
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    const fileName = exportName || `Export_Samudera_${new Date().toISOString().split('T')[0]}`;
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari data..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {customExportButton}
          {!hideDefaultExport && (
            <button
              onClick={handleExport}
<<<<<<< HEAD
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
=======
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
>>>>>>> d03b01c237ff122586757fe4277576186f4344a6
            >
              <Download className="w-4 h-4" />
              Ekspor Excel
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Batch Actions Toolbar */}
      {selectedIds.length > 0 && (() => {
        const selectedRows = data.filter(row => selectedIds.includes(row.id));
        const showApprove = onBatchApprove && user?.role === 'admin_pusat' && (!canBatchApprove || canBatchApprove(selectedRows));
        const showReject = onBatchReject && user?.role === 'admin_pusat' && (!canBatchReject || canBatchReject(selectedRows));
        const showDelete = onBatchDelete && (!canBatchDelete || canBatchDelete(selectedRows));

        return (
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium text-primary">
              {selectedIds.length} data terpilih
            </span>
            <div className="flex items-center gap-2">
              {onEdit && selectedIds.length === 1 && (
                <button
                  onClick={() => {
                    const row = data.find(r => r.id === selectedIds[0]);
                    if (row) onEdit(row);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4"/>
                  Edit Terpilih
                </button>
              )}
              {showApprove && (
                <button
                  onClick={handleBatchApprove}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm font-medium"
                >
                  <CheckCircle className="w-4 h-4"/>
                  Validasi Terpilih
                </button>
              )}
              {showReject && (
                <button
                  onClick={handleBatchReject}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors text-sm font-medium"
                >
                  <XCircle className="w-4 h-4"/>
                  Tolak Terpilih
                </button>
              )}
              {showDelete && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4"/>
                  Hapus Terpilih
                </button>
              )}
              {customBatchActions && customBatchActions(selectedIds, () => setSelectedIds([]))}
            </div>
          </div>
        );
      })()}

      {/* Table Content */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {hasBatchActions && (
                    <th className="px-4 py-4 w-10"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length===data.length && data.length>0} /></th>
                  )}
                  {renderSubComponent && <th className="px-4 py-4 w-10"></th>}
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className="px-6 py-4 font-medium whitespace-nowrap cursor-pointer select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <ChevronUp className="w-4 h-4" />,
                            desc: <ChevronDown className="w-4 h-4" />,
                          }[header.column.getIsSorted()] ?? null}
                        </div>
                      </th>
                    );
                  })}
                  {(onEdit || onDelete || onApprove || onReject) && (
                    <th className="px-6 py-4 font-medium text-right">Aksi</th>
                  )}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      onClick={(event) => {
                        if (
                          !selectRowOnClick ||
                          !hasBatchActions ||
                          shouldIgnoreRowClick(event.target)
                        ) {
                          return;
                        }

                        toggleSelectRow(row.original.id);
                      }}
                      aria-selected={selectedIds.includes(row.original.id)}
                      className={cn(
                        'transition-colors',
                        selectRowOnClick && hasBatchActions && 'cursor-pointer',
                        selectedIds.includes(row.original.id)
                          ? 'bg-primary/10 hover:bg-primary/15'
                          : 'hover:bg-muted/30'
                      )}
                    >
                      {hasBatchActions && (
                        <td className="px-4 py-4 w-10 whitespace-nowrap">
                          <input
                            type="checkbox"
                            aria-label={`Pilih data ${row.original.kabupaten_kota || row.original.id}`}
                            checked={selectedIds.includes(row.original.id)}
                            onChange={() => toggleSelectRow(row.original.id)}
                          />
                        </td>
                      )}
                      {renderSubComponent && (
                        <td className="px-4 py-4 w-10 whitespace-nowrap">
                          <button
                            onClick={row.getToggleExpandedHandler()}
                            className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground transition-colors"
                          >
                            {row.getIsExpanded() ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                      )}
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                      {(onEdit || onDelete || onApprove || onReject) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            {user?.role === 'admin_pusat' && approvableStatuses.includes(row.original.status) && onApprove && (
                              <button
                                onClick={() => onApprove(row.original)}
                                title="Setujui Data"
                                className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            
                            {user?.role === 'admin_pusat' && rejectableStatuses.includes(row.original.status) && onReject && (
                              <button
                                onClick={() => onReject(row.original)}
                                title="Tolak Data"
                                className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

                            {onEdit && (canEditRow ? canEditRow(row.original) : (['admin_pusat', 'admin_bidang'].includes(user?.role) || !lockedStatuses.includes(row.original.status))) && selectedIds.length <= 1 && (
                              <button
                                onClick={() => onEdit(row.original)}
                                title="Edit Data"
                                className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            
                            {onDelete && (['admin_pusat', 'admin_cabang'].includes(user?.role) || !lockedStatuses.includes(row.original.status)) && (
                              <button
                                onClick={() => onDelete(row.original)}
                                title="Hapus Data"
                                className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {row.getIsExpanded() && renderSubComponent && (
                      <tr className="bg-muted/10 border-b border-border">
                        <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0) + (renderSubComponent ? 1 : 0) + (hasBatchActions ? 1 : 0)} className="p-0">
                          {renderSubComponent({ row })}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + (onEdit || onDelete || onApprove || onReject ? 1 : 0) + (renderSubComponent ? 1 : 0) + 1} className="h-24 text-center text-muted-foreground">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Reject Modal / Action confirmation can be handled by parent */}

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground mt-4 px-2">
        <div>
          Menampilkan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} sampai{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          dari {table.getFilteredRowModel().rows.length} entri
        </div>
        <div className="flex items-center gap-4">
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            {[10, 25, 50, 100, 500].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Tampilkan {pageSize} baris
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-1.5 rounded-xl border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-4 py-1.5 rounded-xl border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}