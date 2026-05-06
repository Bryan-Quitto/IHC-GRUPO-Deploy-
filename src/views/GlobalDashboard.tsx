import React, { useMemo, useState } from 'react';
import { TestPlan, Observation, Finding, PlanStatus } from '../models/types';
import {
  ClipboardList, TrendingUp, Clock,
  AlertTriangle, Shield, Plus, ArrowRight,
  BarChart2, Users, Zap, Search, Trash2, Filter, Calendar, X
} from 'lucide-react';

interface GlobalDashboardProps {
  loading?: boolean;
  allPlans: TestPlan[];
  allObservations: Observation[];
  allFindings: Finding[];
  onSelectPlan: (plan: TestPlan) => void;
  onCreatePlan: () => void;
  onDeletePlan: (planId: string) => void;
}

const pct = (n: number, t: number) => (t === 0 ? 0 : Math.round((n / t) * 100));
const fmtTime = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

const SEV_COLORS: Record<string, { bg: string; text: string }> = {
  'Crítica': { bg: 'bg-red-800', text: 'text-white' },
  'Alta':    { bg: 'bg-orange-800', text: 'text-white' },
  'Media':   { bg: 'bg-amber-800', text: 'text-white' },
  'Baja':    { bg: 'bg-green-900', text: 'text-white' },
};

import StatusDropdown from '../components/StatusDropdown';

const STATUS_FILTER_OPTIONS = [
  { value: 'Todos', label: 'Todos los estados', dot: 'bg-slate-300' },
  { value: 'Borrador', label: 'Borrador', dot: 'bg-slate-400', color: 'text-slate-600' },
  { value: 'Activo', label: 'Activos', dot: 'bg-emerald-500', color: 'text-emerald-700' },
  { value: 'Completado', label: 'Completados', dot: 'bg-blue-600', color: 'text-blue-700' }
];

