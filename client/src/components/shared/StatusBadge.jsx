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
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground">
                    Data Ditolak (Perlu Perbaikan)
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Data ini tidak dapat divalidasi oleh Pusat karena ada beberapa hal
                    yang harus diperbaiki. Silakan cek detail di bawah ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
                <h4 className="font-semibold text-rose-600 mb-2">Alasan Penolakan:</h4>
                <div className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                  {alasan || '-'}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <h4 className="font-semibold text-foreground mb-3 text-sm">
                  Konteks Data yang Ditolak:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                  {contextFields && contextFields.map((field, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{field.label}</span>
                      <span className="text-sm font-medium text-foreground break-words mt-0.5">
                        {field.value || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-xl bg-blue-500/10 p-4 text-blue-600">
                <Info className="h-5 w-5 shrink-0" />
                <p className="text-sm">
                  Silakan tekan tombol di bawah ini untuk langsung menuju form edit dan memperbaiki
                  data sesuai arahan Pusat.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/20 p-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
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
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600 hover:shadow-rose-500/40 active:scale-95"
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
