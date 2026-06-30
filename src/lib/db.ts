import { createServerSupabase } from '@/lib/supabase';
import { Task, RiskScore, AIPlan, CalendarEvent, AISchedule, DailyBriefing } from '@/types';

// === Task Operations ===
export async function getTasks(userId: string, filters?: { status?: string; priority?: string }) {
  const supabase = await createServerSupabase();

  let query = supabase.from('tasks').select('*').eq('user_id', userId);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  const { data, error } = await query.order('deadline', { ascending: true });

  if (error) throw error;
  return data as Task[];
}

export async function getTaskById(taskId: string) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.from('tasks').select('*').eq('id', taskId).single();

  if (error) throw error;
  return data as Task;
}

export async function createTask(userId: string, taskData: Partial<Task>) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      ...taskData,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(taskId: string) {
  const supabase = await createServerSupabase();

  const { error } = await supabase.from('tasks').delete().eq('id', taskId);

  if (error) throw error;
}

// === Risk Score Operations ===
export async function getRiskScore(taskId: string) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('risk_scores')
    .select('*')
    .eq('task_id', taskId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return (data as RiskScore) || null;
}

export async function upsertRiskScore(taskId: string, riskData: Partial<RiskScore>) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('risk_scores')
    .upsert(
      {
        task_id: taskId,
        ...riskData,
        calculated_at: new Date().toISOString(),
      },
      { onConflict: 'task_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as RiskScore;
}

// === AI Plan Operations ===
export async function createAIPlan(taskId: string, planData: Partial<AIPlan>, steps: any[]) {
  const supabase = await createServerSupabase();

  // Create the plan
  const { data: planData_response, error: planError } = await supabase
    .from('ai_plans')
    .insert({
      task_id: taskId,
      ...planData,
    })
    .select()
    .single();

  if (planError) throw planError;

  // Create plan steps
  const stepsWithPlanId = steps.map((step) => ({
    ...step,
    plan_id: planData_response.id,
  }));

  const { error: stepsError } = await supabase.from('ai_plan_steps').insert(stepsWithPlanId);

  if (stepsError) throw stepsError;

  return planData_response as AIPlan;
}

export async function getAIPlan(taskId: string) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('ai_plans')
    .select('*, ai_plan_steps(*)')
    .eq('task_id', taskId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data as AIPlan) || null;
}

// === Calendar Events Operations ===
export async function getCalendarEvents(userId: string, startDate?: string, endDate?: string) {
  const supabase = await createServerSupabase();

  let query = supabase.from('calendar_events').select('*').eq('user_id', userId);

  if (startDate) {
    query = query.gte('start_time', startDate);
  }
  if (endDate) {
    query = query.lte('end_time', endDate);
  }

  const { data, error } = await query.order('start_time', { ascending: true });

  if (error) throw error;
  return data as CalendarEvent[];
}

export async function createCalendarEvent(userId: string, eventData: Partial<CalendarEvent>) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      user_id: userId,
      ...eventData,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CalendarEvent;
}

// === AI Schedule Operations ===
export async function getAISchedules(userId: string) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('ai_schedules')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: true });

  if (error) throw error;
  return data as AISchedule[];
}

export async function createAISchedule(userId: string, scheduleData: Partial<AISchedule>) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('ai_schedules')
    .insert({
      user_id: userId,
      ...scheduleData,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AISchedule;
}

// === Daily Briefing Operations ===
export async function getDailyBriefing(userId: string, date: string) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('daily_briefings')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data as DailyBriefing) || null;
}

export async function createDailyBriefing(userId: string, briefingData: Partial<DailyBriefing>) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('daily_briefings')
    .insert({
      user_id: userId,
      ...briefingData,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DailyBriefing;
}

// === Activity Log Operations ===
export async function logActivity(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>
) {
  const supabase = await createServerSupabase();

  const { error } = await supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
  });

  if (error) throw error;
}