const DATE_FILTER_OPTIONS = [
  { value: 'Todas', label: 'Todas las fechas' },
  { value: 'Recientes', label: 'Últimos 7 días' },
  { value: 'Este mes', label: 'Este mes' },
  { value: 'Mes pasado', label: 'Mes pasado' }
];

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({
  loading = false,
  allPlans, allObservations, allFindings,
  onSelectPlan, onCreatePlan, onDeletePlan,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlanStatus | 'Todos'>('Todos');
  const [dateFilter, setDateFilter] = useState<'Todas' | 'Recientes' | 'Este mes' | 'Mes pasado'>('Todas');
  const [page, setPage] = useState(1);
  const [planToDelete, setPlanToDelete] = useState<TestPlan | null>(null);
  const PAGE_SIZE = 10;

  const global = useMemo(() => {
    const total  = allObservations.length;
    const ok     = allObservations.filter(o => o.success_level === 'Sí').length;
    const times  = allObservations.map(o => o.time_seconds || 0);
    const avgTime = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const errors  = allObservations.reduce((s, o) => s + (o.errors || 0), 0);
    const successRate = pct(ok, total);

    const sev: Record<string, number> = { Baja: 0, Media: 0, Alta: 0, 'Crítica': 0 };
    const resolved = allFindings.filter(f => f.status === 'Resuelto').length;
    allFindings.forEach(f => { sev[f.severity] = (sev[f.severity] || 0) + 1; });

    const usabilityScore =
      successRate >= 80 ? 'Aceptable' :
      successRate >= 60 ? 'Mejorable' :
      successRate >= 40 ? 'Deficiente' : total === 0 ? '—' : 'Crítica';

    const usabilityColor =
      successRate >= 80 ? 'text-green-900' :
      successRate >= 60 ? 'text-amber-900' :
      successRate >= 40 ? 'text-orange-900' :
      total === 0        ? 'text-slate-600' : 'text-red-900';

    return {
      total, ok, avgTime, errors, successRate,
      sev, resolved, usabilityScore, usabilityColor,
      totalFindings: allFindings.length,
      resolvedRate: pct(resolved, allFindings.length),
    };
  }, [allObservations, allFindings]);

  const planMetrics = useMemo(() => {
    return allPlans.map(plan => {
      const obs = allObservations.filter(o => o.test_plan_id === plan.id);
      const fin = allFindings.filter(f => f.test_plan_id === plan.id);
      const ok  = obs.filter(o => o.success_level === 'Sí').length;
      const criticalF = fin.filter(f => f.severity === 'Crítica' || f.severity === 'Alta').length;
      const rate = pct(ok, obs.length);
      const score =
        rate >= 80 ? 'Aceptable' :
        rate >= 60 ? 'Mejorable' :
        rate >= 40 ? 'Deficiente' :
        obs.length === 0 ? 'Sin datos' : 'Crítica';

      const scoreColor =
        rate >= 80 ? 'text-green-800' :
        rate >= 60 ? 'text-amber-800' :
        rate >= 40 ? 'text-orange-800' :
        obs.length === 0 ? 'text-slate-600' : 'text-red-800';

      const scoreBg =
        rate >= 80 ? 'bg-green-100 border-green-200' :
        rate >= 60 ? 'bg-amber-100 border-amber-200' :
        rate >= 40 ? 'bg-orange-100 border-orange-200' :
        obs.length === 0 ? 'bg-slate-100 border-slate-200' : 'bg-red-100 border-red-200';

      const barColor =
        rate >= 80 ? 'bg-green-600' :
        rate >= 60 ? 'bg-amber-600' :
        'bg-red-600';

      return { plan, obs: obs.length, fin: fin.length, ok, rate, criticalF, score, scoreColor, scoreBg, barColor };
    });
  }, [allPlans, allObservations, allFindings]);

  const filtered = useMemo(() => {
    return planMetrics.filter(pm => {
      // Búsqueda de texto
      const matchesSearch = pm.plan.product?.toLowerCase().includes(search.toLowerCase()) ||
                           pm.plan.module?.toLowerCase().includes(search.toLowerCase());
      
      // Filtro de estado
      const matchesStatus = statusFilter === 'Todos' || pm.plan.status === statusFilter;

      // Filtro de fecha
      let matchesDate = true;
      if (dateFilter !== 'Todas' && pm.plan.created_at) {
        const planDate = new Date(pm.plan.created_at);
        const now = new Date();
        if (dateFilter === 'Recientes') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          matchesDate = planDate >= sevenDaysAgo;
        } else if (dateFilter === 'Este mes') {
          matchesDate = planDate.getMonth() === now.getMonth() && planDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === 'Mes pasado') {
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          matchesDate = planDate.getMonth() === lastMonth && planDate.getFullYear() === year;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [planMetrics, search, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const kpis = [
    { value: allPlans.length,           label: 'Planes totales',    sub: 'registrados',              icon: <ClipboardList size={20} />, color: 'text-navy', bg: 'bg-blue-50' },
    { value: allObservations.length,    label: 'Observaciones',     sub: 'en todos los planes',      icon: <Users         size={20} />, color: 'text-blue-900', bg: 'bg-indigo-50' },
    { value: `${global.successRate}%`,  label: 'Tasa de éxito',     sub: global.usabilityScore,      icon: <TrendingUp    size={20} />, color: global.usabilityColor, bg: 'bg-green-50' },
    { value: fmtTime(global.avgTime),   label: 'Tiempo promedio',   sub: 'por sesión global',        icon: <Clock         size={20} />, color: 'text-teal-900', bg: 'bg-teal-50' },
    { value: allFindings.length,        label: 'Hallazgos',         sub: `${global.sev['Crítica'] + global.sev['Alta']} críticos`, icon: <AlertTriangle size={20} />, color: 'text-purple-900', bg: 'bg-purple-50' },
    { value: `${global.resolvedRate}%`, label: 'Resueltos',         sub: `${global.resolved} de ${global.totalFindings}`, icon: <Shield size={20} />, color: 'text-emerald-900', bg: 'bg-emerald-50' },
  ];

  return (
    <main className="pb-12">

      {/* ══ HERO GLOBAL ══ */}
      <section className="relative bg-gradient-to-br from-navy-dark via-navy to-navy-light rounded-b-[32px] p-8 md:p-12 mb-8 overflow-hidden text-white min-h-[260px]" aria-labelledby="gd-hero-title">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute w-[380px] h-[380px] bg-blue-400 rounded-full blur-[70px] opacity-15 -top-[120px] -right-[80px] animate-gd-float" />
          <div className="absolute w-[220px] h-[220px] bg-purple-400 rounded-full blur-[70px] opacity-15 -bottom-[60px] left-[8%] animate-gd-float-reverse" />
          <div className="absolute w-[140px] h-[140px] bg-emerald-400 rounded-full blur-[70px] opacity-15 top-[30%] left-[40%] animate-gd-float-delayed" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:44px_44px]" />
        </div>

        <div className="relative z-10 flex flex-wrap justify-between items-end gap-8">
          <div className="flex-1 min-w-[260px]">
            <span className="gd-badge mb-4"><Zap size={12} aria-hidden="true" /> Panel de Control Global</span>
            <h2 id="gd-hero-title" className="text-3xl md:text-4xl lg:text-5xl font-black leading-[1.15] tracking-tight mb-2">
              Gestión de Pruebas<br />
              <em className="not-italic text-blue-300">de Usabilidad</em>
            </h2>
            <p className="text-sm md:text-base text-white/80 max-w-[460px] font-medium leading-relaxed">
              Visión general de todos tus planes, observaciones y hallazgos en un solo lugar.
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-5 md:p-7 text-center flex flex-col gap-1 min-w-[160px]" aria-label={`Usabilidad global: ${global.usabilityScore}`}>
            {loading ? (
              <div className="w-20 h-14 bg-white/20 rounded-lg animate-pulse mx-auto" />
            ) : (
              <>
                <span className="text-4xl md:text-5xl font-black leading-none tracking-tighter font-mono">
                  {global.total === 0 ? '—' : `${global.successRate}%`}
                </span>
                <span className="text-sm font-bold text-white/75 uppercase tracking-widest mt-1">Tasa de éxito</span>
                <span className="inline-block mt-2 px-4 py-1 rounded-full bg-white/20 border border-white/30 text-sm font-bold">
                  {global.usabilityScore}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══ KPIs GLOBALES ══ */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8" aria-label="Indicadores globales">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="bg-white rounded-xl border border-slate-200 h-[100px] animate-pulse" />
          ))
        ) : (
          kpis.map((k, i) => (
            <article key={i} className="bg-white border border-slate-200 border-t-[3px] rounded-xl p-4 flex items-start gap-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.bg} ${k.color}`} aria-hidden="true">
                {k.icon}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <h3 className={`text-xl font-extrabold leading-none tracking-tight font-mono ${k.color}`}>{k.value}</h3>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{k.label}</span>
                <span className="text-xs text-slate-500 font-semibold truncate">{k.sub}</span>
              </div>
            </article>
          ))
        )}
      </section>

      {/* ══ LISTA DE PLANES ══ */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6" aria-labelledby="gd-plans-title">
        <div className="flex flex-wrap justify-between items-center gap-4 p-4 md:px-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 rounded-t-xl">
          <div className="flex items-center gap-3">
            <h3 id="gd-plans-title" className="flex items-center gap-2 text-[0.9rem] font-extrabold text-navy uppercase tracking-wider text-nowrap">
              <BarChart2 size={18} aria-hidden="true" /> Todos los planes
            </h3>
            <span className="bg-blue-50 text-navy text-sm font-bold px-2.5 py-0.5 rounded-full border border-blue-100 whitespace-nowrap">
              {filtered.length} plan{filtered.length !== 1 ? 'es' : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-1 justify-end min-w-0">
            {/* Buscador */}
            <div className="relative flex items-center w-full sm:w-[200px]">
              <Search size={15} aria-hidden="true" className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Buscar plan..."
                aria-label="Buscar plan por producto o módulo"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/5"
              />
            </div>

            {/* Filtro de Estado */}
            <StatusDropdown 
              value={statusFilter} 
              options={STATUS_FILTER_OPTIONS}
              onChange={(val) => { setStatusFilter(val as typeof statusFilter); setPage(1); }}
              icon={Filter}
              headerLabel="Estado del Plan"
            />

            {/* Filtro de Fecha */}
            <StatusDropdown 
              value={dateFilter} 
              options={DATE_FILTER_OPTIONS}
              onChange={(val) => { setDateFilter(val as typeof dateFilter); setPage(1); }}
              icon={Calendar}
              headerLabel="Rango de Fecha"
            />

            {/* Reset Filtros */}
            {(search || statusFilter !== 'Todos' || dateFilter !== 'Todas') && (
              <button 
                onClick={() => { setSearch(''); setStatusFilter('Todos'); setDateFilter('Todas'); setPage(1); }}
                className="p-2 text-slate-400 hover:text-navy transition-colors bg-transparent border-none cursor-pointer"
                title="Limpiar filtros"
              >
                <X size={18} />
              </button>
            )}

            <button 
              className="inline-flex items-center gap-1.5 bg-navy text-white border-none rounded-lg px-4 py-2 text-sm font-bold cursor-pointer transition-all hover:bg-navy-dark active:scale-[0.98] whitespace-nowrap" 
              onClick={onCreatePlan} 
            >
              <Plus size={16} aria-hidden="true" /> <span>Nuevo plan</span>
            </button>
          </div>
        </div>

        <div className="rounded-b-xl overflow-hidden">
          {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[60px] bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center p-14 text-slate-500 gap-2">
            <ClipboardList size={48} aria-hidden="true" className="text-slate-300 mb-2" />
            <h4 className="text-slate-900 font-bold text-lg">{search ? 'Sin resultados' : 'No hay planes todavía'}</h4>
            <p className="text-sm font-medium">{search ? 'Prueba con otra búsqueda.' : 'Crea tu primer plan de prueba de usabilidad.'}</p>
            {!search && (
              <button 
                className="inline-flex items-center gap-2 bg-navy text-white border-none rounded-lg px-6 py-3 text-[0.95rem] font-bold cursor-pointer mt-4 transition-all hover:bg-navy-dark shadow-lg shadow-navy/20" 
                onClick={onCreatePlan}
                aria-label="Crear el primer plan de prueba de usabilidad"
              >
                <Plus size={18} aria-hidden="true" /> Crear primer plan
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Cabecera tabla (Desktop) */}
            <div className="hidden lg:grid grid-cols-[1fr_100px_120px_90px_80px_110px_120px_48px] px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500" aria-hidden="true">
              <span>Plan / Módulo</span>
              <span className="text-center">Obs.</span>
              <span className="text-center">Éxito</span>
              <span className="text-center">Hallazgos</span>
              <span className="text-center">Críticos</span>
              <span className="text-center">Usabilidad</span>
              <span className="text-center">Estado Plan</span>
              <span></span>
            </div>

            <ul className="list-none p-0 m-0 divide-y divide-slate-100">
              {paginated.map(({ plan, obs, fin, ok, rate, criticalF, score, scoreColor, scoreBg, barColor }) => {
                const planStatusData = {
                  'Borrador':   { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
                  'Activo':     { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                  'Completado': { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', dot: 'bg-blue-600' },
                }[plan.status || 'Borrador'];

                return (
                  <li key={plan.id} className="group flex items-center hover:bg-slate-50 transition-colors">
                    <button
                      className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_100px_120px_90px_80px_110px_120px_48px] items-center text-left bg-transparent border-none p-4 lg:py-4 lg:pl-6 lg:pr-0 cursor-pointer font-inherit"
                      onClick={() => onSelectPlan(plan)}
                      aria-label={`Abrir plan: ${plan.product || 'Sin nombre'} - ${plan.module || 'Sin módulo'}`}
                    >
                      {/* Nombre */}
                      <div className="flex flex-col gap-0.5 pr-4 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <strong className="text-[0.95rem] font-bold text-slate-900 truncate">{plan.product || 'Sin nombre'}</strong>
                          <span className={`lg:hidden flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-black uppercase tracking-widest ${planStatusData.bg} ${planStatusData.text}`}>
                            {plan.status || 'Borrador'}
                          </span>
                        </div>
                        <span className="text-sm text-slate-500 font-medium break-words">{plan.module || 'Módulo no especificado'}</span>
                        {plan.moderator && (
                          <span className="flex items-center gap-1.5 text-sm text-slate-500 font-semibold mt-1 truncate">
                            <Users size={11} aria-hidden="true" /> {plan.moderator}
                          </span>
                        )}
                      </div>

                      {/* Observaciones (Desktop) */}
                      <div className="hidden lg:flex flex-col items-center gap-0.5">
                        <span className="text-base font-black text-slate-800 font-mono">{obs}</span>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{ok} exitosas</span>
                      </div>

                      {/* Tasa éxito */}
                      <div className="hidden lg:flex flex-col items-center gap-1.5">
                        <span className={`text-base font-black font-mono ${scoreColor}`}>
                          {obs === 0 ? '—' : `${rate}%`}
                        </span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden" role="presentation">
                          <div
                            className={`h-full rounded-full transition-all duration-700 min-w-[2px] ${barColor}`}
                            style={{ width: obs === 0 ? '0%' : `${rate}%` }}
                          />
                        </div>
                      </div>

                      {/* Hallazgos (Desktop) */}
                      <div className="hidden lg:flex flex-col items-center gap-0.5">
                        <span className="text-base font-black text-slate-800 font-mono">{fin}</span>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Items</span>
                      </div>

                      {/* Críticos (Desktop) */}
                      <div className="hidden lg:flex flex-col items-center gap-0.5">
                        <span className={`text-base font-black font-mono ${criticalF > 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {criticalF}
                        </span>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Alertas</span>
                      </div>

                      {/* Usabilidad (Score) */}
                      <div className="hidden lg:flex justify-center">
                        <span className={`gd-status-badge ${scoreBg} ${scoreColor} border text-xs`}>
                          {score}
                        </span>
                      </div>

                      {/* Estado del Plan */}
                      <div className="hidden lg:flex justify-center">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-black uppercase tracking-widest ${planStatusData.bg} ${planStatusData.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${planStatusData.dot}`} />
                          {plan.status || 'Borrador'}
                        </span>
                      </div>

                      {/* Flecha */}
                      <div className="flex items-center justify-center text-slate-300 transition-all group-hover:text-navy group-hover:translate-x-1">
                        <ArrowRight size={20} aria-hidden="true" />
                      </div>
                    </button>

                  <button
                    className="shrink-0 w-12 h-full min-h-[64px] flex items-center justify-center bg-transparent border-none text-slate-300 cursor-pointer p-0 transition-all hover:bg-red-50 hover:text-red-600 border-l border-transparent group-hover:border-slate-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlanToDelete(plan);
                    }}
                    aria-label={`Eliminar plan ${plan.product || 'Sin nombre'}`}
                    title="Eliminar plan"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </li>
                );
                })}
                </ul>
            {/* ── Paginación ── */}
            {totalPages > 1 && (
              <nav className="flex flex-wrap items-center justify-between gap-4 p-4 md:px-6 border-t border-slate-100 bg-slate-50/50" aria-label="Paginación de planes">
                <span className="text-sm font-bold text-slate-500 whitespace-nowrap uppercase tracking-wider" aria-live="polite">
                  {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} planes
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    className="min-w-[34px] h-[34px] p-0 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-bold cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 hover:text-navy disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setPage(1)}
                    disabled={currentPage === 1}
                    aria-label="Primera página"
                  >«</button>
                  <button
                    className="min-w-[34px] h-[34px] p-0 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-bold cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 hover:text-navy disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                  >‹</button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(n =>
                      n === 1 ||
                      n === totalPages ||
                      Math.abs(n - currentPage) <= 1
                    )
                    .reduce<(number | 'ellipsis')[]>((acc, n, idx, arr) => {
                      if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === 'ellipsis' ? (
                        <span key={`e-${idx}`} className="px-1 text-slate-400 font-bold">…</span>
                      ) : (
                        <button
                          key={item}
                          className={`min-w-[34px] h-[34px] p-0 flex items-center justify-center rounded-lg text-sm font-bold cursor-pointer transition-all ${
                            currentPage === item 
                              ? 'bg-navy text-white border-navy shadow-md shadow-navy/20' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-navy'
                          }`}
                          onClick={() => setPage(item as number)}
                          aria-label={`Página ${item}`}
                          aria-current={currentPage === item ? 'page' : undefined}
                        >
                          {item}
                        </button>
                      )
                    )
                  }

                  <button
                    className="min-w-[34px] h-[34px] p-0 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-bold cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 hover:text-navy disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Página siguiente"
                  >›</button>
                  <button
                    className="min-w-[34px] h-[34px] p-0 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-bold cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 hover:text-navy disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage === totalPages}
                    aria-label="Última página"
                  >»</button>
                </div>
              </nav>
            )}
          </>
        )}
        </div>
      </section>

      {/* ══ SEVERIDAD GLOBAL ══ */}
      {allFindings.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm" aria-labelledby="gd-sev-title">
          <h3 id="gd-sev-title" className="flex items-center gap-2 text-[0.9rem] font-extrabold text-navy uppercase tracking-wider mb-6">
            <AlertTriangle size={18} aria-hidden="true" /> Hallazgos globales por severidad
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(['Crítica', 'Alta', 'Media', 'Baja'] as const).map(s => {
              const c = SEV_COLORS[s];
              return (
                <div key={s} className={`rounded-2xl p-6 text-center flex flex-col gap-1 transition-transform hover:scale-[1.03] ${c.bg} ${c.text} shadow-lg shadow-black/5`}>
                  <span className="text-4xl font-black leading-none font-mono tracking-tighter">{global.sev[s] || 0}</span>
                  <span className="text-sm font-black uppercase tracking-widest mt-1 opacity-90">{s}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ══ MODAL CONFIRMACIÓN ELIMINAR ══ */}
      {planToDelete && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-4 animate-in fade-in duration-200"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="gd-modal-title"
          onClick={() => setPlanToDelete(null)}
        >
          <div className="bg-white rounded-2xl p-8 max-w-[420px] w-full shadow-2xl text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="inline-flex items-center justify-center bg-red-100 text-red-600 rounded-full w-14 h-14 mb-4" aria-hidden="true">
              <Trash2 size={28} />
            </div>
            <h3 id="gd-modal-title" className="text-xl font-bold text-slate-900 mb-3">¿Eliminar este plan?</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Se eliminará permanentemente <strong className="text-slate-900 font-bold">"{planToDelete.product || 'Sin nombre'}"</strong>
              {planToDelete.module ? ` — ${planToDelete.module}` : ''} junto
              con todas sus tareas, observaciones y hallazgos asociados.{' '}
              <strong className="text-red-600">Esta acción no se puede deshacer.</strong>
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-[0.9rem] font-bold cursor-pointer transition-all hover:bg-slate-50" 
                onClick={() => setPlanToDelete(null)}
              >
                Cancelar
              </button>
              <button 
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white text-[0.9rem] font-bold border-none cursor-pointer transition-all hover:bg-red-700 shadow-lg shadow-red-200" 
                onClick={() => {
                  if (planToDelete.id) onDeletePlan(planToDelete.id);
                  setPlanToDelete(null);
                }}
              >
                <Trash2 size={16} aria-hidden="true" /> Eliminar plan
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};