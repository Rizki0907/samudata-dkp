import React, { useState } from 'react';
import { Info, AlertTriangle, X, PenLine } from 'lucide-react';

export function StatusBadge({ row, onEdit, contextFields }) {
  const [showModal, setShowModal] = useState(false);

  const status = row?.status;
  const alasan = row?.alasan_penolakan;
  const isRejected = status === 'REJECTED';

  let colorClass = 'border-yellow-500/20 bg-yellow-500/10 text-yellow-600';
  let label = 'PENDING';

  if (status === 'APPROVED') {
    colorClass = 'border-blue-500/20 bg-blue-500/10 text-blue-600';
    label = 'APPROVED';
  } else if (status === 'VERIFIED') {
    colorClass = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600';
    label = 'VERIFIED';
  } else if (status === 'REJECTED') {
    colorClass = 'border-rose-500/30 bg-rose-500/10 text-rose-600';
    label = 'REJECTED';
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}
      >
        {isRejected ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
        {label}
      </span>

      {isRejected ? (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 underline decoration-dotted underline-offset-2 transition-colors hover:text-rose-600"
        >
          <Info className="h-3.5 w-3.5" />
          Lihat &amp; Perbaiki
        </button>
      ) : null}

      {isRejected && showModal ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-8"
          onClick={() => setShowModal(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-rose-500/30 bg-card shadow-2xl animate-in fade-in zoom-in-95"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto p-7">
              {/* Header modal */}
              <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-foreground">Data Ini Ditolak (Perlu Perbaikan)</h3>
                    <p className="mt-0.5 break-words text-sm text-muted-foreground">
                      Data ini tidak dapat divalidasi oleh Pusat karena ada beberapa hal yang harus diperbaiki.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Konteks data */}
                <dl className="mt-5 grid grid-cols-1 gap-x-4 gap-y-3 rounded-2xl bg-muted/60 p-4 text-sm sm:grid-cols-2">
                  {contextFields && contextFields.map((field, idx) => (
                    <div key={idx} className="min-w-0">
                      <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
                      <dd className="break-words font-semibold text-foreground mt-0.5">
                        {field.value || '-'}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* Alasan penolakan */}
                <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                    Alasan Penolakan dari Pusat
                  </p>
                  <p className="mt-2 break-words text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {alasan || 'Tidak ada alasan yang dicantumkan oleh Pusat.'}
                  </p>
                </div>

                {/* Panduan singkat */}
                <div className="mt-4 rounded-2xl bg-blue-500/10 p-4 text-sm leading-relaxed text-blue-600 break-words whitespace-normal flex items-start gap-3">
                  <Info className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>
                    Silakan tekan tombol di bawah ini untuk langsung menuju form edit dan memperbaiki data sesuai catatan dari Pusat.
                  </p>
                </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Tutup
              </button>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    onEdit();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 active:scale-95 shadow-sm"
                >
                  <PenLine className="h-4 w-4" />
                  Perbaiki Data Sekarang
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
