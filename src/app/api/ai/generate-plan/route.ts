import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { generateTaskPlan } from '@/lib/ai';
import { createAIPlan } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    // Fetch task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if plan already exists
    const { data: existingPlan } = await supabase
      .from('ai_plans')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (existingPlan) {
      return NextResponse.json({ success: true, data: existingPlan, isNew: false });
    }

    // Generate plan
    const planSteps = await generateTaskPlan(
      task.title,
      task.description || '',
      task.estimated_duration
    );

    // Calculate total duration
    const totalDuration = planSteps.reduce((sum, step) => sum + step.estimated_duration, 0);

    // Save to database
    const savedPlan = await createAIPlan(
      taskId,
      { total_duration: totalDuration },
      planSteps
    );

    return NextResponse.json({ success: true, data: savedPlan, isNew: true });
  } catch (error: any) {
    console.error('Plan generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
