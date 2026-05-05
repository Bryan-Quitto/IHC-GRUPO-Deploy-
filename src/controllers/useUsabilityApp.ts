import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TestPlan, TestTask, Observation, Finding, DashboardTab } from '../models/types';
import { useAuth } from './useAuth';

export const useUsabilityApp = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTabState] = useState<DashboardTab>('plan');

  const setActiveTab = (tab: DashboardTab) => {
    setActiveTabState(tab);
  };

  // ── Vista activa: null = dashboard global, plan = detalle de ese plan ──
  const [selectedPlan, setSelectedPlan] = useState<TestPlan | null>(null);

  const [loading, setLoading] = useState(true);
  const [allPlans, setAllPlans] = useState<TestPlan[]>([]);

  // Datos globales (todos los planes)
  const [allObservations, setAllObservations] = useState<Observation[]>([]);
  const [allFindings, setAllFindings] = useState<Finding[]>([]);

  // Datos del plan seleccionado
  const initialPlanState: TestPlan = {
    product: '', module: '', objective: '', 
    user_profile: '', method: '', duration: '', test_date: '', location_channel: '',
    moderator: '', observer: '',
    tools: '', link: '', status: 'Borrador', moderator_notes: '',
    closing_questions: [
      { question: "¿Qué fue lo más fácil?", answer: "" },
      { question: "¿Qué fue lo más confuso?", answer: "" },
      { question: "¿Qué cambiarías primero?", answer: "" }
    ]
  };

  const [testPlan, setTestPlanState] = useState<TestPlan>(initialPlanState);
  const [tasks, setTasksState] = useState<TestTask[]>([]);
  const [observations, setObservationsState] = useState<Observation[]>([]);
  const [findings, setFindingsState] = useState<Finding[]>([]);

  // Estado para rastrear cambios sin guardar en la DB
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const setTestPlan = (val: TestPlan) => {
    setTestPlanState(val);
    setHasUnsavedChanges(true);
  };
  const setTasks = (val: TestTask[]) => {
    setTasksState(val);
    setHasUnsavedChanges(true);
  };
  const setObservations = (val: Observation[]) => {
    setObservationsState(val);
    setHasUnsavedChanges(true);
  };
  const setFindings = (val: Finding[]) => {
    setFindingsState(val);
    setHasUnsavedChanges(true);
  };

  // ── Inicialización Unificada ──────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      // Solo mostramos el spinner de carga si es la primera vez (no hay planes)
      // Si ya hay planes, la actualización será "silenciosa" en segundo plano
      if (allPlans.length === 0) {
        setLoading(true);
      }

      try {
        const { data: plans } = await supabase
          .from('test_plans')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!isMounted) return;
        setAllPlans(plans || []);

        const [obsRes, findRes] = await Promise.all([
          supabase.from('observations').select('*'),
          supabase.from('findings').select('*'),
        ]);

        if (!isMounted) return;
        setAllObservations(obsRes.data || []);
        setAllFindings(findRes.data || []);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Error durante la inicialización:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [user, allPlans.length]); // Incluimos user y allPlans.length para evitar la advertencia de dependencias de React Hook

  // ── Seleccionar un plan y cargar sus datos ────────────────────────────
  const loadFullPlanById = useCallback(async (id: string) => {
    // Si ya tenemos este plan cargado, no activamos el loading global para evitar parpadeos
    const isAlreadyLoaded = testPlan.id === id;
    if (!isAlreadyLoaded) setLoading(true);

    try {
      // 1. Obtener plan de la lista si ya lo tenemos, o de la base de datos
      let plan = allPlans.find(p => p.id === id);
      if (!plan) {
        const { data } = await supabase
          .from('test_plans')
          .select('*')
          .eq('id', id)
          .single();
        plan = data;
      }

      if (plan) {
        setSelectedPlan(plan);
        setTestPlanState(plan);

        const [t, o, f] = await Promise.all([
          supabase.from('tasks').select('*').eq('test_plan_id', id).order('task_index', { ascending: true }),
          supabase.from('observations').select('*').eq('test_plan_id', id).order('created_at', { ascending: true }),
          supabase.from('findings').select('*').eq('test_plan_id', id).order('created_at', { ascending: true }),
        ]);

        setTasksState(t.data || []);
        setObservationsState(o.data || []);
        setFindingsState(f.data || []);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error("Error cargando el plan:", err);
    } finally {
      setLoading(false);
    }
  }, [allPlans, testPlan.id]);

  // ── Volver al dashboard global ─────────────────────────────────────────
  const handleGoHome = () => {
    setSelectedPlan(null);
    setTestPlanState(initialPlanState);
    setTasksState([]);
    setObservationsState([]);
    setFindingsState([]);
    setHasUnsavedChanges(false);
  };

  // ── Crear nuevo plan ───────────────────────────────────────────────────
  const handleCreateNewPlan = () => {
    setSelectedPlan({ ...initialPlanState }); // entra al detalle con plan vacío
    setTestPlanState(initialPlanState);
    setTasksState([]);
    setObservationsState([]);
    setFindingsState([]);
    setHasUnsavedChanges(false);
  };

  // ── Eliminar plan ──────────────────────────────────────────────────────
  const handleDeletePlan = async (id: string) => {
    await supabase.from('test_plans').delete().eq('id', id);
    const remaining = allPlans.filter(p => p.id !== id);
    setAllPlans(remaining);
    setAllObservations(prev => prev.filter(o => o.test_plan_id !== id));
    setAllFindings(prev => prev.filter(f => f.test_plan_id !== id));
    handleGoHome();
  };

  // ── Guardar plan ───────────────────────────────────────────────────────
  const handleSavePlan = async (fullPlan: TestPlan) => {
    if (!user) return null;

    // Limpiar el objeto para Supabase
    // Extraemos campos que NO deben ir en el cuerpo (metadatos o calculados)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, ...rest } = fullPlan;

    // Preparar data asegurando tipos compatibles con Postgres
    const dataToSave = {
      ...rest,
      profile_id: fullPlan.profile_id || user.id,
      // Si la fecha es un string vacío, enviamos null para evitar error de tipo 'date'
      test_date: rest.test_date && rest.test_date.trim() !== '' ? rest.test_date : null,
      closing_questions: rest.closing_questions || []
    };

    try {
      if (!id) {
        // INSERT
        const { data, error } = await supabase
          .from('test_plans')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setTestPlanState(data);
          setSelectedPlan(data);
          setAllPlans(prev => [data, ...prev]);
          setHasUnsavedChanges(false);
          return data;
        }
      } else {
        // UPDATE
        const { data, error } = await supabase
          .from('test_plans')
          .update(dataToSave)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setTestPlanState(data);
          setSelectedPlan(data);
          setAllPlans(prev => prev.map(p => p.id === id ? data : p));
          setHasUnsavedChanges(false);
          return data;
        }
      }
    } catch (err) {
      console.error("Error crítico al guardar el plan:", err);
      if (err instanceof Error) {
        console.error("Mensaje de error:", err.message);
      }
      return null;
    }
    return null;
  };

  // ── Tareas ─────────────────────────────────────────────────────────────
  const handleAddTask = async () => {
    if (!testPlan.id) return;
    const newTask = {
      test_plan_id: testPlan.id,
      task_index: `T${tasks.length + 1}`,
      scenario: '', expected_result: '', main_metric: '', success_criteria: ''
    };
    const { data, error } = await supabase.from('tasks').insert([newTask]).select().single();
    if (!error && data) {
      setTasksState(prev => [...prev, data]);
      setHasUnsavedChanges(false);
    }
  };

  const handleSaveTask = async (id: string, updates: Partial<TestTask>) => {
    await supabase.from('tasks').update(updates).eq('id', id);
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    setHasUnsavedChanges(false);
  };

  const handleDeleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasksState(prev => prev.filter(t => t.id !== id));
    setHasUnsavedChanges(false);
  };

  // ── Observaciones ──────────────────────────────────────────────────────
  const handleAddObservation = async () => {
    if (!testPlan.id) return;
    const newObs = {
      test_plan_id: testPlan.id, participant: '', profile: '', task_ref: '',
      success_level: 'Sí', time_seconds: 0, errors: 0, comments: '',
      problem: '', severity: 'Baja', proposal: ''
    };
    const { data, error } = await supabase.from('observations').insert([newObs]).select().single();
    if (!error && data) {
      setObservationsState(prev => [...prev, data]);
      setAllObservations(prev => [...prev, data]);
      setHasUnsavedChanges(false);
    }
  };

  const handleSaveObservation = async (id: string, updates: Partial<Observation>) => {
    await supabase.from('observations').update(updates).eq('id', id);
    setObservationsState(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    setAllObservations(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    setHasUnsavedChanges(false);
  };

  const handleDeleteObservation = async (id: string) => {
    await supabase.from('observations').delete().eq('id', id);
    setObservationsState(prev => prev.filter(o => o.id !== id));
    setAllObservations(prev => prev.filter(o => o.id !== id));
    setHasUnsavedChanges(false);
  };

  // ── Hallazgos ──────────────────────────────────────────────────────────
  const handleAddFinding = async () => {
    if (!testPlan.id) return;
    const newFinding = {
      test_plan_id: testPlan.id, problem: '', evidence: '', frequency: '',
      severity: 'Baja', recommendation: '', priority: 'Baja', status: 'Pendiente'
    };
    const { data, error } = await supabase.from('findings').insert([newFinding]).select().single();
    if (!error && data) {
      setFindingsState(prev => [...prev, data]);
      setAllFindings(prev => [...prev, data]);
      setHasUnsavedChanges(false);
    }
  };

  const handleSaveFinding = async (id: string, updates: Partial<Finding>) => {
    await supabase.from('findings').update(updates).eq('id', id);
    setFindingsState(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    setAllFindings(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    setHasUnsavedChanges(false);
  };

  const handleDeleteFinding = async (id: string) => {
    await supabase.from('findings').delete().eq('id', id);
    setFindingsState(prev => prev.filter(f => f.id !== id));
    setAllFindings(prev => prev.filter(f => f.id !== id));
    setHasUnsavedChanges(false);
  };

  return {
    // navegación y datos
    activeTab, setActiveTab,
    selectedPlan,
    handleGoHome,
    hasUnsavedChanges,
    loading,
    allPlans, allObservations, allFindings,
    testPlan, setTestPlan, handleSavePlan, handleCreateNewPlan, loadFullPlanById, handleDeletePlan,
    tasks, setTasks, handleAddTask, handleSaveTask, handleDeleteTask,
    observations, setObservations, handleAddObservation, handleSaveObservation, handleDeleteObservation,
    findings, setFindings, handleAddFinding, handleSaveFinding, handleDeleteFinding,
  };
};