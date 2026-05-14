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

  return new Response(JSON.stringify(body), {
    status,
    headers: SECURE_HEADERS,
  });
}

// ============================================================
// RATE LIMITING SIMPLE (en memoria, por instancia)
// Para producción usar Supabase Rate Limiting o un KV store
// ============================================================

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 }; // 10 req/min por IP

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(clientId);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(clientId, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return true;
  }

  if (entry.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
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

  // ----------------------------------------------------------
  // Rate limiting basado en IP o anon key
  // ----------------------------------------------------------
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (!checkRateLimit(clientIp)) {
    console.warn(`[${requestId}] Rate limit excedido para: ${clientIp.slice(0, 8)}***`);
    return errorResponse(
      "RATE_LIMIT_EXCEEDED",
      "Demasiadas solicitudes. Intenta nuevamente en 60 segundos.",
      429
    );
  }

  // ----------------------------------------------------------
  // Validar Content-Type
  // ----------------------------------------------------------
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

    return errorResponse(
      "AI_ERROR",
      "Error al procesar el análisis con IA",
      502,
      process.env.NODE_ENV === "development" ? errorMsg : undefined
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