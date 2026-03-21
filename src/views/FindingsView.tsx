import React, { useState } from 'react';
import { Finding } from '../models/types';
import { Trash2, Plus, CheckCircle, RefreshCcw } from 'lucide-react';

interface FindingsViewProps {
  data: Finding[];
  onAdd: () => void;
  onSave: (id: string, updates: Partial<Finding>) => void;
  onDelete: (id: string) => void;
  planId?: string;
  productName?: string;
  onGoToPlan: () => void;
}

export const FindingsView: React.FC<FindingsViewProps> = ({ data, onAdd, onSave, onDelete, planId, productName, onGoToPlan }) => {
  const [isSaving, setIsSaving] = useState(false);
  const isProductEmpty = !productName || productName.trim() === '';

  const handleActionWithStatus = (action: () => void) => {
    setIsSaving(true);
    action();
    setTimeout(() => setIsSaving(false), 800);
  };

  return (
    <div id="findings-panel" className="dashboard-view">
      <header className="view-header" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Síntesis de hallazgos y plan de mejora</h2>
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
                Para generar la síntesis de hallazgos y el plan de mejora, primero debes asignar un nombre al producto en la pestaña de Plan.
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
                    <th>Problema</th>
                    <th>Evidencia observada</th>
                    <th style={{ width: '100px' }}>Frecuencia</th>
                    <th style={{ width: '120px' }}>Severidad</th>
                    <th>Recomendación</th>
                    <th style={{ width: '120px' }}>Prioridad</th>
                    <th style={{ width: '130px' }}>Estado</th>
                    <th style={{ width: '60px' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    data.map((f) => (
                      <tr key={f.id}>
                        <td><textarea defaultValue={f.problem} onBlur={(e) => handleActionWithStatus(() => onSave(f.id!, { problem: e.target.value }))} placeholder="Ej. Menú 'Rendimiento' no comunica que contiene notas" /></td>
                        <td><textarea defaultValue={f.evidence} onBlur={(e) => handleActionWithStatus(() => onSave(f.id!, { evidence: e.target.value }))} placeholder="Ej. 4 de 5 usuarios dudaron o entraron al segundo intento" /></td>
                        <td><input defaultValue={f.frequency} onBlur={(e) => handleActionWithStatus(() => onSave(f.id!, { frequency: e.target.value }))} placeholder="Ej. 4/5" /></td>
                        <td>
                          <select defaultValue={f.severity} onChange={(e) => handleActionWithStatus(() => onSave(f.id!, { severity: e.target.value as any }))}>
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                            <option value="Crítica">Crítica</option>
                          </select>
                        </td>
                        <td><textarea defaultValue={f.recommendation} onBlur={(e) => handleActionWithStatus(() => onSave(f.id!, { recommendation: e.target.value }))} placeholder="Ej. Cambiar etiqueta a 'Notas'" /></td>
                        <td>
                          <select defaultValue={f.priority} onChange={(e) => handleActionWithStatus(() => onSave(f.id!, { priority: e.target.value as any }))}>
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                          </select>
                        </td>
                        <td>
                          <select defaultValue={f.status} onChange={(e) => handleActionWithStatus(() => onSave(f.id!, { status: e.target.value as any }))}>
                            <option value="Pendiente">Pendiente</option>
                            <option value="En progreso">En progreso</option>
                            <option value="Resuelto">Resuelto</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn-delete" onClick={() => onDelete(f.id!)} type="button">
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay hallazgos registrados. Haz clic en el botón de abajo para empezar.
                      </td>
                    </tr>
                  )}
                </tbody>              </table>
            </div>
            <div style={{ padding: '1rem' }}>
              <button className="btn-add" onClick={onAdd} disabled={!planId} type="button">
                <Plus size={18} /> Añadir Hallazgo
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};