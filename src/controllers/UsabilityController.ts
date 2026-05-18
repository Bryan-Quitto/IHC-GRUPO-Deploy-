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
  AnalysisHistoryItem,
  AnalysisJob,
} from "../models/usabilityModels";

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
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const cleanupSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      // @ts-expect-error - Supabase types for removeChannel can be complex to match exactly with a ref
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  }, []);

  const runAnalysis = useCallback(async (
    request: UsabilityAnalysisRequest,
    rawObservations?: Observation[]
  ): Promise<UsabilityAnalysisResult | null> => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    cleanupSubscription();

    const validationError = validateRequest(request);
    if (validationError) {
      setState({ status: "error", result: null, error: validationError, lastAnalyzedAt: null });
      return null;
    }

    setState((prev) => ({ ...prev, status: "queue", error: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw buildError("AUTH_ERROR", "Debes iniciar sesión para realizar un análisis.");

      const planId = request.context?.includes('planId:') 
        ? request.context.split('planId:')[1] 
        : null;

      if (!planId) throw buildError("VALIDATION_ERROR", "ID de plan de prueba no encontrado.");

      // 1. Insertar en la cola de trabajos (analysis_jobs)
      const { data: job, error: insertError } = await supabase
        .from('analysis_jobs')
        .insert({
          test_plan_id: planId,
          profile_id: user.id,
          project_name: request.projectName,
          request_payload: request,
          observations_snapshot: rawObservations || null,
          metrics: request.metrics,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error al encolar el análisis:", insertError);
        throw buildError("NETWORK_ERROR", "No se pudo encolar el análisis.");
      }

      console.log("🚀 Análisis encolado con ID:", job.id);

      // 2. Suscribirse a cambios en tiempo real
      return new Promise<UsabilityAnalysisResult | null>((resolve) => {
        const channel = supabase
          .channel(`job-${job.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'analysis_jobs',
              filter: `id=eq.${job.id}`
            },
            (payload) => {
              const updatedJob = payload.new as AnalysisJob;
              console.log("🔄 Actualización de Job recibida:", updatedJob.status);

              if (updatedJob.status === 'processing') {
                setState(prev => ({ ...prev, status: 'loading' }));
              } else if (updatedJob.status === 'completed') {
                cleanupSubscription();
                const result = updatedJob.result_payload as UsabilityAnalysisResult;
                setState({
                  status: "success",
                  result,
                  error: null,
                  lastAnalyzedAt: new Date()
                });
                resolve(result);
              } else if (updatedJob.status === 'error') {
                cleanupSubscription();
                const error = buildError("EDGE_FUNCTION_ERROR", updatedJob.error_log || "Error en el procesamiento asíncrono.");
                setState({ status: "error", result: null, error, lastAnalyzedAt: null });
                resolve(null);
              }
            }
          )
          .subscribe();

        subscriptionRef.current = channel;
      });

    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return null;

      const analysisError: AnalysisError = isAnalysisError(err)
        ? err
        : buildError("UNKNOWN_ERROR", err instanceof Error ? err.message : "Error inesperado.");

      setState((prev) => ({ ...prev, status: "error", error: analysisError }));
      return null;
    }
  }, [cleanupSubscription]);

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
      return runAnalysis(request, observations);
    },
    [runAnalysis]
  );

  const analyzeFromRequest = useCallback(
    async (
      request: UsabilityAnalysisRequest, 
      rawObservations?: Observation[]
    ): Promise<UsabilityAnalysisResult | null> => {
      return runAnalysis(request, rawObservations);
    },
    [runAnalysis]
  );

  const cancelAnalysis = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setState((prev) => ({ ...prev, status: "idle", error: null }));
  }, []);

  const resetState = useCallback(() => {
    setState({ status: "idle", result: null, error: null, lastAnalyzedAt: null });
  }, []);

  const fetchHistory = useCallback(async (planId: string): Promise<AnalysisHistoryItem[]> => {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('test_plan_id', planId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AnalysisHistoryItem[];
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