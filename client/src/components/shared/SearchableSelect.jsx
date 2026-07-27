import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SearchableSelect({
  options,
  value,
  onChange,
  name,
  placeholder = 'Pilih...',
  disabled = false,
  className
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch(''); // Reset search on close
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getLabel = (opt) => typeof opt === 'object' && opt !== null ? String(opt.label) : String(opt);
  const getValue = (opt) => typeof opt === 'object' && opt !== null ? String(opt.value) : String(opt);

  const filteredOptions = options.filter(opt => 
    getLabel(opt).toLowerCase().includes(search.toLowerCase())
  );

  const selectedOpt = options.find(opt => getValue(opt) === String(value));
  const displayValue = selectedOpt ? getLabel(selectedOpt) : (value || placeholder);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        className={cn(
          "flex items-center justify-between w-full rounded-lg border bg-background px-3 py-2 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-primary/50",
          disabled ? "opacity-50 cursor-not-allowed bg-muted/50" : "hover:border-primary/50",
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={cn("block truncate text-sm", !value && "text-muted-foreground")}>
          {displayValue}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 overflow-hidden">
          <div className="p-2 border-b border-border flex items-center gap-2 sticky top-0 bg-card z-10">
            <Search className="w-4 h-4 text-muted-foreground ml-1" />
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent border-none outline-none text-sm px-1 py-1 text-foreground focus:ring-0"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const optVal = getValue(opt);
                const optLabel = getLabel(opt);
                return (
                <div
                  key={idx}
                  className={cn(
                    "px-3 py-2.5 text-sm rounded-md cursor-pointer transition-colors flex items-center justify-between",
                    String(value) === String(optVal) ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                  )}
                  onClick={() => {
                    onChange({ target: { name, value: optVal } });
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {optLabel}
                </div>
              )})
            ) : (
              <div className="px-3 py-6 text-center flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-muted-foreground">Tidak ditemukan</span>
                <span className="text-xs text-muted-foreground/70">Pilihan "{search}" tidak tersedia</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
