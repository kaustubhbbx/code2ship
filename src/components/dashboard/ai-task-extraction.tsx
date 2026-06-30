'use client';

import { FormEvent, useState } from 'react';
import { ExtractionResult } from '@/lib/ai';

interface AITaskExtractionProps {
  onExtract: (extractedData: ExtractionResult) => void;
  onEdit?: (extractedData: ExtractionResult) => void;
  isLoading?: boolean;
}

export function AITaskExtraction({ onExtract, onEdit, isLoading }: AITaskExtractionProps) {
  const [input, setInput] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtract = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsExtracting(true);

    try {
      const response = await fetch('/api/ai/extract-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to extract task');
      }

      const data = await response.json();
      setExtractedData(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to extract task information');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUseExtraction = () => {
    if (extractedData) {
      onExtract(extractedData);
      setInput('');
      setExtractedData(null);
    }
  };

  const handleEditExtraction = () => {
    if (extractedData && onEdit) {
      onEdit(extractedData);
      setInput('');
      setExtractedData(null);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleExtract} className="space-y-4">
        <div>
          <label htmlFor="input" className="label">
            Describe Your Task (Natural Language)
          </label>
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g., 'I have a DBMS assignment due Friday and an interview next Monday at 2pm...'"
            className="input resize-none h-24"
            disabled={isExtracting || isLoading}
          />
          <p className="text-xs text-muted mt-2">
            Describe your task in natural language. The AI will extract dates, deadlines, and other details.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isExtracting || isLoading || !input.trim()}
        >
          {isExtracting ? 'Analyzing...' : 'Extract Task Details'}
        </button>
      </form>

      {extractedData && (
        <div className="card bg-surface">
          <h3 className="text-lg font-semibold mb-4">Extracted Information</h3>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm text-muted mb-1">Title</p>
              <p className="font-semibold text-text">{extractedData.title}</p>
            </div>

            {extractedData.description && (
              <div>
                <p className="text-sm text-muted mb-1">Description</p>
                <p className="text-text">{extractedData.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted mb-1">Category</p>
                <p className="font-semibold text-text capitalize">{extractedData.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">Deadline</p>
                <p className="font-semibold text-text">
                  {new Date(extractedData.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted mb-1">Estimated Duration</p>
                <p className="font-semibold text-text">{extractedData.estimated_duration} minutes</p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">Complexity</p>
                <p className="font-semibold text-text">{extractedData.complexity} / 10</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted mb-1">Urgency</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-card rounded-full">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${extractedData.urgency}%` }}
                  />
                </div>
                <span className="font-semibold text-primary text-sm">{extractedData.urgency}%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleUseExtraction}
              className="btn-primary flex-1"
              disabled={isLoading}
            >
              Save Directly
            </button>
            <button
              onClick={handleEditExtraction}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Edit Details
            </button>
            <button
              onClick={() => setExtractedData(null)}
              className="btn-secondary flex-shrink-0"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
