'use server';

export async function triggerRiskAnalysis(taskId: string) {
  try {
    const response = await fetch(new URL('/api/ai/analyze-risk', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to trigger risk analysis');
    }

    return await response.json();
  } catch (error) {
    console.error('Error triggering risk analysis:', error);
    // Don't throw - let task creation succeed even if risk analysis fails
  }
}

export async function triggerBatchRiskAnalysis() {
  try {
    const response = await fetch(new URL('/api/ai/analyze-risk', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').toString(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to trigger batch risk analysis');
    }

    return await response.json();
  } catch (error) {
    console.error('Error triggering batch risk analysis:', error);
  }
}
