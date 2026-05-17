import React from 'react';
import { Observation } from '../models/types';
import { Clock, AlertCircle } from 'lucide-react';

interface ObservationsSnapshotProps {
  observations: Observation[];
}

const severityStyles: Record<string, { bg: string; text: string; border: string }> = {
  Baja: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300' },
  Media: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  Alta: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300' },
  'Crítica': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
};

const successStyles: Record<string, { bg: string; text: string; border: string }> = {
  'Sí': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300' },
  'No': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
  'Con ayuda': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
};

export const ObservationsSnapshot: React.FC<ObservationsSnapshotProps> = ({ observations }) => {
  if (!observations || observations.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
        <p className="text-slate-500 font-medium italic">No hay snapshot de observaciones disponible para este análisis.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-600 text-[0.65rem] font-black uppercase tracking-widest border-b border-slate-200">
            <th className="p-3 text-center border-r border-slate-200 w-10">#</th>
            <th className="p-3 text-left border-r border-slate-200 min-w-[120px]">Participante</th>
            <th className="p-3 text-center border-r border-slate-200 w-24">Tarea</th>
            <th className="p-3 text-center border-r border-slate-200 w-32">Éxito</th>
            <th className="p-3 text-center border-r border-slate-200 w-24">Tiempo</th>
            <th className="p-3 text-left border-r border-slate-200 min-w-[200px]">Comentarios / Problema</th>
            <th className="p-3 text-center border-r border-slate-200 w-32">Severidad</th>
            <th className="p-3 text-left min-w-[200px]">Mejora propuesta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {observations.map((obs, idx) => {
            const sStyle = severityStyles[obs.severity] || severityStyles.Baja;
            const okStyle = successStyles[obs.success_level] || successStyles['Sí'];
            
            return (
              <tr key={obs.id || idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3 text-center border-r border-slate-100 text-xs font-mono text-slate-400">
                  {idx + 1}
                </td>
                <td className="p-3 border-r border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{obs.participant}</p>
                  <p className="text-[0.65rem] text-slate-500 font-medium">{obs.profile}</p>
                </td>
                <td className="p-3 text-center border-r border-slate-100">
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[0.65rem] font-black">
                    {obs.task_ref}
                  </span>
                </td>
                <td className="p-3 text-center border-r border-slate-100">
                  <span className={`px-2 py-1 rounded-full ${okStyle.bg} ${okStyle.text} text-[0.65rem] font-bold border ${okStyle.border}`}>
                    {obs.success_level}
                  </span>
                </td>
                <td className="p-3 text-center border-r border-slate-100">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-slate-700 text-xs font-mono font-bold">
                      <Clock size={10} /> {obs.time_seconds}s
                    </div>
                    {obs.errors > 0 && (
                      <div className="flex items-center gap-1 text-red-600 text-[0.65rem] font-bold mt-0.5">
                        <AlertCircle size={10} /> {obs.errors} err
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3 border-r border-slate-100">
                  <div className="space-y-1.5">
                    <p className="text-[0.7rem] text-slate-700 leading-relaxed italic">
                      "{obs.comments}"
                    </p>
                    {obs.problem && (
                      <div className="p-2 bg-red-50/50 rounded border border-red-100">
                        <p className="text-[0.6rem] font-black text-red-800 uppercase tracking-tighter mb-0.5">Problema detectado</p>
                        <p className="text-[0.7rem] text-red-900 font-medium leading-tight">{obs.problem}</p>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3 text-center border-r border-slate-100">
                  <span className={`px-2.5 py-1 rounded-lg ${sStyle.bg} ${sStyle.text} text-[0.65rem] font-black uppercase tracking-tighter border ${sStyle.border}`}>
                    {obs.severity}
                  </span>
                </td>
                <td className="p-3">
                  <p className="text-[0.7rem] text-slate-600 leading-relaxed">
                    {obs.proposal || '—'}
                  </p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
