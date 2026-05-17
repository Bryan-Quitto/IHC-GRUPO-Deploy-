import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  Download,
  Info,
  TrendingUp,
  History as HistoryIcon,
} from 'lucide-react';
import type {
  UsabilityAnalysisResult,
  AnalyzedIssue,
  ProposedSolution,
  AccessibilityFinding,
} from '../models/usabilityModels';
import { useUsabilityController } from '../controllers/UsabilityController';
import { AnalysisHistoryPanel, type AnalysisHistoryItem } from '../components/AnalysisHistoryPanel';
import { supabase } from '../lib/supabaseClient';

interface ResultsViewProps {
  result: UsabilityAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onExport?: () => void;
  planId?: string;
  initialAnalysisId?: string;
  onSelectResult?: (result: UsabilityAnalysisResult) => void;
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
          Esfuerzo: {solution.effort}
        </span>
        <span className={`px-2.5 py-0.5 rounded-full bg-white text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1`}>
          <TrendingUp size={12} className={impactColor} />
          Impacto: {solution.impact}
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
  result: currentResult,
  isLoading: isAnalyzing,
  error: analysisError,
  onBack,
  onExport,
  planId,
  initialAnalysisId,
  onSelectResult,
}) => {
  const width = useWindowWidth();
  const isMobile = width < 1024;
  const { fetchHistory } = useUsabilityController();

  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedResult, setSelectedResult] = useState<UsabilityAnalysisResult | null>(null);
  const [testPlan, setTestPlan] = useState<{ product: string, module: string } | null>(null);

  const loadHistory = useCallback(async () => {
    if (!planId) return;
    setIsHistoryLoading(true);
    
    // Obtenemos los datos del plan de pruebas para mostrar el producto y módulo
    const { data: planData } = await supabase.from('test_plans').select('product, module').eq('id', planId).single();
    if (planData) {
      setTestPlan(planData);
    }
    const data = await fetchHistory(planId);
    setHistory(data);
    setIsHistoryLoading(false);

    if (initialAnalysisId === 'latest' && data.length > 0) {
      setSelectedResult(data[0].result_data);
    } else if (initialAnalysisId) {
      const found = data.find(item => item.id === initialAnalysisId);
      if (found) {
        setSelectedResult(found.result_data);
      }
    }
  }, [planId, fetchHistory, initialAnalysisId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDeleteHistory = async (id: string) => {
    const { error } = await supabase.from('analysis_history').delete().eq('id', id);
    if (!error) {
      setHistory(prev => prev.filter(item => item.id !== id));
      if (selectedResult && history.find(h => h.id === id)?.result_data === selectedResult) {
        setSelectedResult(null);
      }
    }
  };

  const activeResult = selectedResult || currentResult;

  if (isAnalyzing && !showHistory) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-navy/20 border-t-navy animate-spin" />
        <p className="text-slate-600 font-medium font-black uppercase tracking-widest text-sm">
          Gemini 2.0 analizando...
        </p>
      </div>
    );
  }

  if (analysisError && !showHistory) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-8 text-center max-w-md mx-auto animate-in zoom-in-95">
        <AlertTriangle className="mx-auto mb-4 text-red-600" size={40} />
        <h2 className="font-black text-red-900 text-xl mb-2 uppercase tracking-tight">Error de análisis</h2>
        <p className="text-red-800 text-sm mb-6 font-medium">{analysisError}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onBack} className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200">
            Volver
          </button>
        </div>
      </div>
    );
  }

  const renderContent = (res: UsabilityAnalysisResult) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Section */}
      <section className="bg-gradient-to-br from-navy/5 via-white to-navy-light/5 border-2 border-navy/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12" aria-hidden="true">
          <TrendingUp size={80} />
        </div>
        <h2 className="font-black text-navy text-lg uppercase tracking-widest mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-navy" /> Resumen Ejecutivo
        </h2>
        <p className="text-slate-700 text-base leading-relaxed font-medium relative z-10">
          {res.summary}
        </p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Problemas', val: res.criticalIssues.length, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
            { label: 'Soluciones', val: res.recommendations.length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'WCAG', val: res.accessibilityIssues.length, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
            { label: 'Puntuación', val: res.priorityScore.toFixed(1), color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          ].map((m, i) => (
            <div key={i} className={`${m.bg} ${m.border} border rounded-xl p-4 text-center shadow-sm`}>
              <div className={`text-3xl font-black ${m.color} font-mono tracking-tighter`}>{m.val}</div>
              <div className="text-[0.65rem] text-slate-500 font-black uppercase tracking-widest mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Critical Issues */}
      {res.criticalIssues.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-1.5 bg-red-600 rounded-full" />
            <h2 className="font-black text-navy text-lg uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-600" /> Hallazgos Críticos ({res.criticalIssues.length})
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {res.criticalIssues.map((issue, idx) => (
              <CriticalIssueCard key={idx} issue={issue} idx={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {res.recommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-1.5 bg-emerald-600 rounded-full" />
            <h2 className="font-black text-navy text-lg uppercase tracking-widest flex items-center gap-2">
              <CheckCircle size={20} className="text-emerald-600" /> Plan de Mejora ({res.recommendations.length})
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {res.recommendations.map((solution, idx) => (
              <ProposedSolutionCard key={idx} solution={solution} idx={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Accessibility */}
      {res.accessibilityIssues.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-1.5 bg-purple-600 rounded-full" />
            <h2 className="font-black text-navy text-lg uppercase tracking-widest flex items-center gap-2">
              <Zap size={20} className="text-purple-600" /> Accesibilidad WCAG ({res.accessibilityIssues.length})
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {res.accessibilityIssues.map((finding, idx) => (
              <AccessibilityCard key={idx} finding={finding} idx={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Analysis Metadata Footer */}
      <footer className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10" aria-hidden="true">
          <Info size={120} />
        </div>
        <div className="relative z-10">
          <h2 className="font-black text-blue-300 text-[0.7rem] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Info size={14} /> Metadatos del Procesamiento
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-slate-400 font-bold text-[0.6rem] uppercase tracking-widest mb-1">Motor de IA</p>
              <p className="text-white font-black text-sm">{res.analysisMetadata.model}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[0.6rem] uppercase tracking-widest mb-1">Confianza</p>
              <p className="text-white font-black text-sm">{res.analysisMetadata.confidence}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[0.6rem] uppercase tracking-widest mb-1">Latencia</p>
              <p className="text-white font-black text-sm">{res.analysisMetadata.processingTimeMs}ms</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[0.6rem] uppercase tracking-widest mb-1">Observaciones</p>
              <p className="text-white font-black text-sm">{res.analysisMetadata.observationsAnalyzed} ítems</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      {/* Main Column */}
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
              aria-label="Volver"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-black text-xl md:text-2xl text-slate-900 uppercase tracking-tight leading-none">
                {selectedResult ? 'Revisión de Historial' : 'Análisis de IA'}
              </h1>
              {testPlan && (
                <div className="mt-1.5 flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-700">{testPlan.product || 'Sin producto definido'}</span>
                  {testPlan.module && <span className="text-xs font-semibold text-slate-500">Módulo: {testPlan.module}</span>}
                </div>
              )}
              {selectedResult && (
                <p className="text-[0.65rem] font-bold text-navy uppercase tracking-widest mt-2 animate-pulse">
                  Visualizando registro guardado
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${showHistory ? 'bg-navy text-white border-navy' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                <HistoryIcon size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Historial</span>
              </button>
            )}
            
            {onExport && activeResult && (
              <button
                onClick={onExport}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white font-black text-xs uppercase tracking-widest hover:bg-navy-dark transition-all shadow-lg shadow-navy/20"
              >
                <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
              </button>
            )}
          </div>
        </header>

        {showHistory && isMobile ? (
          <div className="animate-in slide-in-from-right duration-300">
             <AnalysisHistoryPanel 
              history={history} 
              onSelect={(res) => { setSelectedResult(res); setShowHistory(false); if(onSelectResult) onSelectResult(res); }} 
              onDelete={handleDeleteHistory}
              isLoading={isHistoryLoading}
            />
          </div>
        ) : (
          activeResult ? renderContent(activeResult) : (
            <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
              <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                Selecciona un análisis del historial para visualizarlo
              </p>
            </div>
          )
        )}
      </div>

      {/* Sidebar (Desktop only) */}
      {!isMobile && (
        <aside className="w-80 shrink-0 sticky top-4 h-fit max-h-[calc(100vh-2rem)] overflow-y-auto pr-2">
          <AnalysisHistoryPanel 
            history={history} 
            onSelect={(res) => { setSelectedResult(res); if(onSelectResult) onSelectResult(res); }} 
            onDelete={handleDeleteHistory}
            isLoading={isHistoryLoading}
          />
        </aside>
      )}
    </div>
  );
};


export default ResultsView;