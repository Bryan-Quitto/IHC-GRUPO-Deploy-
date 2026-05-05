import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

/**
 * Componente Textarea que ajusta su altura automáticamente según el contenido.
 * Crece hasta un máximo de 5 líneas y luego activa el scroll interno.
 */
const AutoGrowTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', onChange, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Permite que el padre acceda al nodo del textarea si lo necesita
    useImperativeHandle(ref, () => textareaRef.current!);

    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        // Reset de altura para calcular el scrollHeight real
        textarea.style.height = 'auto';
        // Asignamos el scrollHeight como la nueva altura
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    // Ajustar altura al montar y cuando cambie el valor externamente
    useEffect(() => {
      adjustHeight();
    }, [props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <textarea
        ref={textareaRef}
        className={`${className} overflow-y-auto resize-none`}
        style={{ 
          // 1.5em es una altura de línea estándar aproximada. 
          // 5 líneas + un margen de seguridad para el padding.
          maxHeight: 'calc(1.5em * 5 + 1.5rem)',
          minHeight: props.rows ? `calc(1.5em * ${props.rows} + 1rem)` : 'auto'
        }}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

AutoGrowTextarea.displayName = 'AutoGrowTextarea';

export default AutoGrowTextarea;
