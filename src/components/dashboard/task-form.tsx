'use client';

import { FormEvent, useState } from 'react';
import { Task } from '@/types';
import { createClientSupabase } from '@/lib/supabase';

interface TaskFormProps {
  initialTask?: Task;
  onSubmit: (task: Partial<Task>) => Promise<void>;
  isLoading?: boolean;
}

export function TaskForm({ initialTask, onSubmit, isLoading }: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [category, setCategory] = useState<string>(initialTask?.category || 'work');
  const [priority, setPriority] = useState<string>(initialTask?.priority || 'medium');
  const [deadline, setDeadline] = useState(
    initialTask ? new Date(initialTask.deadline).toISOString().split('T')[0] : ''
  );
  const [estimatedDuration, setEstimatedDuration] = useState(
    initialTask?.estimated_duration?.toString() || '60'
  );
  const [complexity, setComplexity] = useState(initialTask?.complexity?.toString() || '5');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!deadline) {
      setError('Deadline is required');
      return;
    }

    try {
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(23, 59, 59);

      await onSubmit({
        title,
        description,
        category: category as any,
        priority: priority as any,
        deadline: deadlineDate.toISOString(),
        estimated_duration: parseInt(estimatedDuration),
        complexity: parseInt(complexity),
        urgency: calculateUrgency(deadlineDate),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="label">
          Task Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need to accomplish?"
          className="input"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details..."
          className="input resize-none h-24"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="label">
            Category *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
            disabled={isLoading}
          >
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="health">Health</option>
            <option value="financial">Financial</option>
            <option value="learning">Learning</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="label">
            Priority *
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="input"
            disabled={isLoading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="deadline" className="label">
            Deadline *
          </label>
          <input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="input"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="estimatedDuration" className="label">
            Estimated Duration (minutes)
          </label>
          <input
            id="estimatedDuration"
            type="number"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            min="5"
            max="480"
            step="5"
            className="input"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="complexity" className="label">
          Complexity (1-10)
        </label>
        <div className="flex items-center gap-4">
          <input
            id="complexity"
            type="range"
            value={complexity}
            onChange={(e) => setComplexity(e.target.value)}
            min="1"
            max="10"
            className="flex-1"
            disabled={isLoading}
          />
          <span className="text-lg font-semibold text-primary min-w-8 text-right">{complexity}</span>
        </div>
        <p className="text-xs text-muted mt-2">
          1 = Very Simple, 10 = Extremely Difficult
        </p>
      </div>

      <button type="submit" className="btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : initialTask ? 'Update Task' : 'Create Task'}
      </button>
    </form>
  );
}

function calculateUrgency(deadline: Date): number {
  const now = new Date();
  const msUntilDeadline = deadline.getTime() - now.getTime();
  const daysUntilDeadline = msUntilDeadline / (1000 * 60 * 60 * 24);

  if (daysUntilDeadline <= 0) return 100; // Overdue
  if (daysUntilDeadline <= 1) return 90; // Today/tomorrow
  if (daysUntilDeadline <= 3) return 75; // 3 days
  if (daysUntilDeadline <= 7) return 50; // 1 week
  return 20; // More than a week
}
