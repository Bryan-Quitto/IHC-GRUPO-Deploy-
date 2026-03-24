import React, { useState } from 'react';
import './App.css';
import { useUsabilityApp } from './controllers/useUsabilityApp';
import { TabNavigation } from './components/TabNavigation';
import { GlobalDashboard } from './views/GlobalDashboard';
import { PlanView } from './views/PlanView';
import { ScriptView } from './views/ScriptView';
import { ObservationsView } from './views/ObservationsView';
import { FindingsView } from './views/FindingsView';
import { ReportsView } from './views/ReportsView';
import { Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const {
    activeTab, setActiveTab,
    selectedPlan, handleGoHome,
    loading, allPlans, allObservations, allFindings,
    testPlan, handleSavePlan, handleCreateNewPlan, loadFullPlan, handleDeletePlan,
    tasks, handleAddTask, handleSaveTask, handleDeleteTask,
    observations, handleAddObservation, handleSaveObservation, handleDeleteObservation,
    findings, handleAddFinding, handleSaveFinding, handleDeleteFinding,
  } = useUsabilityApp();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', height: '100vh', gap: '1rem',
        fontFamily: "'Sora', sans-serif", background: '#f0f4f8',
      }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #e2e8f0',
          borderTopColor: '#003366', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#374151', fontWeight: 600, margin: 0 }}>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="container">

      {/* ══ CABECERA PRINCIPAL ══ */}
      <header className="main-header">
        <h1>Plan de Test de Usabilidad</h1>
        <p>Registra, analiza y mejora la experiencia de tus usuarios.</p>
      </header>

      {/* ══ VISTA: DASHBOARD GLOBAL ════════════════════════════════════════ */}
      {!selectedPlan && (
        <GlobalDashboard
          allPlans={allPlans}
          allObservations={allObservations}
          allFindings={allFindings}
          onSelectPlan={loadFullPlan}
          onCreatePlan={handleCreateNewPlan}
          onDeletePlan={handleDeletePlan}
        />
      )}

      {/* ══ VISTA: DETALLE DE PLAN ═════════════════════════════════════════ */}
      {selectedPlan !== null && (
        <>
          {/* Barra de contexto del plan */}
          <div
            role="region"
            aria-label="Plan activo"
            className="plan-context-bar"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1.25rem',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            {/* Botón volver y nombre del plan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 300px', minWidth: 0, flexWrap: 'wrap' }}>
              <button
                onClick={handleGoHome}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#e8eef7', color: '#003366',
                  border: '1px solid #c7d7f0', borderRadius: '8px',
                  padding: '8px 16px', fontWeight: 700, cursor: 'pointer',
                  fontSize: '.85rem', fontFamily: 'inherit', flexShrink: 0,
                  transition: 'background .2s',
                }}
                aria-label="Volver al dashboard principal"
                onMouseEnter={e => (e.currentTarget.style.background = '#d1e2f7')}
                onMouseLeave={e => (e.currentTarget.style.background = '#e8eef7')}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Todos los planes
              </button>

              {/* Nombre del plan activo */}
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, color: '#0f172a', fontSize: '1rem',
                  wordWrap: 'break-word', overflowWrap: 'break-word',
                }}>
                  {testPlan.product || 'Plan nuevo'}
                </div>
                {testPlan.module && (
                  <div style={{ fontSize: '.85rem', color: '#475569', marginTop: 2, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    {testPlan.module}
                  </div>
                )}
              </div>

              {/* Borrar plan */}
              {testPlan.id && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    background: '#fee2e2', border: '1px solid #fecaca',
                    color: '#dc2626', cursor: 'pointer', padding: '8px',
                    display: 'flex', alignItems: 'center', borderRadius: '8px',
                    flexShrink: 0, transition: 'background .2s',
                  }}
                  title="Eliminar este plan"
                  aria-label="Eliminar plan actual"
                  onMouseEnter={e => (e.currentTarget.style.background = '#fecaca')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fee2e2')}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Crear nuevo */}
            <button
              onClick={handleCreateNewPlan}
              style={{
                backgroundColor: '#0f172a', color: 'white',
                padding: '10px 20px', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold',
                border: 'none',
                whiteSpace: 'nowrap', flexShrink: 0,
                fontFamily: 'inherit', fontSize: '.88rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform .1s',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              + Crear Nuevo Plan
            </button>
          </div>

          {/* Pestañas de sección */}
          <main id="main-content" style={{ minHeight: '50vh' }}>
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'plan' && (
              <div id="plan-panel" role="tabpanel" aria-labelledby="plan-tab">
                <PlanView
                  data={testPlan}
                  tasks={tasks}
                  onUpdate={handleSavePlan}
                  onAddTask={handleAddTask}
                  onSaveTask={handleSaveTask}
                  onDeleteTask={handleDeleteTask}
                />
              </div>
            )}

            {activeTab === 'script' && (
              <div id="script-panel" role="tabpanel" aria-labelledby="script-tab">
                <ScriptView
                  testPlan={testPlan}
                  tasks={tasks}
                  onUpdatePlan={handleSavePlan}
                  onSaveTask={handleSaveTask}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                  onGoToPlan={() => setActiveTab('plan')}
                />
              </div>
            )}

            {activeTab === 'observations' && (
              <div id="observations-panel" role="tabpanel" aria-labelledby="observations-tab">
                <ObservationsView
                  data={observations}
                  planId={testPlan.id}
                  productName={testPlan.product}
                  onAdd={handleAddObservation}
                  onSave={handleSaveObservation}
                  onDelete={handleDeleteObservation}
                  onGoToPlan={() => setActiveTab('plan')}
                />
              </div>
            )}

            {activeTab === 'findings' && (
              <FindingsView
                data={findings}
                planId={testPlan.id}
                productName={testPlan.product}
                onAdd={handleAddFinding}
                onSave={handleSaveFinding}
                onDelete={handleDeleteFinding}
                onGoToPlan={() => setActiveTab('plan')}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                testPlan={testPlan}
                tasks={tasks}
                observations={observations}
                findings={findings}
                onGoToPlan={() => setActiveTab('plan')}
              />
            )}
          </main>
        </>
      )}

      {/* ══ MODAL ELIMINAR ══════════════════════════════════════════════════ */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AlertTriangle size={48} color="#dc2626" style={{ marginBottom: '1rem' }} />
            <h3 className="modal-title">¿Eliminar Plan de Prueba?</h3>
            <p>
              Estás a punto de borrar el plan{' '}
              <strong>"{testPlan.product}"</strong> y todos sus datos asociados
              (tareas, observaciones y hallazgos).
            </p>
            <p style={{ fontWeight: 'bold' }}>Esta acción no se puede deshacer.</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button
                className="btn-confirm-delete"
                onClick={() => {
                  handleDeletePlan(testPlan.id!);
                  setShowDeleteModal(false);
                }}
              >
                Sí, eliminar permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={{
        marginTop: '3rem', padding: '1rem 0',
        borderTop: '1px solid var(--border)',
        fontSize: '.8rem', textAlign: 'center', color: 'var(--text-muted)',
      }}>
        Grupo 3: Mateo Auz, Kerly Chicaiza, Bryan Quitto, Pedro Supe
      </footer>
    </div>
  );
};

export default App;