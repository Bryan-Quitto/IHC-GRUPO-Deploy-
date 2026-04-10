import React, { useState, useEffect } from 'react';
import { Observation, SuccessStatus, Severity } from '../models/types';
import { Trash2, Plus, CheckCircle, RefreshCcw, ClipboardList, Check, X } from 'lucide-react';

interface ObservationsViewProps {
  data: Observation[];
  onSync: (data: Observation[]) => void;
  onAdd: () => void;
  onSave: (id: string, updates: Partial<Observation>) => void;
  onDelete: (id: string) => void;
  planId?: string;
  productName?: string;
  onGoToPlan: () => void;
}

const severityStyles: Record<string, { bg: string; text: string; border: string }> = {
  Baja:    { bg: 'bg-green-50',  text: 'text-green-900', border: 'border-green-200' },
  Media:   { bg: 'bg-amber-50',  text: 'text-amber-900', border: 'border-amber-200' },
  Alta:    { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
  Crítica: { bg: 'bg-red-50',    text: 'text-red-900',    border: 'border-red-200' },
};

const successStyles: Record<string, { bg: string; text: string; border: string }> = {
  'Sí':        { bg: 'bg-green-50',  text: 'text-green-900', border: 'border-green-200' },
  'No':        { bg: 'bg-red-50',    text: 'text-red-900',    border: 'border-red-200' },
  'Con ayuda': { bg: 'bg-amber-50',  text: 'text-amber-900', border: 'border-amber-200' },
};

function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    handler();
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

/* ── Tarjeta individual para móvil ── */
const ObservationCard: React.FC<{
  obs: Observation;
  idx: number;
  onLocalChange: (id: string, updates: Partial<Observation>) => void;
  onSave: (id: string, updates: Partial<Observation>) => void;
  onDelete: (id: string) => void;
  onAction: (fn: () => void) => void;
}> = ({ obs, idx, onLocalChange, onSave, onDelete, onAction }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sStyle  = severityStyles[obs.severity]     || severityStyles['Baja'];
  const okStyle = successStyles[obs.success_level] || successStyles['Sí'];

  return (
    <article
      className={`bg-white border-2 ${sStyle.border} rounded-2xl mb-4 overflow-hidden shadow-sm animate-in slide-in-from-left-2 duration-300`}
      aria-label={`Observación ${idx + 1}`}
    >
      {/* Cabecera */}
      <div className={`${sStyle.bg} p-4 flex justify-between items-center flex-wrap gap-2`}>
        <span className={`font-black ${sStyle.text} text-[0.85rem] uppercase tracking-tighter`}>
          Observación #{idx + 1}
        </span>
        <div className="flex gap-2 items-center flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full ${okStyle.bg} ${okStyle.text} font-bold text-[0.7rem] border ${okStyle.border}`}>
            {obs.success_level || 'Sí'}
          </span>
          <span className={`px-2.5 py-0.5 rounded-md ${sStyle.bg} ${sStyle.text} font-bold text-[0.7rem] border ${sStyle.border}`}>
            {obs.severity || 'Baja'}
          </span>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-4 flex flex-col gap-4">

        {/* Fila: Participante + Perfil + Tarea */}
        <div className="grid grid-cols-[1fr_1fr_80px] gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-obs-participant-${obs.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Participante</label>
            <input id={`m-obs-participant-${obs.id}`} type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all" value={obs.participant || ''} onChange={e => onLocalChange(obs.id!, { participant: e.target.value })} onBlur={e => onAction(() => onSave(obs.id!, { participant: e.target.value }))} placeholder="P1" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-obs-profile-${obs.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Perfil</label>
            <input id={`m-obs-profile-${obs.id}`} type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all" value={obs.profile || ''} onChange={e => onLocalChange(obs.id!, { profile: e.target.value })} onBlur={e => onAction(() => onSave(obs.id!, { profile: e.target.value }))} placeholder="Estudiante" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-obs-taskref-${obs.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Tarea</label>
            <input id={`m-obs-taskref-${obs.id}`} type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all" value={obs.task_ref || ''} onChange={e => onLocalChange(obs.id!, { task_ref: e.target.value })} onBlur={e => onAction(() => onSave(obs.id!, { task_ref: e.target.value }))} placeholder="T1" />
          </div>
        </div>

        {/* Fila: Éxito + Tiempo + Errores */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-obs-success-${obs.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Éxito</label>
            <select
              id={`m-obs-success-${obs.id}`}
              className={`w-full p-2 border ${okStyle.border} rounded-lg text-sm ${okStyle.bg} ${okStyle.text} font-bold outline-none cursor-pointer`}
              value={obs.success_level}
              onChange={e => {
                const val = e.target.value as SuccessStatus;
                onLocalChange(obs.id!, { success_level: val });
                onAction(() => onSave(obs.id!, { success_level: val }));
              }}
            >
              <option value="Sí">Sí</option>
              <option value="No">No</option>
              <option value="Con ayuda">Con ayuda</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-obs-time-${obs.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Tiempo (s)</label>
            <input id={`m-obs-time-${obs.id}`} type="number" min="0" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all font-mono font-bold" value={obs.time_seconds} onChange={e => onLocalChange(obs.id!, { time_seconds: parseInt(e.target.value) || 0 })} onBlur={e => onAction(() => onSave(obs.id!, { time_seconds: parseInt(e.target.value) || 0 }))} placeholder="0" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-obs-errors-${obs.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Errores</label>
            <input id={`m-obs-errors-${obs.id}`} type="number" min="0" className={`w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all font-mono font-bold ${obs.errors > 2 ? 'text-red-600' : 'text-slate-800'}`} value={obs.errors} onChange={e => onLocalChange(obs.id!, { errors: parseInt(e.target.value) || 0 })} onBlur={e => onAction(() => onSave(obs.id!, { errors: parseInt(e.target.value) || 0 }))} placeholder="0" />
          </div>
        </div>

        {/* Comentarios */}
        <div className="flex flex-col gap-1">
          <label htmlFor={`m-obs-comments-${obs.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Comentarios clave</label>
          <textarea id={`m-obs-comments-${obs.id}`} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all font-medium" value={obs.comments || ''} onChange={e => onLocalChange(obs.id!, { comments: e.target.value })} onBlur={e => onAction(() => onSave(obs.id!, { comments: e.target.value }))} placeholder="Ej. Dudó entre 'Notas' y 'Rendimiento'" rows={2} />
        </div>

        {/* Problema */}
        <div className="flex flex-col gap-1">
          <label htmlFor={`m-obs-problem-${obs.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest text-red-800">Problema detectado</label>
          <textarea id={`m-obs-problem-${obs.id}`} className="w-full p-2.5 border border-red-100 rounded-lg text-sm bg-red-50/30 focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium italic" value={obs.problem || ''} onChange={e => onLocalChange(obs.id!, { problem: e.target.value })} onBlur={e => onAction(() => onSave(obs.id!, { problem: e.target.value }))} placeholder="Ej. Nombre del menú no es claro" rows={2} />
        </div>

        {/* Fila: Severidad + Mejora */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-obs-severity-${obs.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Severidad</label>
            <select
              id={`m-obs-severity-${obs.id}`}
              className={`w-full p-2 border ${sStyle.border} rounded-lg text-sm ${sStyle.bg} ${sStyle.text} font-bold outline-none cursor-pointer`}
              value={obs.severity}
              onChange={e => {
                const val = e.target.value as Severity;
                onLocalChange(obs.id!, { severity: val });
                onAction(() => onSave(obs.id!, { severity: val }));
              }}
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-obs-proposal-${obs.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest text-green-800">Mejora propuesta</label>
            <textarea id={`m-obs-proposal-${obs.id}`} className="w-full p-2.5 border border-green-100 rounded-lg text-sm bg-green-50/30 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-50 outline-none transition-all font-medium" value={obs.proposal || ''} onChange={e => onLocalChange(obs.id!, { proposal: e.target.value })} onBlur={e => onAction(() => onSave(obs.id!, { proposal: e.target.value }))} placeholder="Ej. Renombrar el menú" rows={2} />
          </div>
        </div>

        {/* Botón eliminar */}
        <div className="flex justify-end pt-2 border-t border-slate-100 mt-2">
          {confirmDelete ? (
            <div className="flex gap-2 items-center animate-in zoom-in-95 duration-200">
              <span className="text-[0.7rem] text-red-600 font-black uppercase tracking-widest">Confirmar:</span>
              <button
                type="button"
                onClick={() => { onDelete(obs.id!); setConfirmDelete(false); }}
                className="inline-flex items-center justify-center w-8 h-8 bg-red-600 text-white border-none rounded-lg cursor-pointer transition-all hover:bg-red-700 shadow-md shadow-red-100"
                title="Confirmar eliminación"
              >
                <Check size={16} strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-500 border-none rounded-lg cursor-pointer transition-all hover:bg-slate-200"
                title="Cancelar"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button type="button" className="inline-flex items-center gap-1.5 bg-transparent border-none text-slate-400 cursor-pointer p-2 rounded-lg transition-all hover:bg-red-50 hover:text-red-600" onClick={() => setConfirmDelete(true)} aria-label={`Eliminar observación ${idx + 1}`}>
              <Trash2 size={18} aria-hidden="true" />
              <span className="text-[0.82rem] font-bold">Eliminar</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

/* ── Fila de la tabla para desktop ── */
const ObservationRow: React.FC<{
  obs: Observation;
  handleLocalChange: (id: string, updates: Partial<Observation>) => void;
  handleActionWithStatus: (action: () => void) => void;
  onSave: (id: string, updates: Partial<Observation>) => void;
  onDelete: (id: string) => void;
}> = ({ obs, handleLocalChange, handleActionWithStatus, onSave, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sStyle  = severityStyles[obs.severity]     || severityStyles['Baja'];
  const okStyle = successStyles[obs.success_level] || successStyles['Sí'];

  return (
    <tr key={obs.id} className="hover:bg-slate-50/50 transition-colors">
      <td className="p-2">
        <label htmlFor={`obs-participant-${obs.id}`} className="sr-only">Participante</label>
        <input id={`obs-participant-${obs.id}`} type="text" className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-bold text-slate-800" value={obs.participant || ''} onChange={e => handleLocalChange(obs.id!, { participant: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { participant: e.target.value }))} placeholder="P1" />
      </td>
      <td className="p-2">
        <label htmlFor={`obs-profile-${obs.id}`} className="sr-only">Perfil</label>
        <input id={`obs-profile-${obs.id}`} type="text" className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium" value={obs.profile || ''} onChange={e => handleLocalChange(obs.id!, { profile: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { profile: e.target.value }))} placeholder="Estudiante" />
      </td>
      <td className="p-2 text-center">
        <label htmlFor={`obs-taskref-${obs.id}`} className="sr-only">Tarea</label>
        <input id={`obs-taskref-${obs.id}`} type="text" className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm text-center transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-black text-navy" value={obs.task_ref || ''} onChange={e => handleLocalChange(obs.id!, { task_ref: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { task_ref: e.target.value }))} placeholder="T1" />
      </td>
      <td className="p-3">
        <label htmlFor={`obs-success-${obs.id}`} className="sr-only">Éxito</label>
        <select id={`obs-success-${obs.id}`} className={`w-full p-2 border ${okStyle.border} rounded-lg text-[0.75rem] ${okStyle.bg} ${okStyle.text} font-black outline-none cursor-pointer`} value={obs.success_level} onChange={e => { const val = e.target.value as SuccessStatus; handleLocalChange(obs.id!, { success_level: val }); handleActionWithStatus(() => onSave(obs.id!, { success_level: val })); }}>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
          <option value="Con ayuda">Con ayuda</option>
        </select>
      </td>
      <td className="p-2">
        <label htmlFor={`obs-time-${obs.id}`} className="sr-only">Tiempo</label>
        <input id={`obs-time-${obs.id}`} type="number" min="0" className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm text-center transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-mono font-bold" value={obs.time_seconds} onChange={e => handleLocalChange(obs.id!, { time_seconds: parseInt(e.target.value) || 0 })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { time_seconds: parseInt(e.target.value) || 0 }))} placeholder="0" />
      </td>
      <td className="p-2">
        <label htmlFor={`obs-errors-${obs.id}`} className="sr-only">Errores</label>
        <input id={`obs-errors-${obs.id}`} type="number" min="0" className={`w-full p-2 border border-transparent bg-transparent rounded-lg text-sm text-center transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-mono font-bold ${obs.errors > 2 ? 'text-red-600' : 'text-slate-800'}`} value={obs.errors} onChange={e => handleLocalChange(obs.id!, { errors: parseInt(e.target.value) || 0 })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { errors: parseInt(e.target.value) || 0 }))} placeholder="0" />
      </td>
      <td className="p-2">
        <label htmlFor={`obs-comments-${obs.id}`} className="sr-only">Comentarios</label>
        <textarea id={`obs-comments-${obs.id}`} className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium min-h-[60px]" value={obs.comments || ''} onChange={e => handleLocalChange(obs.id!, { comments: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { comments: e.target.value }))} placeholder="Ej. Dudó entre opciones" rows={2} />
      </td>
      <td className="p-2">
        <label htmlFor={`obs-problem-${obs.id}`} className="sr-only">Problema</label>
        <textarea id={`obs-problem-${obs.id}`} className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none font-medium italic text-red-900 min-h-[60px]" value={obs.problem || ''} onChange={e => handleLocalChange(obs.id!, { problem: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { problem: e.target.value }))} placeholder="Ej. Menú no es claro" rows={2} />
      </td>
      <td className="p-3">
        <label htmlFor={`obs-severity-${obs.id}`} className="sr-only">Severidad</label>
        <select id={`obs-severity-${obs.id}`} className={`w-full p-2 border ${sStyle.border} rounded-lg text-[0.75rem] ${sStyle.bg} ${sStyle.text} font-black outline-none cursor-pointer`} value={obs.severity} onChange={e => { const val = e.target.value as Severity; handleLocalChange(obs.id!, { severity: val }); handleActionWithStatus(() => onSave(obs.id!, { severity: val })); }}>
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
          <option value="Crítica">Crítica</option>
        </select>
      </td>
      <td className="p-2">
        <label htmlFor={`obs-proposal-${obs.id}`} className="sr-only">Mejora</label>
        <textarea id={`obs-proposal-${obs.id}`} className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-50 outline-none font-medium min-h-[60px]" value={obs.proposal || ''} onChange={e => handleLocalChange(obs.id!, { proposal: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { proposal: e.target.value }))} placeholder="Ej. Renombrar menú" rows={2} />
      </td>
      <td className="p-3 text-center">
        {confirmDelete ? (
          <div className="flex flex-col gap-1 items-center animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => { onDelete(obs.id!); setConfirmDelete(false); }}
              className="bg-red-600 text-white border-none rounded-md w-7 h-7 flex items-center justify-center cursor-pointer transition-all hover:bg-red-700 shadow-sm"
              title="Confirmar eliminación"
            >
              <Check size={14} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="bg-slate-200 text-slate-600 border-none rounded-md w-7 h-7 flex items-center justify-center cursor-pointer transition-all hover:bg-slate-300 shadow-sm"
              title="Cancelar"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button type="button" className="bg-transparent border-none text-slate-300 p-2 cursor-pointer transition-all hover:bg-red-50 hover:text-red-600 rounded-lg" onClick={() => setConfirmDelete(true)} aria-label={`Eliminar observación de ${obs.participant || 'participante'} en tarea ${obs.task_ref || ''}`}>
            <Trash2 size={18} aria-hidden="true" />
          </button>
        )}
      </td>
    </tr>
  );
};

/* ── Componente principal ── */
export const ObservationsView: React.FC<ObservationsViewProps> = ({
  data, onSync, onAdd, onSave, onDelete, planId, productName, onGoToPlan,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const isProductEmpty = !productName || productName.trim() === '';
  const width = useWindowWidth();
  const isMobile = width < 1024;

  const handleActionWithStatus = (action: () => void) => {
    setIsSaving(true);
    action();
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleLocalChange = (id: string, updates: Partial<Observation>) => {
    const updated = data.map(o => o.id === id ? { ...o, ...updates } : o);
    onSync(updated);
  };

  const totalObs    = data.length;
  const totalOk     = data.filter((o) => o.success_level === 'Sí').length;
  const totalErrors = data.reduce((acc, o) => acc + (o.errors || 0), 0);
  const avgTime     = totalObs > 0
    ? Math.round(data.reduce((acc, o) => acc + (o.time_seconds || 0), 0) / totalObs)
    : 0;

  return (
    <div className="animate-in fade-in duration-500">
      <header className="relative flex items-center justify-center bg-navy text-white p-4 md:px-6 rounded-xl mb-8 shadow-md min-h-[70px]">
        <h2 className="text-xl md:text-2xl font-bold m-0 text-center px-12">Registro de observación — prueba de usabilidad</h2>
        <div aria-live="polite" aria-atomic="true" className="absolute right-4 md:right-6 flex items-center gap-2 text-sm font-bold opacity-90 text-right">
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-white animate-pulse">
              <RefreshCcw size={14} className="animate-spin" aria-hidden="true" />
              <span>Guardando...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle size={14} aria-hidden="true" />
              <span>Cambios guardados</span>
            </span>
          )}
        </div>
      </header>

      <div className="space-y-8">
        {isProductEmpty ? (
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="obs-empty-heading">
            <div className="text-center p-12 md:p-16 flex flex-col items-center">
              <div aria-hidden="true" className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <ClipboardList size={40} className="text-amber-600" />
              </div>
              <h3 id="obs-empty-heading" className="text-xl font-black text-slate-900 mb-2">¡Falta el nombre del producto!</h3>
              <p className="text-slate-500 font-medium max-w-[400px] mb-8 leading-relaxed">
                Para registrar observaciones, primero debes asignar un nombre al producto en la pestaña de Plan.
              </p>
              <button type="button" onClick={onGoToPlan} className="inline-flex items-center gap-2 bg-navy text-white border-none rounded-xl px-8 py-3.5 text-base font-black cursor-pointer transition-all hover:bg-navy-dark shadow-lg shadow-navy/20 active:scale-[0.98]">
                Ir a definir Producto
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Tarjetas de resumen */}
            {totalObs > 0 && (
              <section aria-labelledby="obs-stats-heading" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <h3 id="obs-stats-heading" className="sr-only">Resumen de observaciones</h3>
                {[
                  { label: 'Observaciones',  value: totalObs,    color: 'text-navy', border: 'border-navy' },
                  { label: 'Tareas exitosas', value: totalOk,     color: 'text-green-700', border: 'border-green-600' },
                  { label: 'Total errores',   value: totalErrors, color: 'text-red-600', border: 'border-red-600' },
                  { label: 'Tiempo promedio', value: avgTime,     color: 'text-amber-600', border: 'border-amber-600', suffix: 's' },
                ].map(({ label, value, color, border, suffix }) => (
                  <div key={label} className={`bg-white border border-slate-200 border-t-4 ${border} rounded-xl p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md`}>
                    <p className="m-0 text-[0.7rem] text-slate-500 font-black uppercase tracking-widest mb-1">{label}</p>
                    <p className={`m-0 text-3xl font-black font-mono ${color}`}>{value}{suffix}</p>
                  </div>
                ))}
              </section>
            )}

            {/* ── MÓVIL: tarjetas ── */}
            {isMobile && (
              <section aria-labelledby="obs-cards-heading">
                <h3 id="obs-cards-heading" className="text-[0.9rem] font-black text-navy uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-navy rounded-full"></span> Observaciones registradas
                </h3>
                {data.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium italic mb-6">
                    No hay observaciones todavía.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.map((obs, idx) => (
                      <ObservationCard
                        key={obs.id}
                        obs={obs}
                        idx={idx}
                        onLocalChange={handleLocalChange}
                        onSave={onSave}
                        onDelete={onDelete}
                        onAction={handleActionWithStatus}
                      />
                    ))}
                  </div>
                )}
                <button type="button" className="inline-flex items-center justify-center gap-2 w-full bg-navy text-white border-none p-4 rounded-2xl font-black text-sm uppercase tracking-widest cursor-pointer transition-all hover:bg-navy-dark shadow-lg shadow-navy/10 mt-4 active:scale-[0.98]" onClick={onAdd} disabled={!planId} aria-label="Añadir nueva observación">
                  <Plus size={20} aria-hidden="true" /> Añadir Observación
                </button>
              </section>
            )}

            {/* ── DESKTOP: tabla ── */}
            {!isMobile && (
              <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="obs-tabla-heading">
                <h3 className="bg-navy-light text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0" id="obs-tabla-heading">Observaciones registradas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <caption className="sr-only">Registro de observaciones de prueba de usabilidad</caption>
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[0.7rem] font-black uppercase tracking-[0.1em] border-b border-slate-200">
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Participante</th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Perfil</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[80px]">Tarea</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[130px]">Éxito</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[100px]">Tiempo (s)</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[80px]">Errores</th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Comentarios clave</th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Problema detectado</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[130px]">Severidad</th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Mejora propuesta</th>
                        <th scope="col" className="p-4 text-center w-[60px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.length > 0 ? (
                        data.map((obs) => (
                          <ObservationRow
                            key={obs.id}
                            obs={obs}
                            handleLocalChange={handleLocalChange}
                            handleActionWithStatus={handleActionWithStatus}
                            onSave={onSave}
                            onDelete={onDelete}
                          />
                        ))
                      ) : (
                        <tr><td colSpan={11} className="p-12 text-center text-slate-500 italic font-medium">No hay observaciones registradas. Haz clic en el botón de abajo para empezar.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 px-6 bg-slate-50 border-t border-slate-200">
                  <button type="button" className="inline-flex items-center gap-2 bg-navy text-white border-none px-6 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider cursor-pointer transition-all hover:bg-navy-dark shadow-md shadow-navy/10 active:scale-[0.98]" onClick={onAdd} disabled={!planId} aria-label="Añadir nueva observación">
                    <Plus size={18} aria-hidden="true" /> Añadir Observación
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};