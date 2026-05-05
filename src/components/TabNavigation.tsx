// src/components/TabNavigation.tsx
import React, { useState, useRef, useEffect } from 'react';
import { DashboardTab, PlanStatus } from '../models/types';
import { ClipboardList, FileText, Search, BarChart, BarChart2, Save, Check, Loader2, ChevronDown, AlertTriangle } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onSave?: () => void;
  saveStatus?: 'idle' | 'saving' | 'success' | 'error';
  hasUnsavedChanges?: boolean;
  breadcrumbItems?: { label: string; path?: string; active?: boolean }[];
  currentStatus?: PlanStatus;
  onStatusChange?: (status: PlanStatus) => void;
}

/**
 * Barra de navegación por pestañas del dashboard.
 */
export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  onSave,
  saveStatus = 'idle',
  hasUnsavedChanges = false,
  breadcrumbItems = [],
  currentStatus = 'Borrador',
  onStatusChange
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusOptions: { val: PlanStatus; label: string; color: string; dot: string }[] = [
    { val: 'Borrador',   label: 'Borrador',   color: 'text-slate-600', dot: 'bg-slate-400' },
    { val: 'Activo',     label: 'En curso',    color: 'text-emerald-600', dot: 'bg-emerald-500' },
    { val: 'Completado', label: 'Completado', color: 'text-blue-600',    dot: 'bg-blue-600' },
  ];

  const currentStatusData = statusOptions.find(s => s.val === currentStatus) || statusOptions[0];

  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'plan',         label: 'Plan de Prueba',      icon: <ClipboardList size={18} aria-hidden="true" /> },
    { id: 'script',       label: 'Guion y Tareas',       icon: <FileText      size={18} aria-hidden="true" /> },
    { id: 'observations', label: 'Registro Observación', icon: <Search        size={18} aria-hidden="true" /> },
    { id: 'findings',     label: 'Hallazgos y Mejoras',  icon: <BarChart      size={18} aria-hidden="true" /> },
    { id: 'reports',      label: 'Reportes',             icon: <BarChart2     size={18} aria-hidden="true" /> },
  ];

  return (
    <nav
      className="sticky top-0 z-[900] bg-white flex flex-col border-b-[3px] border-navy mb-8 py-2 px-4 md:px-8 gap-2 shadow-sm"
      role="navigation"
      aria-label="Navegación del plan"
    >
      {breadcrumbItems.length > 0 && (
        <div className="pt-1 pb-1 border-b border-slate-50">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
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
                  ? 'bg-hierarchy-l2 text-white'
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
          <div className="flex items-center gap-2 px-2" ref={menuRef}>
            {/* Dropdown de Estado */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-2 rounded-lg transition-all cursor-pointer"
                aria-haspopup="true"
                aria-expanded={showStatusMenu}
              >
                <span className={`w-2 h-2 rounded-full ${currentStatusData.dot}`} />
                <span className={`text-[0.8rem] font-bold ${currentStatusData.color}`}>
                  {currentStatusData.label}
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} />
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 bg-slate-50 border-b border-slate-100">
                    <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest px-2">Estado del Plan</span>
                  </div>
                  <div className="py-1">
                    {statusOptions.map((option) => (
                      <button
                        key={option.val}
                        type="button"
                        onClick={() => {
                          onStatusChange?.(option.val);
                          setShowStatusMenu(false);
                        }}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors border-none cursor-pointer ${
                          currentStatus === option.val ? 'bg-slate-50/50' : 'bg-transparent'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${option.dot}`} />
                        <span className={`text-[0.85rem] font-bold ${option.color}`}>
                          {option.label}
                        </span>
                        {currentStatus === option.val && (
                          <Check size={14} className="ml-auto text-navy" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onSave}
              disabled={saveStatus !== 'idle'}
              className={`btn-save-sticky ${saveStatus} ${hasUnsavedChanges ? 'unsaved' : ''} w-full sm:w-auto justify-center flex items-center gap-2`}
              title={saveStatus === 'error' ? 'Error al guardar' : hasUnsavedChanges ? 'Tienes cambios sin guardar' : 'Guardar cambios'}
              aria-label={saveStatus === 'error' ? 'Error al guardar' : hasUnsavedChanges ? 'Guardar cambios pendientes' : 'Guardar'}
            >
              {saveStatus === 'saving' ? (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              ) : saveStatus === 'success' ? (
                <Check size={18} aria-hidden="true" />
              ) : saveStatus === 'error' ? (
                <AlertTriangle size={18} aria-hidden="true" />
              ) : (
                <Save size={18} aria-hidden="true" />
              )}

              <span className="save-text">
                {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'success' ? '¡Guardado!' : saveStatus === 'error' ? '¡Error!' : 'Guardar'}
              </span>

              {hasUnsavedChanges && saveStatus === 'idle' && (
                <span className="unsaved-dot" aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
