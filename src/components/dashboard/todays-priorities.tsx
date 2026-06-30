'use client';

import { Task } from '@/types';
import Link from 'next/link';

interface TodaysPrioritiesProps {
  tasks: Task[];
}

export function TodaysPriorities({ tasks }: TodaysPrioritiesProps) {
  const today = new Date().toDateString();
  const todaysTasks = tasks.filter((t) => new Date(t.deadline).toDateString() === today);

  const sortedTasks = todaysTasks.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (
      (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
      (priorityOrder[b.priority as keyof typeof priorityOrder] || 4)
    );
  });

  return (
    <div className="card mb-8">
      <h2 className="text-2xl font-semibold mb-6">Today's Priorities</h2>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted text-lg">No tasks due today</p>
          <p className="text-muted text-sm mt-2">You're all set!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <div className="p-4 bg-surface rounded-lg hover:bg-card transition-colors cursor-pointer border border-transparent hover:border-primary/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
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
                    <h3 className="font-semibold text-text">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted mt-1 line-clamp-1">{task.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-muted">{task.estimated_duration} min</p>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded text-xs font-semibold ${
                        task.status === 'completed'
                          ? 'bg-success/10 text-success'
                          : task.status === 'in_progress'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface text-muted'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
