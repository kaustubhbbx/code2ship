'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import { TaskForm } from '@/components/dashboard/task-form';
import { AITaskExtraction } from '@/components/dashboard/ai-task-extraction';
import { createClientSupabase } from '@/lib/supabase';
import { ExtractionResult } from '@/lib/ai';
import { Task } from '@/types';
import Link from 'next/link';

type CreateMode = 'manual' | 'ai';

export default function NewTaskPage() {
  const router = useRouter();
  const supabase = createClientSupabase();
  const [mode, setMode] = useState<CreateMode>('ai');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);

  const handleAIExtract = (data: ExtractionResult) => {
    setExtractedData(data);
    setMode('manual');
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          ...taskData,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Redirect to task detail
      router.push(`/tasks/${data.id}`);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link href="/dashboard" className="text-primary hover:underline text-sm mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold">Create New Task</h1>
        <p className="text-muted mt-2">Add a new commitment to your list</p>
      </div>

      <div className="max-w-2xl">
        {mode === 'ai' ? (
          <>
            <div className="card mb-6">
              <h2 className="text-2xl font-bold mb-4">AI Task Creation</h2>
              <AITaskExtraction onExtract={handleAIExtract} isLoading={isLoading} />
            </div>

            <div className="text-center py-8">
              <p className="text-muted mb-4">Or</p>
              <button
                onClick={() => setMode('manual')}
                className="btn-secondary"
              >
                Create Manually
              </button>
            </div>
          </>
        ) : (
          <div className="card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Task Details</h2>
              {extractedData && (
                <button
                  onClick={() => {
                    setExtractedData(null);
                    setMode('ai');
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Back to AI
                </button>
              )}
            </div>
            <TaskForm 
              onSubmit={handleCreateTask} 
              isLoading={isLoading} 
              initialTask={extractedData ? {
                title: extractedData.title,
                description: extractedData.description || '',
                category: extractedData.category as any,
                deadline: extractedData.deadline,
                estimated_duration: extractedData.estimated_duration,
                complexity: extractedData.complexity,
                urgency: extractedData.urgency,
              } as any : undefined} 
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
