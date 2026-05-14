// supabase/functions/ai-usability-analysis/contextBuilder.ts
// ============================================================
// Ensambla el contexto optimizado para Gemini
// Minimiza tokens sin perder información crítica
// ============================================================

import type { AIAnalysisInput, Observation } from "./types.ts";

// ============================================================
// AGRUPACIÓN DE OBSERVACIONES POR PATRONES
// ============================================================

interface GroupedObservation {
  issue: string;
  participants: string[];
  tasks: Set<string>;
  severities: string[];
  maxSeverity: string;
  count: number;
}

/**
 * Agrupa observaciones similares para reducir tokens redundantes
 * Detecta el mismo issue reportado por múltiples participantes
 */
function groupSimilarObservations(observations: Observation[]): GroupedObservation[] {
  const groups = new Map<string, GroupedObservation>();

  observations.forEach((obs) => {
    // Crear clave de agrupación basada en la esencia del issue (primeras 60 chars normalizadas)
    const key = obs.issue
      .toLowerCase()
      .replace(/[^a-záéíóúüñ0-9\s]/g, "")
      .trim()
      .slice(0, 60);

    if (groups.has(key)) {
      const group = groups.get(key)!;
      if (!group.participants.includes(obs.participant)) {
        group.participants.push(obs.participant);
      }
      group.tasks.add(obs.task);
      group.severities.push(obs.severity);
      group.count++;

      // Actualizar severidad máxima
      const severityOrder = ["Crítica", "Critical", "Alta", "High", "Media", "Medium", "Baja", "Low"];
      const currentMaxIndex = severityOrder.indexOf(group.maxSeverity);
      const newIndex = severityOrder.indexOf(obs.severity);
      if (newIndex < currentMaxIndex) {
        group.maxSeverity = obs.severity;
      }
    } else {
      groups.set(key, {
        issue: obs.issue,
        participants: [obs.participant],
        tasks: new Set([obs.task]),
        severities: [obs.severity],
        maxSeverity: obs.severity,
        count: 1,
      });
    }
  });

  return Array.from(groups.values())
    // Ordenar por severidad y frecuencia
    .sort((a, b) => {
      const severityOrder = ["Crítica", "Critical", "Alta", "High", "Media", "Medium", "Baja", "Low"];
      const aSeverity = severityOrder.indexOf(a.maxSeverity);
      const bSeverity = severityOrder.indexOf(b.maxSeverity);
      if (aSeverity !== bSeverity) return aSeverity - bSeverity;
      return b.count - a.count;
    });
}

// ============================================================
// CÁLCULO DE ESTADÍSTICAS LOCALES
// ============================================================

interface ObservationStats {
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  uniqueParticipants: number;
  uniqueTasks: number;
  mostProblematicTask: string;
  participantsWithMultipleIssues: number;
}

