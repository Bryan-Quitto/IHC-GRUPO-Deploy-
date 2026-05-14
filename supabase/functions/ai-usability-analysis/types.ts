// supabase/functions/ai-usability-analysis/types.ts
// ============================================================
// Tipos TypeScript estrictos para la Edge Function
// Compatible con src/models/types.ts del proyecto existente
// ============================================================

// ----------------------------------------------------------
// INPUT: Lo que recibe la Edge Function
// ----------------------------------------------------------

export interface TestPlan {
  objective: string;
  method: string;
  targetUsers?: string;
  duration?: number;       // minutos
  tasksCount?: number;
}

export interface Observation {
  participant: string;
  task: string;
  issue: string;
  severity: "Crítica" | "Alta" | "Media" | "Baja" | "Critical" | "High" | "Medium" | "Low";
  timestamp?: string;
  notes?: string;
}

export interface Metrics {
  taskSuccess: number;       // 0-100 porcentaje
  averageTime: number;       // segundos
  satisfaction: number;      // 1-5 escala Likert
  errorRate?: number;        // 0-100 porcentaje
  completionRate?: number;   // 0-100 porcentaje
}

export interface AIAnalysisInput {
  projectName: string;
  testPlan: TestPlan;
  observations: Observation[];
  metrics: Metrics;
  context?: string;          // Contexto adicional opcional
}

// ----------------------------------------------------------
// OUTPUT: Lo que retorna la Edge Function
// ----------------------------------------------------------

export type SeverityLevel = "Crítica" | "Alta" | "Media" | "Baja";

export interface CriticalIssue {
  title: string;
  severity: SeverityLevel;
  heuristic: string;         // Heurística Nielsen afectada (ej: "H1: Visibilidad del estado")
  description: string;
  recommendation: string;
  affectedUsers?: number;    // Porcentaje estimado de usuarios afectados
  wcagCriteria?: string;     // Criterio WCAG si aplica (ej: "WCAG 2.1 AA — 1.3.1")
}

export interface Recommendation {
  title: string;
  priority: "Inmediata" | "Corto plazo" | "Mediano plazo";
  effort: "Bajo" | "Medio" | "Alto";
  impact: "Bajo" | "Medio" | "Alto";
  description: string;
  rationale: string;
}

export interface AccessibilityIssue {
  criterion: string;         // Criterio WCAG (ej: "1.4.3 Contraste de color")
  level: "A" | "AA" | "AAA";
  description: string;
  recommendation: string;
}

export interface AIAnalysisOutput {
  summary: string;
  criticalIssues: CriticalIssue[];
  recommendations: Recommendation[];
  accessibilityIssues: AccessibilityIssue[];
  priorityScore: number;     // 0-100: puntuación global de urgencia
  analysisMetadata: {
    model: string;
    tokensUsed?: number;
    processingTimeMs: number;
    observationsAnalyzed: number;
    confidence: "Alta" | "Media" | "Baja";
  };
}

// ----------------------------------------------------------
// INTERNOS: Tipos de respuesta HTTP
// ----------------------------------------------------------

export interface EdgeFunctionResponse {
  success: boolean;
  data?: AIAnalysisOutput;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  timestamp: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedInput?: AIAnalysisInput;
}