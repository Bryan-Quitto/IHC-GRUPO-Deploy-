import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useUsabilityController } from './UsabilityController';
import { AIAnalysisPanel } from '../components/AIAnalysisPanel';

type UsabilityControllerType = ReturnType<typeof useUsabilityController>;

interface AIAnalysisContextType extends UsabilityControllerType {
  currentPlanId: string | null;
  retryCountdown: number; // segundos restantes para reintentar (0 = libre)
}

const AIAnalysisContext = createContext<AIAnalysisContextType | null>(null);

export const useAIAnalysisContext = () => {
  const context = useContext(AIAnalysisContext);
  if (!context) {
    throw new Error('useAIAnalysisContext must be used within an AIAnalysisProvider');
  }
  return context;
};

export const AIAnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const controller = useUsabilityController();
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cuando llega un error de rate limit con retryAfterSeconds, arranca el countdown
  useEffect(() => {
    if (controller.error?.code === 'RATE_LIMIT' && controller.error.retryAfterSeconds) {
      const seconds = controller.error.retryAfterSeconds;
      setRetryCountdown(seconds);

      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setRetryCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            countdownRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [controller.error]);

  // Si resetState se llama, limpiar countdown también
  const resetState: UsabilityControllerType['resetState'] = () => {
    setRetryCountdown(0);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    controller.resetState();
  };

  // Interceptar la recarga o cierre si está analizando
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (controller.isLoading) {
        e.preventDefault();
        e.returnValue = 'El análisis de IA se está ejecutando. Si cierras o recargas, se cancelará.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [controller.isLoading]);

  // Sobrescribimos analyzeFromPlan para interceptar el planId actual
  const analyzeFromPlan: UsabilityControllerType['analyzeFromPlan'] = async (plan, obs, success, time, sat) => {
    setCurrentPlanId(plan.id ?? null);
    return await controller.analyzeFromPlan(plan, obs, success, time, sat);
  };

  // Sobrescribimos analyzeFromRequest para interceptar el planId del contexto
  const analyzeFromRequest: UsabilityControllerType['analyzeFromRequest'] = async (request) => {
    if (request.context?.includes('planId:')) {
      const planId = request.context.split('planId:')[1];
      setCurrentPlanId(planId || null);
    }
    return await controller.analyzeFromRequest(request);
  };

  return (
    <AIAnalysisContext.Provider value={{ 
      ...controller,
      analyzeFromPlan,
      analyzeFromRequest,
      resetState,
      currentPlanId,
      retryCountdown
    }}>
      {children}
      {/* Panel Global de Análisis (Sobrevive a la navegación) */}
      <AIAnalysisPanel
        isLoading={controller.isLoading}
        result={controller.result}
        error={controller.error?.message || null}
        onClose={resetState}
        onViewDetails={currentPlanId ? () => window.open(`/plan/${currentPlanId}/analysis-history/latest`, '_blank') : undefined}
      />
    </AIAnalysisContext.Provider>
  );
};
