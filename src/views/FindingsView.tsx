import React, { useState, useEffect } from 'react';
import { Finding, Severity, Priority, TaskStatus } from '../models/types';
import { Trash2, Plus, CheckCircle, RefreshCcw, AlertTriangle, Info, Check, X, ChevronDown, Star } from 'lucide-react';
import AutoGrowTextarea from '../components/AutoGrowTextarea';
import CustomSelect from '../components/CustomSelect';
import { FieldWarning } from '../components/FieldWarning';
import { CharCounter } from '../components/CharCounter';
import { fieldClass } from '../components/validation';

// ... (existing constants)

const SEVERITY_OPTIONS = [
  { value: 'Baja', label: 'Baja' },
  { value: 'Media', label: 'Media' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Crítica', label: 'Crítica' }
];

const PRIORITY_OPTIONS = [
  { value: 'Baja', label: 'Baja' },
  { value: 'Media', label: 'Media' },
  { value: 'Alta', label: 'Alta' }
];

const STATUS_OPTIONS = [
  { value: 'Pendiente', label: '⏳ Pendiente' },
  { value: 'En progreso', label: '🔄 En progreso' },
  { value: 'Resuelto', label: '✅ Resuelto' }
];
import { clamp } from '../components/validation';
import { Tooltip } from '../components/Tooltip';

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

const SEVERITY_STYLES: Record<Severity, { bg: string; text: string; border: string }> = {
  Baja: { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200' },
  Media: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' },
  Alta: { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
  Crítica: { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200' },
};

const SEVERITY_WEIGHTS: Record<Severity, number> = { 'Crítica': 4, 'Alta': 3, 'Media': 2, 'Baja': 1 };

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string; border: string }> = {
  Baja: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
  Media: { bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-200' },
  Alta: { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
};

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string; border: string; icon: string }> = {
  Pendiente: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: '⏳' },
  'En progreso': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', icon: '🔄' },
  Resuelto: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', icon: '✅' },
};

interface FindingsViewProps {
  data: Finding[];
  onSync: (data: Finding[]) => void;
  onAdd: () => void;
  onSave: (id: string, updates: Partial<Finding>) => void;
  onDelete: (id: string) => void;
  planId?: string;
  productName?: string;
  onGoToPlan: () => void;
}

/* ── Tarjeta individual para móvil ── */
const FindingCard: React.FC<{
  f: Finding;
  idx: number;
  onSync: (updates: Partial<Finding>) => void;
  onSave: (id: string, updates: Partial<Finding>) => void;
  onDelete: (id: string) => void;
  onAction: (fn: () => void) => void;
}> = ({ f, idx, onSync, onSave, onDelete, onAction }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched(prev => ({ ...prev, [k]: true }));
  const sev = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.Baja;
  const pri = PRIORITY_STYLES[f.priority] ?? PRIORITY_STYLES.Baja;
  const sta = STATUS_STYLES[f.status] ?? STATUS_STYLES.Pendiente;

  const warnProblem = touched.problem && (!f.problem || f.problem.trim() === '');
  const warnEvidence = touched.evidence && (!f.evidence || f.evidence.trim() === '');
  const warnRecommendation = touched.recommendation && (!f.recommendation || f.recommendation.trim() === '');

  const handleChange = (field: keyof Finding, value: string) => {
    onSync({ [field]: clamp(value) } as Partial<Finding>);
  };

  return (
    <article className={`bg-white border-2 ${sev.border} rounded-2xl mb-4 overflow-hidden shadow-sm animate-in slide-in-from-left-2 duration-300`}>
      <div className={`${sev.bg} p-4 flex justify-between items-center flex-wrap gap-2`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { onSync({ is_favorite: !f.is_favorite }); onSave(f.id!, { is_favorite: !f.is_favorite }); }}
            className={`p-1 rounded-lg border-none bg-transparent cursor-pointer transition-all ${f.is_favorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
            aria-label={f.is_favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
          >
            <Star size={18} fill={f.is_favorite ? 'currentColor' : 'none'} strokeWidth={2} aria-hidden="true" />
          </button>
          <span className={`font-black ${sev.text} text-[0.8rem] uppercase tracking-tight`}>Hallazgo #{idx + 1} · {f.severity}</span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full ${pri.bg} ${pri.text} font-bold text-[0.7rem] border ${pri.border}`}>P: {f.priority}</span>
          <span className={`px-2.5 py-0.5 rounded-md ${sta.bg} ${sta.text} font-bold text-[0.7rem] border ${sta.border}`}>{sta.icon} {f.status}</span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`find-problem-${f.id}`} className="font-black text-[0.7rem] text-slate-700 uppercase tracking-widest">Problema detectado *</label>
          <AutoGrowTextarea id={`find-problem-${f.id}`}
            className={fieldClass(warnProblem, "w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all font-bold", 'error')}
            value={f.problem || ''} onChange={e => handleChange('problem', e.target.value)}
            onBlur={e => { touch('problem'); onAction(() => onSave(f.id!, { problem: e.target.value })); }} placeholder="Ej. Menú 'Rendimiento' no es claro" rows={2} />
          <CharCounter value={f.problem} />
          <FieldWarning show={warnProblem} message="Describe el problema detectado." variant="error" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`find-evidence-${f.id}`} className="font-black text-[0.7rem] text-slate-700 uppercase tracking-widest">Evidencia observada *</label>
          <AutoGrowTextarea id={`find-evidence-${f.id}`}
            className={fieldClass(warnEvidence, "w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all font-medium italic", 'error')}
            value={f.evidence || ''} onChange={e => handleChange('evidence', e.target.value)}
            onBlur={e => { touch('evidence'); onAction(() => onSave(f.id!, { evidence: e.target.value })); }} placeholder="Ej. 4 de 5 usuarios dudaron" rows={2} />
          <CharCounter value={f.evidence} />
          <FieldWarning show={warnEvidence} message="Añade la evidencia que respalda el hallazgo." variant="error" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`find-frequency-${f.id}`} className="font-black text-[0.7rem] text-slate-700 uppercase tracking-widest">Frecuencia</label>
            <input id={`find-frequency-${f.id}`} maxLength={20}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all font-mono"
              value={f.frequency || ''} onChange={e => onSync({ frequency: e.target.value })}
              onBlur={e => onAction(() => onSave(f.id!, { frequency: e.target.value }))} placeholder="Ej. 4/5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`find-severity-${f.id}`} className="font-black text-[0.7rem] text-slate-700 uppercase tracking-widest flex items-center gap-1.5">Severidad <Tooltip text="Nivel de impacto del problema en la experiencia del usuario."><Info size={12} className="text-slate-400" /></Tooltip></label>
            <CustomSelect id={`find-severity-${f.id}`} className={`w-full p-2.5 border ${sev.border} rounded-lg text-sm ${sev.bg} ${sev.text} font-bold outline-none cursor-pointer`}
              options={SEVERITY_OPTIONS}
              value={f.severity} onChange={e => { const val = e.target.value as Severity; onSync({ severity: val }); onAction(() => onSave(f.id!, { severity: val })); }} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`find-recommendation-${f.id}`} className="font-black text-[0.7rem] text-green-800 uppercase tracking-widest">Recomendación de mejora *</label>
          <AutoGrowTextarea id={`find-recommendation-${f.id}`}
            className={fieldClass(warnRecommendation, "w-full p-2.5 border border-green-100 rounded-lg text-sm bg-green-50/30 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-50 outline-none transition-all font-medium")}
            value={f.recommendation || ''} onChange={e => handleChange('recommendation', e.target.value)}
            onBlur={e => { touch('recommendation'); onAction(() => onSave(f.id!, { recommendation: e.target.value })); }} placeholder="Ej. Cambiar etiqueta a 'Notas'" rows={2} />
          <CharCounter value={f.recommendation} />
          <FieldWarning show={warnRecommendation} message="Proporciona al menos una recomendación de mejora." variant="warning" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`find-priority-${f.id}`} className="font-black text-[0.7rem] text-slate-700 uppercase tracking-widest flex items-center gap-1.5">Prioridad <Tooltip text="Urgencia recomendada para resolver el hallazgo."><Info size={12} className="text-slate-400" /></Tooltip></label>
            <CustomSelect id={`find-priority-${f.id}`} className={`w-full p-2.5 border ${pri.border} rounded-lg text-sm ${pri.bg} ${pri.text} font-bold outline-none cursor-pointer`}
              options={PRIORITY_OPTIONS}
              value={f.priority} onChange={e => { const val = e.target.value as Priority; onSync({ priority: val }); onAction(() => onSave(f.id!, { priority: val })); }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`find-status-${f.id}`} className="font-black text-[0.7rem] text-slate-700 uppercase tracking-widest">Estado</label>
            <CustomSelect id={`find-status-${f.id}`} className={`w-full p-2.5 border ${sta.border} rounded-lg text-sm ${sta.bg} ${sta.text} font-bold outline-none cursor-pointer`}
              options={STATUS_OPTIONS}
              value={f.status} onChange={e => { const val = e.target.value as TaskStatus; onSync({ status: val }); onAction(() => onSave(f.id!, { status: val })); }} />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 mt-2">
          {confirmDelete ? (
            <div className="flex gap-2 items-center animate-in zoom-in-95 duration-200">
              <span className="text-[0.7rem] text-red-600 font-black uppercase tracking-widest">Confirmar:</span>
              <button type="button" onClick={() => { onDelete(f.id!); setConfirmDelete(false); }} className="inline-flex items-center justify-center w-8 h-8 bg-red-600 text-white border-none rounded-lg cursor-pointer transition-all hover:bg-red-700 shadow-md shadow-red-100" aria-label={`Confirmar eliminación de hallazgo ${idx + 1}`}><Check size={16} strokeWidth={3} aria-hidden="true" /></button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-500 border-none rounded-lg cursor-pointer transition-all hover:bg-slate-200" aria-label="Cancelar eliminación"><X size={16} strokeWidth={3} aria-hidden="true" /></button>
            </div>
          ) : (
            <button type="button" className="inline-flex items-center gap-1.5 bg-transparent border-none text-slate-400 cursor-pointer p-2 rounded-lg transition-all hover:bg-red-50 hover:text-red-600" onClick={() => setConfirmDelete(true)} aria-label={`Eliminar hallazgo ${idx + 1}`}>
              <Trash2 size={18} aria-hidden="true" />
              <span className="text-[0.82rem] font-bold">Eliminar</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

/* ── Fila desktop ── */
const FindingRow: React.FC<{
  f: Finding;
  idx: number;
  handleLocalChange: (id: string, updates: Partial<Finding>) => void;
  handleActionWithStatus: (action: () => void) => void;
  onSave: (id: string, updates: Partial<Finding>) => void;
  onDelete: (id: string) => void;
}> = ({ f, idx, handleLocalChange, handleActionWithStatus, onSave, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched(prev => ({ ...prev, [k]: true }));
  const sev = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.Baja;
  const pri = PRIORITY_STYLES[f.priority] ?? PRIORITY_STYLES.Baja;
  const sta = STATUS_STYLES[f.status] ?? STATUS_STYLES.Pendiente;

  const warnProblem = touched.problem && (!f.problem || f.problem.trim() === '');
  const warnEvidence = touched.evidence && (!f.evidence || f.evidence.trim() === '');
  const warnRecommendation = touched.recommendation && (!f.recommendation || f.recommendation.trim() === '');

  const handleChange = (field: keyof Finding, value: string) => {
    handleLocalChange(f.id!, { [field]: clamp(value) } as Partial<Finding>);
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="p-3 text-center"><span className="id-badge">{idx + 1}</span></td>
      <td className="p-3 text-center">
        <button
          type="button"
          onClick={() => { handleLocalChange(f.id!, { is_favorite: !f.is_favorite }); handleActionWithStatus(() => onSave(f.id!, { is_favorite: !f.is_favorite })); }}
          className={`p-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-all ${f.is_favorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
          aria-label={f.is_favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        >
          <Star size={18} fill={f.is_favorite ? 'currentColor' : 'none'} strokeWidth={2} aria-hidden="true" />
        </button>
      </td>
      <td className="p-2">
        <AutoGrowTextarea aria-label="Problema detectado"
          className={fieldClass(warnProblem, "w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-bold", 'error')}
          value={f.problem || ''} onChange={e => handleChange('problem', e.target.value)}
          onBlur={e => { touch('problem'); handleActionWithStatus(() => onSave(f.id!, { problem: e.target.value })); }} placeholder="Ej. Menú no es claro" rows={2} />
        <CharCounter value={f.problem} />
        <FieldWarning show={warnProblem} message="Describe el problema." variant="error" />
      </td>
      <td className="p-2">
        <AutoGrowTextarea aria-label="Evidencia observada"
          className={fieldClass(warnEvidence, "w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium italic text-slate-600", 'error')}
          value={f.evidence || ''} onChange={e => handleChange('evidence', e.target.value)}
          onBlur={e => { touch('evidence'); handleActionWithStatus(() => onSave(f.id!, { evidence: e.target.value })); }} placeholder="Ej. 4/5 fallaron" rows={2} />
        <CharCounter value={f.evidence} />
        <FieldWarning show={warnEvidence} message="Añade la evidencia." variant="error" />
      </td>
      <td className="p-2 text-center">
        <input type="text" maxLength={20} aria-label="Frecuencia"
          className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm text-center transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-mono"
          value={f.frequency || ''} onChange={e => handleLocalChange(f.id!, { frequency: e.target.value })}
          onBlur={e => handleActionWithStatus(() => onSave(f.id!, { frequency: e.target.value }))} placeholder="4/5" />
      </td>
      <td className="p-3">
        <CustomSelect aria-label="Severidad" className={`w-full p-2 border ${sev.border} rounded-lg text-[0.75rem] ${sev.bg} ${sev.text} font-black outline-none cursor-pointer`}
          options={SEVERITY_OPTIONS}
          value={f.severity} onChange={e => { const val = e.target.value as Severity; handleLocalChange(f.id!, { severity: val }); handleActionWithStatus(() => onSave(f.id!, { severity: val })); }} />
      </td>
      <td className="p-2">
        <AutoGrowTextarea aria-label="Recomendación de mejora"
          className={fieldClass(warnRecommendation, "w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-50 outline-none font-medium text-green-900")}
          value={f.recommendation || ''} onChange={e => handleChange('recommendation', e.target.value)}
          onBlur={e => { touch('recommendation'); handleActionWithStatus(() => onSave(f.id!, { recommendation: e.target.value })); }} placeholder="Mejora..." rows={2} />
        <CharCounter value={f.recommendation} />
        <FieldWarning show={warnRecommendation} message="Añade una recomendación." variant="warning" />
      </td>
      <td className="p-3">
        <CustomSelect aria-label="Prioridad" className={`w-full p-2 border ${pri.border} rounded-lg text-[0.75rem] ${pri.bg} ${pri.text} font-black outline-none cursor-pointer`}
          options={PRIORITY_OPTIONS}
          value={f.priority} onChange={e => { const val = e.target.value as Priority; handleLocalChange(f.id!, { priority: val }); handleActionWithStatus(() => onSave(f.id!, { priority: val })); }} />
      </td>
      <td className="p-3">
        <CustomSelect aria-label="Estado" className={`w-full p-2 border ${sta.border} rounded-lg text-[0.75rem] ${sta.bg} ${sta.text} font-black outline-none cursor-pointer`}
          options={STATUS_OPTIONS}
          value={f.status} onChange={e => { const val = e.target.value as TaskStatus; handleLocalChange(f.id!, { status: val }); handleActionWithStatus(() => onSave(f.id!, { status: val })); }} />
      </td>
      <td className="p-3 text-center">
        {confirmDelete ? (
          <div className="flex flex-col gap-1 items-center animate-in zoom-in-95 duration-200">
            <button type="button" onClick={() => { onDelete(f.id!); setConfirmDelete(false); }} className="bg-red-600 text-white border-none rounded-md w-7 h-7 flex items-center justify-center cursor-pointer transition-all hover:bg-red-700 shadow-sm" aria-label={`Confirmar eliminación de hallazgo ${idx + 1}`}><Check size={14} strokeWidth={3} aria-hidden="true" /></button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="bg-slate-200 text-slate-600 border-none rounded-md w-7 h-7 flex items-center justify-center cursor-pointer transition-all hover:bg-slate-300 shadow-sm" aria-label="Cancelar eliminación"><X size={14} strokeWidth={3} aria-hidden="true" /></button>
          </div>
        ) : (
          <button className="bg-transparent border-none text-slate-300 p-2 cursor-pointer transition-all hover:bg-red-50 hover:text-red-500 rounded-lg" type="button" onClick={() => setConfirmDelete(true)} aria-label={`Eliminar hallazgo ${idx + 1}`}><Trash2 size={18} aria-hidden="true" /></button>
        )}
      </td>
    </tr>
  );
};

export const FindingsView: React.FC<FindingsViewProps> = ({
  data, onSync, onAdd, onSave, onDelete, planId, productName, onGoToPlan
}) => {
  const width = useWindowWidth();
  const isMobile = width < 1024;
  const [isSaving, setIsSaving] = useState(false);
  const [sortMode, setSortMode] = useState<'desc' | 'asc' | 'default'>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const isProductEmpty = !productName || productName.trim() === '';

  const handleActionWithStatus = (action: () => void) => {
    setIsSaving(true);
    action();
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleLocalChange = (id: string, updates: Partial<Finding>) => {
    const updated = data.map(f => f.id === id ? { ...f, ...updates } : f);
    onSync(updated);
  };

  const displayData = React.useMemo(() => {
    if (sortMode === 'default') return data;
    return [...data].sort((a, b) => {
      const wA = SEVERITY_WEIGHTS[a.severity] || 0;
      const wB = SEVERITY_WEIGHTS[b.severity] || 0;
      return sortMode === 'desc' ? wB - wA : wA - wB;
    });
  }, [data, sortMode]);

  return (
    <main className="animate-in fade-in duration-500">
      <header className="flex items-center justify-between bg-navy text-white p-4 md:px-6 rounded-xl mb-8 shadow-md min-h-[70px] gap-4">
        <div className="flex-1" />
        <h1 className="text-xl md:text-2xl font-bold m-0 text-center flex-1 text-white">Síntesis de hallazgos y plan de mejora</h1>
        <div role="status" aria-live="polite" className="flex-1 flex justify-end flex items-center gap-2 text-sm font-bold opacity-90">
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
              <div aria-hidden="true" className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner"><AlertTriangle size={40} className="text-amber-600" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-2">¡Falta el nombre del producto!</h3>
              <p className="text-slate-500 font-medium max-w-[400px] mb-8 leading-relaxed">Para generar la síntesis de hallazgos, primero define un nombre al producto en la pestaña Plan.</p>
              <button onClick={onGoToPlan} className="inline-flex items-center gap-2 bg-navy text-white border-none rounded-xl px-8 py-3.5 text-base font-black cursor-pointer transition-all hover:bg-navy-dark shadow-lg shadow-navy/20 active:scale-[0.98]" aria-label="Volver al plan para definir el producto">Ir a definir Producto</button>
            </div>
          </section>
        ) : (
          <>
            {!isMobile && (
              <section className="bg-white border border-slate-200 rounded-xl shadow-sm" aria-labelledby="findings-table-heading">
                <h2 id="findings-table-heading" className="bg-hierarchy-l1 text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0 rounded-t-xl">Registro de hallazgos</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <caption className="sr-only">Tabla editable de hallazgos</caption>
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[0.7rem] font-black uppercase tracking-[0.1em] border-b border-slate-200">
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[50px]">#</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[50px]" aria-label="Favoritos">
                          <Star size={14} className="mx-auto text-amber-400" fill="currentColor" aria-hidden="true" />
                        </th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Problema *</th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Evidencia *</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[100px]">Frecuencia</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[130px] select-none">
                          <div className="flex items-center gap-1.5 justify-center relative">
                            Severidad
                            <div className="flex items-center gap-0.5">
                              <Tooltip text="Nivel de impacto del problema en la experiencia del usuario."><Info size={12} className="text-slate-400" /></Tooltip>
                              <div className="relative">
                                <button type="button" onClick={() => setShowSortMenu(!showSortMenu)} className={`p-1 rounded-md transition-all hover:bg-slate-200 flex items-center justify-center ${sortMode !== 'default' ? 'text-navy bg-slate-100' : 'text-slate-400'}`} aria-label="Ordenar hallazgos por severidad" aria-expanded={showSortMenu}>
                                  <ChevronDown size={14} className={`transition-transform duration-300 ${showSortMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
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
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Recomendación *</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[120px]">
                          <div className="flex items-center gap-1.5 justify-center">Prioridad <Tooltip text="Urgencia recomendada para resolver el hallazgo."><Info size={12} className="text-slate-400" /></Tooltip></div>
                        </th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[140px]">Estado</th>
                        <th scope="col" className="p-4 text-center w-[60px]" aria-label="Acciones de eliminación"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayData.length > 0 ? displayData.map((f, idx) => (
                        <FindingRow key={f.id} f={f} idx={idx} handleLocalChange={handleLocalChange} handleActionWithStatus={handleActionWithStatus} onSave={onSave} onDelete={onDelete} />
                      )) : (
                        <tr><td colSpan={10} className="p-12 text-center text-slate-500 italic font-medium">No hay hallazgos todavía.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 rounded-b-xl">
                  <button className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider cursor-pointer transition-all disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 active:scale-[0.97] ring-2 ring-emerald-300 ring-offset-1" onClick={onAdd} disabled={!planId} type="button">
                    <Plus size={20} aria-hidden="true" /> Añadir Hallazgo
                  </button>
                </div>
              </section>
            )}

            {isMobile && (
              <section aria-labelledby="findings-cards-heading">
                <div className="flex items-center justify-between mb-4">
                  <h3 id="findings-cards-heading" className="text-[0.9rem] font-black text-navy uppercase tracking-widest flex items-center gap-2 m-0">
                    <span className="w-2 h-6 bg-navy rounded-full"></span> Hallazgos registrados
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
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium italic mb-6">No hay hallazgos todavía.</div>
                ) : (
                  <div className="space-y-4">
                    {displayData.map((f, idx) => (
                      <FindingCard key={f.id} f={f} idx={idx} onSync={(updates) => handleLocalChange(f.id!, updates)} onSave={onSave} onDelete={onDelete} onAction={handleActionWithStatus} />
                    ))}
                  </div>
                )}

                <button className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none p-4 rounded-2xl font-black text-sm uppercase tracking-widest cursor-pointer transition-all disabled:bg-slate-300 disabled:cursor-not-allowed shadow-xl shadow-emerald-200 mt-4 active:scale-[0.97] ring-2 ring-emerald-300 ring-offset-1" onClick={onAdd} disabled={!planId} type="button">
                  <Plus size={20} aria-hidden="true" /> Añadir Hallazgo
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
};