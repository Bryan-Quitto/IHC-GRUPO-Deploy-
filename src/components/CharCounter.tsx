import React from 'react';
import { MAX_CHARS } from './validation';

/**
 * Contador de caracteres que se vuelve rojo cuando supera el límite.
 * [Accesibilidad] Incrementado a text-sm para cumplimiento WAVE.
 */
export const CharCounter: React.FC<{ value: string | undefined }> = ({ value }) => {
  const len = value?.length ?? 0;
  const over = len > MAX_CHARS;
  return (
    <div className={`text-right text-sm font-semibold mt-0.5 transition-colors ${over ? 'text-red-600' : len > MAX_CHARS * 0.8 ? 'text-amber-600' : 'text-slate-500'}`}>
      {len}/{MAX_CHARS}
      {over && <span className="ml-1">⚠ Límite superado</span>}
    </div>
  );
};
