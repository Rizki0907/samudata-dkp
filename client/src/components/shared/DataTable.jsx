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
import * as XLSX from 'xlsx';
import { useAuthStore } from '@/store/authStore';

export function DataTable({ columns, data, onEdit, onDelete, onApprove, onReject, searchKey = 'nama_kapal', exportName, formatExportData, onCustomExport, renderSubComponent }) {
  const { user } = useAuthStore();
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expanded, setExpanded] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => !!renderSubComponent,
    state: {
      sorting,
      globalFilter,
      expanded,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
  });

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
      {/* Table Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari data..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Ekspor Excel
        </button>
      </div>

      {/* Table Content */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
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
                    <tr className="hover:bg-muted/30 transition-colors">
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
                            {user?.role === 'admin_pusat' && row.original.status !== 'APPROVED' && onApprove && (
                              <button
                                onClick={() => onApprove(row.original)}
                                title="Setujui Data"
                                className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            
                            {user?.role === 'admin_pusat' && row.original.status !== 'REJECTED' && onReject && (
                              <button
                                onClick={() => onReject(row.original)}
                                title="Tolak Data"
                                className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

                            {onEdit && (user?.role === 'admin_pusat' || row.original.status !== 'APPROVED') && (
                              <button
                                onClick={() => onEdit(row.original)}
                                title="Edit Data"
                                className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            
                            {onDelete && (user?.role === 'admin_pusat' || row.original.status !== 'APPROVED') && (
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
                        <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0) + 1} className="p-0">
                          {renderSubComponent({ row })}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + (onEdit || onDelete || onApprove || onReject ? 1 : 0) + (renderSubComponent ? 1 : 0)} className="h-24 text-center text-muted-foreground">
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
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Menampilkan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} sampai{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          dari {table.getFilteredRowModel().rows.length} entri
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 rounded-xl border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
          >
            Sebelumnya
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 rounded-xl border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
}
