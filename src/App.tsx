import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { useUsabilityApp } from './controllers/useUsabilityApp';
import { useAuth } from './controllers/useAuth';
import { TabNavigation } from './components/TabNavigation';
import Header from './components/Header';
import { Trash2, AlertTriangle, ArrowLeft, Save } from 'lucide-react';
import { DashboardTab } from './models/types';

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
  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Cargar el plan cuando cambia el ID
  useEffect(() => {
    if (id && id !== 'new') {
      loadFullPlanById(id);
    }
  }, [id, loadFullPlanById]);

  const onManualSave = async () => {
    setSaveStatus('saving');
    const saved = await handleSavePlan(testPlan);
    setSaveStatus('success');
    if (saved && id === 'new') {
      navigate(`/plan/${saved.id}/${activeTab}`, { replace: true });
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

  if (loading && id !== 'new') return <div className="loading-state"><LazyLoader /></div>;

  return (
    <div className="view-transition">
      <div
        role="region"
        aria-label="Plan activo"
        className="plan-context-bar"
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem', padding: '1rem 1.25rem',
          backgroundColor: '#f8fafc', borderRadius: '12px',
          marginBottom: '1.5rem', border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px', minWidth: 0 }}>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleTryGoHome(); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'transparent', color: '#64748b',
              border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '6px 12px', fontWeight: 600, cursor: 'pointer',
              fontSize: '.8rem', fontFamily: 'inherit', flexShrink: 0,
              transition: 'all .2s',
            }}
          >
            <ArrowLeft size={14} /> Volver
          </button>

          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <div style={{
              fontWeight: 800, color: '#1e293b', fontSize: '1.1rem',
              wordWrap: 'break-word', letterSpacing: '-0.02em'
            }}>
              {testPlan.product || 'Nuevo Plan de Prueba'}
            </div>
            {testPlan.module && (
              <div style={{ fontSize: '.8rem', color: '#64748b', marginTop: 1 }}>
                Módulo: {testPlan.module}
              </div>
            )}
          </div>

          {testPlan.id && (
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                background: 'transparent', border: '1px solid transparent',
                color: '#94a3b8', cursor: 'pointer', padding: '6px',
                display: 'flex', alignItems: 'center', borderRadius: '6px',
                flexShrink: 0, transition: 'all .2s',
              }}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <main id="main-content" style={{ minHeight: '50vh' }}>
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          onSave={onManualSave}
          saveStatus={saveStatus}
          hasUnsavedChanges={hasUnsavedChanges}
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
        <div className="modal-overlay">
          <div className="modal-content">
            <AlertTriangle size={48} color="#dc2626" style={{ marginBottom: '1rem' }} />
            <h3 className="modal-title">¿Eliminar Plan de Prueba?</h3>
            <p>Estás a punto de borrar el plan <strong>"{testPlan.product}"</strong> y todos sus datos asociados.</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn-confirm-delete" onClick={() => { handleDeletePlan(testPlan.id!); navigate('/'); }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showUnsavedModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <Save size={48} color="#003366" style={{ marginBottom: '1rem' }} />
            <h3 className="modal-title">Cambios sin guardar</h3>
            <p>Si sales ahora, podrías perder la información que acabas de escribir.</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowUnsavedModal(false)}>Quedarme aquí</button>
              <button
                style={{ backgroundColor: '#003366', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
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
  const { loading, allPlans, allObservations, allFindings, handleDeletePlan, handleCreateNewPlan, hasUnsavedChanges } = controller;

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
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />
      
      <div style={{ marginTop: '80px' }}>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Suspense fallback={<LazyLoader />}><LoginView /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={<LazyLoader />}><RegisterView /></Suspense>} />
          
          {/* Rutas Protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <div className="view-transition">
                <header className="main-banner">
                  <h1>Plan de Test de Usabilidad</h1>
                  <p>Registra, analiza y mejora la experiencia de tus usuarios.</p>
                </header>
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

      <footer className="main-footer">
        Grupo 3: Mateo Auz, Kerly Chicaiza, Bryan Quitto, Pedro Supe
      </footer>
    </div>
  );
};

export default App;