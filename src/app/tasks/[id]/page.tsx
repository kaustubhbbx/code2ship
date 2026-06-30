'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import { TaskForm } from '@/components/dashboard/task-form';
import { createClientSupabase } from '@/lib/supabase';
import { Task, RiskScore, AIPlan } from '@/types';
import Link from 'next/link';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const supabase = createClientSupabase();
  
  const [task, setTask] = useState<Task | null>(null);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [aiPlan, setAIPlan] = useState<AIPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      try {
        // Fetch task
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single();

        if (taskError) throw taskError;
        setTask(taskData);

        // Fetch risk score
        const { data: riskData } = await supabase
          .from('risk_scores')
          .select('*')
          .eq('task_id', taskId)
          .single();

        setRiskScore(riskData);

        // Fetch AI plan
        const { data: planData } = await supabase
          .from('ai_plans')
          .select('*, ai_plan_steps(*)')
          .eq('task_id', taskId)
          .single();

        setAIPlan(planData);
      } catch (error) {
        console.error('Error loading task:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [supabase, taskId]);

  const handleUpdate = async (updates: Partial<Task>) => {
    setIsUpdating(true);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      setTask(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) throw error;
      router.push('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-screen bg-surface rounded-lg animate-pulse" />
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout>
        <div className="card text-center py-16">
          <p className="text-muted text-lg">Task not found</p>
          <Link href="/tasks" className="btn-primary inline-block mt-4">
            Back to Tasks
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link href="/tasks" className="text-primary hover:underline text-sm mb-4 inline-block">
          ← Back to Tasks
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">Edit Task</h2>
              <TaskForm
                initialTask={task}
                onSubmit={handleUpdate}
                isLoading={isUpdating}
              />
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary w-full mt-4"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="card mb-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`w-4 h-4 rounded-full ${
                          task.priority === 'critical'
                            ? 'bg-danger'
                            : task.priority === 'high'
                              ? 'bg-warning'
                              : task.priority === 'medium'
                                ? 'bg-primary'
                                : 'bg-success'
                        }`}
                      />
                      <span className="text-xs font-semibold text-muted uppercase">
                        {task.priority}
                      </span>
                      <span className="text-xs text-muted">{task.category}</span>
                    </div>
                    <h1 className="text-4xl font-bold">{task.title}</h1>
                  </div>
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleUpdate({ status: 'in_progress' })}
                        className="btn-primary text-sm px-4 py-2"
                        disabled={isUpdating}
                      >
                        Start Task
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdate({ status: 'completed' })}
                        className="bg-white text-black hover:bg-neutral-200 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                        disabled={isUpdating}
                      >
                        Complete Task
                      </button>
                    )}
                    {(task.status === 'completed' || task.status === 'cancelled') && (
                      <button
                        onClick={() => handleUpdate({ status: 'in_progress' })}
                        className="btn-secondary text-sm px-4 py-2"
                        disabled={isUpdating}
                      >
                        Reopen Task
                      </button>
                    )}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-secondary text-sm"
                      disabled={isUpdating}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {task.description && (
                  <p className="text-text mb-6 leading-relaxed">{task.description}</p>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted mb-1">Deadline</p>
                    <p className="font-semibold">
                      {new Date(task.deadline).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1">Estimated Duration</p>
                    <p className="font-semibold">{task.estimated_duration} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1">Status</p>
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleUpdate({ status: e.target.value as any })
                      }
                      className="input"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1">Complexity</p>
                    <p className="font-semibold">{task.complexity} / 10</p>
                  </div>
                </div>
              </div>

              {/* AI Plan */}
              {aiPlan && (
                <div className="card mb-8">
                  <h2 className="text-2xl font-bold mb-6">Execution Plan</h2>
                  <div className="space-y-4">
                    {aiPlan.ai_plan_steps
                      ?.sort((a, b) => a.order - b.order)
                      .map((step) => (
                        <div key={step.id} className="p-4 bg-surface rounded-lg">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center font-bold flex-shrink-0">
                              {step.step_number}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-text">{step.title}</h3>
                              {step.description && (
                                <p className="text-sm text-muted mt-1">{step.description}</p>
                              )}
                              <p className="text-xs text-muted mt-2">
                                ~{step.estimated_duration} minutes
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleDelete}
                className="btn-secondary w-full bg-danger/10 text-danger border-danger/30 hover:bg-danger/20"
              >
                Delete Task
              </button>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Score */}
          {riskScore && (
            <div className="card border-l-4 border-l-primary">
              <h3 className="text-lg font-bold mb-4">Risk Analysis</h3>
              <div className="mb-6">
                <p className="text-sm text-muted mb-2">Risk Score</p>
                <div className="flex items-end gap-3">
                  <div className="text-4xl font-bold text-primary">{riskScore.score}</div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-1 ${
                      riskScore.risk_level === 'high'
                        ? 'bg-danger/10 text-danger'
                        : riskScore.risk_level === 'medium'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                    }`}
                  >
                    {riskScore.risk_level}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-surface rounded-lg mb-4">
                <p className="text-xs text-muted mb-2">Reasoning</p>
                <p className="text-sm text-text">{riskScore.reasoning}</p>
              </div>

              {riskScore.recommended_actions.length > 0 && (
                <div>
                  <p className="text-xs text-muted mb-2">Recommended Actions</p>
                  <ul className="space-y-2">
                    {riskScore.recommended_actions.map((action, idx) => (
                      <li key={idx} className="text-xs text-text flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Info Card */}
          <div className="card bg-surface">
            <h3 className="font-semibold mb-4">Quick Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted">Created</p>
                <p className="font-medium">
                  {new Date(task.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted">Last Updated</p>
                <p className="font-medium">
                  {new Date(task.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted">Urgency</p>
                <div className="w-full h-2 bg-card rounded-full mt-1">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${task.urgency}%` }}
                  />
                </div>
                <p className="text-xs text-muted mt-1">{task.urgency}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
