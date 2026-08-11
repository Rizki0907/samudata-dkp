import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Trash2, Info, X } from 'lucide-react';

export default function ActionDialog({ dialog, value, setValue, onClose, onSubmit }) {
  if (!dialog?.open) return null;
  const themes = {
    APPROVED: { border: 'border-blue-500/30', bg: 'bg-blue-500', soft: 'bg-blue-500/10', text: 'text-blue-600', icon: CheckCircle },
    VERIFIED: { border: 'border-emerald-500/30', bg: 'bg-emerald-500', soft: 'bg-emerald-500/10', text: 'text-emerald-600', icon: CheckCircle },
    REJECTED: { border: 'border-rose-500/30', bg: 'bg-rose-500', soft: 'bg-rose-500/10', text: 'text-rose-600', icon: XCircle },
    DELETE: { border: 'border-rose-500/30', bg: 'bg-rose-500', soft: 'bg-rose-500/10', text: 'text-rose-600', icon: Trash2 },
    INFO: { border: 'border-primary/30', bg: 'bg-primary', soft: 'bg-primary/10', text: 'text-primary', icon: Info },
  };
  const theme = themes[dialog.theme] || themes.INFO;
  const Icon = theme.icon;
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60 px-4 py-8" onClick={onClose}>
      <div className={`w-full max-w-lg overflow-hidden rounded-3xl border ${theme.border} bg-card shadow-2xl`} onClick={event => event.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.soft} ${theme.text}`}><Icon className="h-6 w-6" /></div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-foreground">{dialog.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{dialog.message}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
          </div>
          {dialog.input ? (
            <div className="mt-5">
              {dialog.multiline ? (
                <textarea autoFocus rows={4} value={value} onChange={event => setValue(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              ) : (
                <input autoFocus type="text" value={value} onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') onSubmit(); }} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              )}
            </div>
          ) : null}
          {dialog.error ? <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{dialog.error}</div> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-5">
          {dialog.showCancel !== false ? <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted">Batal</button> : null}
          <button type="button" onClick={onSubmit} disabled={dialog.loading} className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${theme.bg} disabled:opacity-50`}>
            {dialog.loading ? 'Memproses...' : (dialog.confirmLabel || 'OK')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
