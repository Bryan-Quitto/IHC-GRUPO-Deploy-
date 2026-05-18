// supabase/functions/ai-usability-analysis/index.ts
// ============================================================
// Entry Point de la Edge Function — IHC-GRUPO AI Analysis
// Deno + TypeScript + Supabase Edge Runtime
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import { validateAndSanitize } from "./validator.ts";
import { buildUserContext } from "./contextBuilder.ts";
import { callGeminiWithRetry } from "./geminiClient.ts";
import type { EdgeFunctionResponse, AIAnalysisInput } from "./types.ts";

// ============================================================
// CONFIGURACIÓN CORS
// ============================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const SECURE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  ...CORS_HEADERS,
};

// ============================================================
// HELPERS DE RESPUESTA
// ============================================================

function successResponse(data: EdgeFunctionResponse): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: SECURE_HEADERS,
  });
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: string
): Response {
  const body: EdgeFunctionResponse = {
    success: false,
    error: { code, message, ...(details && { details }) },
    timestamp: new Date().toISOString(),
  };

  console.error(`[Error] ${code}: ${message}`);
  if (details) console.error(`[Details] ${details}`);

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: SECURE_HEADERS,
  });
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return errorResponse("METHOD_NOT_ALLOWED", "Solo se acepta método POST", 405);
  }

  // ----------------------------------------------------------
  // Inicializar Cliente Supabase (Service Role)
  // ----------------------------------------------------------
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // ----------------------------------------------------------
  // Parsear body JSON
  // ----------------------------------------------------------
  let rawBody: Record<string, unknown>;
  try {
    rawBody = await req.json();
  } catch {
    return errorResponse("INVALID_JSON", "El cuerpo de la petición no es JSON válido", 400);
  }

  const jobId = rawBody?.jobId as string | undefined;
  let input: AIAnalysisInput;
  let rawObservationsForHistory: Observation[] = [];

  // ----------------------------------------------------------
  // MODO ASÍNCRONO: Cargar desde Base de Datos
  // ----------------------------------------------------------
  if (jobId) {
    console.log(`[${requestId}] Procesando Job ID: ${jobId}`);
    const { data: job, error: jobError } = await supabase
      .from("analysis_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return errorResponse("JOB_NOT_FOUND", `No se encontró el trabajo ${jobId}`, 404);
    }

    input = job.request_payload as unknown as AIAnalysisInput;
    rawObservationsForHistory = (job.observations_snapshot as unknown as Observation[]) || [];
  } else {
    // ----------------------------------------------------------
    // MODO SÍNCRONO: Validar input directo
    // ----------------------------------------------------------
    const validation = validateAndSanitize(rawBody);
    if (!validation.isValid || !validation.sanitizedInput) {
      return errorResponse("VALIDATION_ERROR", "Validación fallida", 400, validation.errors.join("; "));
    }
    input = validation.sanitizedInput;
  }

  // ----------------------------------------------------------
  // Procesamiento con Gemini
  // ----------------------------------------------------------
  try {
    const userContext = buildUserContext(input);
    const analysisResult = await callGeminiWithRetry(userContext, input.observations.length);

    // ----------------------------------------------------------
    // Finalización: Guardar resultados
    // ----------------------------------------------------------
    if (jobId) {
      // 1. Actualizar Job
      await supabase
        .from("analysis_jobs")
        .update({
          status: "completed",
          result_payload: analysisResult,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      // 2. Insertar en el historial para visibilidad del usuario
      const { data: jobData } = await supabase.from("analysis_jobs").select("*").eq("id", jobId).single();
      
      const { count } = await supabase
        .from('analysis_history')
        .select('*', { count: 'exact', head: true })
        .eq('test_plan_id', jobData.test_plan_id);

      const nextIndex = (count || 0) + 1;
      let successSummary = "";
      if (rawObservationsForHistory.length > 0) {
        const s = rawObservationsForHistory.filter(o => o.success_level === 'Sí').length;
        const a = rawObservationsForHistory.filter(o => o.success_level === 'Con ayuda').length;
        const n = rawObservationsForHistory.filter(o => o.success_level === 'No').length;
        successSummary = `S:${s}, A:${a}, N:${n}`;
      }

      await supabase.from('analysis_history').insert({
        test_plan_id: jobData.test_plan_id,
        profile_id: jobData.profile_id,
        project_name: jobData.project_name,
        title: `Análisis #${nextIndex} (Asíncrono) | Éxito: ${successSummary || 'N/A'}`,
        request_data: jobData.request_payload,
        result_data: analysisResult,
        metrics: jobData.metrics,
        observations_snapshot: jobData.observations_snapshot
      });

      console.log(`[${requestId}] Job ${jobId} completado exitosamente`);
    }

    return successResponse({
      success: true,
      data: analysisResult,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    
    if (jobId) {
      await supabase
        .from("analysis_jobs")
        .update({
          status: "error",
          error_log: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }

    return errorResponse("AI_ERROR", "Error al procesar el análisis", 500, errorMsg);
  }
});