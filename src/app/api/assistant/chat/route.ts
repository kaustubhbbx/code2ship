import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServerSupabase } from '@/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query active tasks and their risk scores
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*, risk_scores(score)')
      .eq('user_id', user.id);

    // Format tasks into context
    const tasksList = tasksData && tasksData.length > 0
      ? tasksData
          .map(
            (t: any) =>
              `- [Status: ${t.status}] "${t.title}" (Category: ${t.category}, Deadline: ${new Date(t.deadline).toLocaleDateString()}, Estimated duration: ${t.estimated_duration} mins, Complexity: ${t.complexity}/10, Priority: ${t.priority}, Urgency: ${t.urgency}%, Risk Score: ${t.risk_scores?.score ?? 'Not calculated'})`
          )
          .join('\n')
      : 'No current tasks on the list.';

    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    const systemPrompt = `You are DURA's AI Executive Assistant - a premium productivity coach and strategic planner.

Your role:
- Help users analyze their commitments and prioritize effectively
- Provide strategic insights about task management and deadline risk
- Create actionable execution plans
- Coach users on productivity and time management
- Answer questions about their tasks, deadlines, and workload
- Suggest scheduling strategies
- Provide motivation and accountability

Communication style:
- Professional but warm
- Concise and actionable
- Strategic and forward-thinking
- Never be generic - reference specific tasks and deadlines when possible
- Provide concrete next steps

USER'S CURRENT COMMITMENTS (Tasks Database):
${tasksList}

TASK CREATION COMMAND:
If the user asks you to create, log, add, or schedule a task, and you have gathered enough details (title, deadline or relative time, and estimated duration), you MUST append a creation command to the end of your response.
The command must start exactly with "[CREATE_TASK_CMD]" on a new line, followed by a valid JSON object containing the task properties. Do not wrap the JSON in markdown code blocks.
Example format at the end of your reply:
[CREATE_TASK_CMD]
{
  "title": "Clean the kitchen",
  "description": "Wash dishes and wipe down counters",
  "category": "personal",
  "deadline": "2026-07-02T20:00:00.000Z",
  "estimated_duration": 45,
  "complexity": 2,
  "urgency": 60
}

Ensure the deadline is a valid ISO 8601 string calculated relative to the current local time: 2026-07-01. Default category to 'other' if unknown, estimated_duration to 60 if unknown, complexity to 5 if unknown, urgency to 50 if unknown.

When the user asks about creating tasks, say "I'll help you create that task" and ask for key details. Once you have them, append the task creation command at the end.
When they ask about their schedule, suggest the best time based on deadlines and complexity.
When they're overwhelmed, help them prioritize ruthlessly.`;

    const messages = (conversationHistory || []).map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    messages.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const result = await model.generateContent({
      contents: messages,
      systemInstruction: systemPrompt,
    });

    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      data: {
        role: 'assistant',
        content: responseText,
      },
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process message' },
      { status: 500 }
    );
  }
}
