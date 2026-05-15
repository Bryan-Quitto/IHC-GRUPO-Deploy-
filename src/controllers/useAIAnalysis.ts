import { useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import type {
  UsabilityAnalysisRequest as AIAnalysisRequest,
  UsabilityAnalysisResult as AIAnalysisResult,
  ProposedSolution as AIRecommendation,
  AnalyzedIssue as CriticalIssue,
  AccessibilityFinding as AccessibilityIssue,
} from "../models/usabilityModels";

export type { AIAnalysisRequest, AIAnalysisResult, AIRecommendation, CriticalIssue, AccessibilityIssue };

export interface AIAnalysisState {
  result: AIAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  lastAnalyzedAt: Date | null;
}

const EDGE_FUNCTION_NAME = "ai-usability-analysis";

export function useAIAnalysis() {
  const [state, setState] = useState<AIAnalysisState>({
    result: null,
    isLoading: false,
    error: null,
    lastAnalyzedAt: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (request: AIAnalysisRequest): Promise<AIAnalysisResult | null> => {
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
      const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
        body: request,
      });

      if (error) {
        throw new Error(error.message || "Error al conectar con el servicio de análisis");
      }

      if (!data || !data.success) {
        const apiError = data?.error;
        throw new Error(apiError?.message || "El análisis de IA no pudo completarse");
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

  const clearResult = useCallback(() => {
    setState({
      result: null,
      isLoading: false,
      error: null,
      lastAnalyzedAt: null,
    });
  }, []);

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