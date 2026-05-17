import React, { useState } from 'react';
import { History, Calendar, Trash2, Check, X } from 'lucide-react';
import type { UsabilityAnalysisResult } from '../models/usabilityModels';

export interface AnalysisHistoryItem {
  id: string;
  created_at: string;
  project_name: string;
  result_data: UsabilityAnalysisResult;
}

interface AnalysisHistoryPanelProps {
  history: AnalysisHistoryItem[];
  onSelect: (result: UsabilityAnalysisResult) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export const AnalysisHistoryPanel: React.FC<AnalysisHistoryPanelProps> = ({
  history,
  onSelect,
  onDelete,
  isLoading
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-navy/20 border-t-navy animate-spin" />
        <p className="text-slate-500 text-sm">Cargando historial...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <History size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium text-sm">
          No hay análisis previos para este plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
        <History size={14} /> Historial de análisis
      </h3>
      <div className="grid gap-3">
        {history.map((item) => (
          <article 
            key={item.id}
            className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-navy hover:shadow-md transition-all cursor-pointer"
            onClick={() => onSelect(item.result_data)}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar size={12} />
                  <span className="text-[0.7rem] font-bold">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm truncate">
                  {item.project_name}
                </h4>
                <div className="flex gap-2 mt-2">
                  <span className="text-[0.65rem] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-red-50 text-red-700 rounded border border-red-100">
                    {item.result_data.criticalIssues.length} Problemas
                  </span>
                  <span className="text-[0.65rem] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-100">
                    Puntuación: {item.result_data.priorityScore.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {confirmDeleteId === item.id ? (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                      onClick={() => setConfirmDeleteId(null)}
                      aria-label="Cancelar"
                    >
                      <X size={16} />
                    </button>
                    <button
                      className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded-lg transition-all cursor-pointer"
                      onClick={() => {
                        onDelete(item.id);
                        setConfirmDeleteId(null);
                      }}
                      aria-label="Confirmar eliminar"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(item.id);
                    }}
                    aria-label="Eliminar del historial"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AnalysisHistoryPanel;