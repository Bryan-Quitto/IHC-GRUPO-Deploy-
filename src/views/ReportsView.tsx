import React, { useMemo, useEffect, useState, useRef } from 'react';
import { TestPlan, TestTask, Observation, Finding, Severity, Priority } from '../models/types';
import {
  AlertTriangle, BarChart2, Download, Target, Users,
  CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown,
  Minus, Shield, Zap, FileText, Activity
} from 'lucide-react';

// ─── Hook ancho ───────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100);
const avg = (arr: number[]) =>
  arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
const fmtTime = (s: number) =>
  s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

// ─── Colores semánticos ───────────────────────────────────────────────────────
const SEV: Record<Severity, { bg: string; text: string; border: string; solid: string }> = {
  Baja:    { bg: '#dcfce7', text: '#14532d', border: '#16a34a', solid: '#16a34a' },
  Media:   { bg: '#fef3c7', text: '#78350f', border: '#d97706', solid: '#d97706' },
  Alta:    { bg: '#ffedd5', text: '#7c2d12', border: '#ea580c', solid: '#ea580c' },
  Crítica: { bg: '#fee2e2', text: '#7f1d1d', border: '#dc2626', solid: '#dc2626' },
};
const PRI: Record<Priority, { bg: string; text: string; solid: string }> = {
  Baja:  { bg: '#eff6ff', text: '#1e40af', solid: '#3b82f6' },
  Media: { bg: '#fef3c7', text: '#78350f', solid: '#d97706' },
  Alta:  { bg: '#fdf2f8', text: '#701a75', solid: '#a21caf' },
};
const STATUS_MAP: Record<string, { bg: string; text: string; icon: string; border: string }> = {
  'Resuelto':      { bg: '#f0fdf4', text: '#14532d', icon: '✅', border: '#16a34a' },
  'En progreso':   { bg: '#eff6ff', text: '#1e40af', icon: '🔄', border: '#3b82f6' },
  'Pendiente':     { bg: '#fffbeb', text: '#78350f', icon: '⏳', border: '#d97706' },
};

// ─── Gráfico de dona SVG ──────────────────────────────────────────────────────
interface DonutSlice { value: number; color: string; label: string }
const DonutChart: React.FC<{ slices: DonutSlice[]; size?: number; centerLabel?: string; centerSub?: string; title: string }> = ({
  slices, size = 180, centerLabel, centerSub, title,
}) => {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return null;
  const cx = size / 2, cy = size / 2, R = size / 2 - 12, r = R * 0.58;
  let cum = 0;
  const paths = slices.map((sl, i) => {
    if (sl.value === 0) return null;
    const a0 = (cum / total) * 2 * Math.PI - Math.PI / 2;
    cum += sl.value;
    const a1 = (cum / total) * 2 * Math.PI - Math.PI / 2;
    if (sl.value === total) {
      return (
        <g key={i}>
          <circle cx={cx} cy={cy} r={R} fill={sl.color} />
          <circle cx={cx} cy={cy} r={r} fill="#fff" />
        </g>
      );
    }
    const x1o = cx + R * Math.cos(a0), y1o = cy + R * Math.sin(a0);
    const x2o = cx + R * Math.cos(a1), y2o = cy + R * Math.sin(a1);
    const x1i = cx + r * Math.cos(a1), y1i = cy + r * Math.sin(a1);
    const x2i = cx + r * Math.cos(a0), y2i = cy + r * Math.sin(a0);
    const la = sl.value / total > 0.5 ? 1 : 0;
    return (
      <path key={i}
        d={`M${x1o},${y1o} A${R},${R} 0 ${la},1 ${x2o},${y2o} L${x1i},${y1i} A${r},${r} 0 ${la},0 ${x2i},${y2i}Z`}
        fill={sl.color} stroke="#fff" strokeWidth={2}
        aria-label={`${sl.label}: ${Math.round((sl.value / total) * 100)}%`}
      />
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title} style={{ flexShrink: 0 }}>
      <title>{title}</title>
      {paths}
      {centerLabel && (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="#1e293b">{centerLabel}</text>
          {centerSub && <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">{centerSub}</text>}
        </>
      )}
    </svg>
  );
};

// ─── Barra horizontal ─────────────────────────────────────────────────────────
const HBar: React.FC<{ value: number; max: number; color: string; bg?: string; label: string; h?: number }> = ({
  value, max, color, bg = '#e2e8f0', label, h = 10,
}) => {
  const p = pct(value, max);
  return (
    <div role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} aria-label={`${label}: ${p}%`}
      style={{ height: h, backgroundColor: bg, borderRadius: 99, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)' }}>
      <div style={{ height: '100%', width: `${p}%`, backgroundColor: color, borderRadius: 99, transition: 'width 0.5s ease', minWidth: p > 0 ? 4 : 0 }} />
    </div>
  );
};

// ─── Tarjeta KPI ──────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  value: string | number; label: string; sub?: string;
  icon: React.ReactNode; accent: string; bg: string; iconBg: string;
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string;
}> = ({ value, label, sub, icon, accent, bg, iconBg, trend, trendLabel }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#16a34a' : trend === 'down' ? '#dc2626' : '#64748b';
  return (
    <article
      style={{ backgroundColor: bg, borderRadius: 12, padding: '1.1rem', border: `1px solid ${accent}33`, borderTop: `4px solid ${accent}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}
      aria-label={`${label}: ${value}${sub ? '. ' + sub : ''}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span aria-hidden="true" style={{ width: 40, height: 40, backgroundColor: iconBg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>{icon}</span>
        {trend && trendLabel && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: trendColor, fontWeight: 700, backgroundColor: `${trendColor}15`, padding: '3px 8px', borderRadius: 99, border: `1px solid ${trendColor}33` }}>
            <TrendIcon size={12} aria-hidden="true" /> {trendLabel}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: accent, lineHeight: 1, letterSpacing: '-1px' }}>{value}</div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: 2 }}>{sub}</div>}
      </div>
    </article>
  );
};

