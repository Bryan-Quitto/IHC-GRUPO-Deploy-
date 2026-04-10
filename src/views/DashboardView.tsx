import React, { useMemo } from 'react';
import { TestPlan, TestTask, Observation, Finding, DashboardTab } from '../models/types';
import {
  ClipboardList, FileText, Search, BarChart2, TrendingUp,
  CheckCircle2, Clock, AlertTriangle, Users,
  ArrowRight, Activity, Zap, Target, Shield
} from 'lucide-react';

interface DashboardViewProps {
  allPlans: TestPlan[];
  testPlan: TestPlan;
  tasks: TestTask[];
  observations: Observation[];
  findings: Finding[];
  onTabChange: (tab: DashboardTab) => void;
  onLoadPlan: (plan: TestPlan) => void;
}

const fmtTime = (s: number) =>
  s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100);

export const DashboardView: React.FC<DashboardViewProps> = ({
  allPlans, testPlan, tasks, observations, findings, onTabChange, onLoadPlan,
}) => {
  const metrics = useMemo(() => {
    const total = observations.length;
    const ok    = observations.filter(o => o.success_level === 'Sí').length;
    const help  = observations.filter(o => o.success_level === 'Con ayuda').length;
    const fail  = observations.filter(o => o.success_level === 'No').length;
    const errors = observations.reduce((s, o) => s + (o.errors || 0), 0);
    const times  = observations.map(o => o.time_seconds || 0);
    const avgTime = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

    const sevCount: Record<string, number> = { Baja: 0, Media: 0, Alta: 0, 'Crítica': 0 };
    const staCount: Record<string, number> = { Pendiente: 0, 'En progreso': 0, Resuelto: 0 };
    findings.forEach(f => {
      sevCount[f.severity] = (sevCount[f.severity] || 0) + 1;
      staCount[f.status]   = (staCount[f.status]   || 0) + 1;
    });

    const successRate   = pct(ok, total);
    const criticalCount = (sevCount['Crítica'] || 0) + (sevCount['Alta'] || 0);
    const resolvedRate  = pct(staCount['Resuelto'] || 0, findings.length);

    const usabilityScore =
      successRate >= 80 ? 'Aceptable' :
      successRate >= 60 ? 'Mejorable' :
      successRate >= 40 ? 'Deficiente' : 'Crítica';

    const usabilityColor =
      successRate >= 80 ? 'text-green-900' :
      successRate >= 60 ? 'text-amber-900' :
      successRate >= 40 ? 'text-orange-900' : 'text-red-900';

    const usabilityBg =
      successRate >= 80 ? 'bg-green-50' :
      successRate >= 60 ? 'bg-amber-50' :
      successRate >= 40 ? 'bg-orange-50' : 'bg-red-50';

    const iconBg =
      successRate >= 80 ? 'bg-green-100/50' :
      successRate >= 60 ? 'bg-amber-100/50' :
      successRate >= 40 ? 'bg-orange-100/50' : 'bg-red-100/50';

    return {
      total, ok, help, fail, errors, avgTime,
      sevCount, staCount, successRate, criticalCount,
      resolvedRate, usabilityScore, usabilityColor, usabilityBg, iconBg,
      totalFindings: findings.length,
      resolvedCount: staCount['Resuelto'] || 0,
    };
  }, [observations, findings]);

  const recentPlans = allPlans.slice(0, 5);

  const quickActions = [
    { icon: <ClipboardList size={22} />, label: 'Plan de Prueba',   tab: 'plan'         as DashboardTab, desc: 'Define contexto y tareas',   color: 'text-navy', bg: 'bg-blue-50', hoverBg: 'hover:bg-blue-100/50' },
    { icon: <FileText      size={22} />, label: 'Guion y Tareas',    tab: 'script'       as DashboardTab, desc: 'Redacta el guion de sesión', color: 'text-blue-900', bg: 'bg-indigo-50', hoverBg: 'hover:bg-indigo-100/50' },
    { icon: <Search        size={22} />, label: 'Observaciones',     tab: 'observations' as DashboardTab, desc: 'Registra lo observado',      color: 'text-teal-900', bg: 'bg-teal-50', hoverBg: 'hover:bg-teal-100/50' },
    { icon: <BarChart2     size={22} />, label: 'Hallazgos',         tab: 'findings'     as DashboardTab, desc: 'Documenta mejoras',          color: 'text-purple-900', bg: 'bg-purple-50', hoverBg: 'hover:bg-purple-100/50' },
    { icon: <Activity      size={22} />, label: 'Reportes',          tab: 'reports'      as DashboardTab, desc: 'Genera el informe final',    color: 'text-amber-900', bg: 'bg-amber-50', hoverBg: 'hover:bg-amber-100/50' },
  ];

  const hasData = observations.length > 0 || findings.length > 0;

  const kpiCards = [
    {
      value: observations.length,
      label: 'Observaciones',
      sub: `${metrics.ok} exitosas`,
      icon: <CheckCircle2 size={20} aria-hidden="true" />,
      color: 'text-navy',
      bg: 'bg-blue-50',
    },
    {
      value: `${metrics.successRate}%`,
      label: 'Tasa de éxito',
      sub: metrics.usabilityScore,
      icon: <TrendingUp size={20} aria-hidden="true" />,
      color: metrics.usabilityColor,
      bg: metrics.usabilityBg,
    },
    {
      value: fmtTime(metrics.avgTime),
      label: 'Tiempo promedio',
      sub: 'por sesión',
      icon: <Clock size={20} aria-hidden="true" />,
      color: 'text-blue-900',
      bg: 'bg-indigo-50',
    },
    {
      value: findings.length,
      label: 'Hallazgos',
      sub: `${metrics.criticalCount} críticos`,
      icon: <AlertTriangle size={20} aria-hidden="true" />,
      color: 'text-purple-900',
      bg: 'bg-purple-50',
    },
    {
      value: `${metrics.resolvedRate}%`,
      label: 'Resueltos',
      sub: `${metrics.resolvedCount} de ${findings.length}`,
      icon: <Shield size={20} aria-hidden="true" />,
      color: 'text-teal-900',
      bg: 'bg-teal-50',
    },
  ];

  const distRows = [
    { label: 'Completadas', val: metrics.ok,   textColor: 'text-green-900', barColor: 'bg-green-600', icon: '✅' },
    { label: 'Con ayuda',   val: metrics.help, textColor: 'text-amber-900', barColor: 'bg-amber-600', icon: '🤝' },
    { label: 'Fallidas',    val: metrics.fail, textColor: 'text-red-900', barColor: 'bg-red-600', icon: '❌' },
  ];

  const sevCards = [
    { sev: 'Crítica', bg: 'bg-red-800', text: 'text-white' },
    { sev: 'Alta',    bg: 'bg-orange-800', text: 'text-white' },
    { sev: 'Media',   bg: 'bg-amber-800', text: 'text-white' },
    { sev: 'Baja',    bg: 'bg-green-900', text: 'text-white' },
  ];

  return (
    <div className="animate-in fade-in duration-500">

      {/* ══ HERO ══ */}
      <section className="relative bg-gradient-to-br from-navy-dark via-navy to-navy-light rounded-[28px] p-8 md:p-10 mb-8 overflow-hidden text-white" aria-labelledby="db-hero-title">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute w-[320px] h-[320px] bg-blue-400 rounded-full blur-[60px] opacity-[0.18] -top-[80px] -right-[60px] animate-gd-float" />
          <div className="absolute w-[200px] h-[200px] bg-purple-400 rounded-full blur-[60px] opacity-[0.18] -bottom-[60px] left-[10%] animate-gd-float-reverse" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>

        <div className="relative z-10 max-w-[700px]">
          <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 backdrop-blur-md px-3.5 py-1 rounded-full text-[0.8rem] font-bold tracking-widest uppercase text-white/90 mb-4">
            <Zap size={13} aria-hidden="true" />
            <span>Panel de Control</span>
          </div>
          <h2 id="db-hero-title" className="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight mb-2">
            {testPlan.product
              ? <>Bienvenido al plan de <em className="not-italic text-blue-300">{testPlan.product}</em></>
              : 'Gestión de Pruebas de Usabilidad'
            }
          </h2>
          {testPlan.module && (
            <p className="text-[0.9rem] text-white/80 mb-5 font-medium">Módulo: <strong className="text-white font-bold">{testPlan.module}</strong></p>
          )}
          <div className="flex flex-wrap gap-2">
            {testPlan.moderator && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 px-3 py-1 rounded-full text-[0.8rem] font-semibold backdrop-blur-sm">
                <Users size={12} aria-hidden="true" /> {testPlan.moderator}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 px-3 py-1 rounded-full text-[0.8rem] font-semibold backdrop-blur-sm">
              <ClipboardList size={12} aria-hidden="true" /> {allPlans.length} plan{allPlans.length !== 1 ? 'es' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 px-3 py-1 rounded-full text-[0.8rem] font-semibold backdrop-blur-sm">
              <Target size={12} aria-hidden="true" /> {tasks.length} tarea{tasks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </section>

      {/* ══ KPI STRIP ══ */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8" aria-label="Métricas principales">
        {kpiCards.map((kpi, i) => (
          <article
            key={i}
            className={`bg-white border border-slate-200 border-t-[3px] rounded-xl p-4 flex items-start gap-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
            style={{ borderTopColor: 'currentColor' } as React.CSSProperties}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color}`}
              aria-hidden="true"
            >
              {kpi.icon}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className={`text-2xl font-black leading-none tracking-tight font-mono ${kpi.color}`}>
                {kpi.value}
              </span>
              <span className="text-[0.75rem] font-bold text-slate-800 uppercase tracking-wider">{kpi.label}</span>
              <span className="text-[0.75rem] text-slate-500 font-semibold truncate">{kpi.sub}</span>
            </div>
          </article>
        ))}
      </section>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">

        {/* ── Acciones rápidas ── */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="db-actions-heading">
          <header className="flex justify-between items-center p-4 md:px-5 border-b border-slate-200 bg-gradient-to-r from-blue-50/50 to-slate-50/30">
            <h3 id="db-actions-heading" className="flex items-center gap-2 text-[0.88rem] font-bold text-navy uppercase tracking-wider">
              <Zap size={16} aria-hidden="true" /> Acceso rápido
            </h3>
          </header>
          <div className="p-4 flex flex-col gap-2.5">
            {quickActions.map((action) => (
              <button
                key={action.tab}
                className={`group flex items-center gap-4 w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 cursor-pointer text-left transition-all relative overflow-hidden ${action.hoverBg} hover:border-current hover:translate-x-1 hover:shadow-lg hover:shadow-black/5`}
                onClick={() => onTabChange(action.tab)}
                style={{ color: 'inherit' } as React.CSSProperties}
                aria-label={`Ir a ${action.label}: ${action.desc}`}
              >
                <span
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${action.bg} ${action.color}`}
                  aria-hidden="true"
                >
                  {action.icon}
                </span>
                <div className="flex-1 flex flex-col gap-0.5">
                  <strong className="text-[0.9rem] font-bold text-slate-900 leading-tight">{action.label}</strong>
                  <span className="text-[0.8rem] text-slate-500 font-medium">{action.desc}</span>
                </div>
                <ArrowRight size={16} className="text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-current shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        {/* ── Columna derecha ── */}
        <div className="flex flex-col gap-5">

          {/* Distribución por estado */}
          {hasData && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="db-dist-heading">
              <header className="flex justify-between items-center p-4 md:px-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <h3 id="db-dist-heading" className="flex items-center gap-2 text-[0.88rem] font-bold text-navy uppercase tracking-wider">
                  <Activity size={16} aria-hidden="true" /> Distribución
                </h3>
              </header>
              <div className="p-5 flex flex-col gap-4">
                {distRows.map(row => (
                  <div key={row.label} className="grid grid-cols-[110px_1fr_56px] items-center gap-2.5">
                    <div className="flex items-center gap-1.5 text-[0.8rem] font-bold text-slate-900 whitespace-nowrap">
                      <span aria-hidden="true">{row.icon}</span>
                      <span className={row.textColor}>{row.label}</span>
                    </div>
                    <div
                      className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={pct(row.val, metrics.total)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${row.barColor}`}
                        style={{ width: `${pct(row.val, metrics.total)}%` }}
                      />
                    </div>
                    <span className={`text-[0.82rem] font-black text-right whitespace-nowrap font-mono ${row.textColor}`}>
                      {row.val}
                      <span className="text-[0.8rem] font-bold opacity-60 ml-0.5"> ({pct(row.val, metrics.total)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Hallazgos por severidad */}
          {findings.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="db-sev-heading">
              <header className="flex justify-between items-center p-4 md:px-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <h3 id="db-sev-heading" className="flex items-center gap-2 text-[0.88rem] font-bold text-navy uppercase tracking-wider">
                  <AlertTriangle size={16} aria-hidden="true" /> Severidad
                </h3>
                <button
                  className="bg-transparent border-none text-navy text-[0.8rem] font-bold cursor-pointer px-2 py-1 rounded-md transition-all hover:bg-blue-50 flex items-center gap-1"
                  onClick={() => onTabChange('findings')}
                >
                  Ver todos <ArrowRight size={13} />
                </button>
              </header>
              <div className="grid grid-cols-2 gap-3 p-5">
                {sevCards.map(s => (
                  <div
                    key={s.sev}
                    className={`rounded-xl p-4 text-center flex flex-col gap-0.5 transition-transform hover:scale-[1.03] shadow-md shadow-black/5 ${s.bg} ${s.text}`}
                  >
                    <span className="text-3xl font-black leading-none font-mono tracking-tighter">
                      {metrics.sevCount[s.sev] || 0}
                    </span>
                    <span className="text-[0.75rem] font-black uppercase tracking-widest opacity-90">
                      {s.sev}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Planes recientes */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="db-recent-heading">
            <header className="flex justify-between items-center p-4 md:px-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h3 id="db-recent-heading" className="flex items-center gap-2 text-[0.88rem] font-bold text-navy uppercase tracking-wider">
                <ClipboardList size={16} aria-hidden="true" /> Planes recientes
              </h3>
            </header>
            {recentPlans.length === 0 ? (
              <p className="p-6 text-center text-slate-500 text-[0.85rem] font-medium m-0 italic">No hay planes aún. ¡Crea el primero!</p>
            ) : (
              <ul className="list-none p-2 m-0 divide-y divide-slate-50">
                {recentPlans.map((plan) => (
                  <li key={plan.id}>
                    <button
                      className="flex items-center gap-3 w-full bg-transparent border-none rounded-lg p-3 text-left cursor-pointer transition-all hover:bg-slate-50"
                      onClick={() => onLoadPlan(plan)}
                      aria-label={`Cargar plan: ${plan.product || 'Sin nombre'}`}
                    >
                      <span className="text-xl shrink-0" aria-hidden="true">📋</span>
                      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                        <strong className="text-[0.84rem] font-bold text-slate-900 truncate">{plan.product || 'Sin nombre'}</strong>
                        <span className="text-[0.8rem] text-slate-500 font-medium truncate">{plan.module || 'Módulo no especificado'}</span>
                      </div>
                      <span className="text-[0.8rem] text-slate-500 font-bold shrink-0 font-mono">
                        {plan.created_at
                          ? new Date(plan.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
                          : '—'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>
      </div>

      {/* ══ ESTADO VACÍO ══ */}
      {!hasData && !testPlan.product && (
        <section className="text-center p-12 bg-white border-2 border-dashed border-slate-200 rounded-3xl mt-8" aria-labelledby="db-empty-heading">
          <div className="w-20 h-20 bg-blue-50 text-navy rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner" aria-hidden="true">
            <ClipboardList size={40} />
          </div>
          <h3 id="db-empty-heading" className="text-xl font-black text-slate-900 mb-2">Empieza tu primera prueba</h3>
          <p className="text-slate-500 font-medium max-w-[420px] mx-auto mb-6 leading-relaxed">Crea un plan de prueba de usabilidad y comienza a registrar observaciones y hallazgos.</p>
          <button 
            className="inline-flex items-center gap-2 bg-navy text-white border-none rounded-xl px-7 py-3 text-[0.95rem] font-black cursor-pointer transition-all hover:bg-navy-dark shadow-lg shadow-navy/20 active:scale-[0.98]" 
            onClick={() => onTabChange('plan')}
          >
            Crear mi primer plan <ArrowRight size={18} aria-hidden="true" />
          </button>
        </section>
      )}

    </div>
  );
};