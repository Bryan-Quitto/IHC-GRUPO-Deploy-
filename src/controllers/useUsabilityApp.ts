import { useState } from 'react';

export type DashboardTab = 'plan' | 'script' | 'observations' | 'findings';

export const useUsabilityApp = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('plan');

  const [testPlan, setTestPlan] = useState<any>({
    product: '', module: '', objective: '', userProfile: '',
    method: '', duration: '', date: '', location: '',
    tasks: [{ id: 'T1', scenario: '', expectedResult: '', mainMetric: '', successCriteria: '' }],
    moderator: '', observer: '', tools: '', link: '', moderatorNotes: ''
  });

  const [script, setScript] = useState<any>({
    openingSteps: [
      'Agradece la participación.',
      'Explica que se evalúa la interfaz, no a la persona.',
      'Pide que piense en voz alta.',
      'Lee una tarea a la vez.',
      'Evita ayudar salvo bloqueo total.'
    ],
    tasks: [{ id: 'T1', taskText: '', followUpQuestion: '', expectedSuccess: '' }],
    closingQuestions: [
      { question: '¿Qué fue lo más fácil?', answer: '' },
      { question: '¿Qué fue lo más confuso?', answer: '' },
      { question: '¿Qué cambiarías primero?', answer: '' }
    ]
  });

  const [observations, setObservations] = useState<any[]>([
    { id: 'O1', participant: '', profile: '', task: '', success: '', time: '', errors: '', comments: '', problem: '', severity: '', proposal: '' }
  ]);

  const [findings, setFindings] = useState<any[]>([
    { id: 'F1', problem: '', evidence: '', frequency: '', severity: '', recommendation: '', priority: '', status: 'Pendiente' }
  ]);

  const handleUpdatePlan = (updates: any) => setTestPlan((prev: any) => ({ ...prev, ...updates }));

  const handleUpdateTask = (id: string, updates: any) => {
    setTestPlan((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: any) => (t.id === id ? { ...t, ...updates } : t))
    }));
  };

  const handleAddTask = () => {
    setTestPlan((prev: any) => {
      const maxId = prev.tasks.reduce((max: number, task: any) => {
        const num = parseInt(task.id.replace('T', ''), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      return { ...prev, tasks: [...prev.tasks, { id: `T${maxId + 1}`, scenario: '', expectedResult: '', mainMetric: '', successCriteria: '' }] };
    });
  };

  const handleDeleteTask = (id: string) => setTestPlan((prev: any) => ({ ...prev, tasks: prev.tasks.filter((t: any) => t.id !== id) }));

  const handleUpdateScript = (updates: any) => setScript((prev: any) => ({ ...prev, ...updates }));

  const handleUpdateScriptTask = (id: string, updates: any) => {
    setScript((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: any) => (t.id === id ? { ...t, ...updates } : t))
    }));
  };

  const handleAddScriptTask = () => {
    setScript((prev: any) => {
      const maxId = prev.tasks.reduce((max: number, task: any) => {
        const num = parseInt(task.id.replace('T', ''), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      return { ...prev, tasks: [...prev.tasks, { id: `T${maxId + 1}`, taskText: '', followUpQuestion: '', expectedSuccess: '' }] };
    });
  };

  const handleDeleteScriptTask = (id: string) => setScript((prev: any) => ({ ...prev, tasks: prev.tasks.filter((t: any) => t.id !== id) }));

  const handleUpdateClosingAnswer = (index: number, answer: string) => {
    setScript((prev: any) => {
      const newQuestions = [...prev.closingQuestions];
      newQuestions[index] = { ...newQuestions[index], answer };
      return { ...prev, closingQuestions: newQuestions };
    });
  };

  const handleAddObservation = () => {
    const newId = `O${Date.now()}`;
    setObservations(prev => [...prev, { id: newId, participant: '', profile: '', task: '', success: '', time: '', errors: '', comments: '', problem: '', severity: '', proposal: '' }]);
  };

  const handleUpdateObservation = (id: string, updates: any) => {
    setObservations(prev => prev.map(obs => obs.id === id ? { ...obs, ...updates } : obs));
  };

  const handleDeleteObservation = (id: string) => setObservations(prev => prev.filter(obs => obs.id !== id));

  const handleAddFinding = () => {
    const newId = `F${Date.now()}`;
    setFindings(prev => [...prev, { id: newId, problem: '', evidence: '', frequency: '', severity: '', recommendation: '', priority: '', status: 'Pendiente' }]);
  };

  const handleUpdateFinding = (id: string, updates: any) => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleDeleteFinding = (id: string) => setFindings(prev => prev.filter(f => f.id !== id));

  return {
    activeTab, setActiveTab,
    testPlan, handleUpdatePlan, handleUpdateTask, handleAddTask, handleDeleteTask,
    script, handleUpdateScript, handleUpdateScriptTask, handleAddScriptTask, handleDeleteScriptTask, handleUpdateClosingAnswer,
    observations, handleAddObservation, handleUpdateObservation, handleDeleteObservation,
    findings, handleAddFinding, handleUpdateFinding, handleDeleteFinding
  };
};