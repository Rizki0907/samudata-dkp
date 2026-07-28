import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, CheckSquare, Square } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SearchableMultiSelect({
  options = [],
  value,
  values,
  label,
  onChange,
  placeholder = 'Semua Pilihan',
  disabled = false,
  className
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const activeVal = value !== undefined ? value : (values !== undefined ? values : []);
  const selectedValues = Array.isArray(activeVal) ? activeVal : (activeVal ? [activeVal] : []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getOptionLabel = (opt) => {
    if (opt && typeof opt === 'object' && 'label' in opt) return opt.label;
    return String(opt);
  };

  const getOptionValue = (opt) => {
    if (opt && typeof opt === 'object' && 'value' in opt) return String(opt.value);
    return String(opt);
  };

  const filteredOptions = options.filter(opt =>
    getOptionLabel(opt).toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (optVal) => {
    const isSelected = selectedValues.includes(optVal);
    let newValues;
    if (isSelected) {
      newValues = selectedValues.filter(v => v !== optVal);
    } else {
      newValues = [...selectedValues, optVal];
    }
    onChange(newValues);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const renderDisplayValue = () => {
    if (selectedValues.length === 0) {
      return <span className="text-muted-foreground truncate">{placeholder}</span>;
    }
    if (selectedValues.length === 1) {
      const found = options.find(opt => getOptionValue(opt) === selectedValues[0]);
      return <span className="text-foreground font-medium truncate">{found ? getOptionLabel(found) : selectedValues[0]}</span>;
    }
    return (
      <div className="flex items-center gap-1.5 truncate">
        <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold rounded-full text-xs shrink-0">
          {selectedValues.length} Terpilih
        </span>
        <span className="text-xs text-muted-foreground truncate">
          ({selectedValues.slice(0, 2).join(', ')}{selectedValues.length > 2 ? '...' : ''})
        </span>
      </div>
    );
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center justify-between w-full rounded-lg border bg-background px-3 py-2 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-primary/50 text-sm select-none",
          disabled ? "opacity-50 cursor-not-allowed bg-muted/50" : "hover:border-primary/50",
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex-1 min-w-0 flex items-center">
          {renderDisplayValue()}
        </div>

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {selectedValues.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
              title="Reset Filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 overflow-hidden">
          {/* Search bar */}
          <div className="p-2 border-b border-border flex items-center gap-2 sticky top-0 bg-card z-10">
            <Search className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent border-none outline-none text-sm px-1 py-1 text-foreground focus:ring-0 placeholder:text-muted-foreground"
              placeholder="Cari pilihan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground mr-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reset / Semua Pilihan */}
          <div
            className={cn(
              "px-3 py-2 text-sm border-b border-border cursor-pointer transition-colors flex items-center gap-2.5 font-medium select-none",
              selectedValues.length === 0 ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
            )}
            onClick={() => onChange([])}
          >
            {selectedValues.length === 0 ? (
              <CheckSquare className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span>{placeholder}</span>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const optVal = getOptionValue(opt);
                const optLabel = getOptionLabel(opt);
                const isSelected = selectedValues.includes(optVal);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors flex items-center gap-2.5 select-none",
                      isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                    )}
                    onClick={() => handleToggle(optVal)}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="truncate">{optLabel}</span>
                  </div>
                );
              })
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
