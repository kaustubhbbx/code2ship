import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { getTasks, getCalendarEvents, createAISchedule } from '@/lib/db';

interface ScheduleBlock {
  date: Date;
  startHour: number;
  endHour: number;
  taskId?: string;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch tasks and calendar events
    const tasks = await getTasks(user.id, { status: 'pending' });
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const calendarEvents = await getCalendarEvents(
      user.id,
      now.toISOString(),
      sevenDaysLater.toISOString()
    );

    // Generate schedule recommendations
    const scheduleBlocks = generateSchedule(tasks, calendarEvents, user.id);

    // Save schedule recommendations
    const savedSchedules = await Promise.all(
      scheduleBlocks.map(async (block) => {
        return createAISchedule(user.id, {
          task_id: block.taskId,
          title: block.taskId ? 'Work on task' : 'Recommended work block',
          scheduled_date: block.date.toISOString(),
          duration: (block.endHour - block.startHour) * 60,
          priority: 'high',
          reason: block.reason,
        });
      })
    );

    return NextResponse.json({ success: true, data: savedSchedules, count: savedSchedules.length });
  } catch (error: any) {
    console.error('Scheduling error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate schedule' },
      { status: 500 }
    );
  }
}

function generateSchedule(tasks: any[], calendarEvents: any[], userId: string): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Sort tasks by urgency and deadline
  const sortedTasks = [...tasks].sort((a, b) => {
    const aDeadline = new Date(a.deadline).getTime();
    const bDeadline = new Date(b.deadline).getTime();
    if (a.urgency !== b.urgency) return b.urgency - a.urgency;
    return aDeadline - bDeadline;
  });

  // For each day in the next 7 days
  for (let d = new Date(now); d <= sevenDaysLater; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

    // Find available time blocks
    const dayStart = 9; // 9 AM
    const dayEnd = 18; // 6 PM

    const dayEvents = calendarEvents.filter((e) => {
      const eventDate = new Date(e.start_time);
      return eventDate.toDateString() === d.toDateString();
    });

    let currentHour = dayStart;

    // Schedule tasks
    for (const task of sortedTasks) {
      if (currentHour >= dayEnd) break;

      const taskDeadline = new Date(task.deadline);
      if (taskDeadline < d) continue; // Skip overdue tasks for this day

      const duration = Math.ceil(task.estimated_duration / 60); // Convert to hours
      const endHour = Math.min(currentHour + duration, dayEnd);

      // Check for conflicts
      const hasConflict = dayEvents.some((e) => {
        const eventStart = parseInt(new Date(e.start_time).getHours().toString());
        const eventEnd = parseInt(new Date(e.end_time).getHours().toString());
        return !(endHour <= eventStart || currentHour >= eventEnd);
      });

      if (!hasConflict) {
        blocks.push({
          date: new Date(d),
          startHour: currentHour,
          endHour,
          taskId: task.id,
          reason: `High priority task - deadline: ${taskDeadline.toLocaleDateString()}`,
        });
        currentHour = endHour;
      }
    }

    // Suggest general work blocks if there's free time
    if (currentHour < dayEnd - 1) {
      blocks.push({
        date: new Date(d),
        startHour: currentHour,
        endHour: dayEnd,
        reason: 'Available time for deep work or planning',
      });
    }
  }

  return blocks;
}
