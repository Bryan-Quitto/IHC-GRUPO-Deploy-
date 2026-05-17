// supabase/functions/ai-usability-analysis/index.ts
// ============================================================
// Entry Point de la Edge Function — IHC-GRUPO AI Analysis
// Deno + TypeScript + Supabase Edge Runtime
// ============================================================

import { validateAndSanitize } from "./validator.ts";
import { buildUserContext } from "./contextBuilder.ts";
import { callGeminiWithRetry } from "./geminiClient.ts";
import type { EdgeFunctionResponse } from "./types.ts";

// ============================================================
// CONFIGURACIÓN CORS
// ============================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",      // Restringir en producción al dominio de tu app
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

// ============================================================
// HEADERS DE RESPUESTA SEGUROS
// ============================================================

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

  // Log seguro: NO incluir datos del usuario en logs de error
  console.error(`[Error] ${code}: ${message}`);
  if (details) console.error(`[Details] ${details}`);

  // Retornamos SIEMPRE 200 para que supabase-js pueda leer el JSON
  // y no lance un FunctionsHttpError ciego.
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
  const startTime = Date.now();

  console.log(`[${requestId}] ${req.method} ${new URL(req.url).pathname}`);

  // ----------------------------------------------------------
  // Preflight CORS
  // ----------------------------------------------------------
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // ----------------------------------------------------------
  // Validar método HTTP
  // ----------------------------------------------------------
  if (req.method !== "POST") {
    return errorResponse(
      "METHOD_NOT_ALLOWED",
      "Solo se acepta método POST",
      405
    );
  }


  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return errorResponse(
      "INVALID_CONTENT_TYPE",
      "Content-Type debe ser application/json",
      415
    );
  }

  // ----------------------------------------------------------
  // Validar tamaño del body (máx 50KB)
  // ----------------------------------------------------------
  const contentLength = parseInt(req.headers.get("content-length") || "0");
  if (contentLength > 51_200) {
    return errorResponse(
      "PAYLOAD_TOO_LARGE",
      "El cuerpo de la petición excede el límite de 50KB",
      413
    );
  }

  // ----------------------------------------------------------
  // Parsear body JSON
  // ----------------------------------------------------------
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return errorResponse(
      "INVALID_JSON",
      "El cuerpo de la petición no es JSON válido",
      400
    );
  }

  // ----------------------------------------------------------
  // Ping de healthcheck (para Docker healthcheck)
  // ----------------------------------------------------------
  if (
    rawBody &&
    typeof rawBody === "object" &&
    !Array.isArray(rawBody) &&
    (rawBody as Record<string, unknown>).ping === true
  ) {
    return successResponse({
      success: true,
      data: undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // ----------------------------------------------------------
  // Validar y sanitizar input
  // ----------------------------------------------------------
  const validation = validateAndSanitize(rawBody);

  if (!validation.isValid || !validation.sanitizedInput) {
    return errorResponse(
      "VALIDATION_ERROR",
      "El input no cumple los requisitos de validación",
      400,
      validation.errors.join("; ")
    );
  }

  const input = validation.sanitizedInput;
  console.log(`[${requestId}] Proyecto: "${input.projectName.slice(0, 30)}" | Observaciones: ${input.observations.length}`);

  // ----------------------------------------------------------
  // Construir contexto para Gemini
  // ----------------------------------------------------------
  let userContext: string;
  try {
    userContext = buildUserContext(input);
    console.log(`[${requestId}] Contexto construido: ${userContext.length} chars`);
  } catch (err) {
    console.error(`[${requestId}] Error construyendo contexto:`, err);
    return errorResponse(
      "CONTEXT_BUILD_ERROR",
      "Error al procesar las observaciones",
      500
    );
  }

  // ----------------------------------------------------------
  // Llamar a Gemini
  // ----------------------------------------------------------
  let analysisResult;
  try {
    analysisResult = await callGeminiWithRetry(userContext, input.observations.length);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    if (errorMsg.includes("API_KEY") || errorMsg.includes("PERMISSION_DENIED")) {
      return errorResponse(
        "AI_AUTH_ERROR",
        "Error de autenticación con el servicio de IA",
        503
      );
    }

    if (errorMsg.includes("Timeout")) {
      return errorResponse(
        "AI_TIMEOUT",
        "El servicio de IA tardó demasiado en responder. Intenta nuevamente.",
        504
      );
    }

    // Detectar error de cuota / rate limit (429)
    if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota") || errorMsg.toLowerCase().includes("rate")) {
      const match = errorMsg.match(/retry in ([\d.]+)s/i);
      const waitSeconds = match ? Math.ceil(parseFloat(match[1])) : 60;
      console.warn(`[${requestId}] Rate limit detectado. Espera: ${waitSeconds}s`);
      return errorResponse(
        "RATE_LIMIT",
        `Límite de peticiones alcanzado. Por favor, espera ${waitSeconds} segundos antes de reintentar.`,
        200,
        String(waitSeconds) // Se usa como retryAfterSeconds en el frontend
      );
    }

    return errorResponse(
      "AI_ERROR",
      "Error al procesar el análisis con IA",
      500,
      errorMsg // Forzamos mostrar el error real para depuración
    );

  }

  // ----------------------------------------------------------
  // Verificar límite de tokens (>30k = análisis demasiado complejo)
  // ----------------------------------------------------------
  const tokensUsed = analysisResult.analysisMetadata?.tokensUsed ?? 0;
  if (tokensUsed > 30_000) {
    console.warn(`[${requestId}] Tokens excedidos: ${tokensUsed}`);
    return errorResponse(
      "ANALYSIS_TOO_COMPLEX",
      `El análisis es demasiado complejo (${tokensUsed.toLocaleString()} tokens). Por favor, elimine algunas observaciones y vuelva a intentar.`,
      200
    );
  }

  // ----------------------------------------------------------
  // Respuesta exitosa
  // ----------------------------------------------------------
  const totalTime = Date.now() - startTime;
  console.log(`[${requestId}] Completado en ${totalTime}ms | Score: ${analysisResult.priorityScore}`);

  return successResponse({
    success: true,
    data: analysisResult,
    timestamp: new Date().toISOString(),
  });
});