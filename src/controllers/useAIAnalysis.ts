// src/controllers/useAIAnalysis.ts
// ============================================================
// Hook que conecta el frontend con la Edge Function de IA
// Reutiliza supabaseClient.ts y types.ts existentes
// Compatible con la arquitectura de hooks del proyecto
// ============================================================

import { useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

// ============================================================
// TIPOS DEL HOOK (compatibles con types.ts existente)
// ============================================================

export interface AIAnalysisRequest {
  projectName: string;
  testPlan: {
    objective: string;
    method: string;
    targetUsers?: string;
    duration?: number;
    tasksCount?: number;
  };
  observations: Array<{
    participant: string;
    task: string;
    issue: string;
    severity: string;
    notes?: string;
  }>;
  metrics: {
    taskSuccess: number;
    averageTime: number;
    satisfaction: number;
    errorRate?: number;
    completionRate?: number;
  };
  context?: string;
}

export interface CriticalIssue {
  title: string;
  severity: "Crítica" | "Alta" | "Media" | "Baja";
  heuristic: string;
  description: string;
  recommendation: string;
  affectedUsers?: number;
  wcagCriteria?: string;
}

export interface AIRecommendation {
  title: string;
  priority: "Inmediata" | "Corto plazo" | "Mediano plazo";
  effort: "Bajo" | "Medio" | "Alto";
  impact: "Bajo" | "Medio" | "Alto";
  description: string;
  rationale: string;
}

export interface AccessibilityIssue {
  criterion: string;
  level: "A" | "AA" | "AAA";
  description: string;
  recommendation: string;
}

export interface AIAnalysisResult {
  summary: string;
  criticalIssues: CriticalIssue[];
  recommendations: AIRecommendation[];
  accessibilityIssues: AccessibilityIssue[];
  priorityScore: number;
  analysisMetadata: {
    model: string;
    tokensUsed?: number;
    processingTimeMs: number;
    observationsAnalyzed: number;
    confidence: "Alta" | "Media" | "Baja";
  };
}

export interface AIAnalysisState {
  result: AIAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  lastAnalyzedAt: Date | null;
}

// ============================================================
// EDGE FUNCTION URL
// ============================================================

const EDGE_FUNCTION_NAME = "ai-usability-analysis";

// ============================================================
// HOOK PRINCIPAL
// ============================================================

export function useAIAnalysis() {
  const [state, setState] = useState<AIAnalysisState>({
    result: null,
    isLoading: false,
    error: null,
    lastAnalyzedAt: null,
  });

  // Ref para cancelar solicitudes en vuelo si el componente se desmonta
  const abortControllerRef = useRef<AbortController | null>(null);

  // ----------------------------------------------------------
  // Función principal de análisis
  // ----------------------------------------------------------
  const analyze = useCallback(async (request: AIAnalysisRequest): Promise<AIAnalysisResult | null> => {
    // Cancelar solicitud previa si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Invocar la Edge Function a través del cliente Supabase
      // Esto automáticamente incluye el token de auth del usuario
      const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
        body: request,
      });

      if (error) {
        // Error de red o Supabase
        throw new Error(error.message || "Error al conectar con el servicio de análisis");
      }

      if (!data || !data.success) {
        // Error retornado por la Edge Function
        const apiError = data?.error;
        throw new Error(
          apiError?.message || "El análisis de IA no pudo completarse"
        );
      }

      const result = data.data as AIAnalysisResult;

      setState({
        result,
        isLoading: false,
        error: null,
        lastAnalyzedAt: new Date(),
      });

      return result;

    } catch (err) {
      // No actualizar estado si fue cancelado por unmount
      if (err instanceof Error && err.name === "AbortError") {
        return null;
      }

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error inesperado en el análisis de IA";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return null;
    }
  }, []);

  // ----------------------------------------------------------
  // Limpiar el resultado
  // ----------------------------------------------------------
  const clearResult = useCallback(() => {
    setState({
      result: null,
      isLoading: false,
      error: null,
      lastAnalyzedAt: null,
    });
  }, []);

  // ----------------------------------------------------------
  // Cancelar análisis en progreso
  // ----------------------------------------------------------
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: null,
    }));
  }, []);

  return {
    ...state,
    analyze,
    clearResult,
    cancelAnalysis,
  };
}