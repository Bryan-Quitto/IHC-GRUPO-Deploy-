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

/**
 * Indicador de progreso del flujo de usabilidad.
 *
 * [Fase 4 — Espacio] Padding interno p-5 con separación de pasos
 * mediante conectores flex-1. El espacio entre el encabezado y los
 * pasos (mb-4) es mayor que el espacio entre paso y etiqueta (gap-1.5),
 * aplicando la Ley de Proximidad de Gestalt.
 *
 * [Fase 5 — Guía de atención] El paso activo recibe ring-4 ring-navy/20
 * y scale-110: tamaño mayor + anillo de enfoque actúan como señal
 * pre-atentiva de "estás aquí" sin requerir lectura consciente.
 * Implementa Nielsen #1 (Visibilidad del estado del sistema).
 * Los pasos completados usan emerald para comunicar logro.
 * Los pasos pendientes usan slate neutro para no competir visualmente
 * con el paso activo — jerarquía de atención por contraste relativo.
 */
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
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 shadow-sm">

      {/* Encabezado */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
          Progreso del plan
        </span>
        <span className="text-xs font-extrabold text-navy">
          {completedCount} de {steps.length} · {progressPct}%
        </span>
      </div>

      {/* Barra global */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-navy to-blue-500 transition-all duration-700"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso general: ${progressPct}%`}
        />
      </div>

      {/* Pasos */}
      <div className="flex items-center w-full">
        {steps.map((step, idx) => {
          const complete   = isStepComplete(step.id);
          const active     = activeTab === step.id;
          const isLast     = idx === steps.length - 1;
          const statusText = complete ? 'completado' : active ? 'activo' : 'pendiente';

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                {/*
                  [Fase 5 — Guía de atención]
                  Activo: w-9 h-9 + ring-4 ring-navy/20 + scale-110
                    → 12% más grande + anillo exterior = señal pre-atentiva doble.
                    El usuario detecta "dónde está" antes de leer la etiqueta.
                  Completo: emerald w-8 h-8 → logro visual sin competir con activo.
                  Pendiente: slate w-8 h-8 → neutro, no roba atención.
                  Esta jerarquía de atención sigue el principio de pre-atención
                  visual (Ware, 2004): tamaño + color saturado atraen primero.
                */}
                <div
                  className={`rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all duration-300 ${
                    complete
                      ? 'w-8 h-8 bg-emerald-600 border-emerald-600 text-white'
                      : active
                        ? 'w-9 h-9 bg-navy border-navy text-white ring-4 ring-navy/20 scale-110'
                        : 'w-8 h-8 bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                  role="img"
                  aria-label={`Paso ${idx + 1}: ${step.label} — ${statusText}`}
                >
                  {complete ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : idx + 1}
                </div>

                <span className={`text-[0.8rem] font-bold whitespace-nowrap transition-colors ${
                  complete ? 'text-emerald-600' : active ? 'text-navy font-extrabold' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>

              {/* Conector — verde cuando el paso izquierdo está completo */}
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all duration-500 ${
                  complete ? 'bg-emerald-500' : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};