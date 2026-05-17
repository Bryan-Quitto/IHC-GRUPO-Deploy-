import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  Download,
  Info,
  TrendingUp,
} from 'lucide-react';
import type {
  UsabilityAnalysisResult,
  AnalyzedIssue,
  ProposedSolution,
  AccessibilityFinding,
} from '../models/usabilityModels';
//import { Tooltip } from '../components/Tooltip';

interface ResultsViewProps {
  result: UsabilityAnalysisResult;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onExport?: () => void;
}

function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Crítica: { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-300', icon: '🔴' },
  Alta: { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-300', icon: '🟠' },
  Media: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-300', icon: '🟡' },
  Baja: { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-300', icon: '🟢' },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Inmediata: { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-300', icon: '⚡' },
  'Corto plazo': { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-300', icon: '⏱️' },
  'Mediano plazo': { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-300', icon: '📅' },
};

const EFFORT_ICONS: Record<string, string> = {
  Bajo: '⚡',
  Medio: '⚙️',
  Alto: '🏗️',
};

const WCAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-300' },
  AA: { bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-300' },
  AAA: { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-300' },
};

/* ── Componente: Tarjeta de Problema Crítico ── */
const CriticalIssueCard: React.FC<{ issue: AnalyzedIssue; idx: number }> = ({ issue, idx }) => {
  const colors = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.Baja;

  return (
    <article
      className={`${colors.bg} border-2 ${colors.border} rounded-xl p-5 animate-in slide-in-from-left-2 duration-300`}
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <div className="flex gap-3 items-start mb-3">
        <div className="text-2xl">{colors.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-black ${colors.text} text-lg leading-tight`}>
            {issue.title}
          </h3>
          <div className="flex gap-2 items-center mt-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text} font-bold text-xs border ${colors.border}`}>
              {issue.severity}
            </span>
            {issue.heuristic && (
              <span className="text-xs text-slate-600 font-medium italic">
                Nielsen: {issue.heuristic}
              </span>
            )}
            {issue.affectedUsers && (
              <span className="text-xs text-slate-600 font-medium">
                👥 {issue.affectedUsers} usuarios
              </span>
            )}
          </div>
        </div>
      </div>

      <p className={`${colors.text} text-sm leading-relaxed mb-3`}>
        {issue.description}
      </p>

      <div className="bg-white/60 border border-white rounded-lg p-3">
        <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1">
          Recomendación
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          {issue.recommendation}
        </p>
      </div>

      {issue.wcagCriteria && (
        <p className="text-xs text-slate-600 mt-3 italic">
          WCAG: {issue.wcagCriteria}
        </p>
      )}
    </article>
  );
};

/* ── Componente: Tarjeta de Solución Propuesta ── */
const ProposedSolutionCard: React.FC<{ solution: ProposedSolution; idx: number }> = ({
  solution,
  idx,
}) => {
  const priorityColor = PRIORITY_COLORS[solution.priority];
  const effortIcon = EFFORT_ICONS[solution.effort];
  const impactColor = solution.impact === 'Alto' ? 'text-red-600' : solution.impact === 'Medio' ? 'text-amber-600' : 'text-green-600';

  return (
    <article
      className={`${priorityColor.bg} border-2 ${priorityColor.border} rounded-xl p-5 animate-in slide-in-from-left-2 duration-300`}
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-black ${priorityColor.text} text-lg leading-tight`}>
            {solution.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-2xl flex-shrink-0">
          {effortIcon}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        <span
          className={`px-2.5 py-0.5 rounded-full ${priorityColor.bg} ${priorityColor.text} font-bold text-xs border ${priorityColor.border}`}
        >
          {priorityColor.icon} {solution.priority}
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300">
          Effort: {solution.effort}
        </span>
        <span className={`px-2.5 py-0.5 rounded-full bg-white text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1`}>
          <TrendingUp size={12} className={impactColor} />
          Impact: {solution.impact}
        </span>
      </div>

      <p className={`${priorityColor.text} text-sm leading-relaxed mb-3`}>
        {solution.description}
      </p>

      <div className="bg-white/60 border border-white rounded-lg p-3">
        <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1">
          Justificación
        </p>
        <p className="text-sm text-slate-700 leading-relaxed italic">
          {solution.rationale}
        </p>
      </div>
    </article>
  );
};

/* ── Componente: Tarjeta de Hallazgo WCAG ── */
const AccessibilityCard: React.FC<{ finding: AccessibilityFinding; idx: number }> = ({
  finding,
  idx,
}) => {
  const colors = WCAG_COLORS[finding.level];

  return (
    <article
      className={`${colors.bg} border-2 ${colors.border} rounded-xl p-5 animate-in slide-in-from-left-2 duration-300`}
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <div className="flex items-start gap-3 mb-2">
        <span className="text-2xl">♿</span>
        <div className="flex-1 min-w-0">
          <h3 className={`font-black ${colors.text} text-base leading-tight`}>
            {finding.criterion}
          </h3>
          <span className={`inline-block px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text} font-bold text-xs border ${colors.border} mt-1.5`}>
            WCAG {finding.level}
          </span>
        </div>
      </div>

      <p className={`${colors.text} text-sm leading-relaxed mb-3`}>
        {finding.description}
      </p>

      <div className="bg-white/60 border border-white rounded-lg p-3">
        <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1">
          Recomendación
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          {finding.recommendation}
        </p>
      </div>
    </article>
  );
};

/* ── Vista Principal: ResultsView ── */
export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  isLoading,
  error,
  onBack,
  onExport,
}) => {
  const width = useWindowWidth();
  const isMobile = width < 768;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-navy/20 border-t-navy animate-spin" />
        <p className="text-slate-600 font-medium">Analizando resultados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center max-w-md mx-auto">
        <AlertTriangle className="mx-auto mb-3 text-red-600" size={32} />
        <h2 className="font-black text-red-900 text-lg mb-2">Error en el análisis</h2>
        <p className="text-red-800 text-sm mb-4">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors"
        >
          Volver
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 font-medium">No hay resultados para mostrar</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-lg bg-navy text-white font-bold text-sm hover:bg-navy-dark transition-colors"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
          aria-label="Volver a observaciones"
        >
          <ArrowLeft size={16} /> Volver
        </button>

        <h1 className="font-black text-2xl md:text-3xl text-slate-900 uppercase tracking-widest text-center flex-1">
          📊 Análisis de Usabilidad
        </h1>

        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white font-bold text-sm hover:bg-navy-dark transition-colors"
          >
            <Download size={16} /> Exportar
          </button>
        )}
      </div>

      {/* Summary Section */}
      <section className="bg-gradient-to-r from-navy/5 to-navy-light/5 border-2 border-navy/10 rounded-2xl p-6">
        <h2 className="font-black text-navy text-lg uppercase tracking-widest mb-3 flex items-center gap-2">
          <BarChart3 size={20} /> Resumen Ejecutivo
        </h2>
        <p className="text-slate-700 text-base leading-relaxed">
          {result.summary}
        </p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="bg-white rounded-lg p-4 border border-navy/10 text-center">
            <div className="text-2xl font-black text-red-600">
              {result.criticalIssues.length}
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">Problemas</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-navy/10 text-center">
            <div className="text-2xl font-black text-green-600">
              {result.recommendations.length}
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">Soluciones</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-navy/10 text-center">
            <div className="text-2xl font-black text-purple-600">
              {result.accessibilityIssues.length}
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">WCAG</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-navy/10 text-center">
            <div className="text-2xl font-black text-amber-600">
              {result.priorityScore.toFixed(1)}
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">Prioridad</div>
          </div>
        </div>
      </section>

      {/* Critical Issues */}
      {result.criticalIssues.length > 0 && (
        <section>
          <h2 className="font-black text-navy text-lg uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle size={20} /> Problemas Críticos ({result.criticalIssues.length})
          </h2>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {result.criticalIssues.map((issue, idx) => (
              <CriticalIssueCard key={idx} issue={issue} idx={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <section>
          <h2 className="font-black text-navy text-lg uppercase tracking-widest mb-4 flex items-center gap-2">
            <CheckCircle size={20} /> Soluciones Recomendadas ({result.recommendations.length})
          </h2>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {result.recommendations.map((solution, idx) => (
              <ProposedSolutionCard key={idx} solution={solution} idx={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Accessibility Issues */}
      {result.accessibilityIssues.length > 0 && (
        <section>
          <h2 className="font-black text-navy text-lg uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap size={20} /> Accesibilidad WCAG ({result.accessibilityIssues.length})
          </h2>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {result.accessibilityIssues.map((finding, idx) => (
              <AccessibilityCard key={idx} finding={finding} idx={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Metadata */}
      <section className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
        <h2 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
          <Info size={16} /> Información del Análisis
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-600 font-medium mb-1">Modelo</p>
            <p className="text-slate-900 font-black">{result.analysisMetadata.model}</p>
          </div>
          <div>
            <p className="text-slate-600 font-medium mb-1">Observaciones</p>
            <p className="text-slate-900 font-black">
              {result.analysisMetadata.observationsAnalyzed}
            </p>
          </div>
          <div>
            <p className="text-slate-600 font-medium mb-1">Tiempo</p>
            <p className="text-slate-900 font-black">
              {result.analysisMetadata.processingTimeMs}ms
            </p>
          </div>
          <div>
            <p className="text-slate-600 font-medium mb-1">Confianza</p>
            <p className="text-slate-900 font-black">
              {result.analysisMetadata.confidence}
            </p>
          </div>
        </div>
        {result.analysisMetadata.tokensUsed && (
          <p className="text-xs text-slate-600 mt-4">
            Tokens utilizados: {result.analysisMetadata.tokensUsed}
          </p>
        )}
      </section>
    </div>
  );
};

export default ResultsView;