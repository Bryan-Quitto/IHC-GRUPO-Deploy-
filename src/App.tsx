import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useUsabilityApp } from './controllers/useUsabilityApp';
import { useAuth } from './controllers/useAuth';
import { TabNavigation } from './components/TabNavigation';
import Header from './components/Header';
import { Trash2, AlertTriangle, ArrowLeft, Save } from 'lucide-react';
import { DashboardTab, TestPlan } from './models/types';
import { FlowProgress } from './components/FlowProgress';

// Lazy loading de vistas
const GlobalDashboard = lazy(() => import('./views/GlobalDashboard').then(module => ({ default: module.GlobalDashboard })));
const PlanView = lazy(() => import('./views/PlanView').then(module => ({ default: module.PlanView })));
const ScriptView = lazy(() => import('./views/ScriptView').then(module => ({ default: module.ScriptView })));
const ObservationsView = lazy(() => import('./views/ObservationsView').then(module => ({ default: module.ObservationsView })));
const FindingsView = lazy(() => import('./views/FindingsView').then(module => ({ default: module.FindingsView })));
const ReportsView = lazy(() => import('./views/ReportsView').then(module => ({ default: module.ReportsView })));
const LoginView = lazy(() => import('./views/LoginView'));
const RegisterView = lazy(() => import('./views/RegisterView'));
const SettingsView = lazy(() => import('./views/SettingsView'));

const LazyLoader = () => (
  <div className="p-8 text-center text-slate-500 italic">
    Cargando sección...
  </div>
);

// Componente para proteger rutas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
};

