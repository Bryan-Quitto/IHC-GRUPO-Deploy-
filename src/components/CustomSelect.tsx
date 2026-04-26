import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  containerClassName?: string;
  iconSize?: number;
}

/**
 * Componente Select estilizado que sustituye al HTML nativo.
 * Mantiene la accesibilidad y el comportamiento nativo pero con una UI mejorada.
 * Utiliza appearance-none para ocultar la flecha nativa y añadir una de Lucide.
 */
const CustomSelect = forwardRef<HTMLSelectElement, CustomSelectProps>(
  ({ options, className = '', containerClassName = '', iconSize = 16, ...props }, ref) => {
    return (
      <div className={`relative group ${containerClassName}`}>
        <select
          ref={ref}
          className={`
            w-full appearance-none pr-10 cursor-pointer outline-none transition-all
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-slate-900 font-medium">
              {opt.label}
            </option>
          ))}
        </select>
        
        {/* Ícono de flecha personalizado - Hereda el color del texto del select (text-current) */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-current opacity-50 group-hover:opacity-90 transition-opacity">
          <ChevronDown size={iconSize} strokeWidth={2.5} />
        </div>
      </div>
    );
  }
);

CustomSelect.displayName = 'CustomSelect';

export default CustomSelect;
