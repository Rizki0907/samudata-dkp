import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

export default function PromptModal({ isOpen, title, message, onClose, onSubmit }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      // Use setTimeout to ensure the modal is rendered before focusing
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8 animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{message}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(inputValue); }} className="mt-5">
            <input
              ref={inputRef}
              type="text"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </form>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={(e) => onSubmit(inputValue)}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
