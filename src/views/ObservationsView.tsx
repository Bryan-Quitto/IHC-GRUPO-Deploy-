import React, { useState } from 'react';
import { Observation, SuccessStatus, Severity } from '../models/types';
import { Trash2, Plus, CheckCircle, RefreshCcw } from 'lucide-react';

interface ObservationsViewProps {
  data: Observation[];
  onAdd: () => void;
  onSave: (id: string, updates: Partial<Observation>) => void;
  onDelete: (id: string) => void;
  planId?: string;
  productName?: string;
  onGoToPlan: () => void;
}

export const ObservationsView: React.FC<ObservationsViewProps> = ({ data, onAdd, onSave, onDelete, planId, productName, onGoToPlan }) => {
  const [isSaving, setIsSaving] = useState(false);
  const isProductEmpty = !productName || productName.trim() === '';

  const handleActionWithStatus = (action: () => void) => {
    setIsSaving(true);
    action();
    setTimeout(() => setIsSaving(false), 800);
  };

  return (
    <div id="observations-panel" className="dashboard-view">
      <header className="view-header" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Registro de observación - prueba de usabilidad</h2>
        <div style={{ position: 'absolute', right: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          {isSaving ? (
            <span style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <RefreshCcw size={14} className="spin" /> Guardando...
            </span>
          ) : (
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle size={14} /> Cambios guardados
            </span>
          )}
        </div>
      </header>

      <div className="dashboard-content">
        {isProductEmpty ? (
          <section className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: '#fffbeb', 
                borderRadius: '50%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                margin: '0 auto 1rem' 
              }}>
                <Plus size={40} color="#d97706" style={{ transform: 'rotate(45deg)' }} />
              </div>
              <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>¡Falta el nombre del producto!</h3>
              <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                Para registrar observaciones de los participantes, primero debes asignar un nombre al producto en la pestaña de Plan.
              </p>
              <button 
                onClick={onGoToPlan}
                style={{ backgroundColor: '#003366', color: 'white', padding: '12px 24px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Ir a definir Producto
              </button>
            </div>
          </section>
        ) : (
          <section className="card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>Participante</th>
                    <th style={{ width: '150px' }}>Perfil</th>
                    <th style={{ width: '80px' }}>Tarea</th>
                    <th style={{ width: '120px' }}>Éxito</th>
                    <th style={{ width: '100px' }}>Tiempo (seg)</th>
                    <th style={{ width: '80px' }}>Errores</th>
                    <th>Comentarios clave</th>
                    <th>Problema detectado</th>
                    <th style={{ width: '120px' }}>Severidad</th>
                    <th>Mejora propuesta</th>
                    <th style={{ width: '60px' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    data.map((obs) => (
                      <tr key={obs.id}>
                        <td><input aria-label="Participante" defaultValue={obs.participant} onBlur={(e) => handleActionWithStatus(() => onSave(obs.id!, { participant: e.target.value }))} placeholder="Ej. P1" /></td>
                        <td><input aria-label="Perfil" defaultValue={obs.profile} onBlur={(e) => handleActionWithStatus(() => onSave(obs.id!, { profile: e.target.value }))} placeholder="Ej. Estudiante 3er nivel" /></td>
                        <td><input aria-label="Referencia de Tarea" defaultValue={obs.task_ref} onBlur={(e) => handleActionWithStatus(() => onSave(obs.id!, { task_ref: e.target.value }))} placeholder="Ej. T1" /></td>
                        <td>
                          <select aria-label="Nivel de éxito" defaultValue={obs.success_level} onChange={(e) => handleActionWithStatus(() => onSave(obs.id!, { success_level: e.target.value as SuccessStatus }))}>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                            <option value="Con ayuda">Con ayuda</option>
                          </select>
                        </td>
                        <td><input aria-label="Tiempo en segundos" type="number" defaultValue={obs.time_seconds} onBlur={(e) => handleActionWithStatus(() => onSave(obs.id!, { time_seconds: parseInt(e.target.value) || 0 }))} placeholder="12" /></td>
                        <td><input aria-label="Número de errores" type="number" defaultValue={obs.errors} onBlur={(e) => handleActionWithStatus(() => onSave(obs.id!, { errors: parseInt(e.target.value) || 0 }))} placeholder="1" /></td>
                        <td><textarea aria-label="Comentarios clave" defaultValue={obs.comments} onBlur={(e) => handleActionWithStatus(() => onSave(obs.id!, { comments: e.target.value }))} placeholder="Ej. Dudó entre 'Notas' y 'Rendimiento'" /></td>
                        <td><textarea aria-label="Problema detectado" defaultValue={obs.problem} onBlur={(e) => handleActionWithStatus(() => onSave(obs.id!, { problem: e.target.value }))} placeholder="Ej. Nombre del menú no es claro" /></td>
                        <td>
                          <select aria-label="Severidad" defaultValue={obs.severity} onChange={(e) => handleActionWithStatus(() => onSave(obs.id!, { severity: e.target.value as Severity }))}>
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                            <option value="Crítica">Crítica</option>
                          </select>
                        </td>
                        <td><textarea aria-label="Mejora propuesta" defaultValue={obs.proposal} onBlur={(e) => handleActionWithStatus(() => onSave(obs.id!, { proposal: e.target.value }))} placeholder="Ej. Renombrar el menú a 'Notas'" /></td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn-delete" onClick={() => onDelete(obs.id!)} type="button">
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay observaciones registradas. Haz clic en el botón de abajo para empezar.
                      </td>
                    </tr>
                  )}
                </tbody>              </table>
            </div>
            <div style={{ padding: '1rem' }}>
              <button className="btn-add" onClick={onAdd} disabled={!planId} type="button">
                <Plus size={18} /> Añadir Observación
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};