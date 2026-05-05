// src/components/SeveritySuggestion.tsx
import React from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { Severity } from '../models/types';

interface SeveritySuggestionProps {
  suggested:   Severity;
  current:     Severity;
  onAccept:    () => void;
  onDismiss:   () => void;
}

const SEV_COLORS: Record<Severity, { bg: string; text: string; border: string }> = {
  Baja:    { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  Media:   { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  Alta:    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  Crítica: { bg: 'bg-red-100',   text: 'text-red-800',    border: 'border-red-300' },
};

export const SeveritySuggestion: React.FC<SeveritySuggestionProps> = ({
  suggested, current, onAccept, onDismiss,
}) => {
  if (suggested === current) return null;

  const c = SEV_COLORS[suggested];

  return (
    <div
      className={`mt-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${c.bg} ${c.border} animate-in slide-in-from-top-1 duration-200`}
      role="status"
      aria-live="polite"
    >
      <Sparkles size={14} className={c.text} aria-hidden="true" />
      <span className={`text-xs font-bold flex-1 ${c.text}`}>
        Respuesta sugerida: <strong>{suggested}</strong>
      </span>
      <button
        type="button"
        onClick={onAccept}
        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-black border-none cursor-pointer transition-all ${c.bg} ${c.text} hover:brightness-90`}
        aria-label={`Aceptar severidad sugerida: ${suggested}`}
      >
        <Check size={14} strokeWidth={3} />
        Aplicar
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className={`p-0.5 rounded border-none cursor-pointer bg-transparent ${c.text} hover:brightness-75`}
        aria-label="Descartar sugerencia de severidad"
      >
        <X size={14} />
      </button>
    </div>
  );
};