export const MAX_CHARS = 150;

/** Returns true if the text exceeds the character limit */
export function exceedsMax(value: string | undefined): boolean {
  return (value?.length ?? 0) > MAX_CHARS;
}

/** Clamp input to MAX_CHARS */
export function clamp(value: string): string {
  return value.slice(0, MAX_CHARS);
}

/**
 * Devuelve las clases CSS del input según el tipo de aviso.
 * variant='error'   → borde rojo + fondo rojo tenue
 * variant='warning' → borde amarillo + fondo amarillo tenue
 *
 * [Fase 3 — Contraste] El borde coloreado + fondo tenue actúan como
 * señal pre-atentiva: el ojo detecta el cambio de color antes de leer
 * el texto del error (principio de pre-atención visual, Ware 2004).
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

/**
 * Validate a date string (YYYY-MM-DD from <input type="date">).
 * Rules:
 *   - Must be a complete date (year + month + day all present)
 *   - Must not be more than 14 days (2 weeks) before today
 * Returns an error message string or null if valid.
 */
export function validateDate(value: string | undefined | null): string | null {
  if (!value || value.trim() === '') return 'Seleccione una fecha completa (mes/día/año).';

  // HTML date inputs give YYYY-MM-DD; check all parts present
  const parts = value.split('-');
  if (parts.length !== 3 || parts[0].length !== 4 || parts[1].length !== 2 || parts[2].length !== 2) {
    return 'La fecha debe incluir día, mes y año completos.';
  }

  const selected = new Date(value + 'T00:00:00');
  if (isNaN(selected.getTime())) {
    return 'Fecha inválida. Ingrese una fecha real.';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);

  if (selected < twoWeeksAgo) {
    return 'La fecha no puede ser anterior a 2 semanas desde hoy.';
  }

  return null;
}
