import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, RefreshCcw, ClipboardList, Check, X } from 'lucide-react';
import { TestPlan, TestTask, ClosingQuestion } from '../models/types';

interface ScriptViewProps {
  testPlan: TestPlan;
  tasks: TestTask[];
  onUpdatePlan: (updates: TestPlan) => void;
  onSyncPlan: (updates: TestPlan) => void;
  onSyncTasks: (tasks: TestTask[]) => void;
  onSaveTask: (id: string, updates: Partial<TestTask>) => void;
  onAddTask: () => void;
  onDeleteTask: (id: string) => void;
  onGoToPlan: () => void;
}

const ScriptTaskRow: React.FC<{
  task: TestTask;
  handleTaskChange: (id: string, updates: Partial<TestTask>) => void;
  handleActionWithStatus: (action: () => void) => void;
  onSaveTask: (id: string, updates: Partial<TestTask>) => void;
  onDeleteTask: (id: string) => void;
}> = ({ task, handleTaskChange, handleActionWithStatus, onSaveTask, onDeleteTask }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
      <td className="p-3 text-center">
        <span className="id-badge">{task.task_index}</span>
      </td>

      <td className="p-2">
        <label htmlFor={`script-text-${task.id}`} className="sr-only">
          Texto de la tarea {task.task_index}
        </label>
        <textarea
          id={`script-text-${task.id}`}
          className="w-full p-2.5 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium min-h-[80px]"
          value={task.script_task_text || ''}
          onChange={(e) => handleTaskChange(task.id!, { script_task_text: e.target.value })}
          onBlur={(e) =>
            handleActionWithStatus(() =>
              onSaveTask(task.id!, { script_task_text: e.target.value })
            )
          }
          placeholder="Ej. Imagina que quieres..."
          rows={3}
        />
      </td>

      <td className="p-2">
        <label htmlFor={`script-followup-${task.id}`} className="sr-only">
          Pregunta de seguimiento {task.task_index}
        </label>
        <textarea
          id={`script-followup-${task.id}`}
          className="w-full p-2.5 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium min-h-[80px]"
          value={task.script_follow_up || ''}
          onChange={(e) => handleTaskChange(task.id!, { script_follow_up: e.target.value })}
          onBlur={(e) =>
            handleActionWithStatus(() =>
              onSaveTask(task.id!, { script_follow_up: e.target.value })
            )
          }
          placeholder="Ej. ¿Qué esperabas...?"
          rows={3}
        />
      </td>

      <td className="p-2">
        <label htmlFor={`script-success-${task.id}`} className="sr-only">
          Éxito esperado {task.task_index}
        </label>
        <textarea
          id={`script-success-${task.id}`}
          className="w-full p-2.5 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium min-h-[80px]"
          value={task.script_expected_success || ''}
          onChange={(e) => handleTaskChange(task.id!, { script_expected_success: e.target.value })}
          onBlur={(e) =>
            handleActionWithStatus(() =>
              onSaveTask(task.id!, { script_expected_success: e.target.value })
            )
          }
          placeholder="Ej. Encuentra la nota..."
          rows={3}
        />
      </td>

      <td className="p-3 text-center">
        {confirmDelete ? (
          <div className="flex flex-col gap-1 items-center animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => { onDeleteTask(task.id!); setConfirmDelete(false); }}
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
          <button
            type="button"
            className="bg-transparent border-none text-slate-300 p-2 cursor-pointer transition-all hover:bg-red-50 hover:text-red-500 rounded-lg"
            onClick={() => setConfirmDelete(true)}
            aria-label={`Eliminar tarea ${task.task_index}`}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        )}
      </td>
    </tr>
  );
};

