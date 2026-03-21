import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, RefreshCcw } from 'lucide-react';
import { TestPlan, TestTask } from '../models/types';

interface ScriptViewProps {
  testPlan: TestPlan;
  tasks: TestTask[];
  onUpdatePlan: (updates: TestPlan) => void;
  onSaveTask: (id: string, updates: Partial<TestTask>) => void;
  onAddTask: () => void;
  onDeleteTask: (id: string) => void;
  onGoToPlan: () => void;
}

export const ScriptView: React.FC<ScriptViewProps> = ({ testPlan, tasks, onSaveTask, onAddTask, onDeleteTask, onUpdatePlan, onGoToPlan }) => {
  const [isSaving, setIsSaving] = useState(false);
  const isProductEmpty = !testPlan.product || testPlan.product.trim() === '';

  const handleActionWithStatus = (action: () => void) => {
    setIsSaving(true);
    action();
    setTimeout(() => setIsSaving(false), 800);
  };

  const openingSteps = [
    'Agradece la participación.',
    'Explica que se evalúa la interfaz, no a la persona.',
    'Pide que piense en voz alta.',
    'Lee una tarea a la vez.',
    'Evita ayudar salvo bloqueo total.'
  ];

  const handleUpdateClosingAnswer = (index: number, answer: string) => {
    const newQuestions = [...(testPlan.closing_questions || [])];
    newQuestions[index] = { ...newQuestions[index], answer };
    handleActionWithStatus(() => onUpdatePlan({ ...testPlan, closing_questions: newQuestions }));
  };

  return (
    <div id="script-panel" role="tabpanel" className="dashboard-view">
      <header className="view-header" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Guion de moderación y tareas</h2>
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
                Para empezar a redactar el guion y las tareas, primero debes asignar un nombre al producto en la pestaña de Plan.
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
          <>
            <section className="card">
              <h3 className="card-title">Inicio de la sesión</h3>
              <div className="card-content">
                <div className="numbered-list" style={{ gap: '0.8rem' }}>
                  {openingSteps.map((step, index) => (
                    <div 
                      key={index} 
                      className="numbered-item" 
                      style={{ 
                        padding: '0.75rem 1rem', 
                        backgroundColor: '#f8fafc', 
                        borderRadius: '6px',
                        borderLeft: '4px solid var(--primary)'
                      }}
                    >
                      <span className="step-number">{index + 1}.</span>
                      <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="card">
              <h3 className="card-title">Tareas a leer durante el test</h3>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>ID</th>
                      <th style={{ width: '35%' }}>Texto de la tarea</th>
                      <th style={{ width: '35%' }}>Pregunta de seguimiento</th>
                      <th>Éxito esperado</th>
                      <th style={{ width: '60px' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length > 0 ? (
                      tasks.map((task) => (
                        <tr key={task.id}>
                          <td style={{ textAlign: 'center' }}><span className="id-badge">{task.task_index}</span></td>
                          <td>
                            <textarea 
                              defaultValue={task.script_task_text || ''} 
                              onBlur={(e) => handleActionWithStatus(() => onSaveTask(task.id!, { script_task_text: e.target.value }))} 
                              placeholder="Ej. Imagina que quieres..." 
                            />
                          </td>
                          <td>
                            <textarea 
                              defaultValue={task.script_follow_up || ''} 
                              onBlur={(e) => handleActionWithStatus(() => onSaveTask(task.id!, { script_follow_up: e.target.value }))} 
                              placeholder="Ej. ¿Qué esperabas...?" 
                            />
                          </td>
                          <td>
                            <textarea 
                              defaultValue={task.script_expected_success || ''} 
                              onBlur={(e) => handleActionWithStatus(() => onSaveTask(task.id!, { script_expected_success: e.target.value }))} 
                              placeholder="Ej. Encuentra la nota..." 
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn-delete" onClick={() => onDeleteTask(task.id!)}>
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No hay tareas en el guion. Haz clic en el botón de abajo para empezar.
                        </td>
                      </tr>
                    )}
                  </tbody>                </table>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)' }}>
                <button className="btn-add" onClick={onAddTask} disabled={!testPlan.id}>
                  <Plus size={18} /> Añadir Tarea al Guion
                </button>
              </div>
            </section>

            <section className="card">
              <h3 className="card-title">Cierre</h3>
              <div className="card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {(testPlan.closing_questions || []).map((q: any, index: number) => (
                    <div key={index} className="form-group">
                      <label style={{ color: '#854d0e', fontSize: '1.05rem', fontWeight: 'bold' }}>
                        {index + 1}. {q.question}
                      </label>
                      <textarea 
                        defaultValue={q.answer} 
                        onBlur={(e) => handleUpdateClosingAnswer(index, e.target.value)} 
                        placeholder="Escribe la respuesta..."
                        rows={3}
                        style={{ backgroundColor: '#fef9c3', border: '1px solid #fde047', color: '#1a1a1a' }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};