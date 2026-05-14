// supabase/functions/ai-usability-analysis/geminiClient.ts
// ============================================================
// Cliente Gemini con retry, timeout y manejo robusto de errores
// ============================================================

import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";
import type { AIAnalysisOutput } from "./types.ts";
import { SYSTEM_PROMPT } from "./systemPrompt.ts";

// ============================================================
// CONFIGURACIÓN DEL MODELO
// ============================================================

const MODEL_CONFIG = {
  model: "gemini-2.0-flash",          // Modelo más eficiente para análisis estructurado
  maxOutputTokens: 4096,              // Suficiente para respuesta JSON completa
  temperature: 0.2,                   // Baja para respuestas consistentes y técnicas
  topP: 0.8,                          // Diversidad controlada
  topK: 40,                           // Top-K sampling
};

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,                  // 1 segundo inicial
  maxDelayMs: 8000,                   // Máximo 8 segundos
  timeoutMs: 28000,                   // 28s (Edge Function tiene límite de 30s)
};

// ============================================================
// UTILIDADES
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number): number {
  // Exponential backoff con jitter
  const exponential = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelayMs
  );
  // Añadir jitter ±20% para evitar thundering herd
  const jitter = exponential * 0.2 * (Math.random() * 2 - 1);
  return Math.round(exponential + jitter);
}

/**
 * Extrae y valida el JSON de la respuesta de Gemini
 * Gemini a veces incluye markdown ```json ``` aunque le digamos que no
 */
function extractJSON(text: string): string {
  // Intentar primero parsing directo
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  // Buscar JSON dentro de bloques markdown
  const jsonMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    return jsonMatch[1];
  }

  // Buscar el primer { y el último } como fallback
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("No se encontró JSON válido en la respuesta de Gemini");
}

/**
 * Valida que el JSON tenga la estructura correcta de salida
 */
function validateOutputStructure(parsed: unknown): AIAnalysisOutput {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("La respuesta de Gemini no es un objeto JSON válido");
  }

  const output = parsed as Record<string, unknown>;

  // Validar campos requeridos
  if (typeof output.summary !== "string" || output.summary.length < 10) {
    throw new Error("Campo 'summary' inválido o ausente en la respuesta");
  }

  if (!Array.isArray(output.criticalIssues)) {
    throw new Error("Campo 'criticalIssues' debe ser un array");
  }

  if (!Array.isArray(output.recommendations)) {
    throw new Error("Campo 'recommendations' debe ser un array");
  }

  if (!Array.isArray(output.accessibilityIssues)) {
    throw new Error("Campo 'accessibilityIssues' debe ser un array");
  }

  const priorityScore = Number(output.priorityScore);
  if (isNaN(priorityScore) || priorityScore < 0 || priorityScore > 100) {
    throw new Error("Campo 'priorityScore' debe ser un número entre 0 y 100");
  }

  return {
    summary: output.summary as string,
    criticalIssues: output.criticalIssues as AIAnalysisOutput["criticalIssues"],
    recommendations: output.recommendations as AIAnalysisOutput["recommendations"],
    accessibilityIssues: output.accessibilityIssues as AIAnalysisOutput["accessibilityIssues"],
    priorityScore,
    analysisMetadata: {
      model: MODEL_CONFIG.model,
      processingTimeMs: 0, // Se actualiza en el caller
      observationsAnalyzed: 0, // Se actualiza en el caller
      confidence: priorityScore > 70 ? "Alta" : priorityScore > 40 ? "Media" : "Baja",
    },
  };
}

// ============================================================
// CLIENTE PRINCIPAL CON RETRY Y TIMEOUT
// ============================================================

export async function callGeminiWithRetry(
  userContext: string,
  observationsCount: number
): Promise<AIAnalysisOutput> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurado en los secrets de Supabase");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_CONFIG.model,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: MODEL_CONFIG.maxOutputTokens,
      temperature: MODEL_CONFIG.temperature,
      topP: MODEL_CONFIG.topP,
      topK: MODEL_CONFIG.topK,
      responseMimeType: "application/json",    // Fuerza respuesta JSON nativo
    },
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
    try {
      // Log del intento (sin datos sensibles)
      console.log(`[Gemini] Intento ${attempt + 1}/${RETRY_CONFIG.maxRetries}`);

      const startTime = Date.now();

      // Promise con timeout
      const geminiPromise = model.generateContent(userContext);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout: Gemini no respondió en ${RETRY_CONFIG.timeoutMs}ms`)),
          RETRY_CONFIG.timeoutMs
        )
      );

      const result = await Promise.race([geminiPromise, timeoutPromise]);
      const processingTimeMs = Date.now() - startTime;

      // Extraer texto de la respuesta
      const responseText = result.response.text();

      if (!responseText || responseText.trim().length === 0) {
        throw new Error("Gemini retornó una respuesta vacía");
      }

      // Log del uso de tokens (sin datos del usuario)
      const usageMetadata = result.response.usageMetadata;
      console.log(`[Gemini] Tokens — Prompt: ${usageMetadata?.promptTokenCount ?? "N/A"}, Output: ${usageMetadata?.candidatesTokenCount ?? "N/A"}`);

      // Extraer y validar JSON
      const jsonString = extractJSON(responseText);
      const parsed = JSON.parse(jsonString);
      const validated = validateOutputStructure(parsed);

      // Actualizar metadata
      validated.analysisMetadata.processingTimeMs = processingTimeMs;
      validated.analysisMetadata.observationsAnalyzed = observationsCount;
      if (usageMetadata?.candidatesTokenCount) {
        validated.analysisMetadata.tokensUsed = usageMetadata.candidatesTokenCount;
      }

      console.log(`[Gemini] Análisis completado en ${processingTimeMs}ms`);
      return validated;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Gemini] Error en intento ${attempt + 1}: ${lastError.message}`);

      // No reintentar en errores de autenticación o estructura inválida
      if (
        lastError.message.includes("API_KEY") ||
        lastError.message.includes("INVALID_ARGUMENT") ||
        lastError.message.includes("PERMISSION_DENIED")
      ) {
        break;
      }

      // Esperar antes del siguiente intento (excepto en el último)
      if (attempt < RETRY_CONFIG.maxRetries - 1) {
        const delay = calculateBackoff(attempt);
        console.log(`[Gemini] Esperando ${delay}ms antes del siguiente intento...`);
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new Error("Error desconocido al llamar a Gemini");
}