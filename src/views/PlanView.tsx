import React, { useState, useEffect } from 'react';
import { TestPlan, TestTask } from '../models/types';
import { Plus, Trash2, CheckCircle, RefreshCcw, Check, X, Info } from 'lucide-react';
import AutoGrowTextarea from '../components/AutoGrowTextarea';
import { FieldWarning } from '../components/FieldWarning';
import { CharCounter } from '../components/CharCounter';
import { fieldClass } from '../components/validation';
import { MAX_CHARS, clamp, validateDate } from '../components/validation';
import { Tooltip } from '../components/Tooltip';

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
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const touch = (f: string) => setTouchedFields(prev => ({ ...prev, [f]: true }));

  const warnScenario = touchedFields.scenario && (!task.scenario || task.scenario.trim() === '');

  const handleChange = (field: keyof TestTask, value: string) => {
    handleTaskChange(task.id!, { [field]: clamp(value) });
  };

  return (
    <article className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm" aria-label={`Tarea ${task.task_index}`}>
      <div className="bg-navy px-4 py-2 flex justify-between items-center text-white">
        <span className="font-bold text-sm">Tarea {task.task_index}</span>
        {confirmDelete ? (
          <div className="flex gap-2 items-center animate-in zoom-in-95 duration-200">
            <span className="text-sm text-red-300 font-black uppercase tracking-widest">¿Eliminar?</span>
            <button type="button" onClick={() => { onDeleteTask(task.id!); setConfirmDelete(false); }} className="inline-flex items-center justify-center w-7 h-7 bg-red-600 text-white border-none rounded-md cursor-pointer transition-all hover:bg-red-700" aria-label={`Confirmar eliminación de ${task.task_index}`}><Check size={16} strokeWidth={3} aria-hidden="true" /></button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="inline-flex items-center justify-center w-7 h-7 bg-white/10 text-white border-none rounded-md cursor-pointer transition-all hover:bg-white/20" aria-label="Cancelar eliminación"><X size={16} strokeWidth={3} aria-hidden="true" /></button>
          </div>
        ) : (
          <button type="button" className="bg-transparent border-none text-red-300 p-1 cursor-pointer transition-colors hover:text-red-500" onClick={() => setConfirmDelete(true)} aria-label={`Eliminar ${task.task_index || 'tarea'}`}><Trash2 size={16} aria-hidden="true" /></button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="field-group">
          <label htmlFor={`m-scenario-${task.id}`} className="font-black text-sm text-slate-700 uppercase tracking-widest mb-1 block">
            Escenario / tarea <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <input id={`m-scenario-${task.id}`} type="text" maxLength={MAX_CHARS}
            className={fieldClass(warnScenario, "w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all", 'error')}
            value={task.scenario || ''} onChange={e => handleChange('scenario', e.target.value)}
            onBlur={e => { touch('scenario'); onSaveTask(task.id!, { scenario: e.target.value }); }}
            placeholder="Ej. Imagina que quieres comprar..." />
          <CharCounter value={task.scenario} />
          <FieldWarning show={warnScenario} message="El escenario/tarea no puede estar vacío." variant="error" />
        </div>

        <div className="field-group">
          <label htmlFor={`m-expected-${task.id}`} className="font-black text-sm text-slate-700 uppercase tracking-widest mb-1 block">Resultado esperado</label>
          <input id={`m-expected-${task.id}`} type="text" maxLength={MAX_CHARS}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all"
            value={task.expected_result || ''} onChange={e => handleChange('expected_result', e.target.value)}
            onBlur={e => onSaveTask(task.id!, { expected_result: e.target.value })}
            placeholder="Ej. El usuario llega a la confirmación." />
          <CharCounter value={task.expected_result} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="field-group">
            <label htmlFor={`m-metric-${task.id}`} className="font-black text-sm text-slate-700 uppercase tracking-widest mb-1 block">Métrica</label>
            <input id={`m-metric-${task.id}`} type="text" maxLength={MAX_CHARS}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all"
              value={task.main_metric || ''} onChange={e => handleChange('main_metric', e.target.value)}
              onBlur={e => onSaveTask(task.id!, { main_metric: e.target.value })} placeholder="Tiempo..." />
            <CharCounter value={task.main_metric} />
          </div>
          <div className="field-group">
            <label htmlFor={`m-criteria-${task.id}`} className="font-black text-sm text-slate-700 uppercase tracking-widest mb-1 block">Criterio</label>
            <input id={`m-criteria-${task.id}`} type="text" maxLength={MAX_CHARS}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all"
              value={task.success_criteria || ''} onChange={e => handleChange('success_criteria', e.target.value)}
              onBlur={e => onSaveTask(task.id!, { success_criteria: e.target.value })} placeholder="Sin errores..." />
            <CharCounter value={task.success_criteria} />
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
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const touch = (f: string) => setTouchedFields(prev => ({ ...prev, [f]: true }));
  const warnScenario = touchedFields.scenario && (!task.scenario || task.scenario.trim() === '');

  const handleChange = (field: keyof TestTask, value: string) => {
    handleTaskChange(task.id!, { [field]: clamp(value) });
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="p-3 text-center"><span className="id-badge text-sm">{task.task_index}</span></td>
      <td className="p-2">
        <label htmlFor={`scenario-d-${task.id}`} className="sr-only">Escenario para tarea {task.task_index}</label>
        <input id={`scenario-d-${task.id}`} type="text" maxLength={MAX_CHARS}
          className={fieldClass(warnScenario, "w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium", 'error')}
          aria-required="true" value={task.scenario || ''}
          onChange={e => handleChange('scenario', e.target.value)}
          onBlur={e => { touch('scenario'); onSaveTask(task.id!, { scenario: e.target.value }); }}
          placeholder="Ej. Imagina que quieres comprar..." />
        <CharCounter value={task.scenario} />
        <FieldWarning show={warnScenario} message="El escenario no puede estar vacío." variant="error" />
      </td>
      <td className="p-2">
        <label htmlFor={`expected-d-${task.id}`} className="sr-only">Resultado esperado para tarea {task.task_index}</label>
        <input id={`expected-d-${task.id}`} type="text" maxLength={MAX_CHARS}
          className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium"
          value={task.expected_result || ''}
          onChange={e => handleChange('expected_result', e.target.value)}
          onBlur={e => onSaveTask(task.id!, { expected_result: e.target.value })}
          placeholder="Ej. El usuario llega a la confirmación." />
        <CharCounter value={task.expected_result} />
      </td>
      <td className="p-2">
        <label htmlFor={`metric-d-${task.id}`} className="sr-only">Métrica para tarea {task.task_index}</label>
        <input id={`metric-d-${task.id}`} type="text" maxLength={MAX_CHARS}
          className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium"
          value={task.main_metric || ''}
          onChange={e => handleChange('main_metric', e.target.value)}
          onBlur={e => onSaveTask(task.id!, { main_metric: e.target.value })}
          placeholder="Ej. Tiempo, Tasa de éxito..." />
        <CharCounter value={task.main_metric} />
      </td>
      <td className="p-2">
        <label htmlFor={`criteria-d-${task.id}`} className="sr-only">Criterio de éxito para tarea {task.task_index}</label>
        <input id={`criteria-d-${task.id}`} type="text" maxLength={MAX_CHARS}
          className="w-full p-2 border border-transparent bg-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium"
          value={task.success_criteria || ''}
          onChange={e => handleChange('success_criteria', e.target.value)}
          onBlur={e => onSaveTask(task.id!, { success_criteria: e.target.value })}
          placeholder="Ej. Sin errores críticos..." />
        <CharCounter value={task.success_criteria} />
      </td>
      <td className="p-3 text-center">
        {confirmDelete ? (
          <div className="flex flex-col gap-1 items-center animate-in zoom-in-95 duration-200">
            <button type="button" onClick={() => { onDeleteTask(task.id!); setConfirmDelete(false); }} className="bg-red-600 text-white border-none rounded-md w-7 h-7 flex items-center justify-center cursor-pointer transition-all hover:bg-red-700 shadow-sm" aria-label={`Confirmar eliminación de ${task.task_index || 'tarea'}`}><Check size={16} strokeWidth={3} aria-hidden="true" /></button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="bg-slate-200 text-slate-600 border-none rounded-md w-7 h-7 flex items-center justify-center cursor-pointer transition-all hover:bg-slate-300 shadow-sm" aria-label="Cancelar eliminación"><X size={16} strokeWidth={3} aria-hidden="true" /></button>
          </div>
        ) : (
          <button className="bg-transparent border-none text-slate-300 p-2 cursor-pointer transition-all hover:bg-red-50 hover:text-red-500 rounded-lg" onClick={() => setConfirmDelete(true)} type="button" aria-label={`Eliminar ${task.task_index || 'tarea'}`}><Trash2 size={18} aria-hidden="true" /></button>
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

  useEffect(() => { setLocalPlan(data); }, [data]);

  const handleAutoSave = (fieldUpdates: Partial<TestPlan>) => {
    setIsSaving(true);
    const updatedPlan = { ...localPlan, ...fieldUpdates };
    onUpdate(updatedPlan);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleChange = (updates: Partial<TestPlan>) => {
    const clamped: Partial<TestPlan> = {};
    for (const [k, v] of Object.entries(updates)) {
      (clamped as Record<string, unknown>)[k] = typeof v === 'string' ? clamp(v) : v;
    }
    const updated = { ...localPlan, ...clamped };
    setLocalPlan(updated);
    onSyncPlan(updated);
    if ('product' in updates) touch('product');
    if ('objective' in updates) touch('objective');
    if ('moderator' in updates) touch('moderator');
  };

  const handleTaskChange = (id: string, updates: Partial<TestTask>) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    onSyncTasks(updatedTasks);
  };

  const isProductEmpty = !localPlan.product || localPlan.product.trim() === '';
  const isLastTaskEmpty = tasks.length > 0 && (!tasks[tasks.length - 1].scenario || tasks[tasks.length - 1].scenario?.trim() === '');

  const onAddTaskWithValidation = () => {
    if (isLastTaskEmpty) {
      if (tasks.length > 0) {
        const lastTaskId = tasks[tasks.length - 1].id;
        const lastInput = document.getElementById(`scenario-d-${lastTaskId}`) || 
                         document.getElementById(`m-scenario-${lastTaskId}`);
        if (lastInput) {
          (lastInput as HTMLInputElement).focus();
          (lastInput as HTMLInputElement).blur();
        }
      }
      return;
    }
    onAddTask();
  };

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const dateError = touched.test_date ? validateDate(localPlan.test_date) : null;

  const warn = {
    product: touched.product && (!localPlan.product || localPlan.product.trim() === ''),
    objective: touched.objective && (!localPlan.objective || localPlan.objective.trim() === ''),
    user_profile: touched.user_profile && (!localPlan.user_profile || localPlan.user_profile.trim() === ''),
    test_date: !!dateError,
    method: touched.method && (!localPlan.method || localPlan.method.trim() === ''),
    location_channel: touched.location_channel && (!localPlan.location_channel || localPlan.location_channel.trim() === ''),
    moderator: touched.moderator && (!localPlan.moderator || localPlan.moderator.trim() === ''),
    duration: touched.duration && (!localPlan.duration || localPlan.duration.trim() === ''),
  };

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const minDate = twoWeeksAgo.toISOString().split('T')[0];

  return (
    <main id="plan-panel" className="animate-in fade-in duration-500">

      <header className="flex items-center justify-between bg-navy text-white p-4 md:px-6 rounded-xl mb-8 shadow-md min-h-[70px] gap-4">
        <div className="flex-1" />
        <h2 className="text-lg md:text-xl font-black m-0 text-center flex-1 text-white uppercase tracking-widest">
          Planificación del Test
        </h2>
        <div className="flex-1 flex justify-end items-center gap-2 text-sm font-bold opacity-90 text-right" aria-live="polite" aria-atomic="true">
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-white animate-pulse">
              <RefreshCcw size={16} className="animate-spin" aria-hidden="true" /> Guardando...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle size={16} aria-hidden="true" /> Cambios guardados
            </span>
          )}
        </div>
      </header>

      <div className="space-y-8">

        {/* ── 1. CONTEXTO DEL PRODUCTO ── */}
        <section className="section-block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <h2 className="bg-hierarchy-l1 text-white px-5 py-3 text-sm font-bold uppercase tracking-wider m-0 flex items-center justify-between">
            <span className="flex items-center gap-2">
              1. Contexto del Producto
              <Tooltip text="Información básica sobre qué se va a evaluar.">
                <Info size={16} className="text-white/70" />
              </Tooltip>
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-500 ${localPlan.product && localPlan.module && localPlan.objective
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
                }`}
              aria-label="Estado de la sección"
            />
          </h2>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="field-group">
                <label htmlFor="product-name" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-1.5">
                  Nombre del Producto / Servicio:
                  <span className="text-red-600" aria-hidden="true">*</span>
                </label>
                <input id="product-name" type="text" maxLength={MAX_CHARS}
                  className={`w-full p-3 border rounded-lg text-sm transition-all focus:outline-none focus:ring-4 focus:ring-navy/5 ${isProductEmpty && touched.product ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white focus:border-navy'}`}
                  value={localPlan.product} placeholder="Ej: App de Delivery 'Rápido'"
                  onChange={(e) => handleChange({ product: e.target.value })}
                  onBlur={(e) => { touch('product'); handleAutoSave({ product: e.target.value }); }} />
                <CharCounter value={localPlan.product} />
                <FieldWarning show={warn.product} message="El nombre es obligatorio para identificar el plan." variant="error" />
              </div>

              <div className="field-group">
                <label htmlFor="module-name" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-1.5">
                  Módulo o Pantalla Específica:
                  <Tooltip text="Parte específica del sistema que se someterá a prueba.">
                    <Info size={16} className="text-slate-400" />
                  </Tooltip>
                </label>
                <input id="module-name" type="text" maxLength={MAX_CHARS}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white"
                  value={localPlan.module} placeholder="Ej: Proceso de pago (Checkout)"
                  onChange={(e) => handleChange({ module: e.target.value })}
                  onBlur={(e) => handleAutoSave({ module: e.target.value })} />
                <CharCounter value={localPlan.module} />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="test-objective" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-1.5">
                Objetivo de la Evaluación:
                <span className="text-red-600" aria-hidden="true">*</span>
                <Tooltip text="¿Qué quieres descubrir o validar con este test?">
                  <Info size={16} className="text-slate-400" />
                </Tooltip>
              </label>
              <AutoGrowTextarea id="test-objective"
                className={fieldClass(warn.objective, "w-full p-3 border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white", 'error')}
                value={localPlan.objective} placeholder="Ej: Validar si los usuarios pueden completar una compra en menos de 2 minutos sin errores."
                onChange={(e) => handleChange({ objective: e.target.value })}
                onBlur={(e) => { touch('objective'); handleAutoSave({ objective: e.target.value }); }} rows={2} />
              <CharCounter value={localPlan.objective} />
              <FieldWarning show={warn.objective} message="Define qué esperas lograr con esta prueba." variant="error" />
            </div>
          </div>
        </section>

        {/* ── 2. ESTRATEGIA Y PARTICIPANTES ── */}
        <section className="section-block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <h2 className="bg-hierarchy-l1 text-white px-5 py-3 text-sm font-bold uppercase tracking-wider m-0 flex items-center justify-between">
            <span className="flex items-center gap-2">
              2. Estrategia y Participantes
              <Tooltip text="Cómo se ejecutará el test y a quién va dirigido.">
                <Info size={16} className="text-white/70" />
              </Tooltip>
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-500 ${localPlan.user_profile && localPlan.method && localPlan.duration
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
                }`}
              aria-label="Estado de la sección"
            />
          </h2>
          <div className="p-6 space-y-6">
            <div className="field-group">
              <label htmlFor="user-profile" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-1.5">
                Perfil del Usuario (Target):
                <span className="text-red-600" aria-hidden="true">*</span>
                <Tooltip text="Características demográficas y psicográficas de los participantes.">
                  <Info size={16} className="text-slate-400" />
                </Tooltip>
              </label>
              <input id="user-profile" type="text" maxLength={MAX_CHARS}
                className={fieldClass(warn.user_profile, "w-full p-3 border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white", 'error')}
                value={localPlan.user_profile} placeholder="Ej: Estudiantes universitarios, 18-25 años, usan banca móvil."
                onChange={(e) => handleChange({ user_profile: e.target.value })}
                onBlur={(e) => { touch('user_profile'); handleAutoSave({ user_profile: e.target.value }); }} />
              <CharCounter value={localPlan.user_profile} />
              <FieldWarning show={warn.user_profile} message="Describe a quién va dirigida la prueba." variant="error" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="field-group">
                <label htmlFor="test-method" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-1.5">
                  Metodología:
                  <span className="text-red-600" aria-hidden="true">*</span>
                  <Tooltip text="Técnica a usar: Pensamiento en voz alta, Entrevista, Moderado, etc.">
                    <Info size={16} className="text-slate-400" />
                  </Tooltip>
                </label>
                <input id="test-method" type="text" maxLength={MAX_CHARS}
                  className={fieldClass(warn.method, "w-full p-3 border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white", 'error')}
                  value={localPlan.method} placeholder="Ej: Test moderado con Think Aloud"
                  onChange={(e) => handleChange({ method: e.target.value })}
                  onBlur={(e) => { touch('method'); handleAutoSave({ method: e.target.value }); }} />
                <CharCounter value={localPlan.method} />
                <FieldWarning show={warn.method} message="Indica el método de investigación." variant="error" />
              </div>

              <div className="field-group">
                <label htmlFor="test-duration" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-1.5">
                  Duración por Sesión:
                  <span className="text-red-600" aria-hidden="true">*</span>
                </label>
                <input id="test-duration" type="text" maxLength={MAX_CHARS}
                  className={fieldClass(warn.duration, "w-full p-3 border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white", 'error')}
                  value={localPlan.duration} placeholder="Ej: 30 a 45 minutos"
                  onChange={(e) => handleChange({ duration: e.target.value })}
                  onBlur={(e) => { touch('duration'); handleAutoSave({ duration: e.target.value }); }} />
                <CharCounter value={localPlan.duration} />
                <FieldWarning show={warn.duration} message="Establece un tiempo estimado." variant="error" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. CRONOGRAMA Y LOGÍSTICA ── */}
        <section className="section-block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <h2 className="bg-hierarchy-l1 text-white px-5 py-3 text-sm font-bold uppercase tracking-wider m-0 flex items-center justify-between">
            <span className="flex items-center gap-2">
              3. Cronograma y Logística
              <Tooltip text="Cuándo y dónde se realizarán las sesiones.">
                <Info size={16} className="text-white/70" />
              </Tooltip>
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-500 ${localPlan.test_date && localPlan.location_channel && localPlan.moderator
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
                }`}
              aria-label="Estado de la sección"
            />
          </h2>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="field-group">
                <label htmlFor="test-date" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-1.5">
                  Fecha Programada:
                  <span className="text-red-600" aria-hidden="true">*</span>
                </label>
                <input id="test-date" type="date" min={minDate}
                  className={fieldClass(warn.test_date, "w-full p-3 border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white", 'error')}
                  value={localPlan.test_date || ''}
                  onChange={(e) => handleChange({ test_date: e.target.value })}
                  onBlur={(e) => { touch('test_date'); handleAutoSave({ test_date: e.target.value }); }} />
                <FieldWarning show={warn.test_date} message={dateError || 'Selecciona una fecha válida.'} />
              </div>

              <div className="field-group">
                <label htmlFor="location-channel" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-1.5">
                  Lugar o Canal:
                  <span className="text-red-600" aria-hidden="true">*</span>
                  <Tooltip text="Plataforma online (Zoom, Meet) o lugar físico.">
                    <Info size={16} className="text-slate-400" />
                  </Tooltip>
                </label>
                <input id="location-channel" type="text" maxLength={MAX_CHARS}
                  className={fieldClass(warn.location_channel, "w-full p-3 border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white", 'error')}
                  value={localPlan.location_channel} placeholder="Ej: Google Meet / Oficina IHC"
                  onChange={(e) => handleChange({ location_channel: e.target.value })}
                  onBlur={(e) => { touch('location_channel'); handleAutoSave({ location_channel: e.target.value }); }} />
                <CharCounter value={localPlan.location_channel} />
                <FieldWarning show={warn.location_channel} message="Especifica dónde ocurrirá la sesión." variant="error" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. TAREAS DEL TEST ── */}
        <section className="section-block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <h2 className="bg-hierarchy-l1 text-white px-5 py-3 text-sm font-bold uppercase tracking-wider m-0 flex items-center justify-between">
            <span className="flex items-center gap-2">
              4. Tareas del Test
              <Tooltip text="Actividades que el usuario realizará durante la sesión.">
                <Info size={16} className="text-white/70" />
              </Tooltip>
            </span>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold normal-case tracking-normal ${tasks.length >= 10 ? 'text-red-300' : 'text-white/70'}`}>
                {tasks.length}/10 tareas
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-500 ${tasks.length > 0 ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
              />
            </div>
          </h2>

          {isMobile && (
            <div className="p-4 flex flex-col gap-4">
              {tasks.length === 0 ? (
                <p className="text-center text-slate-500 py-8 italic font-medium text-sm">No hay tareas añadidas.</p>
              ) : (
                tasks.map((task) => (
                  <TaskCard key={task.id} task={task} handleTaskChange={handleTaskChange} onSaveTask={onSaveTask} onDeleteTask={onDeleteTask} />
                ))
              )}
              <button type="button"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none p-4 rounded-2xl font-black text-sm uppercase tracking-widest cursor-pointer transition-all disabled:bg-slate-300 shadow-xl mt-2 w-full"
                onClick={onAddTaskWithValidation} disabled={!localPlan.id || isProductEmpty || tasks.length >= 10}>
                <Plus size={20} aria-hidden="true" /> Añadir Tarea
              </button>
            </div>
          )}

          {!isMobile && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-navy text-white text-sm font-black uppercase tracking-widest">
                      <th className="p-4 text-center border-r border-white/10 w-[60px]">ID</th>
                      <th className="p-4 text-left border-r border-white/10">Escenario / tarea</th>
                      <th className="p-4 text-left border-r border-white/10">Resultado esperado</th>
                      <th className="p-4 text-left border-r border-white/10">Métrica principal</th>
                      <th className="p-4 text-left border-r border-white/10">Criterio de éxito</th>
                      <th className="p-4 text-center w-[80px]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.length > 0 ? (
                      tasks.map((task) => (
                        <TaskRow key={task.id} task={task} handleTaskChange={handleTaskChange} onSaveTask={onSaveTask} onDeleteTask={onDeleteTask} />
                      ))
                    ) : (
                      <tr><td colSpan={6} className="p-12 text-center text-slate-500 italic text-sm">No hay tareas añadidas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 px-6 bg-slate-50 border-t border-slate-200">
                <button type="button"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider cursor-pointer transition-all disabled:bg-slate-300 shadow-lg"
                  onClick={onAddTaskWithValidation} disabled={!localPlan.id || isProductEmpty || tasks.length >= 10}>
                  <Plus size={20} aria-hidden="true" /> Añadir Tarea
                </button>
              </div>
            </>
          )}
        </section>

        {/* ── 5. ROLES Y LOGÍSTICA ── */}
        <section className="section-block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <h2 className="bg-hierarchy-l1 text-white px-5 py-3 text-sm font-bold uppercase tracking-wider m-0 flex items-center justify-between">
            <span className="flex items-center gap-2">
              5. Roles y Logística
              <Tooltip text="Personas involucradas y recursos necesarios.">
                <Info size={16} className="text-white/70" />
              </Tooltip>
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-500 ${localPlan.moderator ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
            />
          </h2>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="field-group">
                <label htmlFor="moderator-name" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-1.5">Moderador: <span className="text-red-600">*</span></label>
                <input id="moderator-name" type="text" maxLength={MAX_CHARS}
                  className={fieldClass(warn.moderator, "w-full p-3 border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white", 'error')}
                  value={localPlan.moderator} placeholder="Facilitador"
                  onChange={(e) => handleChange({ moderator: e.target.value })}
                  onBlur={(e) => { touch('moderator'); handleAutoSave({ moderator: e.target.value }); }} />
                <CharCounter value={localPlan.moderator} />
              </div>
              <div className="field-group">
                <label htmlFor="observer-name" className="text-sm font-bold text-slate-700 mb-1.5 block">Observador:</label>
                <input id="observer-name" type="text" maxLength={MAX_CHARS}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white"
                  value={localPlan.observer} placeholder="Opcional"
                  onChange={(e) => handleChange({ observer: e.target.value })}
                  onBlur={(e) => handleAutoSave({ observer: e.target.value })} />
                <CharCounter value={localPlan.observer} />
              </div>
              <div className="field-group">
                <label htmlFor="tools-used" className="text-sm font-bold text-slate-700 mb-1.5 block">Herramientas:</label>
                <input id="tools-used" type="text" maxLength={MAX_CHARS}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white"
                  value={localPlan.tools} placeholder="Ej: Figma, Maze"
                  onChange={(e) => handleChange({ tools: e.target.value })}
                  onBlur={(e) => handleAutoSave({ tools: e.target.value })} />
                <CharCounter value={localPlan.tools} />
              </div>
              <div className="field-group">
                <label htmlFor="project-link" className="text-sm font-bold text-slate-700 mb-1.5 block">Enlace:</label>
                <input id="project-link" type="text" maxLength={MAX_CHARS}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-white"
                  value={localPlan.link} placeholder="https://..."
                  onChange={(e) => handleChange({ link: e.target.value })}
                  onBlur={(e) => handleAutoSave({ link: e.target.value })} />
                <CharCounter value={localPlan.link} />
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. NOTAS DEL MODERADOR ── */}
        <section className="section-block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-hierarchy-l1 px-5 py-3">
            <label htmlFor="moderator-notes" className="text-white text-sm font-bold uppercase tracking-wider block">
              6. Notas del moderador
            </label>
          </div>
          <div className="p-6">
            <AutoGrowTextarea id="moderator-notes"
              className="w-full p-4 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 bg-slate-50 focus:bg-white min-h-[120px]"
              value={localPlan.moderator_notes}
              onChange={(e) => handleChange({ moderator_notes: e.target.value })}
              onBlur={(e) => handleAutoSave({ moderator_notes: e.target.value })}
              rows={3} placeholder="Ej: Recordar pedir al usuario que piense en voz alta..." />
            <CharCounter value={localPlan.moderator_notes} />
          </div>
        </section>

      </div>
    </main>
  );
};
