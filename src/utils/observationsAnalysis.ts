// src/utils/observationsAnalysis.ts
import { Observation, Severity, Finding } from '../models/types';

// ─── Sugerencias de autocompletado ────────────────────────────────────────────
export const PROBLEM_SUGGESTIONS = [
  'El usuario no encontró el botón de acción principal',
  'La navegación entre secciones resultó confusa',
  'Los mensajes de error no son claros ni descriptivos',
  'El formulario no indica qué campos son obligatorios',
  'Los íconos no comunican su función sin etiqueta de texto',
  'El flujo de la tarea requiere demasiados pasos',
  'La información importante no tiene suficiente contraste visual',
  'El usuario no supo que la acción fue completada exitosamente',
  'El menú de navegación no refleja la jerarquía de contenidos',
  'Los tiempos de carga generaron abandono de la tarea',
  'La retroalimentación de errores aparece tarde o en lugar inesperado',
  'El usuario confundió elementos decorativos con interactivos',
  'No existe confirmación antes de acciones destructivas',
  'El contenido desaparece al interactuar con otro elemento',
  'La pantalla no se adapta correctamente al dispositivo usado',
];

export const PROPOSAL_SUGGESTIONS = [
  'Aumentar el tamaño y contraste del botón principal',
  'Simplificar el flujo reduciendo pasos intermedios',
  'Agregar etiquetas descriptivas junto a los íconos',
  'Mostrar indicador de progreso en formularios de varios pasos',
  'Resaltar los campos obligatorios con asterisco y color',
  'Añadir mensaje de confirmación al completar la acción',
  'Mejorar el contraste de texto según WCAG AA (4.5:1)',
  'Incorporar breadcrumbs para mostrar la ubicación del usuario',
  'Agregar tooltip con descripción al pasar el cursor sobre elementos',
  'Implementar búsqueda con autocompletado en el campo afectado',
  'Rediseñar el mensaje de error para incluir pasos de solución',
  'Agrupar opciones relacionadas para reducir carga cognitiva',
  'Agregar confirmación modal antes de eliminar o modificar datos',
  'Usar skeleton loading para mejorar percepción de velocidad',
  'Hacer el área de clic mínima de 44×44px según iOS HIG',
];

// ─── Sugerir severidad automáticamente ───────────────────────────────────────
export function suggestSeverity(obs: Partial<Observation>): Severity {
  const errors  = obs.errors  ?? 0;
  const success = obs.success_level;
  const comment = (obs.comments || '').toLowerCase();
  const problem = (obs.problem  || '').toLowerCase();

  const criticalKeywords = ['bloqueó', 'bloqueado', 'no pudo', 'imposible', 'fallo total', 'abandonó', 'frustrado', 'crítico', 'no funciona'];
  const highKeywords     = ['confuso', 'difícil', 'tardó mucho', 'perdido', 'error', 'falló', 'no encontró', 'varios intentos'];
  const text = comment + ' ' + problem;

  const hasCritical = criticalKeywords.some(k => text.includes(k));
  const hasHigh     = highKeywords.some(k => text.includes(k));

  if (success === 'No' && (errors >= 3 || hasCritical)) return 'Crítica';
  if (success === 'No' || (errors >= 3 && hasCritical))  return 'Alta';
  if (success === 'Con ayuda' && errors >= 2)             return 'Alta';
  if (errors >= 3 || hasCritical)                        return 'Alta';
  if (success === 'Con ayuda' || errors >= 2 || hasHigh) return 'Media';
  if (errors === 1 || success === 'Sí')                  return 'Baja';
  return 'Baja';
}

// ─── Métricas por tarea ───────────────────────────────────────────────────────
export interface TaskMetrics {
  taskRef:     string;
  total:       number;
  successCount: number;
  failCount:   number;
  helpCount:   number;
  successRate: number;           // 0–100
  avgTime:     number;           // segundos
  totalErrors: number;
  avgErrors:   number;
  severityCounts: Record<Severity, number>;
  hasProblem:  boolean;          // tasa éxito < 60%
  isHighError: boolean;          // promedio errores > 2
}

