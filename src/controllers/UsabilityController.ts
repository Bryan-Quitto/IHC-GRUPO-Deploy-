import { useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Observation, TestPlan } from "../models/types";
import type {
  UsabilityAnalysisRequest,
  UsabilityAnalysisResult,
  UsabilityObservation,
  AnalysisControllerState,
  AnalysisError,
  AnalysisErrorCode,
} from "../models/usabilityModels";

const EDGE_FUNCTION_NAME = "ai-usability-analysis" as const;

// ----------------------------------------------------------
// Adaptador Observation → UsabilityObservation
// ----------------------------------------------------------

function adaptObservations(observations: Observation[]): UsabilityObservation[] {
  return observations.map((obs) => ({
    participant: obs.participant,
    task: obs.task_ref,
    issue: obs.problem,
    severity: obs.severity,
    notes: obs.comments || undefined,
  }));
}

// ----------------------------------------------------------
// Validación local del request
// ----------------------------------------------------------

function validateRequest(request: UsabilityAnalysisRequest): AnalysisError | null {
  if (!request.projectName || request.projectName.trim().length < 3) {
    return { code: "VALIDATION_ERROR", message: "El nombre del proyecto debe tener al menos 3 caracteres." };
  }
  if (!request.testPlan.objective || request.testPlan.objective.trim().length < 10) {
    return { code: "VALIDATION_ERROR", message: "El objetivo debe tener al menos 10 caracteres." };
  }
  if (!request.testPlan.method || request.testPlan.method.trim().length < 3) {
    return { code: "VALIDATION_ERROR", message: "El método del plan de prueba es requerido." };
  }
  if (!request.observations || request.observations.length === 0) {
    return { code: "EMPTY_OBSERVATIONS", message: "Se necesita al menos una observación para el análisis." };
  }
  if (request.observations.length > 100) {
    return { code: "VALIDATION_ERROR", message: "Máximo 100 observaciones por análisis." };
  }
  const { taskSuccess, averageTime, satisfaction } = request.metrics;
  if (taskSuccess < 0 || taskSuccess > 100) {
    return { code: "VALIDATION_ERROR", message: "taskSuccess debe estar entre 0 y 100." };
  }
  if (averageTime < 0) {
    return { code: "VALIDATION_ERROR", message: "averageTime no puede ser negativo." };
  }
  if (satisfaction < 1 || satisfaction > 5) {
    return { code: "VALIDATION_ERROR", message: "satisfaction debe estar entre 1 y 5." };
  }
  return null;
}

// ----------------------------------------------------------
// Validación de la estructura del JSON de respuesta
// ----------------------------------------------------------

function validateAnalysisResult(data: unknown): data is UsabilityAnalysisResult {
  if (!data || typeof data !== "object") return false;
  const r = data as Record<string, unknown>;
  if (typeof r.summary !== "string") return false;
  if (!Array.isArray(r.criticalIssues)) return false;
  if (!Array.isArray(r.recommendations)) return false;
  if (!Array.isArray(r.accessibilityIssues)) return false;
  if (typeof r.priorityScore !== "number") return false;
  if (!r.analysisMetadata || typeof r.analysisMetadata !== "object") return false;
  const meta = r.analysisMetadata as Record<string, unknown>;
  if (typeof meta.model !== "string") return false;
  if (typeof meta.processingTimeMs !== "number") return false;
  if (typeof meta.observationsAnalyzed !== "number") return false;
  if (!["Alta", "Media", "Baja"].includes(meta.confidence as string)) return false;
  return true;
}

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------

function buildError(code: AnalysisErrorCode, message: string, details?: string): AnalysisError {
  return { code, message, details };
}

function isAnalysisError(err: unknown): err is AnalysisError {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  return typeof e.code === "string" && typeof e.message === "string";
}

// ----------------------------------------------------------
// Hook principal: useUsabilityController
// ----------------------------------------------------------

