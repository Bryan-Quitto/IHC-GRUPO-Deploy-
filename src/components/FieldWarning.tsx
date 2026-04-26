import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';


interface FieldWarningProps {
  message: string;
  show: boolean;
  /** 'error' = rojo (campo obligatorio), 'warning' = amarillo (recomendado). Default: 'warning' */
  variant?: 'error' | 'warning';
}

/**
 * Aviso de validación debajo de un campo.
 * [Accesibilidad] Incrementado a text-sm para cumplimiento WAVE.
 */
export const FieldWarning: React.FC<FieldWarningProps> = ({ message, show, variant = 'warning' }) => {
  if (!show) return null;

  const isError = variant === 'error';

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-center gap-1.5 mt-1 px-2 py-1 rounded-md text-sm font-semibold animate-in fade-in slide-in-from-top-1 duration-200 ${
        isError
          ? 'text-red-800 bg-red-50 border border-red-200'
          : 'text-amber-800 bg-amber-50 border border-amber-200'
      }`}
    >
      {isError
        ? <XCircle size={14} className="text-red-600 shrink-0" aria-hidden="true" />
        : <AlertTriangle size={14} className="text-amber-600 shrink-0" aria-hidden="true" />
      }
      <span>{message}</span>
    </div>
  );
};