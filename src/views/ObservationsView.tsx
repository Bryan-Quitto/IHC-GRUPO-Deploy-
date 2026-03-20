import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface ObservationsViewProps {
  data: any[];
  onAdd: () => void;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}

export const ObservationsView: React.FC<ObservationsViewProps> = ({ data, onAdd, onUpdate, onDelete }) => {
  return (
    <div id="observations-panel" role="tabpanel" aria-labelledby="observations-tab" className="dashboard-view">
      <header className="view-header">
        <h2>Registro de observación - prueba de usabilidad</h2>
      </header>

      <section className="card" style={{ marginBottom: '0' }}>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Participante</th>
                <th style={{ width: '150px' }}>Perfil</th>
                <th style={{ width: '80px' }}>Tarea</th>
                <th style={{ width: '120px' }}>Éxito</th>
                <th style={{ width: '80px' }}>Tiempo (s)</th>
                <th style={{ width: '80px' }}>Errores</th>
                <th style={{ width: '250px' }}>Comentarios clave</th>
                <th style={{ width: '250px' }}>Problema detectado</th>
                <th style={{ width: '120px' }}>Severidad</th>
                <th style={{ width: '250px' }}>Mejora propuesta</th>
                <th style={{ width: '60px' }}>Borrar</th>
              </tr>
            </thead>
            <tbody>
              {data.map((obs) => (
                <tr key={obs.id}>
                  <td><input value={obs.participant} onChange={(e) => onUpdate(obs.id, { participant: e.target.value })} placeholder="Ej. P1" /></td>
                  <td><input value={obs.profile} onChange={(e) => onUpdate(obs.id, { profile: e.target.value })} placeholder="Perfil" /></td>
                  <td><input value={obs.task} onChange={(e) => onUpdate(obs.id, { task: e.target.value })} placeholder="T1" /></td>
                  <td>
                    <select value={obs.success} onChange={(e) => onUpdate(obs.id, { success: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                      <option value="Con ayuda">Con ayuda</option>
                    </select>
                  </td>
                  <td><input type="number" value={obs.time} onChange={(e) => onUpdate(obs.id, { time: e.target.value })} placeholder="12" /></td>
                  <td><input type="number" value={obs.errors} onChange={(e) => onUpdate(obs.id, { errors: e.target.value })} placeholder="0" /></td>
                  <td><textarea value={obs.comments} onChange={(e) => onUpdate(obs.id, { comments: e.target.value })} placeholder="Comentarios..." /></td>
                  <td><textarea value={obs.problem} onChange={(e) => onUpdate(obs.id, { problem: e.target.value })} placeholder="Problema..." /></td>
                  <td>
                    <select value={obs.severity} onChange={(e) => onUpdate(obs.id, { severity: e.target.value })}>
                      <option value="">Nivel...</option>
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </td>
                  <td><textarea value={obs.proposal} onChange={(e) => onUpdate(obs.id, { proposal: e.target.value })} placeholder="Propuesta..." /></td>
                  <td style={{ textAlign: 'center' }}><button className="btn-delete" onClick={() => onDelete(obs.id)}><Trash2 size={20} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)' }}>
          <button className="btn-add" onClick={onAdd}><Plus size={18} /> Añadir Observación</button>
        </div>
      </section>
    </div>
  );
};