function calculateStats(observations: Observation[]): ObservationStats {
  const participants = new Set(observations.map((o) => o.participant));
  const tasks = new Set(observations.map((o) => o.task));

  // Contar issues por participante
  const issuesByParticipant = observations.reduce((acc, obs) => {
    acc[obs.participant] = (acc[obs.participant] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Contar issues por tarea
  const issuesByTask = observations.reduce((acc, obs) => {
    acc[obs.task] = (acc[obs.task] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostProblematicTask = Object.entries(issuesByTask)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || "No determinada";

  return {
    totalIssues: observations.length,
    criticalCount: observations.filter((o) => ["Crítica", "Critical"].includes(o.severity)).length,
    highCount: observations.filter((o) => ["Alta", "High"].includes(o.severity)).length,
    mediumCount: observations.filter((o) => ["Media", "Medium"].includes(o.severity)).length,
    lowCount: observations.filter((o) => ["Baja", "Low"].includes(o.severity)).length,
    uniqueParticipants: participants.size,
    uniqueTasks: tasks.size,
    mostProblematicTask,
    participantsWithMultipleIssues: Object.values(issuesByParticipant).filter((count) => count > 1).length,
  };
}

// ============================================================
// CONSTRUCTOR DE CONTEXTO PRINCIPAL
// ============================================================

/**
 * Construye el prompt de usuario optimizado para Gemini
 * Estructura la información para máximo impacto con mínimos tokens
 */
export function buildUserContext(input: AIAnalysisInput): string {
  const stats = calculateStats(input.observations);
  const grouped = groupSimilarObservations(input.observations);

  // ----------------------------------------------------------
  // SECCIÓN 1: Metadatos del proyecto
  // ----------------------------------------------------------
  const projectSection = `
=== PROYECTO DE PRUEBA ===
Nombre: ${input.projectName}
Objetivo: ${input.testPlan.objective}
Método: ${input.testPlan.method}
${input.testPlan.targetUsers ? `Usuarios objetivo: ${input.testPlan.targetUsers}` : ""}
${input.testPlan.duration ? `Duración: ${input.testPlan.duration} minutos` : ""}
${input.context ? `Contexto adicional: ${input.context}` : ""}
`.trim();

  // ----------------------------------------------------------
  // SECCIÓN 2: Métricas cuantitativas
  // ----------------------------------------------------------
  const metricsSection = `
=== MÉTRICAS CUANTITATIVAS ===
Tasa de éxito de tareas: ${input.metrics.taskSuccess}%
Tiempo promedio por tarea: ${input.metrics.averageTime}s (${Math.round(input.metrics.averageTime / 60 * 10) / 10} min)
Satisfacción del usuario: ${input.metrics.satisfaction}/5.0 (${input.metrics.satisfaction >= 4 ? "BUENA" : input.metrics.satisfaction >= 3 ? "REGULAR" : "DEFICIENTE"})
${input.metrics.errorRate !== undefined ? `Tasa de error: ${input.metrics.errorRate}%` : ""}
${input.metrics.completionRate !== undefined ? `Tasa de completación: ${input.metrics.completionRate}%` : ""}

INDICADORES DE ALERTA:
${input.metrics.taskSuccess < 60 ? "⚠️ CRÍTICO: Tasa de éxito por debajo del umbral mínimo aceptable (60%)" : ""}
${input.metrics.taskSuccess >= 60 && input.metrics.taskSuccess < 75 ? "⚠️ ADVERTENCIA: Tasa de éxito por debajo del objetivo estándar (75%)" : ""}
${input.metrics.satisfaction < 3 ? "⚠️ CRÍTICO: Satisfacción por debajo del umbral mínimo (3.0/5.0)" : ""}
${input.metrics.averageTime > 300 ? "⚠️ ADVERTENCIA: Tiempo promedio excede 5 minutos por tarea" : ""}
`.trim();

  // ----------------------------------------------------------
  // SECCIÓN 3: Resumen estadístico de observaciones
  // ----------------------------------------------------------
  const statsSection = `
=== ESTADÍSTICAS DE OBSERVACIONES ===
Total de issues registrados: ${stats.totalIssues}
Participantes únicos: ${stats.uniqueParticipants}
Tareas evaluadas: ${stats.uniqueTasks}
Tarea más problemática: ${stats.mostProblematicTask}
Participantes con múltiples issues: ${stats.participantsWithMultipleIssues}

Distribución por severidad:
- Crítica: ${stats.criticalCount} (${Math.round(stats.criticalCount / stats.totalIssues * 100)}%)
- Alta: ${stats.highCount} (${Math.round(stats.highCount / stats.totalIssues * 100)}%)
- Media: ${stats.mediumCount} (${Math.round(stats.mediumCount / stats.totalIssues * 100)}%)
- Baja: ${stats.lowCount} (${Math.round(stats.lowCount / stats.totalIssues * 100)}%)
`.trim();

  // ----------------------------------------------------------
  // SECCIÓN 4: Observaciones agrupadas (optimizadas en tokens)
  // ----------------------------------------------------------
  const observationsSection = `
=== OBSERVACIONES AGRUPADAS POR PATRÓN ===
${grouped.map((group, idx) => `
[PATRÓN ${idx + 1}] Severidad máxima: ${group.maxSeverity} | Frecuencia: ${group.count} vez/veces
Participantes: ${group.participants.join(", ")}
Tareas afectadas: ${Array.from(group.tasks).join("; ")}
Issue: ${group.issue}
`).join("\n").trim()}
`.trim();

  // ----------------------------------------------------------
  // SECCIÓN 5: Observaciones individuales críticas (verbatim)
  // Solo las críticas se incluyen completas para no perder contexto
  // ----------------------------------------------------------
  const criticalObs = input.observations.filter((o) =>
    ["Crítica", "Critical"].includes(o.severity)
  );

  const criticalSection = criticalObs.length > 0
    ? `
=== OBSERVACIONES CRÍTICAS — DETALLE COMPLETO ===
${criticalObs.map((obs) => `
[${obs.participant}] Tarea: "${obs.task}"
Issue: ${obs.issue}
${obs.notes ? `Notas: ${obs.notes}` : ""}
`).join("\n").trim()}`
    : "";

  // ----------------------------------------------------------
  // INSTRUCCIÓN FINAL
  // ----------------------------------------------------------
  const instruction = `
=== INSTRUCCIÓN ===
Analiza todos los datos anteriores como UX Researcher Senior.
Genera el JSON de análisis siguiendo EXACTAMENTE la estructura y criterios del system prompt.
Basa TODOS los hallazgos en los datos proporcionados.
NO generes hallazgos especulativos sin evidencia en las observaciones.
`;

  return [
    projectSection,
    metricsSection,
    statsSection,
    observationsSection,
    criticalSection,
    instruction,
  ].filter(Boolean).join("\n\n");
}