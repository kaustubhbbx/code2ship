'use client';

import { Task } from '@/types';
import Link from 'next/link';

interface UpcomingDeadlinesProps {
  tasks: Task[];
}

export function UpcomingDeadlines({ tasks }: UpcomingDeadlinesProps) {
  // Filter for upcoming tasks (next 7 days)
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingTasks = tasks
    .filter(
      (t) =>
        new Date(t.deadline) > now &&
        new Date(t.deadline) <= sevenDaysFromNow &&
        t.status !== 'completed'
    )
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const groupedByDate = upcomingTasks.reduce(
    (acc, task) => {
      const date = new Date(task.deadline).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(task);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold mb-6">Upcoming Deadlines</h2>

      {Object.keys(groupedByDate).length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted">No upcoming deadlines in the next 7 days</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, tasksForDate]) => (
            <div key={date}>
              <p className="text-sm font-semibold text-muted mb-3">{date}</p>
              <div className="space-y-2">
                {tasksForDate.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="p-3 bg-surface rounded-lg hover:bg-card transition-colors cursor-pointer border border-transparent hover:border-primary/30">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text truncate">{task.title}</p>
                          <p className="text-xs text-muted mt-1">{task.category}</p>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs text-muted">{task.estimated_duration} min</p>
                          </div>
                          <div
                            className={`w-3 h-3 rounded-full ${
                              task.urgency > 70
                                ? 'bg-danger'
                                : task.urgency > 40
                                  ? 'bg-warning'
                                  : 'bg-success'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
