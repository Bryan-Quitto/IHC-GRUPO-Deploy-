import React, { useState, useEffect } from 'react';
import { TestPlan, TestTask } from '../models/types';
import { Plus, Trash2, CheckCircle, RefreshCcw, Check, X } from 'lucide-react';

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

interface PlanViewProps {
  data: TestPlan;
  tasks: TestTask[];
  onUpdate: (updates: TestPlan) => void;
  onSyncPlan: (updates: TestPlan) => void;
  onSyncTasks: (tasks: TestTask[]) => void;
  onAddTask: () => void;
  onSaveTask: (id: string, updates: Partial<TestTask>) => void;
  onDeleteTask: (id: string) => void;
}

/* ── Tarjeta de tarea para móvil ── */
const TaskCard: React.FC<{
  task: TestTask;
  handleTaskChange: (id: string, updates: Partial<TestTask>) => void;
  onSaveTask: (id: string, updates: Partial<TestTask>) => void;
  onDeleteTask: (id: string) => void;
}> = ({ task, handleTaskChange, onSaveTask, onDeleteTask }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <article
      className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
      aria-label={`Tarea ${task.task_index}`}
    >
      <div className="bg-navy px-4 py-2 flex justify-between items-center text-white">
        <span className="font-bold text-sm">Tarea {task.task_index}</span>
        {confirmDelete ? (
          <div className="flex gap-2 items-center animate-in zoom-in-95 duration-200">
            <span className="text-[0.65rem] text-red-300 font-black uppercase tracking-widest">¿Eliminar?</span>
            <button
              type="button"
              onClick={() => { onDeleteTask(task.id!); setConfirmDelete(false); }}
              className="inline-flex items-center justify-center w-7 h-7 bg-red-600 text-white border-none rounded-md cursor-pointer transition-all hover:bg-red-700"
              title="Confirmar"
            >
              <Check size={14} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="inline-flex items-center justify-center w-7 h-7 bg-white/10 text-white border-none rounded-md cursor-pointer transition-all hover:bg-white/20"
              title="Cancelar"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button type="button" className="bg-transparent border-none text-red-300 p-1 cursor-pointer transition-colors hover:text-red-500" onClick={() => setConfirmDelete(true)} aria-label={`Eliminar ${task.task_index}`}>
            <Trash2 size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`m-scenario-${task.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Escenario / tarea</label>
          <input id={`m-scenario-${task.id}`} type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all" value={task.scenario || ''} onChange={e => handleTaskChange(task.id!, { scenario: e.target.value })} onBlur={e => onSaveTask(task.id!, { scenario: e.target.value })} placeholder="Ej. Imagina que quieres comprar..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`m-expected-${task.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Resultado esperado</label>
          <input id={`m-expected-${task.id}`} type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all" value={task.expected_result || ''} onChange={e => handleTaskChange(task.id!, { expected_result: e.target.value })} onBlur={e => onSaveTask(task.id!, { expected_result: e.target.value })} placeholder="Ej. El usuario llega a la confirmación." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`m-metric-${task.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Métrica</label>
            <input id={`m-metric-${task.id}`} type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all" value={task.main_metric || ''} onChange={e => handleTaskChange(task.id!, { main_metric: e.target.value })} onBlur={e => onSaveTask(task.id!, { main_metric: e.target.value })} placeholder="Tiempo..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`m-criteria-${task.id}`} className="font-black text-[0.7rem] text-slate-500 uppercase tracking-widest">Criterio</label>
            <input id={`m-criteria-${task.id}`} type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all" value={task.success_criteria || ''} onChange={e => handleTaskChange(task.id!, { success_criteria: e.target.value })} onBlur={e => onSaveTask(task.id!, { success_criteria: e.target.value })} placeholder="Sin errores..." />
          </div>
        </div>
      </div>
    </article>
  );
};

/* ── Fila de tarea para desktop ── */
const TaskRow: React.FC<{
  task: TestTask;
  handleTaskChange: (id: string, updates: Partial<TestTask>) => void;
  onSaveTask: (id: string, updates: Partial<TestTask>) => void;
  onDeleteTask: (id: string) => void;
}> = ({ task, handleTaskChange, onSaveTask, onDeleteTask }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="p-3 text-center"><span className="id-badge">{task.task_index}</span></td>
      <td className="p-2">
        <input 
          type="text" 
          className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium" 
          aria-label={`Escenario para ${task.task_index}`} 
          value={task.scenario || ''} 
          onChange={e => handleTaskChange(task.id!, { scenario: e.target.value })} 
          onBlur={e => onSaveTask(task.id!, { scenario: e.target.value })} 
          placeholder="Ej. Imagina que quieres comprar..." 
        />
      </td>
      <td className="p-2">
        <input 
          type="text" 
          className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium" 
          aria-label={`Resultado esperado para ${task.task_index}`} 
          value={task.expected_result || ''} 
          onChange={e => handleTaskChange(task.id!, { expected_result: e.target.value })} 
          onBlur={e => onSaveTask(task.id!, { expected_result: e.target.value })} 
          placeholder="Ej. El usuario llega a la confirmación." 
        />
      </td>
      <td className="p-2">
        <input 
          type="text" 
          className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium" 
          aria-label={`Métrica para ${task.task_index}`} 
          value={task.main_metric || ''} 
          onChange={e => handleTaskChange(task.id!, { main_metric: e.target.value })} 
          onBlur={e => onSaveTask(task.id!, { main_metric: e.target.value })} 
          placeholder="Ej. Tiempo, Tasa de éxito..." 
        />
      </td>
      <td className="p-2">
        <input 
          type="text" 
          className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium" 
          aria-label={`Criterio de éxito para ${task.task_index}`} 
          value={task.success_criteria || ''} 
          onChange={e => handleTaskChange(task.id!, { success_criteria: e.target.value })} 
          onBlur={e => onSaveTask(task.id!, { success_criteria: e.target.value })} 
          placeholder="Ej. Sin errores críticos..." 
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
          <button className="bg-transparent border-none text-slate-300 p-2 cursor-pointer transition-all hover:bg-red-50 hover:text-red-500 rounded-lg" onClick={() => setConfirmDelete(true)} type="button" aria-label={`Eliminar ${task.task_index}`}>
            <Trash2 size={18} aria-hidden="true" />
          </button>
        )}
      </td>
    </tr>
  );
};

