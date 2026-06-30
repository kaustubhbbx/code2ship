import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

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

When the user asks about creating tasks, say "I'll help you create that task" and ask for key details.
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
