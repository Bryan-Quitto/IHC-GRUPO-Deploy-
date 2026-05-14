// supabase/functions/ai-usability-analysis/validator.ts
// ============================================================
// Validación estricta y sanitización del input
// Previene prompt injection y datos maliciosos
// ============================================================

import type { AIAnalysisInput, ValidationResult, Observation } from "./types.ts";

// ============================================================
// CONSTANTES DE VALIDACIÓN
// ============================================================

const LIMITS = {
  projectName: { min: 3, max: 200 },
  objective: { min: 10, max: 1000 },
  method: { min: 3, max: 200 },
  observations: { min: 1, max: 100 },
  issue: { min: 3, max: 500 },
  participant: { min: 1, max: 50 },
  task: { min: 3, max: 300 },
  context: { max: 2000 },
} as const;

const VALID_SEVERITIES = [
  "Crítica", "Alta", "Media", "Baja",
  "Critical", "High", "Medium", "Low"
] as const;

// Patrones de prompt injection más comunes
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/gi,
  /system\s*prompt/gi,
  /you\s+are\s+now/gi,
  /forget\s+(everything|all|your)/gi,
  /act\s+as\s+(a\s+)?(?!ux|researcher|analyst)/gi,
  /jailbreak/gi,
  /<\s*script\s*>/gi,
  /\$\{.*\}/g,           // Template injection
  /\{\{.*\}\}/g,         // Template injection alternativo
];

// ============================================================
// FUNCIONES DE SANITIZACIÓN
// ============================================================

/**
 * Sanitiza un string: elimina caracteres peligrosos y normaliza
 */
function sanitizeString(value: string, maxLength: number): string {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .slice(0, maxLength)
    // Eliminar caracteres de control excepto newlines y tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Normalizar múltiples espacios
    .replace(/\s{3,}/g, "  ")
    // Eliminar null bytes
    .replace(/\0/g, "");
}

/**
 * Detecta patrones de prompt injection
 */
function detectInjection(value: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Valida y sanitiza un número en rango
 */
function sanitizeNumber(value: unknown, min: number, max: number): number | null {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) return null;
  return Math.round(num * 100) / 100; // máximo 2 decimales
}

// ============================================================
// VALIDADOR PRINCIPAL
// ============================================================

