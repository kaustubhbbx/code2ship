import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { getTasks, getRiskScore, getDailyBriefing, createDailyBriefing } from '@/lib/db';
import { geminiFlashModel } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date } = await request.json();
    const briefingDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Check if briefing already exists for today
    const existingBriefing = await getDailyBriefing(user.id, briefingDate);
    if (existingBriefing) {
      return NextResponse.json({ success: true, data: existingBriefing, isNew: false });
    }

    // Fetch user's tasks
    const tasks = await getTasks(user.id);

    // Calculate statistics
    const activeCommitments = tasks.filter((t) => t.status !== 'completed').length;
    const completedToday = tasks.filter((t) => {
      const taskDeadline = new Date(t.deadline).toDateString();
      return t.status === 'completed' && taskDeadline === new Date(briefingDate).toDateString();
    }).length;

    // Find highest risk task
    let highestRiskTask = null;
    let highestRiskScore = null;

    for (const task of tasks) {
      if (task.status === 'completed') continue;

      const riskScore = await getRiskScore(task.id);
      if (riskScore && (!highestRiskScore || riskScore.score > highestRiskScore.score)) {
        highestRiskTask = task;
        highestRiskScore = riskScore;
      }
    }

    // Generate AI briefing text
    const briefingText = await generateBriefingText(
      user.user_metadata?.full_name || 'User',
      activeCommitments,
      completedToday,
      highestRiskTask,
      highestRiskScore,
      tasks
    );

    // Parse recommended actions from briefing
    const recommendedActions = extractRecommendations(briefingText);

    // Save briefing
    const savedBriefing = await createDailyBriefing(user.id, {
      date: briefingDate,
      summary: briefingText,
      active_commitments: activeCommitments,
      highest_risk_task_id: highestRiskTask?.id,
      highest_risk_score: highestRiskScore?.score || 0,
      recommended_actions: recommendedActions,
    });

    return NextResponse.json({ success: true, data: savedBriefing, isNew: true });
  } catch (error: any) {
    console.error('Briefing generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}

async function generateBriefingText(
  userName: string,
  activeCommitments: number,
  completedToday: number,
  highestRiskTask: any,
  highestRiskScore: any,
  allTasks: any[]
): Promise<string> {
  const model = geminiFlashModel();

  const taskSummary = allTasks
    .filter((t) => t.status !== 'completed')
    .slice(0, 5)
    .map((t) => `- ${t.title} (due ${new Date(t.deadline).toLocaleDateString()})`)
    .join('\n');

  const prompt = `Generate a professional, concise executive briefing for ${userName}.

Active Commitments: ${activeCommitments}
Completed Today: ${completedToday}
Highest Risk Task: ${highestRiskTask?.title || 'None'} (Risk: ${highestRiskScore?.score || 0}%)
Top Tasks:
${taskSummary}

Generate a 2-3 paragraph briefing that:
1. Provides an encouraging greeting
2. Summarizes the day's priorities
3. Highlights risks and recommended actions
4. Motivates action

Keep it professional but warm. Use actual numbers and task names.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

function extractRecommendations(text: string): string[] {
  const recommendations: string[] = [];

  // Look for action items in the text
  const lines = text.split('\n');
  for (const line of lines) {
    if (
      line.toLowerCase().includes('recommend') ||
      line.toLowerCase().includes('action') ||
      line.toLowerCase().includes('focus') ||
      line.toLowerCase().includes('priorit') ||
      line.toLowerCase().includes('schedule')
    ) {
      if (line.length > 10 && line.length < 200) {
        recommendations.push(line.trim().replace(/^[-•*]\s*/, ''));
      }
    }
  }

  return recommendations.slice(0, 5);
}
