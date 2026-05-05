import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const navigate = useNavigate();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[0.75rem] font-medium text-slate-500 py-1">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 hover:text-navy transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-medium"
        aria-label="Ir al inicio"
      >
        <Home size={14} />
        <span className="sr-only">Inicio</span>
      </button>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={14} className="text-slate-300" aria-hidden="true" />
          {item.path && !item.active ? (
            <button
              onClick={() => navigate(item.path!)}
              className="hover:text-navy transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-medium truncate max-w-[150px] sm:max-w-[200px]"
            >
              {item.label}
            </button>
          ) : (
            <span 
              className={`truncate max-w-[150px] sm:max-w-[200px] ${item.active ? 'text-navy font-bold' : ''}`}
              aria-current={item.active ? 'page' : undefined}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