export const ScriptView: React.FC<ScriptViewProps> = ({
  testPlan,
  tasks,
  onSaveTask,
  onAddTask,
  onDeleteTask,
  onUpdatePlan,
  onSyncPlan,
  onSyncTasks,
  onGoToPlan,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const isProductEmpty = !testPlan.product || testPlan.product.trim() === '';

  const handleActionWithStatus = (action: () => void) => {
    setIsSaving(true);
    action();
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleTaskChange = (id: string, updates: Partial<TestTask>) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    onSyncTasks(updatedTasks);
  };

  const openingSteps = [
    'Agradece la participación.',
    'Explica que se evalúa la interfaz, no a la persona.',
    'Pide que piense en voz alta.',
    'Lee una tarea a la vez.',
    'Evita ayudar salvo bloqueo total.',
  ];

  const handleUpdateClosingAnswer = (index: number, answer: string) => {
    const newQuestions = [...(testPlan.closing_questions || [])];
    newQuestions[index] = { ...newQuestions[index], answer };
    const updatedPlan = { ...testPlan, closing_questions: newQuestions };
    onSyncPlan(updatedPlan);
  };

  const handleSaveClosingAnswer = (index: number, answer: string) => {
    const newQuestions = [...(testPlan.closing_questions || [])];
    newQuestions[index] = { ...newQuestions[index], answer };
    handleActionWithStatus(() =>
      onUpdatePlan({ ...testPlan, closing_questions: newQuestions })
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* ── Encabezado ── */}
      <header className="relative flex items-center justify-center bg-navy text-white p-4 md:px-6 rounded-xl mb-8 shadow-md min-h-[70px]">
        <h2 className="text-xl md:text-2xl font-bold m-0 text-center px-12">Guion de moderación y tareas</h2>
        <div
          aria-live="polite"
          aria-atomic="true"
          className="absolute right-4 md:right-6 flex items-center gap-2 text-sm font-bold opacity-90 text-right"
        >
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
        {/* ── Estado vacío ── */}
        {isProductEmpty ? (
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="script-empty-heading">
            <div className="text-center p-12 md:p-16 flex flex-col items-center">
              <div
                aria-hidden="true"
                className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner"
              >
                <ClipboardList size={40} className="text-amber-600" />
              </div>
              <h3 id="script-empty-heading" className="text-xl font-black text-slate-900 mb-2">
                ¡Falta el nombre del producto!
              </h3>
              <p className="text-slate-500 font-medium max-w-[400px] mb-8 leading-relaxed">
                Para redactar el guion y las tareas, primero debes asignar un nombre al
                producto en la pestaña de Plan.
              </p>
              <button
                type="button"
                onClick={onGoToPlan}
                className="inline-flex items-center gap-2 bg-navy text-white border-none rounded-xl px-8 py-3.5 text-base font-black cursor-pointer transition-all hover:bg-navy-dark shadow-lg shadow-navy/20 active:scale-[0.98]"
              >
                Ir a definir Producto
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* ── 0. Contexto de la sesión ── */}
            {(testPlan.method || testPlan.duration || testPlan.location_channel) && (
              <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="script-contexto-heading">
                <h3 className="bg-navy-light text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0" id="script-contexto-heading">
                  Contexto de la sesión
                </h3>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testPlan.method && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[0.7rem] font-black text-slate-500 uppercase tracking-widest">Método</label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                          {testPlan.method}
                        </div>
                      </div>
                    )}
                    {testPlan.duration && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[0.7rem] font-black text-slate-500 uppercase tracking-widest">Duración estimada</label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                          {testPlan.duration}
                        </div>
                      </div>
                    )}
                    {testPlan.location_channel && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[0.7rem] font-black text-slate-500 uppercase tracking-widest">Lugar / Canal</label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                          {testPlan.location_channel}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ── 1. Inicio de la sesión ── */}
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="script-inicio-heading">
              <h3 className="bg-navy-light text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0" id="script-inicio-heading">
                Inicio de la sesión
              </h3>
              <div className="p-6">
                <ol className="p-0 m-0 list-none space-y-3">
                  {openingSteps.map((step, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border-l-[6px] border-navy transition-all hover:bg-slate-100 shadow-sm"
                    >
                      <span
                        aria-hidden="true"
                        className="text-lg font-black text-navy min-w-[24px]"
                      >
                        {index + 1}.
                      </span>
                      <span className="text-base text-slate-800 font-semibold leading-snug">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* ── 2. Tareas a leer durante el test ── */}
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="script-tareas-heading">
              <h3 className="bg-navy-light text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0" id="script-tareas-heading">
                Tareas a leer durante el test
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <caption className="sr-only">Tareas a leer durante el test de usabilidad</caption>
                  <thead>
                    <tr className="bg-navy text-white text-[0.75rem] font-black uppercase tracking-[0.1em]">
                      <th scope="col" className="p-4 text-center border-r border-white/10 w-[60px]">ID</th>
                      <th scope="col" className="p-4 text-left border-r border-white/10 w-[35%]">Texto de la tarea</th>
                      <th scope="col" className="p-4 text-left border-r border-white/10 w-[30%]">Pregunta de seguimiento</th>
                      <th scope="col" className="p-4 text-left border-r border-white/10">Éxito esperado</th>
                      <th scope="col" className="p-4 text-center w-[70px]">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.length > 0 ? (
                      tasks.map((task) => (
                        <ScriptTaskRow
                          key={task.id}
                          task={task}
                          handleTaskChange={handleTaskChange}
                          handleActionWithStatus={handleActionWithStatus}
                          onSaveTask={onSaveTask}
                          onDeleteTask={onDeleteTask}
                        />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-12 text-center text-slate-500 italic font-medium"
                        >
                          No hay tareas en el guion. Haz clic en el botón de abajo para empezar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 px-6 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 bg-navy text-white border-none px-6 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider cursor-pointer transition-all hover:bg-navy-dark disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-navy/10"
                  onClick={onAddTask}
                  disabled={!testPlan.id}
                  aria-label="Añadir tarea al guion"
                >
                  <Plus size={18} aria-hidden="true" />
                  Añadir Tarea al Guion
                </button>
              </div>
            </section>

            {/* ── 3. Cierre ── */}
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="script-cierre-heading">
              <h3 className="bg-navy-light text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0" id="script-cierre-heading">
                Cierre
              </h3>
              <div className="p-6">
                <div className="flex flex-col gap-8">
                  {(testPlan.closing_questions || []).map((q: ClosingQuestion, index: number) => (
                    <div key={index} className="flex flex-col gap-3">
                      <label
                        htmlFor={`closing-q-${index}`}
                        className="text-amber-900 text-base font-black tracking-tight"
                      >
                        {index + 1}. {q.question}
                      </label>
                      <textarea
                        id={`closing-q-${index}`}
                        className="w-full p-4 border border-amber-200 rounded-xl text-base transition-all focus:outline-none focus:ring-4 focus:ring-amber-50 bg-amber-50/50 focus:bg-white text-slate-900 font-medium min-h-[100px]"
                        value={q.answer}
                        onChange={(e) => handleUpdateClosingAnswer(index, e.target.value)}
                        onBlur={(e) => handleSaveClosingAnswer(index, e.target.value)}
                        placeholder="Escribe la respuesta..."
                        rows={3}
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
