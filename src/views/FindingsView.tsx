import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface FindingsViewProps {
  data: any[];
  onAdd: () => void;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}

export const FindingsView: React.FC<FindingsViewProps> = ({ data, onAdd, onUpdate, onDelete }) => {
  return (
    <div id="findings-panel" role="tabpanel" aria-labelledby="findings-tab" className="dashboard-view">
      <header className="view-header">
        <h2>Síntesis de hallazgos y plan de mejora</h2>
      </header>

      <section className="card" style={{ marginBottom: '0' }}>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Problema</th>
                <th style={{ width: '25%' }}>Evidencia observada</th>
                <th style={{ width: '100px' }}>Frecuencia</th>
                <th style={{ width: '120px' }}>Severidad</th>
                <th style={{ width: '25%' }}>Recomendación</th>
                <th style={{ width: '120px' }}>Prioridad</th>
                <th style={{ width: '120px' }}>Estado</th>
                <th style={{ width: '60px' }}>Borrar</th>
              </tr>
            </thead>
            <tbody>
              {data.map((finding) => (
                <tr key={finding.id}>
                  <td><textarea value={finding.problem} onChange={(e) => onUpdate(finding.id, { problem: e.target.value })} placeholder="Descripción del problema..." /></td>
                  <td><textarea value={finding.evidence} onChange={(e) => onUpdate(finding.id, { evidence: e.target.value })} placeholder="Ej. 4 de 5 usuarios..." /></td>
                  <td><input value={finding.frequency} onChange={(e) => onUpdate(finding.id, { frequency: e.target.value })} placeholder="Ej. 4/5" /></td>
                  <td>
                    <select value={finding.severity} onChange={(e) => onUpdate(finding.id, { severity: e.target.value })}>
                      <option value="">Nivel...</option>
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </td>
                  <td><textarea value={finding.recommendation} onChange={(e) => onUpdate(finding.id, { recommendation: e.target.value })} placeholder="Solución propuesta..." /></td>
                  <td>
                    <select value={finding.priority} onChange={(e) => onUpdate(finding.id, { priority: e.target.value })}>
                      <option value="">Nivel...</option>
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </td>
                  <td>
                    <select value={finding.status} onChange={(e) => onUpdate(finding.id, { status: e.target.value })}>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En proceso">En proceso</option>
                      <option value="Resuelto">Resuelto</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}><button className="btn-delete" onClick={() => onDelete(finding.id)}><Trash2 size={20} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)' }}>
          <button className="btn-add" onClick={onAdd}><Plus size={18} /> Añadir Hallazgo</button>
        </div>
      </section>
    </div>
  );
};