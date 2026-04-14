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
  { id: 'plan',         label: 'Plan',          },
  { id: 'script',       label: 'Guion',         },
  { id: 'observations', label: 'Observaciones', },
  { id: 'findings',     label: 'Hallazgos',     },
  { id: 'reports',      label: 'Reporte',       },
];

export const FlowProgress: React.FC<FlowProgressProps> = ({
  activeTab, testPlan, tasksCount, observationsCount, findingsCount,
}) => {
  const isStepComplete = (id: string): boolean => {
    if (id === 'plan')         return !!(testPlan.product && testPlan.objective && testPlan.moderator);
    if (id === 'script')       return tasksCount > 0;
    if (id === 'observations') return observationsCount > 0;
    if (id === 'findings')     return findingsCount > 0;
    if (id === 'reports')      return observationsCount > 0 && findingsCount > 0;
    return false;
  };

  const completedCount = steps.filter(s => isStepComplete(s.id)).length;
  const progressPct    = Math.round((completedCount / steps.length) * 100);

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Progreso del plan
        </span>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#003366' }}>
          {completedCount} de {steps.length} · {progressPct}%
        </span>
      </div>

      {/* Barra global */}
      <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: 'linear-gradient(90deg, #003366, #3b82f6)',
          borderRadius: '99px',
          transition: 'width 0.7s ease',
        }} />
      </div>

      {/* Pasos */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        {steps.map((step, idx) => {
          const complete = isStepComplete(step.id);
          const active   = activeTab === step.id;
          const isLast   = idx === steps.length - 1;
          const statusText = complete ? 'completado' : active ? 'activo' : 'pendiente';

          return (
            <React.Fragment key={step.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    border: '2px solid',
                    transition: 'all 0.3s',
                    backgroundColor: complete ? '#059669' : active ? '#003366' : '#f1f5f9',
                    borderColor:     complete ? '#059669' : active ? '#003366' : '#cbd5e1',
                    color:           complete ? '#fff'    : active ? '#fff'    : '#1e293b',
                  }}
                  role="img"
                  aria-label={`Paso ${idx + 1}: ${step.label} - ${statusText}`}
                >
                  {complete ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : idx + 1}
                </div>
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: complete ? '#059669' : active ? '#003366' : '#1e293b',
                  whiteSpace: 'nowrap',
                }}>
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  margin: '0 4px',
                  marginBottom: '18px',
                  borderRadius: '99px',
                  backgroundColor: complete ? '#059669' : '#e2e8f0',
                  transition: 'background-color 0.5s',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};