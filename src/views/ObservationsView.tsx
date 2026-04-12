import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Observation, SuccessStatus, Severity } from '../models/types';
import { Trash2, Plus, CheckCircle, RefreshCcw, ClipboardList, Check, X, ChevronDown, Info } from 'lucide-react';
import AutoGrowTextarea from '../components/AutoGrowTextarea';
import { FieldWarning, CharCounter, fieldClass } from '../components/FieldWarning';
import { MAX_CHARS, clamp } from '../components/validation';

interface ObservationsViewProps {
  data: Observation[];
  onSync: (data: Observation[]) => void;
  onAdd: () => void;
  onSave: (id: string, updates: Partial<Observation>) => void;
  onDelete: (id: string) => void;
  planId?: string;
  productName?: string;
  onGoToPlan: () => void;
  tasks?: { task_index: string; scenario: string }[];
}

const severityStyles: Record<string, { bg: string; text: string; border: string }> = {
  Baja:    { bg: 'bg-green-50',  text: 'text-green-900', border: 'border-green-200' },
  Media:   { bg: 'bg-amber-50',  text: 'text-amber-900', border: 'border-amber-200' },
  Alta:    { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
  Crítica: { bg: 'bg-red-50',    text: 'text-red-900',    border: 'border-red-200' },
};

const SEVERITY_WEIGHTS: Record<Severity, number> = { 'Crítica': 4, 'Alta': 3, 'Media': 2, 'Baja': 1 };

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

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ left: rect.left + rect.width / 2, top: rect.top + window.scrollY - 8 });
    }
  }, [visible]);
  return (
    <div ref={triggerRef} onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)} className="relative inline-flex items-center group cursor-help">
      {children}
      {visible && createPortal(
        <div className="absolute bg-slate-800 text-white px-3 py-2 rounded-lg text-[0.7rem] leading-snug w-[180px] z-[99999] shadow-2xl text-center pointer-events-none font-medium normal-case animate-in fade-in zoom-in-95 duration-200" style={{ left: coords.left, top: coords.top, transform: 'translate(-50%, -100%)' }}>
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent border-t-4 border-t-slate-800" />
        </div>,
        document.body
      )}
    </div>
  );
};