const PlanDetailContainer: React.FC<{
  controller: ReturnType<typeof useUsabilityApp>
}> = ({ controller }) => {
  const { id, tab } = useParams<{ id: string; tab: string }>();
  const navigate = useNavigate();
  const activeTab = (tab || 'plan') as DashboardTab;

  const {
    testPlan, setTestPlan, handleSavePlan, loadFullPlanById, handleDeletePlan,
    tasks, setTasks, handleAddTask, handleSaveTask, handleDeleteTask,
    observations, setObservations, handleAddObservation, handleSaveObservation, handleDeleteObservation,
    findings, setFindings, handleAddFinding, handleSaveFinding, handleDeleteFinding,
    hasUnsavedChanges, loading
  } = controller;

  const tabLabels: Record<DashboardTab, string> = {
    plan: 'Planificación',
    script: 'Guion de Test',
    observations: 'Observaciones',
    findings: 'Hallazgos',
    reports: 'Resultados y Reportes'
  };

  const breadcrumbItems = [
    { label: 'Proyectos', path: '/' },
    { label: testPlan.product || 'Nuevo Plan', path: `/plan/${id}/plan` },
    { label: tabLabels[activeTab] || 'Plan', active: true }
  ];

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Cargar el plan cuando cambia el ID
  useEffect(() => {
    if (id && id !== 'new') {
      loadFullPlanById(id);
    }
  }, [id, loadFullPlanById]);

  const onManualSave = async () => {
    setSaveStatus('saving');
    const saved = await handleSavePlan(testPlan);
    
    if (saved) {
      setSaveStatus('success');
      if (id === 'new') {
        navigate(`/plan/${saved.id}/${activeTab}`, { replace: true });
      }
    } else {
      setSaveStatus('error');
    }
    
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleTryGoHome = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      navigate('/');
    }
  };

  const onTabChange = (newTab: DashboardTab) => {
    navigate(`/plan/${id}/${newTab}`);
  };

  const onStatusChange = (newStatus: TestPlan['status']) => {
    controller.setTestPlan({ ...testPlan, status: newStatus });
  };

  if (loading && id !== 'new') return <div className="min-h-[50vh]"><LazyLoader /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <section className="bg-navy text-white py-12 px-4 -mx-4 md:-mx-8 text-center mb-8 sm:mb-12 rounded-xl">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest mb-2">Plan de Test de Usabilidad</h1>
        <p className="text-white/80 text-base md:text-lg font-medium max-w-2xl mx-auto">Registra, analiza y mejora la experiencia de tus usuarios.</p>
      </section>

      <div
        role="region"
        aria-label="Plan activo"
        className="flex justify-between items-center flex-wrap gap-4 p-4 md:px-5 bg-slate-50 rounded-xl mb-6 border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0 max-w-full sm:max-w-none">
          <button
            onMouseDown={(e) => { e.preventDefault(); handleTryGoHome(); }}
            className="inline-flex items-center gap-1.5 bg-transparent text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold cursor-pointer text-[0.8rem] transition-all flex-shrink-0 hover:bg-slate-100 hover:text-navy hover:border-slate-300"
          >
            <ArrowLeft size={14} /> Volver
          </button>

          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-slate-800 text-lg md:text-xl truncate tracking-tight">
              {testPlan.product || 'Nuevo Plan de Prueba'}
            </div>
            {testPlan.module && (
              <div className="text-[0.8rem] text-slate-500 mt-0.5 truncate">
                Módulo: {testPlan.module}
              </div>
            )}
          </div>

          {testPlan.id && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-transparent border-none text-slate-400 cursor-pointer p-1.5 flex items-center rounded-lg flex-shrink-0 transition-all hover:bg-red-50 hover:text-red-500"
              aria-label="Eliminar plan de prueba"
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <FlowProgress
        activeTab={activeTab}
        testPlan={testPlan}
        tasksCount={tasks.length}
        observationsCount={observations.length}
        findingsCount={findings.length}
      />  

      <main id="main-content" className="min-h-[50vh]">

        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          onSave={onManualSave}
          saveStatus={saveStatus}
          hasUnsavedChanges={hasUnsavedChanges}
          breadcrumbItems={breadcrumbItems}
          currentStatus={testPlan.status}
          onStatusChange={onStatusChange}
        />

        <Suspense fallback={<LazyLoader />}>
          {activeTab === 'plan' && (
            <PlanView
              data={testPlan}
              tasks={tasks}
              onUpdate={handleSavePlan}
              onSyncPlan={setTestPlan}
              onSyncTasks={setTasks}
              onAddTask={handleAddTask}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === 'script' && (
            <ScriptView
              testPlan={testPlan}
              tasks={tasks}
              planTasks={tasks}
              onUpdatePlan={handleSavePlan}
              onSyncPlan={setTestPlan}
              onSyncTasks={setTasks}
              onSaveTask={handleSaveTask}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onGoToPlan={() => onTabChange('plan')}
            />
          )}

          {activeTab === 'observations' && (
            <ObservationsView
              data={observations}
              onSync={setObservations}
              planId={testPlan.id}
              productName={testPlan.product}
              onAdd={handleAddObservation}
              onSave={handleSaveObservation}
              onDelete={handleDeleteObservation}
              onGoToPlan={() => onTabChange('plan')}
              tasks={tasks}
            />
          )}

          {activeTab === 'findings' && (
            <FindingsView
              data={findings}
              onSync={setFindings}
              planId={testPlan.id}
              productName={testPlan.product}
              onAdd={handleAddFinding}
              onSave={handleSaveFinding}
              onDelete={handleDeleteFinding}
              onGoToPlan={() => onTabChange('plan')}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              testPlan={testPlan}
              tasks={tasks}
              observations={observations}
              findings={findings}
              onGoToPlan={() => onTabChange('plan')}
            />
          )}
        </Suspense>
      </main>

      {/* Modales */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-[420px] w-full shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="inline-flex items-center justify-center bg-red-100 text-red-600 rounded-full w-14 h-14 mb-4">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">¿Eliminar Plan de Prueba?</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">Estás a punto de borrar el plan <strong className="text-slate-900">"{testPlan.product}"</strong> y todos sus datos asociados.</p>
            <div className="flex gap-3 justify-center">
              <button 
                className="px-6 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold cursor-pointer transition-all hover:bg-slate-50" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-bold border-none cursor-pointer transition-all hover:bg-red-700" 
                onClick={() => { handleDeletePlan(testPlan.id!); navigate('/'); }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-[420px] w-full shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="inline-flex items-center justify-center bg-navy/10 text-navy rounded-full w-14 h-14 mb-4">
              <Save size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Cambios sin guardar</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">Si sales ahora, podrías perder la información que acabas de escribir.</p>
            <div className="flex gap-3 justify-center">
              <button 
                className="px-6 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold cursor-pointer transition-all hover:bg-slate-50" 
                onClick={() => setShowUnsavedModal(false)}
              >
                Quedarme aquí
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-navy text-white text-sm font-bold border-none cursor-pointer transition-all hover:bg-navy-dark shadow-lg shadow-navy/20"
                onClick={() => { navigate('/'); setShowUnsavedModal(false); }}
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const controller = useUsabilityApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, allPlans, allObservations, allFindings, handleDeletePlan, handleCreateNewPlan, hasUnsavedChanges } = controller;

  const hideFooterPaths = ['/login', '/register'];
  const shouldHideFooter = hideFooterPaths.includes(location.pathname);

  // Advertencia nativa para cerrar pestaña
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (loading && allPlans.length === 0) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p className="text-slate-500 font-medium mt-4 animate-pulse">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className={shouldHideFooter ? "min-h-screen bg-white" : "main-container"}>
      <div>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Suspense fallback={<LazyLoader />}><LoginView /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={<LazyLoader />}><RegisterView /></Suspense>} />

          {/* Rutas Protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Header />
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pt-20">
                <Suspense fallback={<LazyLoader />}>
                  <GlobalDashboard
                    loading={loading}
                    allPlans={allPlans}
                    allObservations={allObservations}
                    allFindings={allFindings}
                    onSelectPlan={(plan) => navigate(`/plan/${plan.id}`)}
                    onCreatePlan={() => { handleCreateNewPlan(); navigate('/plan/new'); }}
                    onDeletePlan={handleDeletePlan}
                  />
                </Suspense>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Suspense fallback={<LazyLoader />}>
                <SettingsView />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/plan/:id" element={<ProtectedRoute><PlanDetailContainer controller={controller} /></ProtectedRoute>} />
          <Route path="/plan/:id/:tab" element={<ProtectedRoute><PlanDetailContainer controller={controller} /></ProtectedRoute>} />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {!shouldHideFooter && (
        <footer className="mt-12 py-8 border-t border-slate-200 text-center text-[0.85rem] text-slate-500 font-medium">
          Grupo 3: Mateo Auz, Kerly Chicaiza, Bryan Quitto, Pedro Supe
        </footer>
      )}
    </div>
  );
};

export default App;