export function validateAndSanitize(body: unknown): ValidationResult {
  const errors: string[] = [];

  // ----------------------------------------------------------
  // Validación de tipo base
  // ----------------------------------------------------------
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      isValid: false,
      errors: ["El cuerpo de la petición debe ser un objeto JSON válido"],
    };
  }

  const input = body as Record<string, unknown>;

  // ----------------------------------------------------------
  // Validar projectName
  // ----------------------------------------------------------
  if (!input.projectName || typeof input.projectName !== "string") {
    errors.push("projectName es requerido y debe ser un string");
  } else {
    if (input.projectName.length < LIMITS.projectName.min) {
      errors.push(`projectName debe tener al menos ${LIMITS.projectName.min} caracteres`);
    }
    if (detectInjection(input.projectName)) {
      errors.push("projectName contiene contenido no permitido");
    }
  }

  // ----------------------------------------------------------
  // Validar testPlan
  // ----------------------------------------------------------
  if (!input.testPlan || typeof input.testPlan !== "object" || Array.isArray(input.testPlan)) {
    errors.push("testPlan es requerido y debe ser un objeto");
  } else {
    const plan = input.testPlan as Record<string, unknown>;

    if (!plan.objective || typeof plan.objective !== "string" ||
        plan.objective.length < LIMITS.objective.min) {
      errors.push(`testPlan.objective es requerido (mínimo ${LIMITS.objective.min} caracteres)`);
    } else if (detectInjection(plan.objective)) {
      errors.push("testPlan.objective contiene contenido no permitido");
    }

    if (!plan.method || typeof plan.method !== "string" ||
        plan.method.length < LIMITS.method.min) {
      errors.push(`testPlan.method es requerido (mínimo ${LIMITS.method.min} caracteres)`);
    }
  }

  // ----------------------------------------------------------
  // Validar observations
  // ----------------------------------------------------------
  if (!input.observations || !Array.isArray(input.observations)) {
    errors.push("observations es requerido y debe ser un array");
  } else {
    if (input.observations.length < LIMITS.observations.min) {
      errors.push(`Se requiere al menos ${LIMITS.observations.min} observación`);
    }
    if (input.observations.length > LIMITS.observations.max) {
      errors.push(`Máximo ${LIMITS.observations.max} observaciones por análisis`);
    }

    input.observations.forEach((obs: unknown, index: number) => {
      if (!obs || typeof obs !== "object") {
        errors.push(`observations[${index}]: debe ser un objeto`);
        return;
      }

      const o = obs as Record<string, unknown>;

      if (!o.participant || typeof o.participant !== "string") {
        errors.push(`observations[${index}].participant es requerido`);
      }

      if (!o.task || typeof o.task !== "string" || o.task.length < LIMITS.task.min) {
        errors.push(`observations[${index}].task es requerido (mínimo ${LIMITS.task.min} chars)`);
      }

      if (!o.issue || typeof o.issue !== "string" || o.issue.length < LIMITS.issue.min) {
        errors.push(`observations[${index}].issue es requerido (mínimo ${LIMITS.issue.min} chars)`);
      } else if (detectInjection(o.issue as string)) {
        errors.push(`observations[${index}].issue contiene contenido no permitido`);
      }

      if (!o.severity || !VALID_SEVERITIES.includes(o.severity as typeof VALID_SEVERITIES[number])) {
        errors.push(`observations[${index}].severity debe ser: ${VALID_SEVERITIES.join(", ")}`);
      }
    });
  }

  // ----------------------------------------------------------
  // Validar metrics
  // ----------------------------------------------------------
  if (!input.metrics || typeof input.metrics !== "object") {
    errors.push("metrics es requerido y debe ser un objeto");
  } else {
    const m = input.metrics as Record<string, unknown>;

    if (sanitizeNumber(m.taskSuccess, 0, 100) === null) {
      errors.push("metrics.taskSuccess debe ser un número entre 0 y 100");
    }
    if (sanitizeNumber(m.averageTime, 0, 86400) === null) {
      errors.push("metrics.averageTime debe ser un número entre 0 y 86400 (segundos)");
    }
    if (sanitizeNumber(m.satisfaction, 1, 5) === null) {
      errors.push("metrics.satisfaction debe ser un número entre 1 y 5");
    }
  }

  // ----------------------------------------------------------
  // Retornar errores si los hay
  // ----------------------------------------------------------
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // ----------------------------------------------------------
  // Sanitizar el input válido
  // ----------------------------------------------------------
  const rawInput = input as Record<string, unknown>;
  const rawPlan = rawInput.testPlan as Record<string, unknown>;
  const rawMetrics = rawInput.metrics as Record<string, unknown>;

  const sanitizedInput: AIAnalysisInput = {
    projectName: sanitizeString(rawInput.projectName as string, LIMITS.projectName.max),
    testPlan: {
      objective: sanitizeString(rawPlan.objective as string, LIMITS.objective.max),
      method: sanitizeString(rawPlan.method as string, LIMITS.method.max),
      targetUsers: rawPlan.targetUsers
        ? sanitizeString(rawPlan.targetUsers as string, 200)
        : undefined,
      duration: rawPlan.duration ? Number(rawPlan.duration) : undefined,
      tasksCount: rawPlan.tasksCount ? Number(rawPlan.tasksCount) : undefined,
    },
    observations: (rawInput.observations as unknown[]).map((obs) => {
      const o = obs as Record<string, unknown>;
      return {
        participant: sanitizeString(o.participant as string, LIMITS.participant.max),
        task: sanitizeString(o.task as string, LIMITS.task.max),
        issue: sanitizeString(o.issue as string, LIMITS.issue.max),
        severity: o.severity as Observation["severity"],
        notes: o.notes ? sanitizeString(o.notes as string, 300) : undefined,
      };
    }),
    metrics: {
      taskSuccess: sanitizeNumber(rawMetrics.taskSuccess, 0, 100) as number,
      averageTime: sanitizeNumber(rawMetrics.averageTime, 0, 86400) as number,
      satisfaction: sanitizeNumber(rawMetrics.satisfaction, 1, 5) as number,
      errorRate: rawMetrics.errorRate
        ? (sanitizeNumber(rawMetrics.errorRate, 0, 100) ?? undefined)
        : undefined,
      completionRate: rawMetrics.completionRate
        ? (sanitizeNumber(rawMetrics.completionRate, 0, 100) ?? undefined)
        : undefined,
    },
    context: rawInput.context
      ? sanitizeString(rawInput.context as string, LIMITS.context.max)
      : undefined,
  };

  return {
    isValid: true,
    errors: [],
    sanitizedInput,
  };
}