'use client';

import { useState } from 'react';
import { AIPlan } from '@/types';

interface AIPlanGeneratorProps {
  taskId: string;
  taskTitle: string;
  onPlanGenerated: (plan: AIPlan) => void;
}

export function AIPlanGenerator({ taskId, taskTitle, onPlanGenerated }: AIPlanGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePlan = async () => {
    setError('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate plan');
      }

      const data = await response.json();
      onPlanGenerated(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGeneratePlan}
        disabled={isGenerating}
        className="btn-primary w-full"
      >
        {isGenerating ? 'Generating Plan...' : 'Generate Execution Plan'}
      </button>

      {error && (
        <div className="p-3 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
