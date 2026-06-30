import { z } from 'zod';

// === User Types ===
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().optional(),
  avatar_url: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// === Task Types ===
export const TaskSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  category: z.enum(['work', 'personal', 'health', 'financial', 'learning', 'other']),
  deadline: z.string().datetime(),
  estimated_duration: z.number().int().min(5).max(480), // in minutes
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  urgency: z.number().int().min(0).max(100),
  complexity: z.number().int().min(1).max(10),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Task = z.infer<typeof TaskSchema>;

// === Risk Score Types ===
export const RiskScoreSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  score: z.number().int().min(0).max(100),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  risk_level: z.enum(['low', 'medium', 'high']),
  recommended_actions: z.array(z.string()),
  calculated_at: z.string().datetime(),
});

export type RiskScore = z.infer<typeof RiskScoreSchema>;

// === AI Plan Types ===
export const AIPlanStepSchema = z.object({
  id: z.string().optional(),
  step_number: z.number().int().min(1),
  title: z.string(),
  description: z.string().optional(),
  estimated_duration: z.number().int().min(5),
  order: z.number().int().min(1),
});

export const AIPlanSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  steps: z.array(AIPlanStepSchema).optional(),
  ai_plan_steps: z.array(AIPlanStepSchema.extend({ id: z.string() })).optional(),
  total_duration: z.number().int(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type AIPlan = z.infer<typeof AIPlanSchema>;
export type AIPlanStep = z.infer<typeof AIPlanStepSchema>;

// === AI Schedule Types ===
export const AIScheduleSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  task_id: z.string().optional(),
  title: z.string(),
  scheduled_date: z.string().datetime(),
  duration: z.number().int(),
  priority: z.enum(['low', 'medium', 'high']),
  reason: z.string(),
  created_at: z.string().datetime(),
});

export type AISchedule = z.infer<typeof AIScheduleSchema>;

// === Calendar Event Types ===
export const CalendarEventSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  location: z.string().optional(),
  created_at: z.string().datetime(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

// === Daily Briefing Types ===
export const DailyBriefingSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  date: z.string(),
  summary: z.string(),
  active_commitments: z.number().int(),
  highest_risk_task_id: z.string().optional(),
  highest_risk_score: z.number().optional(),
  recommended_actions: z.array(z.string()),
  created_at: z.string().datetime(),
});

export type DailyBriefing = z.infer<typeof DailyBriefingSchema>;

// === User Preferences Types ===
export const UserPreferencesSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  theme: z.enum(['light', 'dark']).default('dark'),
  notifications_enabled: z.boolean().default(true),
  daily_briefing_time: z.string().default('08:00'),
  risk_threshold: z.number().int().min(0).max(100).default(70),
  preferred_ai_assistant: z.enum(['gemini_live', 'gemini_flash']).default('gemini_live'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// === Activity Log Types ===
export const ActivityLogSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
});

export type ActivityLog = z.infer<typeof ActivityLogSchema>;

// === API Response Types ===
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type ApiResponse<T = unknown> = z.infer<typeof ApiResponseSchema> & {
  data?: T;
};
