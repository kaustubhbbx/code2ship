'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import { createClientSupabase } from '@/lib/supabase';
import { Task } from '@/types';
import Link from 'next/link';

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

export default function TasksPage() {
  const router = useRouter();
  const supabase = createClientSupabase();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        let query = supabase.from('tasks').select('*').eq('user_id', user.id);

        if (filter !== 'all') {
          query = query.eq('status', filter);
        }

        const { data, error } = await query.order('deadline', { ascending: true });

        if (error) throw error;
        setTasks(data || []);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [supabase, router, filter]);

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">All Tasks</h1>
        <Link href="/tasks/new" className="btn-primary">
          + New Task
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 pb-4 border-b border-surface overflow-x-auto">
        {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
              filter === status
                ? 'bg-primary text-background'
                : 'bg-surface text-text hover:bg-card'
            }`}
          >
            {status === 'all' ? 'All Tasks' : status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-muted text-lg mb-4">No tasks found</p>
          <Link href="/tasks/new" className="btn-primary inline-block">
            Create Your First Task
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <div className="card hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          task.priority === 'critical'
                            ? 'bg-danger'
                            : task.priority === 'high'
                              ? 'bg-warning'
                              : task.priority === 'medium'
                                ? 'bg-primary'
                                : 'bg-success'
                        }`}
                      />
                      <span className="text-xs font-semibold text-muted uppercase">{task.priority}</span>
                      <span className="text-xs text-muted">{task.category}</span>
                      <span className="text-xs font-semibold text-muted ml-auto">
                        {new Date(task.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-text">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted mt-2 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                        task.status === 'completed'
                          ? 'bg-success/10 text-success'
                          : task.status === 'in_progress'
                            ? 'bg-primary/10 text-primary'
                            : task.status === 'cancelled'
                              ? 'bg-danger/10 text-danger'
                              : 'bg-surface text-muted'
                      }`}
                    >
                      {task.status}
                    </span>
                    <p className="text-xs text-muted mt-3">{task.estimated_duration} min</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
