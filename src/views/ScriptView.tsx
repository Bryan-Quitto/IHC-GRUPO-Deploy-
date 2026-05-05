import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, RefreshCcw, ClipboardList, Check, X, Search } from 'lucide-react';
import { TestPlan, TestTask, ClosingQuestion } from '../models/types';
import AutoGrowTextarea from '../components/AutoGrowTextarea';
import { FieldWarning } from '../components/FieldWarning';
import { CharCounter } from '../components/CharCounter';
import { fieldClass } from '../components/validation';
import { MAX_CHARS, clamp } from '../components/validation';

interface ScriptViewProps {
  testPlan: TestPlan;
  tasks: TestTask[];
  planTasks: TestTask[];
  onUpdatePlan: (updates: TestPlan) => void;
  onSyncPlan: (updates: TestPlan) => void;
  onSyncTasks: (tasks: TestTask[]) => void;
  onSaveTask: (id: string, updates: Partial<TestTask>) => void;
  onAddTask: () => void;
  onDeleteTask: (id: string) => void;
  onGoToPlan: () => void;
}

/* ── Combo box con búsqueda dinámica ── */
const TaskComboBox: React.FC<{
  value: string;
  planTasks: TestTask[];
  onChange: (value: string) => void;
  onBlur?: (val?: string) => void;
  placeholder?: string;
  id?: string;
  hasWarning?: boolean;
}> = ({ value, planTasks, onChange, onBlur, placeholder, id, hasWarning }) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = planTasks.filter(t => {
    const text = (t.scenario || '').toLowerCase();
    return query === '' || text.includes(query.toLowerCase());
  });

  const handleSelect = (task: TestTask) => {
    const label = task.scenario || task.task_index;
    setQuery(label);
    onChange(label);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <input
          id={id}
          type="text"
          maxLength={MAX_CHARS}
          className={fieldClass(!!hasWarning, `w-full p-2.5 pr-8 border border-slate-200 rounded-lg text-sm bg-transparent transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium`, 'error')}
          value={query}
          placeholder={placeholder || 'Seleccionar o escribir tarea...'}
          onChange={e => { 
            const val = clamp(e.target.value);
            setQuery(val); 
            onChange(val); 
            setOpen(true); 
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => { 
            // Pequeño delay para permitir que el click en el dropdown ocurra antes del blur
            setTimeout(() => {
              if (!open) onBlur?.(query);
            }, 200);
          }}
        />
        <Search size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
      </div>
      {open && planTasks.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400 italic">Sin resultados</div>
          ) : (
            filtered.map(t => (
              <button
                key={t.id || t.task_index}
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-navy/5 transition-colors border-b border-slate-100 last:border-0 flex items-start gap-2"
                onClick={() => handleSelect(t)}
              >
                <span className="id-badge shrink-0 mt-0.5 text-xs">{t.task_index}</span>
                <span className="leading-snug">{t.scenario || '(sin nombre)'}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const ScriptTaskRow: React.FC<{
  task: TestTask;
  planTasks: TestTask[];
  handleTaskChange: (id: string, updates: Partial<TestTask>) => void;
  handleActionWithStatus: (action: () => void) => void;
  onSaveTask: (id: string, updates: Partial<TestTask>) => void;
  onDeleteTask: (id: string) => void;
}> = ({ task, planTasks, handleTaskChange, handleActionWithStatus, onSaveTask, onDeleteTask }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (f: string) => setTouched(prev => ({ ...prev, [f]: true }));

  const [showWarning, setShowWarning] = useState(false);
  const warnText = touched.script_task_text && (!task.script_task_text || task.script_task_text.trim() === '');

  useEffect(() => {
    if (warnText) {
      const timer = setTimeout(() => setShowWarning(true), 150);
      return () => clearTimeout(timer);
    }
    setShowWarning(false);
  }, [warnText]);

  const handleChange = (field: keyof TestTask, value: string) => {
    handleTaskChange(task.id!, { [field]: clamp(value) });
  };

  return (
    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
      <td className="p-3 text-center">
        <span className="id-badge">{task.task_index}</span>
      </td>

      <td className="p-2">
        <label htmlFor={`script-text-${task.id}`} className="sr-only">Texto de la tarea {task.task_index}</label>
        <TaskComboBox
          id={`script-text-${task.id}`}
          value={task.script_task_text || ''}
          planTasks={planTasks}
          hasWarning={showWarning}
          placeholder="Ej. Imagina que quieres..."
          onChange={(val) => { touch('script_task_text'); handleChange('script_task_text', val); }}
          onBlur={(val) => { 
            touch('script_task_text'); 
            onSaveTask(task.id!, { script_task_text: val ?? task.script_task_text }); 
          }}
        />
        <CharCounter value={task.script_task_text} />
        <FieldWarning show={showWarning} message="El texto de la tarea no puede estar vacío." variant="error" />
      </td>

      <td className="p-2">
        <label htmlFor={`script-followup-${task.id}`} className="sr-only">Pregunta de seguimiento {task.task_index}</label>
        <AutoGrowTextarea
          id={`script-followup-${task.id}`}
          className="w-full p-2.5 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium min-h-[80px]"
          value={task.script_follow_up || ''}
          onChange={(e) => handleChange('script_follow_up', e.target.value)}
          onBlur={(e) => handleActionWithStatus(() => onSaveTask(task.id!, { script_follow_up: e.target.value }))}
          placeholder="Ej. ¿Qué esperabas...?"
          rows={3}
        />
        <CharCounter value={task.script_follow_up} />
      </td>

      <td className="p-2">
        <label htmlFor={`script-success-${task.id}`} className="sr-only">Éxito esperado {task.task_index}</label>
        <AutoGrowTextarea
          id={`script-success-${task.id}`}
          className="w-full p-2.5 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium min-h-[80px]"
          value={task.script_expected_success || ''}
          onChange={(e) => handleChange('script_expected_success', e.target.value)}
          onBlur={(e) => handleActionWithStatus(() => onSaveTask(task.id!, { script_expected_success: e.target.value }))}
          placeholder="Ej. Encuentra la nota..."
          rows={3}
        />
        <CharCounter value={task.script_expected_success} />
      </td>

      <td className="p-3 text-center">
        {confirmDelete ? (
          <div className="flex flex-col gap-1 items-center animate-in zoom-in-95 duration-200">
            <button type="button" onClick={() => { onDeleteTask(task.id!); setConfirmDelete(false); }} className="bg-red-600 text-white border-none rounded-md w-7 h-7 flex items-center justify-center cursor-pointer transition-all hover:bg-red-700 shadow-sm" aria-label={`Confirmar eliminación de tarea ${task.task_index}`}><Check size={14} strokeWidth={3} aria-hidden="true" /></button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="bg-slate-200 text-slate-600 border-none rounded-md w-7 h-7 flex items-center justify-center cursor-pointer transition-all hover:bg-slate-300 shadow-sm" aria-label="Cancelar eliminación"><X size={14} strokeWidth={3} aria-hidden="true" /></button>
          </div>
        ) : (
          <button type="button" className="bg-transparent border-none text-slate-300 p-2 cursor-pointer transition-all hover:bg-red-50 hover:text-red-500 rounded-lg" onClick={() => setConfirmDelete(true)} aria-label={`Eliminar tarea ${task.task_index}`}>
            <Trash2 size={18} aria-hidden="true" />
          </button>
        )}
      </td>
    </tr>
  );
};

export const ScriptView: React.FC<ScriptViewProps> = ({
  testPlan, tasks, planTasks, onSaveTask, onAddTask, onDeleteTask, onUpdatePlan, onSyncPlan, onSyncTasks, onGoToPlan,
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
    newQuestions[index] = { ...newQuestions[index], answer: clamp(answer) };
    const updatedPlan = { ...testPlan, closing_questions: newQuestions };
    onSyncPlan(updatedPlan);
  };

  const handleSaveClosingAnswer = (index: number, answer: string) => {
    const newQuestions = [...(testPlan.closing_questions || [])];
    newQuestions[index] = { ...newQuestions[index], answer: clamp(answer) };
    handleActionWithStatus(() => onUpdatePlan({ ...testPlan, closing_questions: newQuestions }));
  };

  return (
    <main className="animate-in fade-in duration-500">

      {/* Header de vista — mismo patrón que PlanView para consistencia de sistema */}
      <header className="flex items-center justify-between bg-navy text-white p-4 md:px-6 rounded-xl mb-8 shadow-md min-h-[70px] gap-4">
        <div className="flex-1" />
        <h2 className="text-lg md:text-xl font-black m-0 text-center flex-1 text-white">
          Guion de moderación y tareas
        </h2>
        {/* [Fase 3 — Contraste] aria-live para lectores de pantalla.
            El indicador de guardado usa emerald-400 sobre navy: ratio 3.2:1 para
            texto grande (≥18px bold) → cumple WCAG AA criterio 1.4.3. */}
        <div aria-live="polite" aria-atomic="true" className="flex-1 flex justify-end items-center gap-2 text-sm font-bold opacity-90 text-right">
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-white animate-pulse">
              <RefreshCcw size={16} className="animate-spin" aria-hidden="true" />
              <span>Guardando...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle size={16} aria-hidden="true" />
              <span>Cambios guardados</span>
            </span>
          )}
        </div>
      </header>

      {/*
        [Fase 4 — Espacio] space-y-8 entre secciones = 32px.
        Igual que PlanView para ritmo espacial consistente en todo el sistema.
      */}
      <div className="space-y-8">
        {isProductEmpty ? (
          <section className="section-block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="text-center p-12 md:p-16 flex flex-col items-center">
              <div aria-hidden="true" className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <ClipboardList size={40} className="text-amber-600" />
              </div>
              {/* [Fase 1 — Tamaño] h3 text-xl → segundo nivel de tamaño en esta pantalla */}
              <h3 className="text-xl font-black text-slate-900 mb-2">¡Falta el nombre del producto!</h3>
              {/* [Fase 3 — Contraste] text-slate-500 para texto secundario explicativo:
                  deliberadamente menor contraste que el h3, reforzando jerarquía. */}
              <p className="text-slate-500 font-medium max-w-[400px] mb-8 leading-relaxed">
                Para redactar el guion y las tareas, primero debes asignar un nombre al producto en la pestaña de Plan.
              </p>
              <button type="button" onClick={onGoToPlan}
                className="inline-flex items-center gap-2 bg-navy text-white border-none rounded-xl px-8 py-3.5 text-base font-black cursor-pointer transition-all hover:bg-navy-dark shadow-lg shadow-navy/20 active:scale-[0.98]"
                aria-label="Volver al plan para definir el producto">
                Ir a definir Producto
              </button>
            </div>
          </section>
        ) : (
          <>
            {(testPlan.method || testPlan.duration || testPlan.location_channel) && (
              <section className="section-block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <h2 className="bg-hierarchy-l1 text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0">
                  Contexto de la sesión
                </h2>
                {/* [Fase 4 — Espacio] p-6 consistente + gap-6 en grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testPlan.method && (
                      <div className="field-group">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-1">Método</span>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">{testPlan.method}</div>
                      </div>
                    )}
                    {testPlan.duration && (
                      <div className="field-group">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-1">Duración estimada</span>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">{testPlan.duration}</div>
                      </div>
                    )}
                    {testPlan.location_channel && (
                      <div className="field-group">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-1">Lugar / Canal</span>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">{testPlan.location_channel}</div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="section-block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <h2 className="bg-hierarchy-l1 text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0">
                Inicio de la sesión
              </h2>
              {/*
                [Fase 4 — Espacio] space-y-3 entre pasos de apertura (12px).
                Cada paso tiene p-3.5 (14px) interno.
                Ratio espacio-entre / espacio-interno = 12/28 < 1: los pasos se perciben
                como LISTA CONTINUA (mismo grupo), no como items independientes.
                Esto es intencional: son instrucciones secuenciales, no secciones.
                El border-l-[6px] actúa como conector visual entre items.
              */}
              <div className="p-6">
                <ol className="p-0 m-0 list-none space-y-3" aria-label="Pasos de apertura de la sesión">
                  {openingSteps.map((step, index) => (
                    <li key={index} className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border-l-[6px] border-navy transition-all hover:bg-slate-100 shadow-sm">
                      {/* [Fase 1 — Tamaño] Número en text-lg font-black = elemento de mayor
                          tamaño dentro del item → jerarquía interna: número > texto */}
                      <span aria-hidden="true" className="text-lg font-black text-navy min-w-[24px]">{index + 1}.</span>
                      <span className="text-base text-slate-800 font-semibold leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* ── Tareas ── */}
            <section className="section-block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <h2 className="bg-hierarchy-l1 text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0">
                Tareas a leer durante el test
                {planTasks.length > 0 && (
                  <span className="ml-2 text-emerald-300 text-xs font-bold normal-case">
                    · {planTasks.length} tarea{planTasks.length !== 1 ? 's' : ''} del plan disponible{planTasks.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <caption className="sr-only">Tareas a leer durante el test de usabilidad</caption>
                  <thead>
                    <tr className="bg-navy text-white text-xs font-black uppercase tracking-[0.1em]">
                      <th scope="col" className="p-4 text-center border-r border-white/10 w-[60px]">ID</th>
                      <th scope="col" className="p-4 text-left border-r border-white/10 w-[35%]">
                        Texto de la tarea
                        {planTasks.length > 0 && (
                          <span className="block text-emerald-300 text-xs font-medium normal-case mt-0.5">
                            Selecciona del plan o escribe
                          </span>
                        )}
                      </th>
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
                          planTasks={planTasks}
                          handleTaskChange={handleTaskChange}
                          handleActionWithStatus={handleActionWithStatus}
                          onSaveTask={onSaveTask}
                          onDeleteTask={onDeleteTask}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-500 italic font-medium">
                          No hay tareas en el guion. Haz clic en el botón de abajo para empezar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* [Fase 4 — Espacio] bg-slate-50 + border-t = divisor espacial por cambio de fondo */}
              <div className="p-4 px-6 bg-slate-50 border-t border-slate-200">
                <button type="button"
                  className="inline-flex items-center gap-2 bg-navy text-white border-none px-6 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider cursor-pointer transition-all hover:bg-navy-dark disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-navy/10"
                  onClick={onAddTask} disabled={!testPlan.id}
                  aria-label="Añadir tarea al guion">
                  <Plus size={18} aria-hidden="true" />
                  Añadir Tarea al Guion
                </button>
              </div>
            </section>

            {/* ── Cierre ── */}
            <section className="section-block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <h2 className="bg-hierarchy-l1 text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0">Cierre</h2>
              {/*
                [Fase 4 — Espacio] Las preguntas de cierre tienen space-y-8 (32px) entre ellas.
                Cada pregunta tiene un label + textarea + counter: internamente usan gap-3 (12px).
                Ratio entre-preguntas / interno = 32/12 ≈ 2.7× — supera el mínimo 2×
                de NNGroup, comunicando claramente que cada bloque es una pregunta distinta.
              */}
              <div className="p-6">
                <div className="flex flex-col gap-8">
                  {(testPlan.closing_questions || []).map((q: ClosingQuestion, index: number) => (
                    <div key={index} className="flex flex-col gap-3">
                      {/*
                        [Fase 3 — Contraste] text-amber-900 sobre blanco = ratio 7.5:1 ✓ WCAG AA.
                        El color ámbar diferencia estas preguntas del resto de labels (navy/slate),
                        señalando visualmente que son de "cierre/reflexión" vs. "planificación".
                        Es una aplicación del color como codificación semántica (Color Coding Theory).
                      */}
                      <label htmlFor={`closing-q-${index}`} className="text-amber-900 text-base font-black tracking-tight">
                        {index + 1}. {q.question}
                      </label>
                      <AutoGrowTextarea
                        id={`closing-q-${index}`}
                        className="w-full p-4 border border-amber-200 rounded-xl text-base transition-all focus:outline-none focus:ring-4 focus:ring-amber-50 bg-amber-50/50 focus:bg-white text-slate-900 font-medium min-h-[100px]"
                        value={q.answer}
                        onChange={(e) => handleUpdateClosingAnswer(index, e.target.value)}
                        onBlur={(e) => handleSaveClosingAnswer(index, e.target.value)}
                        placeholder="Escribe la respuesta..."
                        rows={3}
                      />
                      <CharCounter value={q.answer} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};