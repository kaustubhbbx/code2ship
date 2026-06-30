import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export const geminiFlashModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
};

export const geminiFlashLiteModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
};

export interface ExtractionResult {
  title: string;
  category: string;
  deadline: string;
  estimated_duration: number;
  urgency: number;
  complexity: number;
  description?: string;
}

/**
 * Extract task information from natural language input
 */
export async function extractTaskFromText(input: string): Promise<ExtractionResult> {
  const model = geminiFlashModel();

  const prompt = `Extract task information from this input and return a JSON object:
Input: "${input}"

Return ONLY a valid JSON object with these fields:
{
  "title": "task title",
  "category": "work|personal|health|financial|learning|other",
  "deadline": "ISO 8601 datetime string",
  "estimated_duration": number in minutes (5-480),
  "urgency": number 0-100,
  "complexity": number 1-10,
  "description": "optional description"
}

Be precise with dates. If relative dates are mentioned (e.g., "Friday"), calculate the actual date.
Categories should be lowercase and single value.
Urgency: how soon it needs to be done (0=far future, 100=immediate).
Complexity: how difficult is the task (1=very easy, 10=extremely difficult).`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract task information');
  }

  return JSON.parse(jsonMatch[0]) as ExtractionResult;
}

export interface PlanStep {
  step_number: number;
  title: string;
  description?: string;
  estimated_duration: number;
  order: number;
}

/**
 * Generate an execution plan for a task
 */
export async function generateTaskPlan(
  taskTitle: string,
  description: string,
  duration: number
): Promise<PlanStep[]> {
  const model = geminiFlashModel();

  const prompt = `Create a detailed execution plan for this task.
  
Task: ${taskTitle}
Description: ${description}
Estimated Total Duration: ${duration} minutes

Return ONLY a valid JSON array of steps:
[
  {
    "step_number": 1,
    "title": "step title",
    "description": "what to do",
    "estimated_duration": minutes for this step,
    "order": 1
  }
]

Each step should be actionable and specific. The sum of all step durations should be close to ${duration} minutes.
Prioritize logical order for task completion.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to generate task plan');
  }

  return JSON.parse(jsonMatch[0]) as PlanStep[];
}

export interface RiskAnalysis {
  score: number;
  confidence: number;
  reasoning: string;
  risk_level: 'low' | 'medium' | 'high';
  recommended_actions: string[];
}

/**
 * Analyze risk for a task based on deadline and complexity
 */
export async function analyzeTaskRisk(
  taskTitle: string,
  deadline: string,
  estimatedDuration: number,
  complexity: number,
  urgency: number
): Promise<RiskAnalysis> {
  const model = geminiFlashModel();

  const prompt = `Analyze the risk level for completing this task.

Task: ${taskTitle}
Deadline: ${deadline}
Estimated Duration: ${estimatedDuration} minutes
Complexity (1-10): ${complexity}
Urgency (0-100): ${urgency}

Return ONLY a valid JSON object:
{
  "score": number 0-100,
  "confidence": number 0-1,
  "reasoning": "why this risk score",
  "risk_level": "low|medium|high",
  "recommended_actions": ["action1", "action2"]
}

Consider:
- Time remaining until deadline
- Task complexity vs available time
- Urgency level
- Whether this is a critical path item

Risk Score: 0-30=low, 31-70=medium, 71-100=high`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to analyze task risk');
  }

  return JSON.parse(jsonMatch[0]) as RiskAnalysis;
}