/* ── Tarjeta individual para móvil ── */
const ObservationCard: React.FC<{
  obs: Observation;
  idx: number;
  onLocalChange: (id: string, updates: Partial<Observation>) => void;
  onSave: (id: string, updates: Partial<Observation>) => void;
  onDelete: (id: string) => void;
  onAction: (fn: () => void) => void;
  tasks?: { task_index: string; scenario: string }[];
}> = ({ obs, idx, onLocalChange, onSave, onDelete, onAction, tasks = [] }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (f: string) => setTouched(prev => ({ ...prev, [f]: true }));
  const sStyle  = severityStyles[obs.severity]     || severityStyles['Baja'];
  const okStyle = successStyles[obs.success_level] || successStyles['Sí'];

  const warnParticipant = touched.participant && (!obs.participant || obs.participant.trim() === '');
  const warnTaskRef     = touched.task_ref && (!obs.task_ref || obs.task_ref.trim() === '');
  const warnComments    = touched.comments && (!obs.comments || obs.comments.trim() === '');
  const warnProblem     = touched.problem && (!obs.problem || obs.problem.trim() === '');

  const handleChange = (field: keyof Observation, value: string) => {
    onLocalChange(obs.id!, { [field]: typeof value === 'string' ? clamp(value) : value } as Partial<Observation>);
  };

  return (
    <article className={`bg-white border-2 ${sStyle.border} rounded-2xl mb-4 overflow-hidden shadow-sm animate-in slide-in-from-left-2 duration-300`} aria-label={`Observación ${idx + 1}`}>
      <div className={`${sStyle.bg} p-4 flex justify-between items-center flex-wrap gap-2`}>
        <span className={`font-black ${sStyle.text} text-[0.85rem] uppercase tracking-tighter`}>Observación #{idx + 1}</span>
        <div className="flex gap-2 items-center flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full ${okStyle.bg} ${okStyle.text} font-bold text-[0.7rem] border ${okStyle.border}`}>{obs.success_level || 'Sí'}</span>
          <span className={`px-2.5 py-0.5 rounded-md ${sStyle.bg} ${sStyle.text} font-bold text-[0.7rem] border ${sStyle.border}`}>{obs.severity || 'Baja'}</span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_1fr_80px] gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Participante *</label>
            <input type="text" maxLength={MAX_CHARS}
              className={fieldClass(warnParticipant, "w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all", 'error')}
              value={obs.participant || ''} onChange={e => handleChange('participant', e.target.value)}
              onBlur={e => { touch('participant'); onAction(() => onSave(obs.id!, { participant: e.target.value })); }} placeholder="P1" />
            <CharCounter value={obs.participant} />
            <FieldWarning show={warnParticipant} message="Ingrese el nombre o código del participante." variant="error" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Perfil</label>
            <input type="text" maxLength={MAX_CHARS}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all"
              value={obs.profile || ''} onChange={e => handleChange('profile', e.target.value)}
              onBlur={e => onAction(() => onSave(obs.id!, { profile: e.target.value }))} placeholder="Estudiante" />
            <CharCounter value={obs.profile} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Tarea *</label>
            {tasks.length > 0 ? (
              <select
                className={fieldClass(warnTaskRef, "w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy outline-none transition-all font-medium", 'error')}
                value={obs.task_ref || ''}
                onChange={e => { touch('task_ref'); onLocalChange(obs.id!, { task_ref: e.target.value }); onAction(() => onSave(obs.id!, { task_ref: e.target.value })); }}
              >
                <option value="">— Tarea —</option>
                {tasks.map(t => (
                  <option key={t.task_index} value={t.task_index}>
                    {t.task_index} – {t.scenario ? t.scenario.slice(0, 30) + (t.scenario.length > 30 ? '…' : '') : '(sin nombre)'}
                  </option>
                ))}
              </select>
            ) : (
              <input type="text" maxLength={20}
                className={fieldClass(warnTaskRef, "w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all", 'error')}
                value={obs.task_ref || ''} onChange={e => onLocalChange(obs.id!, { task_ref: e.target.value })}
                onBlur={e => { touch('task_ref'); onAction(() => onSave(obs.id!, { task_ref: e.target.value })); }} placeholder="T1" />
            )}
            <FieldWarning show={warnTaskRef} message="Seleccione la tarea asociada." variant="error" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Éxito</label>
            <select className={`w-full p-2 border ${okStyle.border} rounded-lg text-sm ${okStyle.bg} ${okStyle.text} font-bold outline-none cursor-pointer`}
              value={obs.success_level}
              onChange={e => { const val = e.target.value as SuccessStatus; onLocalChange(obs.id!, { success_level: val }); onAction(() => onSave(obs.id!, { success_level: val })); }}>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
              <option value="Con ayuda">Con ayuda</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Tiempo (s)</label>
            <input type="number" min="0" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all font-mono font-bold" value={obs.time_seconds} onChange={e => onLocalChange(obs.id!, { time_seconds: parseInt(e.target.value) || 0 })} onBlur={e => onAction(() => onSave(obs.id!, { time_seconds: parseInt(e.target.value) || 0 }))} placeholder="0" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Errores</label>
            <input type="number" min="0" className={`w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all font-mono font-bold ${obs.errors > 2 ? 'text-red-600' : 'text-slate-800'}`} value={obs.errors} onChange={e => onLocalChange(obs.id!, { errors: parseInt(e.target.value) || 0 })} onBlur={e => onAction(() => onSave(obs.id!, { errors: parseInt(e.target.value) || 0 }))} placeholder="0" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Comentarios clave *</label>
          <AutoGrowTextarea
            className={fieldClass(warnComments, "w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all font-medium", 'error')}
            value={obs.comments || ''} onChange={e => handleChange('comments', e.target.value)}
            onBlur={e => { touch('comments'); onAction(() => onSave(obs.id!, { comments: e.target.value })); }} placeholder="Ej. Dudó..." rows={2} />
          <CharCounter value={obs.comments} />
          <FieldWarning show={warnComments} message="Ingrese al menos un comentario clave de la observación." variant="error" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest text-red-800">Problema detectado *</label>
          <AutoGrowTextarea
            className={fieldClass(warnProblem, "w-full p-2.5 border border-red-100 rounded-lg text-sm bg-red-50/30 focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium italic", 'error')}
            value={obs.problem || ''} onChange={e => handleChange('problem', e.target.value)}
            onBlur={e => { touch('problem'); onAction(() => onSave(obs.id!, { problem: e.target.value })); }} placeholder="Ej. Nombre..." rows={2} />
          <CharCounter value={obs.problem} />
          <FieldWarning show={warnProblem} message="Describe el problema detectado durante la observación." variant="error" />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">Severidad <Tooltip text="Nivel de impacto del problema en la experiencia del usuario."><Info size={12} className="text-slate-400" /></Tooltip></label>
            <select className={`w-full p-2 border ${sStyle.border} rounded-lg text-sm ${sStyle.bg} ${sStyle.text} font-bold outline-none cursor-pointer`}
              value={obs.severity}
              onChange={e => { const val = e.target.value as Severity; onLocalChange(obs.id!, { severity: val }); onAction(() => onSave(obs.id!, { severity: val })); }}>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest text-green-800">Mejora propuesta</label>
            <AutoGrowTextarea
              className="w-full p-2.5 border border-green-100 rounded-lg text-sm bg-green-50/30 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-50 outline-none transition-all font-medium"
              value={obs.proposal || ''} onChange={e => handleChange('proposal', e.target.value)}
              onBlur={e => onAction(() => onSave(obs.id!, { proposal: e.target.value }))} placeholder="Ej. Cambiar..." rows={2} />
            <CharCounter value={obs.proposal} />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 mt-2">
          {confirmDelete ? (
            <div className="flex gap-2 items-center animate-in zoom-in-95 duration-200">
              <span className="text-[0.7rem] text-red-600 font-black uppercase tracking-widest">Confirmar:</span>
              <button type="button" onClick={() => { onDelete(obs.id!); setConfirmDelete(false); }} className="inline-flex items-center justify-center w-8 h-8 bg-red-600 text-white border-none rounded-lg cursor-pointer transition-all hover:bg-red-700 shadow-md shadow-red-100"><Check size={16} strokeWidth={3} /></button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-500 border-none rounded-lg cursor-pointer transition-all hover:bg-slate-200"><X size={16} strokeWidth={3} /></button>
            </div>
          ) : (
            <button type="button" className="inline-flex items-center gap-1.5 bg-transparent border-none text-slate-400 cursor-pointer p-2 rounded-lg transition-all hover:bg-red-50 hover:text-red-600" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={18} aria-hidden="true" />
              <span className="text-[0.82rem] font-bold">Eliminar</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

/* ── Fila de tabla para desktop ── */
const ObservationRow: React.FC<{
  obs: Observation;
  handleLocalChange: (id: string, updates: Partial<Observation>) => void;
  handleActionWithStatus: (fn: () => void) => void;
  onSave: (id: string, updates: Partial<Observation>) => void;
  onDelete: (id: string) => void;
  tasks?: { task_index: string; scenario: string }[];
}> = ({ obs, handleLocalChange, handleActionWithStatus, onSave, onDelete, tasks = [] }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (f: string) => setTouched(prev => ({ ...prev, [f]: true }));
  const sStyle  = severityStyles[obs.severity]     || severityStyles['Baja'];
  const okStyle = successStyles[obs.success_level] || successStyles['Sí'];

  const warnParticipant = touched.participant && (!obs.participant || obs.participant.trim() === '');
  const warnTaskRef     = touched.task_ref && (!obs.task_ref || obs.task_ref.trim() === '');
  const warnComments    = touched.comments && (!obs.comments || obs.comments.trim() === '');
  const warnProblem     = touched.problem && (!obs.problem || obs.problem.trim() === '');

  const handleChange = (field: keyof Observation, value: string) => {
    handleLocalChange(obs.id!, { [field]: clamp(value) } as Partial<Observation>);
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
      <td className="p-2 border-r border-slate-100">
        <input type="text" maxLength={MAX_CHARS}
          className={fieldClass(warnParticipant, "w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy outline-none font-bold", 'error')}
          value={obs.participant || ''} onChange={e => handleChange('participant', e.target.value)}
          onBlur={() => { touch('participant'); handleActionWithStatus(() => onSave(obs.id!, { participant: obs.participant })); }} placeholder="P1" />
        <CharCounter value={obs.participant} />
        <FieldWarning show={warnParticipant} message="Ingrese el participante." variant="error" />
      </td>
      <td className="p-2 border-r border-slate-100">
        <input type="text" maxLength={MAX_CHARS}
          className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy outline-none font-medium"
          value={obs.profile || ''} onChange={e => handleChange('profile', e.target.value)}
          onBlur={() => handleActionWithStatus(() => onSave(obs.id!, { profile: obs.profile }))} placeholder="Perfil" />
        <CharCounter value={obs.profile} />
      </td>
      <td className="p-2 text-center border-r border-slate-100">
        {tasks.length > 0 ? (
          <select
            className={fieldClass(warnTaskRef, "w-full p-2 border border-transparent bg-transparent rounded-lg text-sm text-center transition-all focus:bg-white focus:border-navy outline-none font-mono font-bold", 'error')}
            value={obs.task_ref || ''}
            onChange={e => { touch('task_ref'); handleLocalChange(obs.id!, { task_ref: e.target.value }); handleActionWithStatus(() => onSave(obs.id!, { task_ref: e.target.value })); }}
          >
            <option value="">—</option>
            {tasks.map(t => (
              <option key={t.task_index} value={t.task_index}>
                {t.task_index} – {t.scenario ? t.scenario.slice(0, 25) + (t.scenario.length > 25 ? '…' : '') : ''}
              </option>
            ))}
          </select>
        ) : (
          <input type="text" maxLength={20}
            className={fieldClass(warnTaskRef, "w-full p-2 border border-transparent bg-transparent rounded-lg text-sm text-center transition-all focus:bg-white focus:border-navy outline-none font-mono font-bold", 'error')}
            value={obs.task_ref || ''} onChange={e => handleLocalChange(obs.id!, { task_ref: e.target.value })}
            onBlur={() => { touch('task_ref'); handleActionWithStatus(() => onSave(obs.id!, { task_ref: obs.task_ref })); }} placeholder="T1" />
        )}
        <FieldWarning show={warnTaskRef} message="Seleccione la tarea." variant="error" />
      </td>
      <td className="p-2 text-center border-r border-slate-100">
        <select className={`w-full p-2 border ${okStyle.border} rounded-lg text-[0.75rem] ${okStyle.bg} ${okStyle.text} font-black outline-none cursor-pointer shadow-sm`}
          value={obs.success_level}
          onChange={e => { const val = e.target.value as SuccessStatus; handleLocalChange(obs.id!, { success_level: val }); handleActionWithStatus(() => onSave(obs.id!, { success_level: val })); }}>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
          <option value="Con ayuda">Con ayuda</option>
        </select>
      </td>
      <td className="p-2 text-center border-r border-slate-100 font-mono font-bold">
        <input type="number" min="0" className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm text-center transition-all focus:bg-white focus:border-navy outline-none" value={obs.time_seconds} onChange={e => handleLocalChange(obs.id!, { time_seconds: parseInt(e.target.value) || 0 })} onBlur={() => handleActionWithStatus(() => onSave(obs.id!, { time_seconds: obs.time_seconds }))} placeholder="0" />
      </td>
      <td className="p-2 text-center border-r border-slate-100 font-mono font-bold">
        <input type="number" min="0" className={`w-full p-2 border border-transparent bg-transparent rounded-lg text-sm text-center transition-all focus:bg-white focus:border-navy outline-none ${obs.errors > 2 ? 'text-red-600 font-black' : 'text-slate-800'}`} value={obs.errors} onChange={e => handleLocalChange(obs.id!, { errors: parseInt(e.target.value) || 0 })} onBlur={() => handleActionWithStatus(() => onSave(obs.id!, { errors: obs.errors }))} placeholder="0" />
      </td>
      <td className="p-2 border-r border-slate-100">
        <AutoGrowTextarea
          className={fieldClass(warnComments, "w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy outline-none font-medium resize-none", 'error')}
          value={obs.comments || ''} onChange={e => handleChange('comments', e.target.value)}
          onBlur={() => { touch('comments'); handleActionWithStatus(() => onSave(obs.id!, { comments: obs.comments })); }} placeholder="Comentarios..." rows={1} />
        <CharCounter value={obs.comments} />
        <FieldWarning show={warnComments} message="Campo requerido." variant="error" />
      </td>
      <td className="p-2 border-r border-slate-100">
        <AutoGrowTextarea
          className={fieldClass(warnProblem, "w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-red-400 outline-none font-medium italic text-red-900 resize-none", 'error')}
          value={obs.problem || ''} onChange={e => handleChange('problem', e.target.value)}
          onBlur={() => { touch('problem'); handleActionWithStatus(() => onSave(obs.id!, { problem: obs.problem })); }} placeholder="Problema..." rows={1} />
        <CharCounter value={obs.problem} />
        <FieldWarning show={warnProblem} message="Describe el problema." variant="error" />
      </td>
      <td className="p-2 text-center border-r border-slate-100">
        <select className={`w-full p-2 border ${sStyle.border} rounded-lg text-[0.75rem] ${sStyle.bg} ${sStyle.text} font-black outline-none cursor-pointer shadow-sm`}
          value={obs.severity}
          onChange={e => { const val = e.target.value as Severity; handleLocalChange(obs.id!, { severity: val }); handleActionWithStatus(() => onSave(obs.id!, { severity: val })); }}>
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
          <option value="Crítica">Crítica</option>
        </select>
      </td>
      <td className="p-2 border-r border-slate-100">
        <AutoGrowTextarea
          className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-green-400 outline-none font-medium text-green-900 resize-none"
          value={obs.proposal || ''} onChange={e => handleChange('proposal', e.target.value)}
          onBlur={() => handleActionWithStatus(() => onSave(obs.id!, { proposal: obs.proposal }))} placeholder="Mejora..." rows={1} />
        <CharCounter value={obs.proposal} />
      </td>
      <td className="p-2 text-center">
        {confirmDelete ? (
          <div className="flex flex-col gap-1 items-center animate-in zoom-in-95 duration-200">
            <button type="button" onClick={() => { onDelete(obs.id!); setConfirmDelete(false); }} className="bg-red-600 text-white border-none rounded-md w-7 h-7 flex items-center justify-center cursor-pointer transition-all hover:bg-red-700 shadow-sm"><Check size={14} strokeWidth={3} /></button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="bg-slate-200 text-slate-600 border-none rounded-md w-7 h-7 flex items-center justify-center cursor-pointer transition-all hover:bg-slate-300 shadow-sm"><X size={14} strokeWidth={3} /></button>
          </div>
        ) : (
          <button type="button" className="bg-transparent border-none text-slate-300 p-2 cursor-pointer transition-all hover:bg-red-50 hover:text-red-500 rounded-lg" onClick={() => setConfirmDelete(true)}><Trash2 size={18} aria-hidden="true" /></button>
        )}
      </td>
    </tr>
  );
};

export const ObservationsView: React.FC<ObservationsViewProps> = ({
  data, onSync, onAdd, onSave, onDelete, planId, productName, onGoToPlan, tasks = []
}) => {
  const width = useWindowWidth();
  const isMobile = width < 1024;
  const [isSaving, setIsSaving] = useState(false);
  const [sortMode, setSortMode] = useState<'desc' | 'asc' | 'default'>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const isProductEmpty = !productName || productName.trim() === '';

  const handleActionWithStatus = (fn: () => void) => {
    setIsSaving(true);
    fn();
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleLocalChange = (id: string, updates: Partial<Observation>) => {
    const updated = data.map(obs => obs.id === id ? { ...obs, ...updates } : obs);
    onSync(updated);
  };

  const displayData = React.useMemo(() => {
    if (sortMode === 'default') return data;
    return [...data].sort((a, b) => {
      const weightA = SEVERITY_WEIGHTS[a.severity] || 0;
      const weightB = SEVERITY_WEIGHTS[b.severity] || 0;
      return sortMode === 'desc' ? weightB - weightA : weightA - weightB;
    });
  }, [data, sortMode]);

  return (
    <div className="animate-in fade-in duration-500">
      <header className="relative flex items-center justify-center bg-navy text-white p-4 md:px-6 rounded-xl mb-8 shadow-md min-h-[70px]">
        <h2 className="text-xl md:text-2xl font-bold m-0 text-center px-12">Bitácora de observaciones</h2>
        <div role="status" aria-live="polite" className="absolute right-4 md:right-6 flex items-center gap-2 text-sm font-bold opacity-90">
          {isSaving
            ? <span className="flex items-center gap-1.5 text-white animate-pulse"><RefreshCcw size={14} className="animate-spin" aria-hidden="true" /> Guardando…</span>
            : <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle size={14} aria-hidden="true" /> Cambios guardados</span>
          }
        </div>
      </header>

      <div className="space-y-8">
        {isProductEmpty ? (
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="text-center p-12 md:p-16 flex flex-col items-center">
              <div aria-hidden="true" className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner"><ClipboardList size={40} className="text-amber-600" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-2">¡Falta el nombre del producto!</h3>
              <p className="text-slate-500 font-medium max-w-[400px] mb-8 leading-relaxed">Para registrar observaciones, primero define un nombre al producto en la pestaña Plan.</p>
              <button onClick={onGoToPlan} className="inline-flex items-center gap-2 bg-navy text-white border-none rounded-xl px-8 py-3.5 text-base font-black cursor-pointer transition-all hover:bg-navy-dark shadow-lg shadow-navy/20 active:scale-[0.98]">Ir a definir Producto</button>
            </div>
          </section>
        ) : (
          <>
            {isMobile && (
              <section aria-labelledby="obs-cards-heading">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[0.9rem] font-black text-navy uppercase tracking-widest flex items-center gap-2 m-0" id="obs-cards-heading">
                    <span className="w-2 h-6 bg-navy rounded-full"></span> Observaciones
                  </h3>
                  <div className="relative">
                    <button onClick={() => setShowSortMenu(!showSortMenu)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.7rem] font-black uppercase tracking-wider transition-all border ${sortMode !== 'default' ? 'bg-navy text-white border-navy shadow-md shadow-navy/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                      Severidad <ChevronDown size={14} className={`transition-transform duration-300 ${showSortMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {showSortMenu && (
                      <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setShowSortMenu(false)} />
                        <div className="absolute top-full right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <button onClick={() => { setSortMode('desc'); setShowSortMenu(false); }} className={`w-full text-left px-3 py-2 text-[0.7rem] font-bold hover:bg-slate-50 transition-colors ${sortMode === 'desc' ? 'text-navy bg-slate-50' : 'text-slate-600'}`}>Descendente</button>
                          <button onClick={() => { setSortMode('asc'); setShowSortMenu(false); }} className={`w-full text-left px-3 py-2 text-[0.7rem] font-bold hover:bg-slate-50 transition-colors ${sortMode === 'asc' ? 'text-navy bg-slate-50' : 'text-slate-600'}`}>Ascendente</button>
                          <button onClick={() => { setSortMode('default'); setShowSortMenu(false); }} className={`w-full text-left px-3 py-2 text-[0.7rem] font-bold hover:bg-slate-50 transition-colors ${sortMode === 'default' ? 'text-navy bg-slate-50' : 'text-slate-600'}`}>Defecto</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {displayData.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium italic mb-6">No hay observaciones todavía.</div>
                ) : (
                  <div className="space-y-4">
                    {displayData.map((obs, idx) => (
                      <ObservationCard key={obs.id} obs={obs} idx={idx} onLocalChange={handleLocalChange} onSave={onSave} onDelete={onDelete} onAction={handleActionWithStatus} tasks={tasks} />
                    ))}
                  </div>
                )}

                <button type="button" className="inline-flex items-center justify-center gap-2 w-full bg-navy text-white border-none p-4 rounded-2xl font-black text-sm uppercase tracking-widest cursor-pointer transition-all hover:bg-navy-dark shadow-lg shadow-navy/10 mt-4 active:scale-[0.98]" onClick={onAdd} disabled={!planId}>
                  <Plus size={20} aria-hidden="true" /> Añadir Observación
                </button>
              </section>
            )}

            {!isMobile && (
              <section className="bg-white border border-slate-200 rounded-xl shadow-sm" aria-labelledby="obs-tabla-heading">
                <h3 className="bg-navy-light text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0 rounded-t-xl" id="obs-tabla-heading">Observaciones registradas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <caption className="sr-only">Registro de observaciones</caption>
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[0.7rem] font-black uppercase tracking-[0.1em] border-b border-slate-200">
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Participante *</th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Perfil</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[140px]">Tarea *</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[130px]">Éxito</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[100px]">Tiempo (s)</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[80px]">Errores</th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Comentarios *</th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Problema *</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[130px] select-none">
                          <div className="flex items-center gap-1.5 justify-center relative">
                            Severidad
                            <div className="flex items-center gap-0.5">
                              <Tooltip text="Nivel de impacto del problema en la experiencia del usuario."><Info size={12} className="text-slate-400" /></Tooltip>
                              <div className="relative">
                                <button type="button" onClick={() => setShowSortMenu(!showSortMenu)} className={`p-1 rounded-md transition-all hover:bg-slate-200 flex items-center justify-center ${sortMode !== 'default' ? 'text-navy bg-slate-100' : 'text-slate-400'}`}>
                                  <ChevronDown size={14} className={`transition-transform duration-300 ${showSortMenu ? 'rotate-180' : ''}`} />
                                </button>
                                {showSortMenu && (
                                  <>
                                    <div className="fixed inset-0 z-[90]" onClick={() => setShowSortMenu(false)} />
                                    <div className="absolute top-full right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                      <button onClick={() => { setSortMode('desc'); setShowSortMenu(false); }} className={`w-full text-left px-3 py-2 text-[0.7rem] font-bold hover:bg-slate-50 transition-colors ${sortMode === 'desc' ? 'text-navy bg-slate-50' : 'text-slate-600'}`}>Descendente</button>
                                      <button onClick={() => { setSortMode('asc'); setShowSortMenu(false); }} className={`w-full text-left px-3 py-2 text-[0.7rem] font-bold hover:bg-slate-50 transition-colors ${sortMode === 'asc' ? 'text-navy bg-slate-50' : 'text-slate-600'}`}>Ascendente</button>
                                      <button onClick={() => { setSortMode('default'); setShowSortMenu(false); }} className={`w-full text-left px-3 py-2 text-[0.7rem] font-bold hover:bg-slate-50 transition-colors ${sortMode === 'default' ? 'text-navy bg-slate-50' : 'text-slate-600'}`}>Defecto</button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Mejora propuesta</th>
                        <th scope="col" className="p-4 text-center w-[60px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayData.length > 0 ? (
                        displayData.map((obs) => (
                          <ObservationRow key={obs.id} obs={obs} handleLocalChange={handleLocalChange} handleActionWithStatus={handleActionWithStatus} onSave={onSave} onDelete={onDelete} tasks={tasks} />
                        ))
                      ) : (
                        <tr><td colSpan={11} className="p-12 text-center text-slate-500 italic font-medium">No hay observaciones registradas.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 rounded-b-xl">
                  <button type="button" className="inline-flex items-center gap-2 bg-navy text-white border-none px-6 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider cursor-pointer transition-all hover:bg-navy-dark disabled:bg-slate-300 shadow-md shadow-navy/10 active:scale-[0.98]" onClick={onAdd} disabled={!planId}>
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
