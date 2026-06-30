import { NextRequest, NextResponse } from 'next/server';
import { extractTaskFromText } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const result = await extractTaskFromText(text);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Task extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract task' },
      { status: 500 }
    );
  }
}
