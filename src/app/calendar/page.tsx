'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import { createClientSupabase } from '@/lib/supabase';
import { CalendarEvent, Task } from '@/types';
import Link from 'next/link';

export default function CalendarPage() {
  const router = useRouter();
  const supabase = createClientSupabase();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Fetch calendar events
        const { data: eventsData } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: true });

        setEvents(eventsData || []);

        // Fetch tasks
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('deadline', { ascending: true });

        setTasks(tasksData || []);
      } catch (error) {
        console.error('Error loading calendar:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase, router]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const selectedDateEvents = events.filter((e) => {
    const eventDate = new Date(e.start_time).toDateString();
    return eventDate === selectedDate.toDateString();
  });

  const selectedDateTasks = tasks.filter((t) => {
    const taskDate = new Date(t.deadline).toDateString();
    return taskDate === selectedDate.toDateString() && t.status !== 'completed';
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-screen bg-surface rounded-lg animate-pulse" />
      </DashboardLayout>
    );
  }

  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDay = getFirstDayOfMonth(selectedDate);
  const calendarDays = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold mb-8">Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                  className="btn-secondary text-sm"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                  className="btn-secondary text-sm"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-muted py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => day && setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                  className={`p-3 rounded-lg text-center font-semibold transition-colors ${
                    !day
                      ? 'bg-transparent'
                      : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toDateString() ===
                          new Date().toDateString()
                        ? 'bg-primary text-background'
                        : selectedDate.getDate() === day
                          ? 'bg-card border-2 border-primary'
                          : 'bg-surface hover:bg-card'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Selected date details */}
        <div className="space-y-6">
          <div className="card">
            <p className="text-sm text-muted mb-2">Selected Date</p>
            <h3 className="text-2xl font-bold">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
          </div>

          {/* Events for selected date */}
          <div className="card">
            <h3 className="font-semibold mb-4">Events</h3>
            {selectedDateEvents.length === 0 ? (
              <p className="text-muted text-sm">No events scheduled</p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="p-3 bg-surface rounded-lg">
                    <p className="font-medium text-text text-sm">{event.title}</p>
                    <p className="text-xs text-muted mt-1">
                      {new Date(event.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks for selected date */}
          <div className="card">
            <h3 className="font-semibold mb-4">Due Today</h3>
            {selectedDateTasks.length === 0 ? (
              <p className="text-muted text-sm">No tasks due</p>
            ) : (
              <div className="space-y-3">
                {selectedDateTasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="p-3 bg-surface rounded-lg hover:bg-card cursor-pointer transition-colors">
                      <p className="font-medium text-text text-sm truncate">{task.title}</p>
                      <p className="text-xs text-muted mt-1">{task.estimated_duration} min</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
