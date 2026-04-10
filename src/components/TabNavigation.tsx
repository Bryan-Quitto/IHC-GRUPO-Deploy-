// src/components/TabNavigation.tsx
import React from 'react';
import { DashboardTab } from '../models/types';
import { ClipboardList, FileText, Search, BarChart, BarChart2, Save, Check, Loader2 } from 'lucide-react';

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onSave?: () => void;
  saveStatus?: 'idle' | 'saving' | 'success';
  hasUnsavedChanges?: boolean;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  onSave, 
  saveStatus = 'idle',
  hasUnsavedChanges = false 
}) => {
  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'plan',         label: 'Plan de Prueba',       icon: <ClipboardList size={18} aria-hidden="true" /> },
    { id: 'script',       label: 'Guion y Tareas',        icon: <FileText      size={18} aria-hidden="true" /> },
    { id: 'observations', label: 'Registro Observación',  icon: <Search        size={18} aria-hidden="true" /> },
    { id: 'findings',     label: 'Hallazgos y Mejoras',   icon: <BarChart      size={18} aria-hidden="true" /> },
    { id: 'reports',      label: 'Reportes',              icon: <BarChart2     size={18} aria-hidden="true" /> },
  ];

  return (
    <nav className="sticky top-0 z-[900] bg-white flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b-[3px] border-navy mb-8 py-2 gap-4 shadow-sm" role="navigation" aria-label="Navegación del plan">
      <div className="flex gap-1 overflow-x-auto no-scrollbar flex-nowrap" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            className={`px-4 md:px-6 py-3 border-none font-bold cursor-pointer rounded-t-lg text-[0.9rem] transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-navy text-white' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-navy'
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              onTabChange(tab.id);
            }}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {tab.icon}
            <span className="hidden md:inline">{tab.label}</span>
            <span className="md:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {onSave && (
        <div className="flex items-center px-2">
          <button
            onClick={onSave}
            disabled={saveStatus !== 'idle'}
            className={`btn-save-sticky ${saveStatus} ${hasUnsavedChanges ? 'unsaved' : ''} w-full sm:w-auto justify-center`}
            title={hasUnsavedChanges ? "Tienes cambios sin guardar" : "Guardar cambios"}
          >
            {saveStatus === 'saving' ? (
              <Loader2 size={18} className="spin" aria-hidden="true" />
            ) : saveStatus === 'success' ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <Save size={18} aria-hidden="true" />
            )}

            <span className="save-text">
              {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'success' ? '¡Guardado!' : 'Guardar'}
            </span>

            {hasUnsavedChanges && saveStatus === 'idle' && (
              <span className="unsaved-dot" aria-hidden="true" />
            )}
          </button>
        </div>
      )}
    </nav>
  );
};