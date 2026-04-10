import React, { useState, useEffect } from 'react';
import { Finding, Severity, Priority, TaskStatus } from '../models/types';
import { Trash2, Plus, CheckCircle, RefreshCcw, AlertTriangle, Info } from 'lucide-react';

// ─── Hook para detectar ancho de ventana ─────────────────────────────────────
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

// ─── Estilos semánticos con Tailwind ─────────────────────────────────
const SEVERITY_STYLES: Record<Severity, { bg: string; text: string; border: string }> = {
  Baja:    { bg: 'bg-green-50',  text: 'text-green-900',  border: 'border-green-200' },
  Media:   { bg: 'bg-amber-50',  text: 'text-amber-900',  border: 'border-amber-200' },
  Alta:    { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
  Crítica: { bg: 'bg-red-50',    text: 'text-red-900',    border: 'border-red-200' },
};

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string; border: string }> = {
  Baja:  { bg: 'bg-blue-50',    text: 'text-blue-900',   border: 'border-blue-200' },
  Media: { bg: 'bg-yellow-50',  text: 'text-yellow-900', border: 'border-yellow-200' },
  Alta:  { bg: 'bg-purple-50',  text: 'text-purple-900', border: 'border-purple-200' },
};

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string; border: string; icon: string }> = {
  Pendiente:     { bg: 'bg-slate-50',  text: 'text-slate-700', border: 'border-slate-200', icon: '⏳' },
  'En progreso': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', icon: '🔄' },
  Resuelto:      { bg: 'bg-green-50',  text: 'text-green-800', border: 'border-green-200', icon: '✅' },
};

// ─── Componente Tooltip Tailwind ────────────────────────────────────────
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className="relative inline-flex items-center group"
    >
      {children}
      {visible && (
        <div className="absolute bottom-[140%] left-1/2 -translate-x-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg text-[0.7rem] leading-snug w-[180px] z-[10000] shadow-xl text-center pointer-events-none font-medium normal-case animate-in fade-in zoom-in-95 duration-200">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent border-t-4 border-t-slate-800" />
        </div>
      )}
    </div>
  );
};

// ─── Props ───────────────────────────────────────────────────────────────────
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

