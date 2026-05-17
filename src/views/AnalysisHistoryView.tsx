import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResultsView } from './ResultsView';
import { useUsabilityController } from '../controllers/UsabilityController';

export const AnalysisHistoryView: React.FC = () => {
  const { id, analysisId } = useParams<{ id: string, analysisId?: string }>();
  const navigate = useNavigate();
  const { resetState } = useUsabilityController();
  
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ResultsView
          result={null}
          isLoading={false}
          error={null}
          planId={id}
          initialAnalysisId={analysisId}
          onBack={() => {
            resetState();
            navigate(`/plan/${id}/observations`);
          }}
        />
      </div>
    </div>
  );
};
