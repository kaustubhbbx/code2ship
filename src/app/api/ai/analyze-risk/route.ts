import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { analyzeTaskRisk } from '@/lib/ai';
import { upsertRiskScore } from '@/lib/db';

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

    // Analyze risk
    const riskAnalysis = await analyzeTaskRisk(
      task.title,
      task.deadline,
      task.estimated_duration,
      task.complexity,
      task.urgency
    );

    // Save to database
    const savedRiskScore = await upsertRiskScore(taskId, {
      score: riskAnalysis.score,
      confidence: riskAnalysis.confidence,
      reasoning: riskAnalysis.reasoning,
      risk_level: riskAnalysis.risk_level,
      recommended_actions: riskAnalysis.recommended_actions,
    });

    return NextResponse.json({ success: true, data: savedRiskScore });
  } catch (error: any) {
    console.error('Risk analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze risk' },
      { status: 500 }
    );
  }
}

// Run risk analysis for all tasks
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress']);

    if (tasksError) throw tasksError;

    // Analyze risk for each task
    const results = await Promise.all(
      (tasks || []).map(async (task) => {
        try {
          const riskAnalysis = await analyzeTaskRisk(
            task.title,
            task.deadline,
            task.estimated_duration,
            task.complexity,
            task.urgency
          );

          await upsertRiskScore(task.id, {
            score: riskAnalysis.score,
            confidence: riskAnalysis.confidence,
            reasoning: riskAnalysis.reasoning,
            risk_level: riskAnalysis.risk_level,
            recommended_actions: riskAnalysis.recommended_actions,
          });

          return { taskId: task.id, success: true };
        } catch (error) {
          return { taskId: task.id, success: false, error };
        }
      })
    );

    return NextResponse.json({ success: true, results, total: tasks?.length || 0 });
  } catch (error: any) {
    console.error('Batch risk analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze risks' },
      { status: 500 }
    );
  }
}