// ─── Tarjeta individual para vista móvil ─────────────────────────────────────
const FindingCard: React.FC<{
  f: Finding;
  idx: number;
  onSync: (updates: Partial<Finding>) => void;
  onSave: (id: string, updates: Partial<Finding>) => void;
  onDelete: (id: string) => void;
  onAction: (fn: () => void) => void;
}> = ({ f, idx, onSync, onSave, onDelete, onAction }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sev = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.Baja;
  const pri = PRIORITY_STYLES[f.priority] ?? PRIORITY_STYLES.Baja;
  const sta = STATUS_STYLES[f.status] ?? STATUS_STYLES.Pendiente;

  return (
    <article className={`bg-white border-2 ${sev.border} rounded-2xl mb-4 overflow-hidden shadow-sm animate-in slide-in-from-left-2 duration-300`}>
      <div className={`${sev.bg} p-4 flex justify-between items-center flex-wrap gap-2`}>
        <span className={`font-black ${sev.text} text-[0.8rem] uppercase tracking-tight`}>
          Hallazgo #{idx + 1} · {f.severity}
        </span>
        <div className="flex gap-2 items-center flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full ${pri.bg} ${pri.text} font-bold text-[0.7rem] border ${pri.border}`}>
            P: {f.priority}
          </span>
          <span className={`px-2.5 py-0.5 rounded-md ${sta.bg} ${sta.text} font-bold text-[0.7rem] border ${sta.border}`}>
            {sta.icon} {f.status}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Problema detectado</label>
          <textarea className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all font-bold" value={f.problem || ''} onChange={e => onSync({ problem: e.target.value })} onBlur={e => onAction(() => onSave(f.id!, { problem: e.target.value }))} placeholder="Ej. Menú 'Rendimiento' no es claro" rows={2} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Evidencia observada</label>
          <textarea className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all font-medium italic" value={f.evidence || ''} onChange={e => onSync({ evidence: e.target.value })} onBlur={e => onAction(() => onSave(f.id!, { evidence: e.target.value }))} placeholder="Ej. 4 de 5 usuarios dudaron" rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Frecuencia</label>
            <input className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all font-mono" value={f.frequency || ''} onChange={e => onSync({ frequency: e.target.value })} onBlur={e => onAction(() => onSave(f.id!, { frequency: e.target.value }))} placeholder="Ej. 4/5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">Severidad <Tooltip text="Nivel de impacto del problema en la experiencia del usuario."><Info size={12} className="text-slate-400" /></Tooltip></label>
            <select className={`w-full p-2.5 border ${sev.border} rounded-lg text-sm ${sev.bg} ${sev.text} font-bold outline-none cursor-pointer`} value={f.severity} onChange={e => { const val = e.target.value as Severity; onSync({ severity: val }); onAction(() => onSave(f.id!, { severity: val })); }}>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-black text-[0.7rem] text-green-800 uppercase tracking-widest">Recomendación de mejora</label>
          <textarea className="w-full p-2.5 border border-green-100 rounded-lg text-sm bg-green-50/30 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-50 outline-none transition-all font-medium" value={f.recommendation || ''} onChange={e => onSync({ recommendation: e.target.value })} onBlur={e => onAction(() => onSave(f.id!, { recommendation: e.target.value }))} placeholder="Ej. Cambiar etiqueta a 'Notas'" rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">Prioridad <Tooltip text="Urgencia recomendada para resolver el hallazgo."><Info size={12} className="text-slate-400" /></Tooltip></label>
            <select className={`w-full p-2.5 border ${pri.border} rounded-lg text-sm ${pri.bg} ${pri.text} font-bold outline-none cursor-pointer`} value={f.priority} onChange={e => { const val = e.target.value as Priority; onSync({ priority: val }); onAction(() => onSave(f.id!, { priority: val })); }}>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Estado</label>
            <select className={`w-full p-2.5 border ${sta.border} rounded-lg text-sm ${sta.bg} ${sta.text} font-bold outline-none cursor-pointer`} value={f.status} onChange={e => { const val = e.target.value as TaskStatus; onSync({ status: val }); onAction(() => onSave(f.id!, { status: val })); }}>
              <option value="Pendiente">⏳ Pendiente</option>
              <option value="En progreso">🔄 En progreso</option>
              <option value="Resuelto">✅ Resuelto</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 mt-2">
          {confirmDelete ? (
            <div className="flex gap-2 items-center animate-in zoom-in-95 duration-200">
              <span className="text-[0.8rem] text-red-600 font-black uppercase">¿Seguro?</span>
              <button type="button" onClick={() => { onDelete(f.id!); setConfirmDelete(false); }} className="bg-red-600 text-white border-none rounded-lg px-4 py-1.5 text-[0.8rem] cursor-pointer font-bold shadow-lg shadow-red-100">Eliminar</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="bg-slate-100 text-slate-600 border-none rounded-lg px-4 py-1.5 text-[0.8rem] cursor-pointer font-bold">No</button>
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

// ─── Componente principal ────────────────────────────────────────────────────
export const FindingsView: React.FC<FindingsViewProps> = ({
  data, onSync, onAdd, onSave, onDelete, planId, productName, onGoToPlan
}) => {
  const width = useWindowWidth();
  const isMobile = width < 1024;
  const [isSaving, setIsSaving] = useState(false);
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

  return (
    <div className="animate-in fade-in duration-500">
      <header className="relative flex items-center justify-center bg-navy text-white p-4 md:px-6 rounded-xl mb-8 shadow-md min-h-[70px]">
        <h2 className="text-xl md:text-2xl font-bold m-0 text-center px-12">
          Síntesis de hallazgos y plan de mejora
        </h2>
        <div role="status" aria-live="polite" className="absolute right-4 md:right-6 flex items-center gap-2 text-sm font-bold opacity-90">
          {isSaving
            ? <span className="flex items-center gap-1.5 text-white animate-pulse"><RefreshCcw size={14} className="animate-spin" aria-hidden="true" /> Guardando…</span>
            : <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle size={14} aria-hidden="true" /> Cambios guardados</span>
          }
        </div>
      </header>

      <div className="space-y-8">
        {isProductEmpty ? (
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="script-empty-heading">
            <div className="text-center p-12 md:p-16 flex flex-col items-center">
              <div aria-hidden="true" className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <AlertTriangle size={40} className="text-amber-600" />
              </div>
              <h3 id="script-empty-heading" className="text-xl font-black text-slate-900 mb-2">¡Falta el nombre del producto!</h3>
              <p className="text-slate-500 font-medium max-w-[400px] mb-8 leading-relaxed">
                Para generar la síntesis de hallazgos, primero define un nombre al producto en la pestaña Plan.
              </p>
              <button onClick={onGoToPlan} className="inline-flex items-center gap-2 bg-navy text-white border-none rounded-xl px-8 py-3.5 text-base font-black cursor-pointer transition-all hover:bg-navy-dark shadow-lg shadow-navy/20 active:scale-[0.98]">
                Ir a definir Producto
              </button>
            </div>
          </section>
        ) : (
          <>
            {!isMobile && (
              <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="findings-table-heading">
                <h3 id="findings-table-heading" className="bg-navy-light text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0">Registro de hallazgos</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <caption className="sr-only">Tabla editable de hallazgos</caption>
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[0.7rem] font-black uppercase tracking-[0.1em] border-b border-slate-200">
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[50px]">#</th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Problema detectado</th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Evidencia observada</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[100px]">Frecuencia</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[130px]">
                          <div className="flex items-center gap-1.5 justify-center">
                            Severidad
                            <Tooltip text="Nivel de impacto del problema en la experiencia del usuario.">
                              <Info size={12} className="text-slate-400" />
                            </Tooltip>
                          </div>
                        </th>
                        <th scope="col" className="p-4 text-left border-r border-slate-100">Recomendación</th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[120px]">
                          <div className="flex items-center gap-1.5 justify-center">
                            Prioridad
                            <Tooltip text="Urgencia recomendada para resolver el hallazgo.">
                              <Info size={12} className="text-slate-400" />
                            </Tooltip>
                          </div>
                        </th>
                        <th scope="col" className="p-4 text-center border-r border-slate-100 w-[140px]">Estado</th>
                        <th scope="col" className="p-4 text-center w-[60px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.length > 0 ? data.map((f, idx) => {
                        const sev = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.Baja;
                        const pri = PRIORITY_STYLES[f.priority] ?? PRIORITY_STYLES.Baja;
                        const sta = STATUS_STYLES[f.status] ?? STATUS_STYLES.Pendiente;
                        return (
                          <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 text-center">
                              <span className="id-badge">{idx + 1}</span>
                            </td>
                            <td className="p-2">
                              <textarea className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-bold" value={f.problem || ''} onChange={e => handleLocalChange(f.id!, { problem: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(f.id!, { problem: e.target.value }))} placeholder="Ej. Menú no es claro" rows={2} />
                            </td>
                            <td className="p-2">
                              <textarea className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium italic text-slate-600" value={f.evidence || ''} onChange={e => handleLocalChange(f.id!, { evidence: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(f.id!, { evidence: e.target.value }))} placeholder="Ej. 4/5 fallaron" rows={2} />
                            </td>
                            <td className="p-2 text-center">
                              <input type="text" className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm text-center transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-mono" value={f.frequency || ''} onChange={e => handleLocalChange(f.id!, { frequency: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(f.id!, { frequency: e.target.value }))} placeholder="4/5" />
                            </td>
                            <td className="p-3">
                              <select className={`w-full p-2 border ${sev.border} rounded-lg text-[0.75rem] ${sev.bg} ${sev.text} font-black outline-none cursor-pointer`} value={f.severity} onChange={e => {
                                const val = e.target.value as Severity;
                                handleLocalChange(f.id!, { severity: val });
                                handleActionWithStatus(() => onSave(f.id!, { severity: val }));
                              }}>
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Alta">Alta</option>
                                <option value="Crítica">Crítica</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <textarea className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-50 outline-none font-medium text-green-900" value={f.recommendation || ''} onChange={e => handleLocalChange(f.id!, { recommendation: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(f.id!, { recommendation: e.target.value }))} placeholder="Mejora..." rows={2} />
                            </td>
                            <td className="p-3">
                              <select className={`w-full p-2 border ${pri.border} rounded-lg text-[0.75rem] ${pri.bg} ${pri.text} font-black outline-none cursor-pointer`} value={f.priority} onChange={e => {
                                const val = e.target.value as Priority;
                                handleLocalChange(f.id!, { priority: val });
                                handleActionWithStatus(() => onSave(f.id!, { priority: val }));
                              }}>
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Alta">Alta</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <select className={`w-full p-2 border ${sta.border} rounded-lg text-[0.75rem] ${sta.bg} ${sta.text} font-black outline-none cursor-pointer`} value={f.status} onChange={e => {
                                const val = e.target.value as TaskStatus;
                                handleLocalChange(f.id!, { status: val });
                                handleActionWithStatus(() => onSave(f.id!, { status: val }));
                              }}>
                                <option value="Pendiente">⏳ Pendiente</option>
                                <option value="En progreso">🔄 En progreso</option>
                                <option value="Resuelto">✅ Resuelto</option>
                              </select>
                            </td>
                            <td className="p-3 text-center">
                              <button className="bg-transparent border-none text-slate-300 p-2 cursor-pointer transition-all hover:bg-red-50 hover:text-red-500 rounded-lg" type="button" onClick={() => onDelete(f.id!)}>
                                <Trash2 size={18} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={9} className="p-12 text-center text-slate-500 italic font-medium">No hay hallazgos todavía.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 px-6 bg-slate-50 border-t border-slate-200">
                  <button className="inline-flex items-center gap-2 bg-navy text-white border-none px-6 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider cursor-pointer transition-all hover:bg-navy-dark disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-navy/10 active:scale-[0.98]" onClick={onAdd} disabled={!planId} type="button">
                    <Plus size={18} aria-hidden="true" /> Añadir Hallazgo
                  </button>
                </div>
              </section>
            )}

            {isMobile && (
              <section aria-labelledby="findings-cards-heading">
                <h3 id="findings-cards-heading" className="text-[0.9rem] font-black text-navy uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-navy rounded-full"></span> Hallazgos registrados
                </h3>

                {data.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium italic mb-6">
                    No hay hallazgos todavía.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.map((f, idx) => (
                      <FindingCard
                        key={f.id}
                        f={f}
                        idx={idx}
                        onSync={(updates) => handleLocalChange(f.id!, updates)}
                        onSave={onSave}
                        onDelete={onDelete}
                        onAction={handleActionWithStatus}
                      />
                    ))}
                  </div>
                )}

                <button className="inline-flex items-center justify-center gap-2 w-full bg-navy text-white border-none p-4 rounded-2xl font-black text-sm uppercase tracking-widest cursor-pointer transition-all hover:bg-navy-dark shadow-lg shadow-navy/10 mt-4 active:scale-[0.98]" onClick={onAdd} disabled={!planId} type="button">
                  <Plus size={20} aria-hidden="true" /> Añadir Hallazgo
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