// ─── Sección header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; sub?: string }> = ({ icon, title, sub }) => (
  <div style={{ marginBottom: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
      <span style={{ color: '#003366', display: 'flex', alignItems: 'center' }} aria-hidden="true">{icon}</span>
      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#003366', letterSpacing: '-0.3px' }}>{title}</h3>
    </div>
    {sub && <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', paddingLeft: 34 }}>{sub}</p>}
    <div style={{ height: 2, background: 'linear-gradient(90deg, #003366, transparent)', marginTop: 8, borderRadius: 99 }} />
  </div>
);

// ─── Panel card ───────────────────────────────────────────────────────────────
const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({ children, style, className }) => (
  <div className={className} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', ...style }}>
    {children}
  </div>
);

// ─── Badges ───────────────────────────────────────────────────────────────────
const SevBadge: React.FC<{ sev: Severity }> = ({ sev }) => {
  const c = SEV[sev];
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap' }}>{sev}</span>;
};
const PriBadge: React.FC<{ pri: Priority }> = ({ pri }) => {
  const c = PRI[pri];
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, backgroundColor: c.bg, color: c.text, border: `1px solid ${c.solid}44`, fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap' }}>{pri}</span>;
};
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = STATUS_MAP[status] ?? STATUS_MAP['Pendiente'];
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap' }}>{c.icon} {status}</span>;
};

// ─── Gráfico de barras verticales SVG ─────────────────────────────────────────
const BarChartVertical: React.FC<{
  data: { label: string; value: number; color: string; sublabel?: string }[];
  maxValue?: number; height?: number; title: string;
}> = ({ data, maxValue, height = 140, title }) => {
  const max = maxValue ?? Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(60, Math.floor(500 / data.length) - 12);
  const svgW = data.length * (barW + 16) + 32;
  return (
    <div role="img" aria-label={title} style={{ overflowX: 'auto' }}>
      <svg width={svgW} height={height + 50} viewBox={`0 0 ${svgW} ${height + 50}`} style={{ display: 'block', margin: '0 auto' }}>
        <title>{title}</title>
        {data.map((d, i) => {
          const bh = max === 0 ? 0 : Math.round((d.value / max) * height);
          const x = 16 + i * (barW + 16);
          const y = height - bh + 10;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bh} rx={6} fill={d.color} />
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="12" fontWeight="800" fill={d.color}>{d.value}</text>
              <text x={x + barW / 2} y={height + 26} textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">{d.label}</text>
              {d.sublabel && <text x={x + barW / 2} y={height + 40} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.sublabel}</text>}
            </g>
          );
        })}
        <line x1={12} y1={10} x2={12} y2={height + 10} stroke="#e2e8f0" strokeWidth={1} />
        <line x1={12} y1={height + 10} x2={svgW - 8} y2={height + 10} stroke="#e2e8f0" strokeWidth={1} />
      </svg>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface ReportsViewProps {
  testPlan: TestPlan;
  tasks: TestTask[];
  observations: Observation[];
  findings: Finding[];
  onGoToPlan: () => void;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export const ReportsView: React.FC<ReportsViewProps> = ({
  testPlan, tasks, observations, findings, onGoToPlan,
}) => {
  const width = useWindowWidth();
  const isMobile = width < 900;
  const reportRef = useRef<HTMLDivElement>(null);
  const isProductEmpty = !testPlan.product || testPlan.product.trim() === '';

  // ── PDF via print ──────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    window.print();
  };

  // ── Métricas ───────────────────────────────────────────────────────────────
  const m = useMemo(() => {
    const total  = observations.length;
    const ok     = observations.filter(o => o.success_level === 'Sí').length;
    const help   = observations.filter(o => o.success_level === 'Con ayuda').length;
    const fail   = observations.filter(o => o.success_level === 'No').length;
    const errors = observations.reduce((s, o) => s + (o.errors || 0), 0);
    const avgErr = total > 0 ? (errors / total).toFixed(1) : '0';
    const times  = observations.map(o => o.time_seconds || 0);
    const avgTime = avg(times);
    const maxTime = times.length ? Math.max(...times) : 0;
    const minTime = times.length ? Math.min(...times) : 0;

    const sev: Record<Severity, number>  = { Baja: 0, Media: 0, Alta: 0, Crítica: 0 };
    const pri: Record<Priority, number>  = { Baja: 0, Media: 0, Alta: 0 };
    const sta: Record<string, number>    = { Pendiente: 0, 'En progreso': 0, Resuelto: 0 };
    findings.forEach(f => { sev[f.severity]++; pri[f.priority]++; sta[f.status] = (sta[f.status] || 0) + 1; });

    const participants = [...new Set(observations.map(o => o.participant).filter(Boolean))];

    const taskRates = tasks.map(t => {
      const obs   = observations.filter(o => o.task_ref === t.task_index);
      const obsOk = obs.filter(o => o.success_level === 'Sí').length;
      const obsHelp = obs.filter(o => o.success_level === 'Con ayuda').length;
      const obsFail = obs.filter(o => o.success_level === 'No').length;
      const avgT  = avg(obs.map(o => o.time_seconds || 0));
      const totErr = obs.reduce((s, o) => s + (o.errors || 0), 0);
      return {
        label: t.task_index,
        scenario: t.scenario,
        total: obs.length, ok: obsOk, help: obsHelp, fail: obsFail,
        avgTime: avgT, totalErrors: totErr,
        rate: pct(obsOk, obs.length),
      };
    }).filter(t => t.total > 0);

    const successRate    = pct(ok, total);
    const criticalCount  = sev['Crítica'] + sev['Alta'];
    const resolvedCount  = sta['Resuelto'] || 0;
    const resolvedRate   = pct(resolvedCount, findings.length);

    // Nota de interpretación
    const usabilityScore =
      successRate >= 80 ? 'Aceptable' :
      successRate >= 60 ? 'Mejorable' :
      successRate >= 40 ? 'Deficiente' : 'Crítica';

    return {
      total, ok, help, fail, errors, avgErr, avgTime, maxTime, minTime,
      sev, pri, sta, participants, taskRates,
      totalF: findings.length, resolvedCount, resolvedRate,
      successRate, criticalCount, usabilityScore,
    };
  }, [observations, findings, tasks]);

  // ── Sin producto ───────────────────────────────────────────────────────────
  if (isProductEmpty) return (
    <div role="tabpanel" aria-labelledby="reports-tab" className="dashboard-view">
      <header className="view-header" style={{ display: 'flex', justifyContent: 'center' }}><h2>Reporte de Resultados</h2></header>
      <Panel style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <AlertTriangle size={48} color="#d97706" style={{ margin: '0 auto 1rem', display: 'block' }} aria-hidden="true" />
        <h3 style={{ color: '#1e293b' }}>Falta el nombre del producto</h3>
        <p style={{ color: '#475569', maxWidth: 440, margin: '0 auto 1.5rem' }}>Define un producto en la pestaña <strong>Plan</strong> para generar el reporte de resultados.</p>
        <button onClick={onGoToPlan} style={{ backgroundColor: '#003366', color: 'white', padding: '12px 28px', borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
          Ir a definir Producto
        </button>
      </Panel>
    </div>
  );

  if (observations.length === 0 && findings.length === 0) return (
    <div role="tabpanel" aria-labelledby="reports-tab" className="dashboard-view">
      <header className="view-header" style={{ display: 'flex', justifyContent: 'center' }}><h2>Reporte de Resultados</h2></header>
      <Panel style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <BarChart2 size={56} color="#94a3b8" style={{ margin: '0 auto 1rem', display: 'block' }} aria-hidden="true" />
        <h3 style={{ color: '#1e293b' }}>Aún no hay datos para reportar</h3>
        <p style={{ color: '#475569', maxWidth: 440, margin: '0 auto' }}>Registra observaciones y hallazgos en las pestañas anteriores para generar el reporte automáticamente.</p>
      </Panel>
    </div>
  );

  const usabilityColor =
    m.usabilityScore === 'Aceptable' ? '#16a34a' :
    m.usabilityScore === 'Mejorable' ? '#d97706' :
    m.usabilityScore === 'Deficiente' ? '#ea580c' : '#dc2626';

  const reportDate = new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div role="tabpanel" aria-labelledby="reports-tab" className="dashboard-view">

      {/* ── Estilos de impresión (inyectados en head vía style tag) ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-printable, #report-printable * { visibility: visible !important; }
          #report-printable { position: fixed; top: 0; left: 0; width: 100%; z-index: 9999; background: white; padding: 20px; }
          .no-print { display: none !important; }
          .print-page-break { page-break-before: always; }
          @page { margin: 15mm 12mm; size: A4; }
        }
      `}</style>

      {/* ── Cabecera de pantalla ── */}
      <header className="view-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '1rem 1.5rem' }}>
        <h2 style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: '1.3rem' }}>Reporte de Resultados — Prueba de Usabilidad</h2>
        <button
          onClick={handleDownloadPDF}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: '#fff', color: '#003366',
            border: '2px solid #003366', padding: '10px 20px',
            borderRadius: 8, fontWeight: 700, cursor: 'pointer',
            fontSize: '0.9rem', transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#003366'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fff'; (e.currentTarget as HTMLButtonElement).style.color = '#003366'; }}
          aria-label="Descargar reporte como PDF"
        >
          <Download size={18} aria-hidden="true" />
          Exportar PDF
        </button>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          CONTENIDO IMPRIMIBLE
      ═══════════════════════════════════════════════════════════════ */}
      <div id="report-printable" ref={reportRef} style={{ padding: '0 0 2rem' }}>

        {/* ── PORTADA DEL REPORTE ── */}
        <section
          aria-label="Portada del reporte"
          style={{
            background: 'linear-gradient(135deg, #003366 0%, #004080 50%, #0059b3 100%)',
            borderRadius: 16, padding: isMobile ? '2rem 1.5rem' : '2.5rem 3rem',
            marginBottom: '2rem', color: '#fff', position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Decoración geométrica */}
          <div aria-hidden="true" style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div aria-hidden="true" style={{ position: 'absolute', bottom: -30, left: '40%', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={32} color="#fff" aria-hidden="true" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                Informe de Prueba de Usabilidad
              </p>
              <h2 style={{ margin: '4px 0 0', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.5px' }}>
                {testPlan.product}
              </h2>
              {testPlan.module && (
                <p style={{ margin: '6px 0 0', fontSize: '1rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                  Módulo: {testPlan.module}
                </p>
              )}
            </div>
          </div>

          {/* Metadatos en grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '1rem', position: 'relative' }}>
            {[
              { icon: <Users size={16} />, label: 'Participantes', value: m.participants.length > 0 ? m.participants.length.toString() : '—' },
              { icon: <Target size={16} />, label: 'Tareas evaluadas', value: tasks.length > 0 ? tasks.length.toString() : '—' },
              { icon: <Activity size={16} />, label: 'Observaciones', value: m.total.toString() },
              { icon: <Shield size={16} />, label: 'Hallazgos', value: m.totalF.toString() },
            ].map(meta => (
              <div key={meta.label} style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '0.875rem 1rem', backdropFilter: 'blur(4px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {meta.icon} {meta.label}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{meta.value}</div>
              </div>
            ))}
          </div>

          {/* Barra inferior */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', position: 'relative' }}>
            <span>{testPlan.moderator ? `Moderador: ${testPlan.moderator}` : ''}{testPlan.observer ? ` · Observador: ${testPlan.observer}` : ''}</span>
            <span>Generado el {reportDate}</span>
          </div>
        </section>

        {/* ── VEREDICTO DE USABILIDAD ── */}
        <section aria-labelledby="veredicto-heading" style={{ marginBottom: '2rem' }}>
          <SectionHeader
            icon={<Zap size={20} />}
            title="Veredicto de Usabilidad"
            sub="Evaluación global del sistema basada en observaciones y hallazgos registrados"
          />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: '1rem' }}>

            {/* Score principal */}
            <Panel style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', background: `linear-gradient(135deg, ${usabilityColor}10, ${usabilityColor}08)`, border: `2px solid ${usabilityColor}33` }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b' }}>Nivel de usabilidad</div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: usabilityColor, lineHeight: 1, letterSpacing: '-2px' }}>{m.successRate}%</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: usabilityColor, backgroundColor: `${usabilityColor}18`, padding: '6px 18px', borderRadius: 99, border: `1px solid ${usabilityColor}44` }}>
                {m.usabilityScore}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Tasa de éxito global</div>
              <div style={{ width: '100%', height: 12, backgroundColor: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${m.successRate}%`, backgroundColor: usabilityColor, borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </Panel>

            {/* Desglose */}
            <Panel>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Desglose de resultados de sesión</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { label: 'Tareas completadas exitosamente', val: m.ok,   total: m.total, color: '#16a34a', bg: '#dcfce7', icon: '✅', desc: 'Sin intervención del moderador' },
                  { label: 'Completadas con ayuda',           val: m.help, total: m.total, color: '#d97706', bg: '#fef3c7', icon: '🤝', desc: 'Requirieron orientación adicional' },
                  { label: 'No completadas',                  val: m.fail, total: m.total, color: '#dc2626', bg: '#fee2e2', icon: '❌', desc: 'El usuario no logró terminar la tarea' },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span aria-hidden="true">{row.icon}</span> {row.label}
                      </span>
                      <span style={{ fontWeight: 800, color: row.color, fontSize: '1rem', minWidth: 70, textAlign: 'right' }}>
                        {row.val} <span style={{ fontSize: '0.73rem', color: '#94a3b8', fontWeight: 500 }}>/ {row.total} ({pct(row.val, row.total)}%)</span>
                      </span>
                    </div>
                    <HBar value={row.val} max={row.total} color={row.color} bg={row.bg} label={row.label} h={14} />
                    <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>{row.desc}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </section>

        {/* ── KPIs ── */}
        <section aria-labelledby="kpis-heading" style={{ marginBottom: '2rem' }}>
          <SectionHeader icon={<Activity size={20} />} title="Indicadores Clave de Desempeño" sub="Métricas cuantitativas del proceso de evaluación" />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: '0.875rem' }}>
            <KpiCard value={`${m.successRate}%`} label="Tasa de éxito" sub={`${m.ok} de ${m.total} sesiones`}
              icon={<CheckCircle2 size={20} />} accent="#16a34a" bg="#f0fdf4" iconBg="#dcfce7"
              trend={m.successRate >= 80 ? 'up' : m.successRate >= 50 ? 'neutral' : 'down'}
              trendLabel={m.successRate >= 80 ? 'Óptimo' : m.successRate >= 50 ? 'Aceptable' : 'Revisar'}
            />
            <KpiCard value={fmtTime(m.avgTime)} label="Tiempo promedio" sub={`Máx: ${fmtTime(m.maxTime)} · Mín: ${fmtTime(m.minTime)}`}
              icon={<Clock size={20} />} accent="#1d4ed8" bg="#eff6ff" iconBg="#dbeafe"
            />
            <KpiCard value={m.errors} label="Total de errores" sub={`${m.avgErr} errores por sesión`}
              icon={<XCircle size={20} />} accent="#dc2626" bg="#fff7ed" iconBg="#ffedd5"
              trend={parseFloat(m.avgErr) <= 1 ? 'up' : parseFloat(m.avgErr) <= 3 ? 'neutral' : 'down'}
              trendLabel={parseFloat(m.avgErr) <= 1 ? 'Pocos errores' : parseFloat(m.avgErr) <= 3 ? 'Moderado' : 'Alto'}
            />
            <KpiCard value={m.totalF} label="Hallazgos" sub={`${m.criticalCount} de alta/crítica prioridad`}
              icon={<AlertTriangle size={20} />} accent="#7e22ce" bg="#fdf4ff" iconBg="#fae8ff"
              trend={m.criticalCount === 0 ? 'up' : m.criticalCount <= 2 ? 'neutral' : 'down'}
              trendLabel={m.criticalCount === 0 ? 'Sin críticos' : `${m.criticalCount} críticos`}
            />
            <KpiCard value={`${m.resolvedRate}%`} label="Hallazgos resueltos" sub={`${m.resolvedCount} de ${m.totalF} corregidos`}
              icon={<Shield size={20} />} accent="#0f172a" bg="#f8fafc" iconBg="#e2e8f0"
              trend={m.resolvedRate >= 66 ? 'up' : m.resolvedRate >= 33 ? 'neutral' : 'down'}
              trendLabel={m.resolvedRate >= 66 ? 'Avance bueno' : 'Pendientes'}
            />
          </div>
        </section>

        {/* ── RESULTADOS POR TAREA ── */}
        {m.taskRates.length > 0 && (
          <section aria-labelledby="tasks-heading" style={{ marginBottom: '2rem' }}>
            <SectionHeader icon={<Target size={20} />} title="Resultados por Tarea" sub="Comparativa de eficacia y tiempo por cada tarea evaluada" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>

              {/* Gráfico barras */}
              <Panel>
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Tasa de éxito por tarea (%)</h4>
                <BarChartVertical
                  title="Gráfico de barras: tasa de éxito por tarea"
                  data={m.taskRates.map(t => ({
                    label: t.label,
                    value: t.rate,
                    color: t.rate >= 80 ? '#16a34a' : t.rate >= 50 ? '#d97706' : '#dc2626',
                    sublabel: `${t.ok}/${t.total}`,
                  }))}
                  maxValue={100}
                  height={130}
                />
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  {[{ color: '#16a34a', label: '≥ 80% Óptimo' }, { color: '#d97706', label: '50–79% Mejorar' }, { color: '#dc2626', label: '< 50% Crítico' }].map(l => (
                    <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.73rem', color: '#475569' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: l.color, display: 'inline-block' }} aria-hidden="true" /> {l.label}
                    </span>
                  ))}
                </div>
              </Panel>

              {/* Tabla de tareas */}
              <Panel style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" aria-label="Detalle de resultados por tarea">
                    <caption className="sr-only">Tasa de éxito, tiempo y errores por cada tarea evaluada</caption>
                    <thead>
                      <tr>
                        <th scope="col" style={{ width: 55, padding: '0.75rem 0.5rem' }}>Tarea</th>
                        <th scope="col" style={{ padding: '0.75rem 0.5rem' }}>Éxito / total</th>
                        <th scope="col" style={{ width: 70, padding: '0.75rem 0.5rem' }}>⏱ Tiempo</th>
                        <th scope="col" style={{ width: 65, padding: '0.75rem 0.5rem' }}>Errores</th>
                        <th scope="col" style={{ padding: '0.75rem 0.5rem' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.taskRates.map(t => {
                        const col = t.rate >= 80 ? '#16a34a' : t.rate >= 50 ? '#d97706' : '#dc2626';
                        const bgCol = t.rate >= 80 ? '#dcfce7' : t.rate >= 50 ? '#fef3c7' : '#fee2e2';
                        return (
                          <tr key={t.label}>
                            <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}><span className="id-badge">{t.label}</span></td>
                            <td style={{ padding: '0.6rem 0.5rem' }}>
                              <HBar value={t.ok} max={t.total} color={col} bg={bgCol} label={`Éxito tarea ${t.label}`} h={10} />
                              <span style={{ fontSize: '0.73rem', color: col, fontWeight: 700 }}>{t.rate}% ({t.ok}/{t.total})</span>
                            </td>
                            <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>{t.avgTime > 0 ? fmtTime(t.avgTime) : '—'}</td>
                            <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem', fontWeight: 700, color: t.totalErrors > 2 ? '#dc2626' : '#334155', fontSize: '0.85rem' }}>{t.totalErrors}</td>
                            <td style={{ padding: '0.6rem 0.5rem' }}>
                              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, backgroundColor: bgCol, color: col, fontWeight: 700, fontSize: '0.72rem' }}>
                                {t.rate >= 80 ? '✅ Óptimo' : t.rate >= 50 ? '⚠ Mejorar' : '❌ Crítico'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          </section>
        )}

        {/* ── ANÁLISIS DE HALLAZGOS ── */}
        {m.totalF > 0 && (
          <section aria-labelledby="findings-heading" style={{ marginBottom: '2rem' }} className="print-page-break">
            <SectionHeader icon={<AlertTriangle size={20} />} title="Análisis de Hallazgos" sub="Distribución de problemas detectados según severidad, prioridad y estado de resolución" />

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '1rem', marginBottom: '1rem' }}>

              {/* Dona severidad */}
              <Panel style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Por severidad</h4>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <DonutChart
                    title={`Severidad: Crítica ${m.sev['Crítica']}, Alta ${m.sev['Alta']}, Media ${m.sev['Media']}, Baja ${m.sev['Baja']}`}
                    size={150}
                    centerLabel={m.totalF.toString()}
                    centerSub="hallazgos"
                    slices={[
                      { value: m.sev['Crítica'], color: '#dc2626', label: 'Crítica' },
                      { value: m.sev['Alta'],    color: '#ea580c', label: 'Alta' },
                      { value: m.sev['Media'],   color: '#d97706', label: 'Media' },
                      { value: m.sev['Baja'],    color: '#16a34a', label: 'Baja' },
                    ]}
                  />
                </div>
                <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(['Crítica', 'Alta', 'Media', 'Baja'] as Severity[]).map(s => (
                    <div key={s} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 28px', alignItems: 'center', gap: 8 }}>
                      <dt style={{ margin: 0 }}><SevBadge sev={s} /></dt>
                      <dd style={{ margin: 0 }}><HBar value={m.sev[s]} max={m.totalF} color={SEV[s].solid} bg={SEV[s].bg} label={s} h={8} /></dd>
                      <span style={{ textAlign: 'right', fontWeight: 800, color: SEV[s].text, fontSize: '0.88rem' }}>{m.sev[s]}</span>
                    </div>
                  ))}
                </dl>
              </Panel>

              {/* Dona estado resolución */}
              <Panel style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Estado de resolución</h4>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <DonutChart
                    title={`Resolución: ${m.resolvedCount} resueltos, ${m.sta['En progreso'] || 0} en progreso, ${m.sta['Pendiente'] || 0} pendientes`}
                    size={150}
                    centerLabel={`${m.resolvedRate}%`}
                    centerSub="resueltos"
                    slices={[
                      { value: m.resolvedCount,              color: '#16a34a', label: 'Resuelto' },
                      { value: m.sta['En progreso'] || 0,    color: '#3b82f6', label: 'En progreso' },
                      { value: m.sta['Pendiente'] || 0,      color: '#d97706', label: 'Pendiente' },
                    ]}
                  />
                </div>
                <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { k: 'Resuelto',    c: '#16a34a', b: '#dcfce7', icon: '✅' },
                    { k: 'En progreso', c: '#3b82f6', b: '#dbeafe', icon: '🔄' },
                    { k: 'Pendiente',   c: '#d97706', b: '#fef3c7', icon: '⏳' },
                  ].map(s => (
                    <div key={s.k} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 28px', alignItems: 'center', gap: 8 }}>
                      <dt style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: s.c }}>{s.icon} {s.k}</dt>
                      <dd style={{ margin: 0 }}><HBar value={m.sta[s.k] || 0} max={m.totalF} color={s.c} bg={s.b} label={s.k} h={8} /></dd>
                      <span style={{ textAlign: 'right', fontWeight: 800, color: s.c, fontSize: '0.88rem' }}>{m.sta[s.k] || 0}</span>
                    </div>
                  ))}
                </dl>
              </Panel>

              {/* Por prioridad */}
              <Panel style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Por prioridad de corrección</h4>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <BarChartVertical
                    title="Hallazgos por prioridad"
                    data={[
                      { label: 'Alta',  value: m.pri['Alta'],  color: '#a21caf' },
                      { label: 'Media', value: m.pri['Media'], color: '#d97706' },
                      { label: 'Baja',  value: m.pri['Baja'],  color: '#3b82f6' },
                    ]}
                    height={110}
                  />
                </div>
                <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(['Alta', 'Media', 'Baja'] as Priority[]).map(p => (
                    <div key={p} style={{ display: 'grid', gridTemplateColumns: '65px 1fr 28px', alignItems: 'center', gap: 8 }}>
                      <dt style={{ margin: 0 }}><PriBadge pri={p} /></dt>
                      <dd style={{ margin: 0 }}><HBar value={m.pri[p]} max={m.totalF} color={PRI[p].solid} bg={PRI[p].bg} label={p} h={8} /></dd>
                      <span style={{ textAlign: 'right', fontWeight: 800, color: PRI[p].text, fontSize: '0.88rem' }}>{m.pri[p]}</span>
                    </div>
                  ))}
                </dl>
              </Panel>
            </div>

            {/* Tabla hallazgos priorizados */}
            <Panel style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>Hallazgos priorizados (ordenados de mayor a menor severidad)</h4>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" aria-label="Lista de hallazgos priorizados">
                  <caption className="sr-only">Hallazgos detectados durante la prueba de usabilidad, ordenados por severidad y prioridad</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: 36 }}>#</th>
                      <th scope="col">Problema identificado</th>
                      <th scope="col">Evidencia observada</th>
                      <th scope="col" style={{ width: 85 }}>Frecuencia</th>
                      <th scope="col" style={{ width: 90 }}>Severidad</th>
                      <th scope="col">Recomendación</th>
                      <th scope="col" style={{ width: 80 }}>Prioridad</th>
                      <th scope="col" style={{ width: 115 }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...findings].sort((a, b) => {
                      const so: Record<Severity, number> = { Crítica: 0, Alta: 1, Media: 2, Baja: 3 };
                      const po: Record<Priority, number>  = { Alta: 0, Media: 1, Baja: 2 };
                      return (so[a.severity] - so[b.severity]) || (po[a.priority] - po[b.priority]);
                    }).map((f, i) => (
                      <tr key={f.id} style={{ borderLeft: `4px solid ${SEV[f.severity].solid}` }}>
                        <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}>
                          <span className="id-badge">{i + 1}</span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#1e293b', padding: '0.6rem 0.75rem' }}>
                          {f.problem || <em style={{ color: '#94a3b8' }}>Sin descripción</em>}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic', padding: '0.6rem 0.75rem' }}>
                          {f.evidence || '—'}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 600, padding: '0.6rem 0.5rem' }}>
                          {f.frequency || '—'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}>
                          <SevBadge sev={f.severity} />
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#1e293b', padding: '0.6rem 0.75rem' }}>
                          {f.recommendation || <em style={{ color: '#94a3b8' }}>Sin recomendación</em>}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}>
                          <PriBadge pri={f.priority} />
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}>
                          <StatusBadge status={f.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        )}

        {/* ── DETALLE DE OBSERVACIONES ── */}
        {observations.length > 0 && (
          <section aria-labelledby="obs-heading" style={{ marginBottom: '2rem' }} className="print-page-break">
            <SectionHeader icon={<Users size={20} />} title="Detalle de Observaciones" sub="Registro completo de las sesiones de prueba con cada participante" />

            {/* Participantes */}
            {m.participants.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
                {m.participants.map(p => (
                  <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: 99, fontSize: '0.82rem', fontWeight: 700 }}>
                    <Users size={12} aria-hidden="true" /> {p}
                  </span>
                ))}
              </div>
            )}

            <Panel style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" aria-label="Registro de observaciones por participante">
                  <caption className="sr-only">Sesiones de prueba: participante, tarea, resultado, tiempo, errores y observaciones</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: 36 }}>#</th>
                      <th scope="col" style={{ width: 90 }}>Participante</th>
                      <th scope="col" style={{ width: 70 }}>Tarea</th>
                      <th scope="col" style={{ width: 110 }}>Resultado</th>
                      <th scope="col" style={{ width: 90 }}>⏱ Tiempo</th>
                      <th scope="col" style={{ width: 75 }}>Errores</th>
                      <th scope="col">Comentarios / Problema</th>
                      <th scope="col" style={{ width: 90 }}>Severidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observations.map((o, i) => {
                      const OK = { 'Sí': { bg: '#f0fdf4', color: '#14532d', border: '#16a34a', icon: '✅' }, 'Con ayuda': { bg: '#fffbeb', color: '#78350f', border: '#d97706', icon: '🤝' }, 'No': { bg: '#fef2f2', color: '#7f1d1d', border: '#dc2626', icon: '❌' } }[o.success_level] ?? { bg: '#f8fafc', color: '#334155', border: '#e2e8f0', icon: '—' };
                      return (
                        <tr key={o.id}>
                          <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}><span className="id-badge">{i + 1}</span></td>
                          <td style={{ fontWeight: 600, fontSize: '0.85rem', padding: '0.6rem 0.75rem' }}>{o.participant || '—'}</td>
                          <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}>{o.task_ref ? <span className="id-badge">{o.task_ref}</span> : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                          <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}>
                            <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 99, backgroundColor: OK.bg, color: OK.color, border: `1px solid ${OK.border}`, fontWeight: 700, fontSize: '0.75rem' }}>
                              {OK.icon} {o.success_level}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', padding: '0.6rem 0.5rem' }}>{fmtTime(o.time_seconds || 0)}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: (o.errors || 0) > 2 ? '#dc2626' : '#334155', fontSize: '0.88rem', padding: '0.6rem 0.5rem' }}>{o.errors ?? 0}</td>
                          <td style={{ fontSize: '0.82rem', color: '#334155', padding: '0.6rem 0.75rem' }}>
                            {o.comments && <div>{o.comments}</div>}
                            {o.problem && <div style={{ marginTop: 4, color: '#7c2d12', fontStyle: 'italic', fontSize: '0.78rem' }}>⚠ {o.problem}</div>}
                            {!o.comments && !o.problem && <em style={{ color: '#94a3b8' }}>Sin observaciones</em>}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}><SevBadge sev={o.severity} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        )}

        {/* ── CONCLUSIONES Y RECOMENDACIONES ── */}
        <section aria-labelledby="conclusions-heading" style={{ marginBottom: '2rem' }}>
          <SectionHeader icon={<TrendingUp size={20} />} title="Conclusiones y Recomendaciones" sub="Síntesis ejecutiva de los hallazgos y pasos de mejora sugeridos" />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>

            {/* Conclusiones automáticas */}
            <Panel style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, backgroundColor: '#003366', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>📋</span>
                Síntesis ejecutiva
              </h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0.75rem', backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span aria-hidden="true" style={{ color: usabilityColor, fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>{m.successRate >= 80 ? '✅' : m.successRate >= 50 ? '⚠️' : '❌'}</span>
                  <span style={{ fontSize: '0.84rem', color: '#334155' }}>
                    La tasa de éxito global es <strong style={{ color: usabilityColor }}>{m.successRate}%</strong>, clasificando la usabilidad como <strong style={{ color: usabilityColor }}>{m.usabilityScore}</strong>.
                  </span>
                </li>
                {m.totalF > 0 && (
                  <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0.75rem', backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span aria-hidden="true" style={{ color: m.criticalCount > 0 ? '#dc2626' : '#16a34a', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                      {m.criticalCount > 0 ? '🔴' : '🟢'}
                    </span>
                    <span style={{ fontSize: '0.84rem', color: '#334155' }}>
                      {m.criticalCount > 0
                        ? <>Se detectaron <strong style={{ color: '#dc2626' }}>{m.criticalCount} hallazgos</strong> de severidad Alta o Crítica que requieren atención inmediata.</>
                        : <>No se detectaron hallazgos de severidad Alta o Crítica. El sistema muestra buenas prácticas de usabilidad.</>
                      }
                    </span>
                  </li>
                )}
                {m.totalF > 0 && (
                  <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0.75rem', backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span aria-hidden="true" style={{ fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>🔧</span>
                    <span style={{ fontSize: '0.84rem', color: '#334155' }}>
                      <strong style={{ color: '#16a34a' }}>{m.resolvedCount} de {m.totalF} hallazgos</strong> han sido corregidos ({m.resolvedRate}%). Quedan <strong>{m.sta['Pendiente'] || 0}</strong> pendientes.
                    </span>
                  </li>
                )}
                {m.avgTime > 0 && (
                  <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0.75rem', backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span aria-hidden="true" style={{ fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>⏱</span>
                    <span style={{ fontSize: '0.84rem', color: '#334155' }}>
                      El tiempo promedio por tarea fue <strong>{fmtTime(m.avgTime)}</strong>, con un máximo de <strong>{fmtTime(m.maxTime)}</strong>.
                    </span>
                  </li>
                )}
              </ul>
            </Panel>

            {/* Top hallazgos prioritarios */}
            <Panel>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden="true">🎯</span> Principales acciones de mejora
              </h4>
              {findings
                .filter(f => f.status !== 'Resuelto')
                .sort((a, b) => {
                  const so: Record<Severity, number> = { Crítica: 0, Alta: 1, Media: 2, Baja: 3 };
                  return so[a.severity] - so[b.severity];
                })
                .slice(0, 5)
                .map((f, i) => {
                  const c = SEV[f.severity];
                  return (
                    <div key={f.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '0.75rem', backgroundColor: c.bg, borderRadius: 8, border: `1px solid ${c.border}`, marginBottom: i < 4 ? '0.5rem' : 0 }}>
                      <span style={{ width: 26, height: 26, backgroundColor: c.solid, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                          <SevBadge sev={f.severity} />
                          <PriBadge pri={f.priority} />
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#1e293b', fontWeight: 600 }}>{f.problem || 'Sin descripción'}</p>
                        {f.recommendation && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#475569' }}>→ {f.recommendation}</p>}
                      </div>
                    </div>
                  );
                })
              }
              {findings.filter(f => f.status !== 'Resuelto').length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#16a34a' }}>
                  <CheckCircle2 size={32} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>¡Todos los hallazgos han sido resueltos!</p>
                </div>
              )}
            </Panel>
          </div>
        </section>

        {/* ── PIE DEL REPORTE ── */}
        <footer
          role="contentinfo"
          aria-label="Pie del reporte"
          style={{
            background: 'linear-gradient(90deg, #003366, #004080)',
            color: 'rgba(255,255,255,0.8)', borderRadius: 10, padding: '1rem 1.5rem',
            display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap',
            gap: 8, fontSize: '0.78rem',
          }}
        >
          <span> Usability Test Dashboard Web — Informe generado automáticamente</span>
          <span>{reportDate}</span>
        </footer>
      </div>
    </div>
  );
};