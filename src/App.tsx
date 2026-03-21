import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { useUsabilityApp } from './controllers/useUsabilityApp';
import { TabNavigation } from './components/TabNavigation';
import { PlanView } from './views/PlanView';
import { ScriptView } from './views/ScriptView';
import { ObservationsView } from './views/ObservationsView';
import { FindingsView } from './views/FindingsView';
import { Trash2, AlertTriangle, Search, ChevronDown, X } from 'lucide-react';

const App: React.FC = () => {
  const { 
    activeTab, setActiveTab, loading, allPlans,
    testPlan, handleSavePlan, handleCreateNewPlan, loadFullPlan, handleDeletePlan,
    tasks, handleAddTask, handleSaveTask, handleDeleteTask,
    observations, handleAddObservation, handleSaveObservation, handleDeleteObservation,
    findings, handleAddFinding, handleSaveFinding, handleDeleteFinding
  } = useUsabilityApp();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar planes (máximo 10)
  const filteredPlans = allPlans
    .filter(plan => 
      (plan.product?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (plan.module?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .slice(0, 10);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <p>Cargando datos desde Supabase...</p>
      </div>
    );
  }

  const currentDisplayName = testPlan.id 
    ? `${testPlan.product} ${testPlan.module ? ` - ${testPlan.module}` : ''}`
    : '-- Selecciona o busca un plan --';

  return (
    <div className="container">
      <header className="main-header">
        <h1>Gestión de planes de usabilidad</h1>
        <p>Plataforma para la gestión de pruebas de usabilidad.</p>
      </header>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.2rem', 
        backgroundColor: '#f8fafc', 
        borderRadius: '10px', 
        marginBottom: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
          <label style={{ fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap' }}>Plan Actual:</label>
          
          <div ref={dropdownRef} style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: 'white', 
                border: '1px solid #cbd5e1', 
                borderRadius: '6px',
                padding: '2px 10px',
                cursor: 'text'
              }}
              onClick={() => setIsDropdownOpen(true)}
            >
              <Search size={18} color="#64748b" style={{ marginRight: '8px' }} />
              <input 
                type="text"
                placeholder="Buscar por producto o módulo..."
                value={isDropdownOpen ? searchTerm : currentDisplayName}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  setSearchTerm('');
                  setIsDropdownOpen(true);
                }}
                style={{ 
                  border: 'none', 
                  padding: '8px 0', 
                  width: '100%', 
                  outline: 'none',
                  fontSize: '0.95rem',
                  color: isDropdownOpen ? '#1e293b' : (testPlan.id ? '#1e293b' : '#94a3b8'),
                  fontWeight: isDropdownOpen ? 'normal' : (testPlan.id ? '600' : 'normal')
                }}
              />
              {isDropdownOpen ? (
                <X 
                  size={18} 
                  color="#64748b" 
                  style={{ cursor: 'pointer', marginLeft: '8px' }} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                    setSearchTerm('');
                  }} 
                />
              ) : (
                <ChevronDown size={18} color="#64748b" style={{ marginLeft: '8px' }} />
              )}
            </div>

            {isDropdownOpen && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                backgroundColor: 'white', 
                border: '1px solid #cbd5e1', 
                borderRadius: '6px', 
                marginTop: '5px', 
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                maxHeight: '350px',
                overflowY: 'auto',
                zIndex: 2000
              }}>
                {filteredPlans.length > 0 ? (
                  filteredPlans.map(plan => (
                    <div 
                      key={plan.id}
                      onClick={() => {
                        loadFullPlan(plan);
                        setIsDropdownOpen(false);
                        setSearchTerm('');
                      }}
                      style={{ 
                        padding: '12px 15px', 
                        cursor: 'pointer', 
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>
                          {plan.product || 'Sin nombre'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {new Date(plan.created_at!).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                        {plan.module || 'Módulo no especificado'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                    No se encontraron planes que coincidan.
                  </div>
                )}
              </div>
            )}
          </div>
          
          {testPlan.id && (
            <button 
              onClick={() => setShowDeleteModal(true)}
              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center' }}
              title="Eliminar este plan"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
        
        <button 
          onClick={handleCreateNewPlan}
          style={{ 
            backgroundColor: '#0f172a', 
            color: 'white', 
            padding: '10px 20px', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            border: 'none',
            marginLeft: '20px',
            whiteSpace: 'nowrap'
          }}
        >
          + Crear Nuevo Plan
        </button>
      </div>

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main style={{ minHeight: '60vh' }}>
        {activeTab === 'plan' && (
          <PlanView 
            data={testPlan} 
            tasks={tasks}
            onUpdate={handleSavePlan} 
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
            onSaveTask={handleSaveTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onGoToPlan={() => setActiveTab('plan')}
          />
        )}

        {activeTab === 'observations' && (
          <ObservationsView 
            data={observations}
            planId={testPlan.id}
            productName={testPlan.product}
            onAdd={handleAddObservation}
            onSave={handleSaveObservation}
            onDelete={handleDeleteObservation}
            onGoToPlan={() => setActiveTab('plan')}
          />
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
      </main>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AlertTriangle size={48} color="#dc2626" style={{ marginBottom: '1rem' }} />
            <h3 className="modal-title">¿Eliminar Plan de Prueba?</h3>
            <p>Estás a punto de borrar el plan <strong>"{testPlan.product}"</strong> y todos sus datos asociados (tareas, observaciones y hallazgos).</p>
            <p style={{ fontWeight: 'bold' }}>Esta acción no se puede deshacer.</p>
            
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button className="btn-confirm-delete" onClick={() => {
                handleDeletePlan(testPlan.id!);
                setShowDeleteModal(false);
              }}>
                Sí, eliminar permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
      
      <footer style={{ marginTop: '3rem', padding: '1rem 0', borderTop: '1px solid var(--border)', fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Grupo 3: Mateo Auz, Kerly Chicaiza, Bryan Quitto, Pedro Supe
      </footer>
    </div>
  );
};

export default App;