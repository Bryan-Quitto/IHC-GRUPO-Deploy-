// src/components/SuggestionsInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';

interface SuggestionsInputProps {
  value:        string;
  suggestions:  string[];
  onChange:     (val: string) => void;
  onBlur?:      (val: string) => void;
  placeholder?: string;
  className?:   string;
  id?:          string;
  maxLength?:   number;
  rows?:        number;
  'aria-label'?: string;
}

/**
 * Textarea con panel de sugerencias contextual.
 * Muestra sugerencias filtradas por el texto actual.
 * Completamente accesible y sin romper el diseño existente.
 */
export const SuggestionsInput: React.FC<SuggestionsInputProps> = ({
  value, suggestions, onChange, onBlur,
  placeholder, className = '', id, maxLength, rows = 2,
  'aria-label': ariaLabel,
}) => {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState('');
  const wrapRef             = useRef<HTMLDivElement>(null);
  const listId              = `suggestions-${id || Math.random().toString(36).slice(2)}`;

  // Cerrar al clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtrar sugerencias por lo escrito (si hay 3+ chars o está vacío)
  const filtered = suggestions.filter(s => {
    if (!query || query.length < 2) return true;
    return s.toLowerCase().includes(query.toLowerCase());
  }).slice(0, 6);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
    setQuery(v);
    onChange(v);
    if (v.length > 0) setOpen(true);
  };

  const handleSelect = (suggestion: string) => {
    const v = maxLength ? suggestion.slice(0, maxLength) : suggestion;
    onChange(v);
    setQuery(v);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative">
        <textarea
          id={id}
          rows={rows}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-expanded={open}
          className={`${className} resize-none overflow-y-auto`}
          style={{ maxHeight: 'calc(1.5em * 5 + 1.5rem)' }}
          onChange={handleChange}
          onBlur={e => {
            // pequeño delay para permitir clic en sugerencia
            setTimeout(() => setOpen(false), 150);
            if (onBlur) onBlur(e.target.value);
          }}
          onFocus={() => { if (filtered.length > 0) setOpen(true); }}
        />
        {/* Ícono de sugerencias */}
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-2 top-2 p-1 rounded-md border-none bg-transparent cursor-pointer text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-all"
          onClick={() => setOpen(v => !v)}
          aria-label="Ver sugerencias"
          title="Ver sugerencias de texto"
        >
          <Lightbulb size={13} aria-hidden="true" />
        </button>
      </div>

      {/* Lista de sugerencias */}
      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Sugerencias"
          className="absolute z-[200] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto list-none p-1 m-0 animate-in fade-in zoom-in-95 duration-150"
        >
          <li className="px-3 py-1 text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pointer-events-none flex items-center gap-1">
            <Lightbulb size={10} aria-hidden="true" /> Sugerencias
          </li>
          {filtered.map((s, i) => (
            <li key={i} role="option" aria-selected={value === s}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-[0.78rem] font-medium text-slate-700 hover:bg-navy/5 hover:text-navy transition-colors rounded-lg border-none bg-transparent cursor-pointer"
                onMouseDown={e => { e.preventDefault(); handleSelect(s); }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};