export const PlanView: React.FC<PlanViewProps> = ({
  data, tasks, onUpdate, onSyncPlan, onSyncTasks, onAddTask, onSaveTask, onDeleteTask
}) => {
  const [localPlan, setLocalPlan] = useState<TestPlan>(data);
  const [isSaving, setIsSaving] = useState(false);
  const width = useWindowWidth();
  const isMobile = width < 1024;

  useEffect(() => {
    setLocalPlan(data);
  }, [data]);

  const handleAutoSave = (fieldUpdates: Partial<TestPlan>) => {
    setIsSaving(true);
    const updatedPlan = { ...localPlan, ...fieldUpdates };
    onUpdate(updatedPlan);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleChange = (updates: Partial<TestPlan>) => {
    const updated = { ...localPlan, ...updates };
    setLocalPlan(updated);
    onSyncPlan(updated);
  };

  const handleTaskChange = (id: string, updates: Partial<TestTask>) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    onSyncTasks(updatedTasks);
  };

  const isProductEmpty = !localPlan.product || localPlan.product.trim() === '';

  return (
    <div id="plan-panel" className="animate-in fade-in duration-500">
      <header className="relative flex items-center justify-center bg-navy text-white p-4 md:px-6 rounded-xl mb-8 shadow-md min-h-[70px]">
        <h2 className="text-xl md:text-2xl font-bold m-0 text-center px-12">Plan de Pruebas de Usabilidad</h2>
        <div className="absolute right-4 md:right-6 flex items-center gap-2 text-sm font-bold opacity-90 text-right">
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-white animate-pulse">
              <RefreshCcw size={14} className="animate-spin" /> Guardando...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle size={14} /> Cambios guardados
            </span>
          )}
        </div>
      </header>

      <div className="space-y-8">
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <h3 className="bg-navy-light text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0">1. Contexto general</h3>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="product-name" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Producto / servicio:
                  {isProductEmpty && <span className="text-amber-600 text-[0.75rem] font-black uppercase">(Obligatorio)</span>}
                </label>
                <input
                  id="product-name"
                  type="text"
                  className={`w-full p-3 border rounded-lg text-base transition-all focus:outline-none focus:ring-4 focus:ring-navy/5 ${
                    isProductEmpty ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white focus:border-navy'
                  }`}
                  value={localPlan.product}
                  placeholder="Ej: App de Delivery 'Rápido', E-commerce, etc."
                  onChange={(e) => handleChange({ product: e.target.value })}
                  onBlur={(e) => handleAutoSave({ product: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="module-name" className="text-sm font-bold text-slate-700">Pantalla / módulo:</label>
                <input
                  id="module-name"
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white"
                  value={localPlan.module}
                  placeholder="Ej: Proceso de checkout, Registro de usuario, etc."
                  onChange={(e) => handleChange({ module: e.target.value })}
                  onBlur={(e) => handleAutoSave({ module: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="test-objective" className="text-sm font-bold text-slate-700">Objetivo del test:</label>
              <textarea
                id="test-objective"
                className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white"
                value={localPlan.objective}
                placeholder="Ej: Evaluar la facilidad de navegación y el tiempo de completado del flujo de compra."
                onChange={(e) => handleChange({ objective: e.target.value })}
                onBlur={(e) => handleAutoSave({ objective: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="user-profile" className="text-sm font-bold text-slate-700">Perfil de usuarios:</label>
              <input
                id="user-profile"
                type="text"
                className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white"
                value={localPlan.user_profile}
                placeholder="Ej: Usuarios de 25-40 años, con experiencia en compras online."
                onChange={(e) => handleChange({ user_profile: e.target.value })}
                onBlur={(e) => handleAutoSave({ user_profile: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="test-method" className="text-sm font-bold text-slate-700">Método:</label>
                <input
                  id="test-method"
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white"
                  value={localPlan.method}
                  placeholder="Ej: Moderado, remoto, presencial..."
                  onChange={(e) => handleChange({ method: e.target.value })}
                  onBlur={(e) => handleAutoSave({ method: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="test-duration" className="text-sm font-bold text-slate-700">Duración:</label>
                <input
                  id="test-duration"
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white"
                  value={localPlan.duration}
                  placeholder="Ej: 45 min por sesión."
                  onChange={(e) => handleChange({ duration: e.target.value })}
                  onBlur={(e) => handleAutoSave({ duration: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="test-date" className="text-sm font-bold text-slate-700">Fecha del test:</label>
                <input
                  id="test-date"
                  type="date"
                  className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white"
                  value={localPlan.test_date || ''}
                  onChange={(e) => handleChange({ test_date: e.target.value })}
                  onBlur={(e) => handleAutoSave({ test_date: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="location-channel" className="text-sm font-bold text-slate-700">Lugar / canal:</label>
                <input
                  id="location-channel"
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white"
                  value={localPlan.location_channel}
                  placeholder="Ej: Google Meet, Oficina 302..."
                  onChange={(e) => handleChange({ location_channel: e.target.value })}
                  onBlur={(e) => handleAutoSave({ location_channel: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <h3 className="bg-navy-light text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0">2. Tareas del test</h3>

          {/* ── MÓVIL: tarjetas ── */}
          {isMobile && (
            <div className="p-4 flex flex-col gap-4">
              {tasks.length === 0 ? (
                <p className="text-center text-slate-500 py-8 italic font-medium">
                  No hay tareas añadidas. Haz clic en el botón de abajo para empezar.
                </p>
              ) : (
                tasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    handleTaskChange={handleTaskChange} 
                    onSaveTask={onSaveTask} 
                    onDeleteTask={onDeleteTask} 
                  />
                ))
              )}
              <button type="button" className="inline-flex items-center justify-center gap-2 bg-green-600 text-white border-none p-3.5 rounded-xl font-black text-sm uppercase tracking-widest cursor-pointer transition-all hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-green-100 mt-2" onClick={onAddTask} disabled={!localPlan.id || isProductEmpty}>
                <Plus size={18} aria-hidden="true" /> Añadir Tarea
              </button>
              {isProductEmpty && <span className="text-[0.8rem] text-slate-500 italic text-center mt-1">* Debes definir un nombre de producto para añadir tareas.</span>}
            </div>
          )}

          {/* ── DESKTOP: tabla ── */}
          {!isMobile && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <caption className="sr-only">Listado de tareas detalladas para la prueba de usabilidad</caption>
                  <thead>
                    <tr className="bg-navy text-white text-[0.75rem] font-black uppercase tracking-[0.1em]">
                      <th scope="col" className="p-4 text-center border-r border-white/10 w-[60px]">ID</th>
                      <th scope="col" className="p-4 text-left border-r border-white/10">Escenario / tarea</th>
                      <th scope="col" className="p-4 text-left border-r border-white/10">Resultado esperado</th>
                      <th scope="col" className="p-4 text-left border-r border-white/10">Métrica principal</th>
                      <th scope="col" className="p-4 text-left border-r border-white/10">Criterio de éxito</th>
                      <th scope="col" className="p-4 text-center w-[80px]">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.length > 0 ? (
                      tasks.map((task) => (
                        <TaskRow 
                          key={task.id} 
                          task={task} 
                          handleTaskChange={handleTaskChange} 
                          onSaveTask={onSaveTask} 
                          onDeleteTask={onDeleteTask} 
                        />
                      ))
                    ) : (
                      <tr><td colSpan={6} className="p-12 text-center text-slate-500 italic font-medium">No hay tareas añadidas. Haz clic en el botón de abajo para empezar.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center gap-4">
                <button type="button" className="inline-flex items-center gap-2 bg-green-600 text-white border-none px-6 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider cursor-pointer transition-all hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-green-100" onClick={onAddTask} disabled={!localPlan.id || isProductEmpty}>
                  <Plus size={18} aria-hidden="true" /> Añadir Tarea
                </button>
                {isProductEmpty && <span className="text-[0.85rem] text-slate-500 font-bold italic">* Debes definir un nombre de producto para añadir tareas.</span>}
              </div>
            </>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <h3 className="bg-navy-light text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0">3. Roles y logística</h3>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="moderator-name" className="text-sm font-bold text-slate-700">Moderador:</label>
                <input id="moderator-name" type="text" className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white" value={localPlan.moderator} placeholder="Nombre del facilitador" onChange={(e) => handleChange({ moderator: e.target.value })} onBlur={(e) => handleAutoSave({ moderator: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="observer-name" className="text-sm font-bold text-slate-700">Observador:</label>
                <input id="observer-name" type="text" className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white" value={localPlan.observer} placeholder="Nombre del que toma notas" onChange={(e) => handleChange({ observer: e.target.value })} onBlur={(e) => handleAutoSave({ observer: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="tools-used" className="text-sm font-bold text-slate-700">Herramientas:</label>
                <input id="tools-used" type="text" className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white" value={localPlan.tools} placeholder="Ej: Figma, Zoom, Maze..." onChange={(e) => handleChange({ tools: e.target.value })} onBlur={(e) => handleAutoSave({ tools: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="project-link" className="text-sm font-bold text-slate-700">Enlace:</label>
                <input id="project-link" type="text" className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white" value={localPlan.link} placeholder="https://figma.com/proto/..." onChange={(e) => handleChange({ link: e.target.value })} onBlur={(e) => handleAutoSave({ link: e.target.value })} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <h3 className="bg-navy-light text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0">4. Notas del moderador</h3>
          <div className="p-6">
            <label htmlFor="moderator-notes" className="sr-only">Notas adicionales del moderador</label>
            <textarea
              id="moderator-notes"
              className="w-full p-4 border border-slate-200 rounded-xl text-base transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-slate-50 focus:bg-white min-h-[120px]"
              value={localPlan.moderator_notes}
              onChange={(e) => handleChange({ moderator_notes: e.target.value })}
              onBlur={(e) => handleAutoSave({ moderator_notes: e.target.value })}
              rows={3}
              placeholder="Ej: Recordar pedir al usuario que piense en voz alta..."
            />
          </div>
        </section>
      </div>
    </div>
  );
};