import React from 'react';
import { DashboardTab } from '../models/types';
import { Check } from 'lucide-react';

interface FlowProgressProps {
  activeTab: DashboardTab;
  testPlan: { product?: string; objective?: string; moderator?: string };
  tasksCount: number;
  observationsCount: number;
  findingsCount: number;
}

const steps = [
  { id: 'plan',         label: 'Plan',         desc: 'Define el contexto' },
  { id: 'script',       label: 'Guion',        desc: 'Prepara las tareas' },
  { id: 'observations', label: 'Observaciones', desc: 'Registra datos' },
  { id: 'findings',     label: 'Hallazgos',    desc: 'Sintetiza problemas' },
  { id: 'reports',      label: 'Reporte',      desc: 'Genera el informe' },
];

export const FlowProgress: React.FC<FlowProgressProps> = ({
  activeTab, testPlan, tasksCount, observationsCount, findingsCount,
}) => {
  const isStepComplete = (id: string): boolean => {
    if (id === 'plan') return !!(testPlan.product && testPlan.objective && testPlan.moderator);
    if (id === 'script') return tasksCount > 0;
    if (id === 'observations') return observationsCount > 0;
    if (id === 'findings') return findingsCount > 0;
    if (id === 'reports') return observationsCount > 0 && findingsCount > 0;
    return false;
  };

  const completedCount = steps.filter(s => isStepComplete(s.id)).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 mb-6 shadow-sm">
      {/* Barra global */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-[0.75rem] font-black text-slate-500 uppercase tracking-widest">
          Progreso del plan
        </span>
        <span className="text-[0.75rem] font-black text-navy">{progressPct}%</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-navy to-blue-500 rounded-full transition-all duration-700"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Pasos */}
      <div className="flex items-center gap-0">
        {steps.map((step, idx) => {
          const complete = isStepComplete(step.id);
          const active = activeTab === step.id;
          const isLast = idx === steps.length - 1;
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.65rem] font-black border-2 transition-all ${
                  complete
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : active
                    ? 'bg-navy border-navy text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  {complete ? <Check size={12} strokeWidth={3} /> : idx + 1}
                </div>
                <span className={`text-[0.6rem] font-bold text-center leading-tight hidden sm:block ${
                  active ? 'text-navy' : complete ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-500 ${
                  complete ? 'bg-emerald-400' : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};