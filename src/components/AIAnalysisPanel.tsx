import React from 'react';
import { X, Loader, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import type { UsabilityAnalysisResult } from '../models/usabilityModels';

interface AIAnalysisPanelProps {
  isLoading: boolean;
  result: UsabilityAnalysisResult | null;
  error: string | null;
  onClose: () => void;
  onViewDetails?: () => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  isLoading,
  result,
  error,
  onClose,
  onViewDetails
}) => {
  if (!isLoading && !result && !error) return null;

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-navy/10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-navy-light text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                <span className="font-black text-sm">Analizando con IA...</span>
              </>
            ) : error ? (
              <>
                <AlertTriangle size={18} />
                <span className="font-black text-sm">Error en análisis</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span className="font-black text-sm">Análisis completado</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-navy/20 border-t-navy animate-spin" />
              <p className="text-slate-600 text-sm text-center">
                Procesando observaciones con Gemini 2.0...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm font-medium">{error}</p>
              <p className="text-red-700 text-xs mt-1">
                Intenta nuevamente o verifica tu conexión.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="bg-navy/5 rounded-lg p-3 border border-navy/10">
                <p className="text-slate-700 text-sm leading-relaxed">
                  {result.summary}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-red-50 rounded-lg p-2 text-center border border-red-200">
                  <div className="text-lg font-black text-red-900">
                    {result.criticalIssues.length}
                  </div>
                  <div className="text-xs text-red-800 font-medium">Problemas</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
                  <div className="text-lg font-black text-green-900">
                    {result.recommendations.length}
                  </div>
                  <div className="text-xs text-green-800 font-medium">Soluciones</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center border border-purple-200">
                  <div className="text-lg font-black text-purple-900">
                    {result.accessibilityIssues.length}
                  </div>
                  <div className="text-xs text-purple-800 font-medium">WCAG</div>
                </div>
              </div>

              {/* Priority Score */}
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-black text-amber-900">
                    Puntuación
                  </span>
                  <TrendingUp size={16} className="text-amber-600" />
                </div>
                <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 transition-all duration-500"
                    style={{ width: `${Math.min(result.priorityScore * 10, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  {result.priorityScore.toFixed(1)}/10
                </p>
              </div>

              {/* Confidence */}
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <span className="font-medium">
                  Confianza: {result.analysisMetadata.confidence}
                </span>
                <span>•</span>
                <span>
                  {result.analysisMetadata.processingTimeMs}ms
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {result && onViewDetails && (
          <div className="border-t border-slate-200 p-3 flex gap-2">
            <button
              onClick={onViewDetails}
              className="flex-1 px-3 py-2 rounded-lg bg-navy text-white text-sm font-bold hover:bg-navy-dark transition-colors cursor-pointer"
            >
              Ver análisis completo
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisPanel;