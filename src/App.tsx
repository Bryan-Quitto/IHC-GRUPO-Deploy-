import React from 'react';
import './styles/App.css';
import { useUsabilityApp } from './controllers/useUsabilityApp';
import { TabNavigation } from './components/TabNavigation';
import { PlanView } from './views/PlanView';
import { ScriptView } from './views/ScriptView';
import { ObservationsView } from './views/ObservationsView';
import { FindingsView } from './views/FindingsView';

const App: React.FC = () => {
  const { 
    activeTab, setActiveTab, 
    testPlan, handleUpdatePlan, handleAddTask, handleUpdateTask, handleDeleteTask,
    script, handleUpdateScript, handleUpdateScriptTask, handleAddScriptTask, handleDeleteScriptTask, handleUpdateClosingAnswer,
    observations, handleAddObservation, handleUpdateObservation, handleDeleteObservation,
    findings, handleAddFinding, handleUpdateFinding, handleDeleteFinding
  } = useUsabilityApp();

  return (
    <div className="container">
      <header className="main-header">
        <h1>Usability Hub & Monitoring</h1>
        <p>Plataforma para la gestión de pruebas de usabilidad y seguimiento de mejoras bajo estándares WCAG.</p>
      </header>

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main style={{ minHeight: '60vh' }}>
        {activeTab === 'plan' && (
          <PlanView 
            data={testPlan} 
            onUpdate={handleUpdatePlan} 
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        
        {activeTab === 'script' && (
          <ScriptView 
            data={script}
            onUpdateScript={handleUpdateScript}
            onUpdateTask={handleUpdateScriptTask}
            onAddTask={handleAddScriptTask}
            onDeleteTask={handleDeleteScriptTask}
            onUpdateClosingAnswer={handleUpdateClosingAnswer}
          />
        )}

        {activeTab === 'observations' && (
          <ObservationsView 
            data={observations}
            onAdd={handleAddObservation}
            onUpdate={handleUpdateObservation}
            onDelete={handleDeleteObservation}
          />
        )}

        {activeTab === 'findings' && (
          <FindingsView 
            data={findings}
            onAdd={handleAddFinding}
            onUpdate={handleUpdateFinding}
            onDelete={handleDeleteFinding}
          />
        )}
      </main>
      
      <footer style={{ marginTop: '3rem', padding: '1rem 0', borderTop: '1px solid var(--border)', fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Diseñado bajo estándares WCAG 2.1 (AA) para accesibilidad web.
      </footer>
    </div>
  );
};

export default App;