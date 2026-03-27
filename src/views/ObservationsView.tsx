import React, { useState, useEffect } from 'react';
import { Observation, SuccessStatus, Severity } from '../models/types';
import { Trash2, Plus, CheckCircle, RefreshCcw, ClipboardList } from 'lucide-react';

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

const severityStyles: Record<string, { bg: string; color: string; border: string }> = {
  Baja:    { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  Media:   { bg: '#fefce8', color: '#854d0e', border: '#fde68a' },
  Alta:    { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
  Crítica: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

const successStyles: Record<string, { bg: string; color: string; border: string }> = {
  'Sí':        { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  'No':        { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  'Con ayuda': { bg: '#fefce8', color: '#854d0e', border: '#fde68a' },
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
      style={{
        background: '#fff',
        border: `2px solid ${sStyle.border}`,
        borderRadius: 10,
        marginBottom: '1rem',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
      aria-label={`Observación ${idx + 1}`}
    >
      {/* Cabecera */}
      <div style={{ background: sStyle.bg, padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontWeight: 700, color: sStyle.color, fontSize: '0.85rem' }}>
          Observación #{idx + 1}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ padding: '2px 8px', borderRadius: 99, backgroundColor: okStyle.bg, color: okStyle.color, fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${okStyle.border}` }}>
            {obs.success_level || 'Sí'}
          </span>
          <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: sStyle.bg, color: sStyle.color, fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${sStyle.border}` }}>
            {obs.severity || 'Baja'}
          </span>
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Fila: Participante + Perfil + Tarea */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '0.75rem' }}>
          <div className="form-group">
            <label htmlFor={`m-obs-participant-${obs.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Participante</label>
            <input id={`m-obs-participant-${obs.id}`} type="text" value={obs.participant || ''} onChange={e => onLocalChange(obs.id!, { participant: e.target.value })} onBlur={e => onAction(() => onSave(obs.id!, { participant: e.target.value }))} placeholder="P1" />
          </div>
          <div className="form-group">
            <label htmlFor={`m-obs-profile-${obs.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Perfil</label>
            <input id={`m-obs-profile-${obs.id}`} type="text" value={obs.profile || ''} onChange={e => onLocalChange(obs.id!, { profile: e.target.value })} onBlur={e => onAction(() => onSave(obs.id!, { profile: e.target.value }))} placeholder="Estudiante" />
          </div>
          <div className="form-group">
            <label htmlFor={`m-obs-taskref-${obs.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tarea</label>
            <input id={`m-obs-taskref-${obs.id}`} type="text" value={obs.task_ref || ''} onChange={e => onLocalChange(obs.id!, { task_ref: e.target.value })} onBlur={e => onAction(() => onSave(obs.id!, { task_ref: e.target.value }))} placeholder="T1" />
          </div>
        </div>

        {/* Fila: Éxito + Tiempo + Errores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label htmlFor={`m-obs-success-${obs.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Éxito</label>
            <select
              id={`m-obs-success-${obs.id}`}
              value={obs.success_level}
              onChange={e => {
                const val = e.target.value as SuccessStatus;
                onLocalChange(obs.id!, { success_level: val });
                onAction(() => onSave(obs.id!, { success_level: val }));
              }}
              style={{ backgroundColor: okStyle.bg, color: okStyle.color, border: `1px solid ${okStyle.border}`, fontWeight: 600 }}
            >
              <option value="Sí">Sí</option>
              <option value="No">No</option>
              <option value="Con ayuda">Con ayuda</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor={`m-obs-time-${obs.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tiempo (s)</label>
            <input id={`m-obs-time-${obs.id}`} type="number" min="0" value={obs.time_seconds} onChange={e => onLocalChange(obs.id!, { time_seconds: parseInt(e.target.value) || 0 })} onBlur={e => onAction(() => onSave(obs.id!, { time_seconds: parseInt(e.target.value) || 0 }))} placeholder="0" />
          </div>
          <div className="form-group">
            <label htmlFor={`m-obs-errors-${obs.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Errores</label>
            <input id={`m-obs-errors-${obs.id}`} type="number" min="0" value={obs.errors} onChange={e => onLocalChange(obs.id!, { errors: parseInt(e.target.value) || 0 })} onBlur={e => onAction(() => onSave(obs.id!, { errors: parseInt(e.target.value) || 0 }))} placeholder="0" />
          </div>
        </div>

        {/* Comentarios */}
        <div className="form-group">
          <label htmlFor={`m-obs-comments-${obs.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Comentarios clave</label>
          <textarea id={`m-obs-comments-${obs.id}`} value={obs.comments || ''} onChange={e => onLocalChange(obs.id!, { comments: e.target.value })} onBlur={e => onAction(() => onSave(obs.id!, { comments: e.target.value }))} placeholder="Ej. Dudó entre 'Notas' y 'Rendimiento'" rows={2} />
        </div>

        {/* Problema */}
        <div className="form-group">
          <label htmlFor={`m-obs-problem-${obs.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Problema detectado</label>
          <textarea id={`m-obs-problem-${obs.id}`} value={obs.problem || ''} onChange={e => onLocalChange(obs.id!, { problem: e.target.value })} onBlur={e => onAction(() => onSave(obs.id!, { problem: e.target.value }))} placeholder="Ej. Nombre del menú no es claro" rows={2} />
        </div>

        {/* Fila: Severidad + Mejora */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label htmlFor={`m-obs-severity-${obs.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Severidad</label>
            <select
              id={`m-obs-severity-${obs.id}`}
              value={obs.severity}
              onChange={e => {
                const val = e.target.value as Severity;
                onLocalChange(obs.id!, { severity: val });
                onAction(() => onSave(obs.id!, { severity: val }));
              }}
              style={{ backgroundColor: sStyle.bg, color: sStyle.color, border: `1px solid ${sStyle.border}`, fontWeight: 600 }}
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor={`m-obs-proposal-${obs.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mejora propuesta</label>
            <textarea id={`m-obs-proposal-${obs.id}`} value={obs.proposal || ''} onChange={e => onLocalChange(obs.id!, { proposal: e.target.value })} onBlur={e => onAction(() => onSave(obs.id!, { proposal: e.target.value }))} placeholder="Ej. Renombrar el menú" rows={2} />
          </div>
        </div>

        {/* Botón eliminar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 700 }}>¿Eliminar?</span>
              <button type="button" onClick={() => { onDelete(obs.id!); setConfirmDelete(false); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700 }} aria-label={`Confirmar eliminar observación ${idx + 1}`}>Sí</button>
              <button type="button" onClick={() => setConfirmDelete(false)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}>No</button>
            </div>
          ) : (
            <button type="button" className="btn-delete" onClick={() => setConfirmDelete(true)} aria-label={`Eliminar observación ${idx + 1}`}>
              <Trash2 size={18} aria-hidden="true" />
              <span style={{ fontSize: '0.82rem', marginLeft: 4 }}>Eliminar</span>
            </button>
          )}
        </div>
      </div>
    </article>
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
    <div className="dashboard-view">
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, flex: 1, textAlign: 'center' }}>Registro de observación — prueba de usabilidad</h2>
        <div aria-live="polite" aria-atomic="true" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', flexShrink: 0 }}>
          {isSaving ? (
            <><RefreshCcw size={14} className="spin" aria-hidden="true" /><span style={{ color: '#ffffff' }}>Guardando...</span></>
          ) : (
            <><CheckCircle size={14} aria-hidden="true" style={{ color: '#10b981' }} /><span style={{ color: '#10b981' }}>Cambios guardados</span></>
          )}
        </div>
      </header>

      <div className="dashboard-content">
        {isProductEmpty ? (
          <section className="card" aria-labelledby="obs-empty-heading">
            <div className="card-content" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div aria-hidden="true" style={{ width: '80px', height: '80px', backgroundColor: '#fffbeb', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1rem' }}>
                <ClipboardList size={40} color="#d97706" />
              </div>
              <h3 id="obs-empty-heading" style={{ color: '#1e293b', marginBottom: '0.5rem' }}>¡Falta el nombre del producto!</h3>
              <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                Para registrar observaciones, primero debes asignar un nombre al producto en la pestaña de Plan.
              </p>
              <button type="button" onClick={onGoToPlan} style={{ backgroundColor: '#003366', color: 'white', padding: '12px 24px', borderRadius: '6px', border: '2px solid transparent', fontWeight: 'bold', cursor: 'pointer' }}>
                Ir a definir Producto
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Tarjetas de resumen */}
            {totalObs > 0 && (
              <section aria-labelledby="obs-stats-heading" style={{ marginBottom: '1.5rem' }}>
                <h3 id="obs-stats-heading" className="sr-only">Resumen de observaciones</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'Observaciones',  value: totalObs,    color: 'var(--primary)', suffix: '' },
                    { label: 'Tareas exitosas', value: totalOk,     color: '#166534',        suffix: '' },
                    { label: 'Total errores',   value: totalErrors, color: '#dc2626',        suffix: '' },
                    { label: 'Tiempo promedio', value: avgTime,     color: '#d97706',        suffix: 's' },
                  ].map(({ label, value, color, suffix }) => (
                    <div key={label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem 1rem', textAlign: 'center', borderTop: `4px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '2rem', fontWeight: 800, color }}>{value}{suffix}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── MÓVIL: tarjetas ── */}
            {isMobile && (
              <section aria-labelledby="obs-cards-heading">
                <h3 id="obs-cards-heading" className="card-title" style={{ borderRadius: '8px 8px 0 0', marginBottom: '1rem' }}>
                  Observaciones registradas
                </h3>
                {data.length === 0 ? (
                  <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay observaciones. Haz clic en "Añadir Observación".
                  </div>
                ) : (
                  data.map((obs, idx) => (
                    <ObservationCard
                      key={obs.id}
                      obs={obs}
                      idx={idx}
                      onLocalChange={handleLocalChange}
                      onSave={onSave}
                      onDelete={onDelete}
                      onAction={handleActionWithStatus}
                    />
                  ))
                )}
                <button type="button" className="btn-add" onClick={onAdd} disabled={!planId} style={{ width: '100%', justifyContent: 'center' }} aria-label="Añadir nueva observación">
                  <Plus size={18} aria-hidden="true" /> Añadir Observación
                </button>
              </section>
            )}

            {/* ── DESKTOP: tabla ── */}
            {!isMobile && (
              <section className="card" aria-labelledby="obs-tabla-heading">
                <h3 className="card-title" id="obs-tabla-heading">Observaciones registradas</h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <caption className="sr-only">Registro de observaciones de prueba de usabilidad</caption>
                    <thead>
                      <tr>
                        <th scope="col">Participante</th>
                        <th scope="col">Perfil</th>
                        <th scope="col">Tarea</th>
                        <th scope="col">Éxito</th>
                        <th scope="col">Tiempo (s)</th>
                        <th scope="col">Errores</th>
                        <th scope="col">Comentarios clave</th>
                        <th scope="col">Problema detectado</th>
                        <th scope="col">Severidad</th>
                        <th scope="col">Mejora propuesta</th>
                        <th scope="col">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.length > 0 ? (
                        data.map((obs) => {
                          const sStyle  = severityStyles[obs.severity]     || severityStyles['Baja'];
                          const okStyle = successStyles[obs.success_level] || successStyles['Sí'];
                          return (
                            <tr key={obs.id}>
                              <td><label htmlFor={`obs-participant-${obs.id}`} className="sr-only">Participante</label><input id={`obs-participant-${obs.id}`} type="text" value={obs.participant || ''} onChange={e => handleLocalChange(obs.id!, { participant: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { participant: e.target.value }))} placeholder="P1" /></td>
                              <td><label htmlFor={`obs-profile-${obs.id}`} className="sr-only">Perfil</label><input id={`obs-profile-${obs.id}`} type="text" value={obs.profile || ''} onChange={e => handleLocalChange(obs.id!, { profile: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { profile: e.target.value }))} placeholder="Estudiante" /></td>
                              <td><label htmlFor={`obs-taskref-${obs.id}`} className="sr-only">Tarea</label><input id={`obs-taskref-${obs.id}`} type="text" value={obs.task_ref || ''} onChange={e => handleLocalChange(obs.id!, { task_ref: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { task_ref: e.target.value }))} placeholder="T1" /></td>
                              <td><label htmlFor={`obs-success-${obs.id}`} className="sr-only">Éxito</label><select id={`obs-success-${obs.id}`} value={obs.success_level} onChange={e => { const val = e.target.value as SuccessStatus; handleLocalChange(obs.id!, { success_level: val }); handleActionWithStatus(() => onSave(obs.id!, { success_level: val })); }} style={{ backgroundColor: okStyle.bg, color: okStyle.color, border: `1px solid ${okStyle.border}`, fontWeight: 600 }}><option value="Sí">Sí</option><option value="No">No</option><option value="Con ayuda">Con ayuda</option></select></td>
                              <td><label htmlFor={`obs-time-${obs.id}`} className="sr-only">Tiempo</label><input id={`obs-time-${obs.id}`} type="number" min="0" value={obs.time_seconds} onChange={e => handleLocalChange(obs.id!, { time_seconds: parseInt(e.target.value) || 0 })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { time_seconds: parseInt(e.target.value) || 0 }))} placeholder="0" /></td>
                              <td><label htmlFor={`obs-errors-${obs.id}`} className="sr-only">Errores</label><input id={`obs-errors-${obs.id}`} type="number" min="0" value={obs.errors} onChange={e => handleLocalChange(obs.id!, { errors: parseInt(e.target.value) || 0 })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { errors: parseInt(e.target.value) || 0 }))} placeholder="0" /></td>
                              <td><label htmlFor={`obs-comments-${obs.id}`} className="sr-only">Comentarios</label><textarea id={`obs-comments-${obs.id}`} value={obs.comments || ''} onChange={e => handleLocalChange(obs.id!, { comments: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { comments: e.target.value }))} placeholder="Ej. Dudó entre opciones" rows={3} /></td>
                              <td><label htmlFor={`obs-problem-${obs.id}`} className="sr-only">Problema</label><textarea id={`obs-problem-${obs.id}`} value={obs.problem || ''} onChange={e => handleLocalChange(obs.id!, { problem: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { problem: e.target.value }))} placeholder="Ej. Menú no es claro" rows={3} /></td>
                              <td><label htmlFor={`obs-severity-${obs.id}`} className="sr-only">Severidad</label><select id={`obs-severity-${obs.id}`} value={obs.severity} onChange={e => { const val = e.target.value as Severity; handleLocalChange(obs.id!, { severity: val }); handleActionWithStatus(() => onSave(obs.id!, { severity: val })); }} style={{ backgroundColor: sStyle.bg, color: sStyle.color, border: `1px solid ${sStyle.border}`, fontWeight: 600 }}><option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option><option value="Crítica">Crítica</option></select></td>
                              <td><label htmlFor={`obs-proposal-${obs.id}`} className="sr-only">Mejora</label><textarea id={`obs-proposal-${obs.id}`} value={obs.proposal || ''} onChange={e => handleLocalChange(obs.id!, { proposal: e.target.value })} onBlur={e => handleActionWithStatus(() => onSave(obs.id!, { proposal: e.target.value }))} placeholder="Ej. Renombrar menú" rows={3} /></td>
                              <td style={{ textAlign: 'center' }}><button type="button" className="btn-delete" onClick={() => onDelete(obs.id!)} aria-label={`Eliminar observación de ${obs.participant || 'participante'} en tarea ${obs.task_ref || ''}`}><Trash2 size={18} aria-hidden="true" /></button></td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan={11} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay observaciones registradas. Haz clic en el botón de abajo para empezar.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn-add" onClick={onAdd} disabled={!planId} aria-label="Añadir nueva observación">
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