import type { Observation } from "./types";

// ----------------------------------------------------------
// Severidades
// ----------------------------------------------------------

export type SeverityES = "Crítica" | "Alta" | "Media" | "Baja";
export type SeverityEN = "Critical" | "High" | "Medium" | "Low";
export type ObservationSeverity = SeverityES | SeverityEN;

// ----------------------------------------------------------
// UsabilityObservation
// ----------------------------------------------------------

export interface UsabilityObservation {
  participant: string;
  task: string;
  issue: string;
  severity: ObservationSeverity;
  notes?: string;
}

// ----------------------------------------------------------
// TestPlanContext
// ----------------------------------------------------------

export interface TestPlanContext {
  objective: string;
  method: string;
  targetUsers?: string;
  duration?: number;
  tasksCount?: number;
}

// ----------------------------------------------------------
// UsabilityMetrics
// ----------------------------------------------------------

export interface UsabilityMetrics {
  taskSuccess: number;
  averageTime: number;
  satisfaction: number;
  errorRate?: number;
  completionRate?: number;
}

// ----------------------------------------------------------
// UsabilityAnalysisRequest — payload completo a la Edge Function
// ----------------------------------------------------------

export interface UsabilityAnalysisRequest {
  projectName: string;
  testPlan: TestPlanContext;
  observations: UsabilityObservation[];
  metrics: UsabilityMetrics;
  context?: string;
}

// ----------------------------------------------------------
// ProposedSolution
// ----------------------------------------------------------

export interface ProposedSolution {
  title: string;
  priority: "Inmediata" | "Corto plazo" | "Mediano plazo";
  effort: "Bajo" | "Medio" | "Alto";
  impact: "Bajo" | "Medio" | "Alto";
  description: string;
  rationale: string;
}

// ----------------------------------------------------------
// AnalyzedIssue
// ----------------------------------------------------------

export interface AnalyzedIssue {
  title: string;
  severity: SeverityES;
  heuristic: string;
  description: string;
  recommendation: string;
  affectedUsers?: number;
  wcagCriteria?: string;
}

// ----------------------------------------------------------
// AccessibilityFinding
// ----------------------------------------------------------

export interface AccessibilityFinding {
  criterion: string;
  level: "A" | "AA" | "AAA";
  description: string;
  recommendation: string;
}

// ----------------------------------------------------------
// UsabilityAnalysisResult
// ----------------------------------------------------------

export interface UsabilityAnalysisResult {
  summary: string;
  criticalIssues: AnalyzedIssue[];
  recommendations: ProposedSolution[];
  accessibilityIssues: AccessibilityFinding[];
  priorityScore: number;
  analysisMetadata: {
    model: string;
    tokensUsed?: number;
    processingTimeMs: number;
    observationsAnalyzed: number;
    confidence: "Alta" | "Media" | "Baja";
  };
}

// ----------------------------------------------------------
// AnalysisError
// ----------------------------------------------------------

export type AnalysisErrorCode =
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "EDGE_FUNCTION_ERROR"
  | "PARSE_ERROR"
  | "AUTH_ERROR"
  | "EMPTY_OBSERVATIONS"
  | "UNKNOWN_ERROR";

export interface AnalysisError {
  code: AnalysisErrorCode;
  message: string;
  details?: string;
}

// ----------------------------------------------------------
// AnalysisControllerState
// ----------------------------------------------------------

export type AnalysisStatus = "idle" | "loading" | "success" | "error";

export interface AnalysisControllerState {
  status: AnalysisStatus;
  result: UsabilityAnalysisResult | null;
  error: AnalysisError | null;
  lastAnalyzedAt: Date | null;
}