export function useUsabilityController() {
  const [state, setState] = useState<AnalysisControllerState>({
    status: "idle",
    result: null,
    error: null,
    lastAnalyzedAt: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  async function runAnalysis(request: UsabilityAnalysisRequest): Promise<UsabilityAnalysisResult | null> {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const validationError = validateRequest(request);
    if (validationError) {
      setState({ status: "error", result: null, error: validationError, lastAnalyzedAt: null });
      return null;
    }

    setState((prev) => ({ ...prev, status: "loading", error: null }));

    console.log("🚀 Iniciando análisis de IA con payload:", JSON.stringify(request, null, 2));

    try {
      const { data, error: supabaseError } = await supabase.functions.invoke(
        EDGE_FUNCTION_NAME,
        { body: request }
      );

      console.log("📥 Respuesta de Supabase Edge Function:", { data, error: supabaseError });

      if (supabaseError) {
        console.error("❌ Error de Supabase Functions:", supabaseError);
        throw buildError("NETWORK_ERROR", supabaseError.message || "Error de conexión con el servicio de análisis.");
      }

      if (!data || data.success === false) {
        console.error("❌ La API devolvió un error:", data);
        const apiErr = data?.error as { code?: string; message?: string; details?: string } | undefined;

        // Detectar error de cuota (429 / quota exceeded)
        const isQuotaError =
          apiErr?.details?.includes("429") ||
          apiErr?.details?.toLowerCase().includes("quota") ||
          apiErr?.message?.toLowerCase().includes("quota");

        if (isQuotaError) {
          throw buildError(
            "RATE_LIMIT",
            "Has alcanzado el límite de análisis de IA. Los análisis estarán disponibles nuevamente dentro de 24 horas."
          );
        }

        throw buildError("EDGE_FUNCTION_ERROR", apiErr?.message || "El análisis de IA no pudo completarse.", apiErr?.code);
      }

      if (!validateAnalysisResult(data.data)) {
        throw buildError("PARSE_ERROR", "La respuesta del servicio de IA tiene un formato inesperado.");
      }

      const result = data.data as UsabilityAnalysisResult;

      // Verificar límite de tokens
      const tokensUsed = result.analysisMetadata?.tokensUsed ?? 0;
      if (tokensUsed > 30000) {
        throw buildError(
          "VALIDATION_ERROR",
          `El análisis es demasiado complejo (${tokensUsed.toLocaleString()} tokens). Por favor, elimine algunas observaciones y vuelva a intentar.`
        );
      }
      
      // ----------------------------------------------------------
      // PERSISTENCIA (Bryan - Punto 4)
      // ----------------------------------------------------------
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && request.context?.includes('planId:')) {
          const planId = request.context.split('planId:')[1];
          await supabase.from('analysis_history').insert({
            test_plan_id: planId,
            profile_id: user.id,
            project_name: request.projectName,
            request_data: request,
            result_data: result,
            metrics: request.metrics
          });
        }
      } catch (dbErr) {
        console.error("Error al persistir el historial:", dbErr);
      }

      setState({ status: "success", result, error: null, lastAnalyzedAt: new Date() });
      return result;

    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return null;

      const analysisError: AnalysisError = isAnalysisError(err)
        ? err
        : buildError("UNKNOWN_ERROR", err instanceof Error ? err.message : "Error inesperado.");

      setState((prev) => ({ ...prev, status: "error", error: analysisError }));
      return null;
    }
  }

  const analyzeFromPlan = useCallback(
    async (
      plan: TestPlan,
      observations: Observation[],
      taskSuccess: number,
      averageTime: number,
      satisfaction: number
    ): Promise<UsabilityAnalysisResult | null> => {
      const request: UsabilityAnalysisRequest = {
        projectName: `${plan.product} — ${plan.module}`.trim(),
        testPlan: {
          objective: plan.objective,
          method: plan.method,
          targetUsers: plan.user_profile || undefined,
        },
        observations: adaptObservations(observations),
        metrics: { taskSuccess, averageTime, satisfaction },
        context: `planId:${plan.id}`,
      };
      return runAnalysis(request);
    },
    []
  );

  const analyzeFromRequest = useCallback(
    async (request: UsabilityAnalysisRequest): Promise<UsabilityAnalysisResult | null> => {
      return runAnalysis(request);
    },
    []
  );

  const cancelAnalysis = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setState((prev) => ({ ...prev, status: "idle", error: null }));
  }, []);

  const resetState = useCallback(() => {
    setState({ status: "idle", result: null, error: null, lastAnalyzedAt: null });
  }, []);

  const fetchHistory = useCallback(async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('test_plan_id', planId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error al obtener el historial de análisis:", err);
      return [];
    }
  }, []);

  return {
    status: state.status,
    result: state.result,
    error: state.error,
    lastAnalyzedAt: state.lastAnalyzedAt,
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    analyzeFromPlan,
    analyzeFromRequest,
    cancelAnalysis,
    resetState,
    fetchHistory,
  };
}