export function computeTaskMetrics(observations: Observation[]): TaskMetrics[] {
  const byTask: Record<string, Observation[]> = {};
  for (const obs of observations) {
    const key = obs.task_ref || '(sin tarea)';
    if (!byTask[key]) byTask[key] = [];
    byTask[key].push(obs);
  }

  return Object.entries(byTask).map(([taskRef, obs]) => {
    const total        = obs.length;
    const successCount = obs.filter(o => o.success_level === 'Sí').length;
    const failCount    = obs.filter(o => o.success_level === 'No').length;
    const helpCount    = obs.filter(o => o.success_level === 'Con ayuda').length;
    const successRate  = total > 0 ? Math.round((successCount / total) * 100) : 0;
    const totalTime    = obs.reduce((s, o) => s + (o.time_seconds || 0), 0);
    const avgTime      = total > 0 ? Math.round(totalTime / total) : 0;
    const totalErrors  = obs.reduce((s, o) => s + (o.errors || 0), 0);
    const avgErrors    = total > 0 ? parseFloat((totalErrors / total).toFixed(1)) : 0;

    const severityCounts: Record<Severity, number> = { Baja: 0, Media: 0, Alta: 0, Crítica: 0 };
    for (const o of obs) severityCounts[o.severity] = (severityCounts[o.severity] || 0) + 1;

    return {
      taskRef, total, successCount, failCount, helpCount,
      successRate, avgTime, totalErrors, avgErrors, severityCounts,
      hasProblem:  successRate < 60,
      isHighError: avgErrors > 2,
    };
  });
}

// ─── Detectar problemas repetidos ────────────────────────────────────────────
export interface RepeatedProblem {
  text:  string;
  count: number;
  tasks: string[];
}

export function detectRepeatedProblems(observations: Observation[]): RepeatedProblem[] {
  const map: Record<string, { count: number; tasks: Set<string> }> = {};

  for (const obs of observations) {
    const raw = (obs.problem || '').trim().toLowerCase();
    if (!raw) continue;

    // Normalizar para agrupar similares (primeras 40 letras como clave simple)
    const key = raw.slice(0, 40);
    if (!map[key]) map[key] = { count: 0, tasks: new Set() };
    map[key].count++;
    if (obs.task_ref) map[key].tasks.add(obs.task_ref);
  }

  return Object.entries(map)
    .filter(([, v]) => v.count >= 2)
    .map(([text, v]) => ({ text, count: v.count, tasks: [...v.tasks] }))
    .sort((a, b) => b.count - a.count);
}

// ─── Generar insights de usabilidad ─────────────────────────────────────────
export type InsightLevel = 'info' | 'warning' | 'critical';

export interface UsabilityInsight {
  id:      string;
  level:   InsightLevel;
  message: string;
  detail?: string;
  taskRef?: string;
}

