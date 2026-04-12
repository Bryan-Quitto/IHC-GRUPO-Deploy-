import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { MAX_CHARS } from './validation';

interface FieldWarningProps {
  message: string;
  show: boolean;
  /** 'error' = rojo (campo obligatorio), 'warning' = amarillo (recomendado). Default: 'warning' */
  variant?: 'error' | 'warning';
}

/**
 * Aviso de validación debajo de un campo.
 * - variant='error'   → rojo  (campo obligatorio vacío o dato inválido)
 * - variant='warning' → amarillo (campo recomendado vacío)
 */
export const FieldWarning: React.FC<FieldWarningProps> = ({ message, show, variant = 'warning' }) => {
  if (!show) return null;

  const isError = variant === 'error';

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-center gap-1.5 mt-1 text-[0.75rem] font-semibold animate-in fade-in slide-in-from-top-1 duration-200 ${
        isError ? 'text-red-700' : 'text-amber-700'
      }`}
    >
      {isError
        ? <XCircle size={13} className="text-red-500 shrink-0" aria-hidden="true" />
        : <AlertTriangle size={13} className="text-amber-500 shrink-0" aria-hidden="true" />
      }
      <span>{message}</span>
    </div>
  );
};

/**
 * Contador de caracteres que se vuelve rojo cuando supera el límite.
 */
export const CharCounter: React.FC<{ value: string | undefined }> = ({ value }) => {
  const len = value?.length ?? 0;
  const over = len > MAX_CHARS;
  return (
    <div className={`text-right text-[0.7rem] font-semibold mt-0.5 transition-colors ${over ? 'text-red-600' : len > MAX_CHARS * 0.8 ? 'text-amber-600' : 'text-slate-400'}`}>
      {len}/{MAX_CHARS}
      {over && <span className="ml-1">⚠ Límite superado</span>}
    </div>
  );
};

/**
 * Devuelve las clases CSS del input según el tipo de aviso.
 * variant='error'   → borde rojo + fondo rojo tenue
 * variant='warning' → borde amarillo + fondo amarillo tenue
 */
export function fieldClass(
  hasWarning: boolean,
  baseClass: string,
  variant: 'error' | 'warning' = 'warning'
): string {
  if (!hasWarning) return baseClass;

  if (variant === 'error') {
    return baseClass
      .replace(/border-slate-200/g, 'border-red-400')
      .replace(/border-transparent/g, 'border-red-400')
      .replace(/bg-white/g, 'bg-red-50')
      .replace(/bg-slate-50/g, 'bg-red-50') + ' border-red-400';
  }

  // warning (amarillo)
  return baseClass
    .replace(/border-slate-200/g, 'border-amber-400')
    .replace(/border-transparent/g, 'border-amber-400')
    .replace(/bg-white/g, 'bg-amber-50')
    .replace(/bg-slate-50/g, 'bg-amber-50') + ' border-amber-400';
}
