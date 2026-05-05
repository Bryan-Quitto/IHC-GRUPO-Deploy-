import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Filter, LucideIcon } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  color?: string;
  dot?: string;
}

interface StatusDropdownProps {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  className?: string;
  headerLabel?: string;
}

/**
 * Dropdown estilizado con menús flotantes.
 * Basado en la estética de TabNavigation pero mejorado y con apertura hacia abajo.
 */
const StatusDropdown: React.FC<StatusDropdownProps> = ({
  options,
  value,
  onChange,
  icon: Icon = Filter,
  className = '',
  headerLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = options.find(o => o.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-3 py-2 rounded-lg transition-all cursor-pointer shadow-sm group"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Icon size={14} className="text-slate-400 group-hover:text-navy transition-colors" />
        
        {currentOption.dot && (
          <span className={`w-2 h-2 rounded-full ${currentOption.dot}`} />
        )}
        
        <span className={`text-[0.8rem] font-bold ${currentOption.color || 'text-slate-700'}`}>
          {currentOption.label}
        </span>
        
        <ChevronDown 
          size={14} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-[2000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {headerLabel && (
            <div className="p-2 bg-slate-50 border-b border-slate-100">
              <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest px-2">{headerLabel}</span>
            </div>
          )}
          
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors border-none cursor-pointer ${
                  value === option.value ? 'bg-slate-50/50' : 'bg-transparent'
                }`}
              >
                {option.dot && (
                  <span className={`w-2 h-2 rounded-full ${option.dot}`} />
                )}
                <span className={`text-[0.85rem] font-bold ${option.color || 'text-slate-700'}`}>
                  {option.label}
                </span>
                {value === option.value && (
                  <Check size={14} className="ml-auto text-navy" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusDropdown;