export function generateInsights(
  observations: Observation[],
  taskMetrics: TaskMetrics[],
  repeatedProblems: RepeatedProblem[]
): UsabilityInsight[] {
  const insights: UsabilityInsight[] = [];

  // Por tarea
  for (const tm of taskMetrics) {
    if (tm.successRate === 0 && tm.total >= 2) {
      insights.push({
        id:      `task-zero-${tm.taskRef}`,
        level:   'critical',
        message: `Tarea "${tm.taskRef}" — tasa de éxito 0%`,
        detail:  `Ninguno de los ${tm.total} participantes completó esta tarea. Requiere rediseño urgente.`,
        taskRef: tm.taskRef,
      });
    } else if (tm.hasProblem && tm.total >= 2) {
      insights.push({
        id:      `task-low-${tm.taskRef}`,
        level:   'warning',
        message: `Tarea "${tm.taskRef}" — baja tasa de éxito (${tm.successRate}%)`,
        detail:  `Solo ${tm.successCount} de ${tm.total} participantes completaron la tarea sin ayuda.`,
        taskRef: tm.taskRef,
      });
    }
    if (tm.isHighError) {
      insights.push({
        id:      `task-errors-${tm.taskRef}`,
        level:   'warning',
        message: `Tarea "${tm.taskRef}" — promedio alto de errores (${tm.avgErrors}/sesión)`,
        detail:  `${tm.totalErrors} errores en ${tm.total} sesiones. Revisar la usabilidad del flujo.`,
        taskRef: tm.taskRef,
      });
    }
    if (tm.severityCounts['Crítica'] > 0) {
      insights.push({
        id:      `task-critical-${tm.taskRef}`,
        level:   'critical',
        message: `Tarea "${tm.taskRef}" — ${tm.severityCounts['Crítica']} observación(es) crítica(s)`,
        taskRef: tm.taskRef,
      });
    }
  }

  // Problemas repetidos
  for (const rp of repeatedProblems.slice(0, 3)) {
    insights.push({
      id:      `repeated-${rp.text.slice(0, 20)}`,
      level:   rp.count >= 3 ? 'critical' : 'warning',
      message: `Problema frecuente (${rp.count} veces): "${rp.text.slice(0, 60)}${rp.text.length > 60 ? '…' : ''}"`,
      detail:  rp.tasks.length > 0 ? `Aparece en tareas: ${rp.tasks.join(', ')}` : undefined,
    });
  }

  // General
  const criticalCount = observations.filter(o => o.severity === 'Crítica').length;
  if (criticalCount >= 3) {
    insights.push({
      id:    'many-criticals',
      level: 'critical',
      message: `${criticalCount} observaciones con severidad Crítica`,
      detail: 'Alto impacto en la experiencia. Considera detener el lanzamiento hasta resolver los bloqueantes.',
    });
  }

  const globalSuccessRate = observations.length > 0
    ? Math.round(observations.filter(o => o.success_level === 'Sí').length / observations.length * 100)
    : 100;

  if (observations.length >= 3 && globalSuccessRate < 50) {
    insights.push({
      id:    'low-global-success',
      level: 'critical',
      message: `Tasa de éxito global muy baja: ${globalSuccessRate}%`,
      detail: 'Más de la mitad de las sesiones no logran completar las tareas.',
    });
  } else if (observations.length >= 3 && globalSuccessRate >= 80) {
    insights.push({
      id:    'good-global-success',
      level: 'info',
      message: `Tasa de éxito global satisfactoria: ${globalSuccessRate}%`,
      detail: 'La mayoría de participantes completó las tareas sin ayuda.',
    });
  }

  return insights;
}

// ─── Convertir observación en hallazgo candidato ─────────────────────────────
export interface FindingCandidate {
  observationId: string;
  reason:        string;
  suggestedFinding: Partial<Finding>;
}

export function detectFindingCandidates(observations: Observation[]): FindingCandidate[] {
  const candidates: FindingCandidate[] = [];

  for (const obs of observations) {
    const isCritical   = obs.severity === 'Crítica';
    const manyErrors   = (obs.errors || 0) >= 3;
    const failed       = obs.success_level === 'No';

    if (!isCritical && !manyErrors && !(failed && (obs.errors || 0) >= 2)) continue;

    const reasons: string[] = [];
    if (isCritical)  reasons.push('severidad crítica');
    if (manyErrors)  reasons.push(`${obs.errors} errores`);
    if (failed)      reasons.push('tarea fallida');

    candidates.push({
      observationId: obs.id!,
      reason: reasons.join(', '),
      suggestedFinding: {
        problem:        obs.problem || obs.comments || '',
        evidence:       `Participante ${obs.participant}${obs.task_ref ? `, tarea ${obs.task_ref}` : ''}: ${obs.comments || ''}`.trim(),
        frequency:      '1/' + observations.filter(o => o.task_ref === obs.task_ref).length,
        severity:       obs.severity,
        recommendation: obs.proposal || '',
        priority:       isCritical ? 'Alta' : 'Media',
        status:         'Pendiente',
      },
    });
  }

  return candidates;
}