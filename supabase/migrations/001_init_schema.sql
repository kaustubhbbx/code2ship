-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgrest";

-- === Users Table (extends auth.users) ===
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- === Tasks Table ===
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('work', 'personal', 'health', 'financial', 'learning', 'other')),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_duration INTEGER NOT NULL CHECK (estimated_duration >= 5 AND estimated_duration <= 480),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  urgency INTEGER NOT NULL DEFAULT 50 CHECK (urgency >= 0 AND urgency <= 100),
  complexity INTEGER NOT NULL DEFAULT 5 CHECK (complexity >= 1 AND complexity <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- === Risk Scores Table ===
CREATE TABLE IF NOT EXISTS public.risk_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL UNIQUE REFERENCES public.tasks(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  recommended_actions TEXT[] DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- === AI Plan Steps Table ===
CREATE TABLE IF NOT EXISTS public.ai_plan_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  estimated_duration INTEGER NOT NULL CHECK (estimated_duration >= 5),
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- === AI Plans Table ===
CREATE TABLE IF NOT EXISTS public.ai_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL UNIQUE REFERENCES public.tasks(id) ON DELETE CASCADE,
  total_duration INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add foreign key for plan_steps after plans table is created
ALTER TABLE ONLY public.ai_plan_steps
  ADD CONSTRAINT ai_plan_steps_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.ai_plans(id) ON DELETE CASCADE;

-- === Calendar Events Table ===
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- === AI Schedules Table ===
CREATE TABLE IF NOT EXISTS public.ai_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- === Daily Briefings Table ===
CREATE TABLE IF NOT EXISTS public.daily_briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  summary TEXT NOT NULL,
  active_commitments INTEGER NOT NULL,
  highest_risk_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  highest_risk_score INTEGER,
  recommended_actions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, date)
);

-- === Activity Logs Table ===
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- === User Preferences Table ===
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  notifications_enabled BOOLEAN DEFAULT true,
  daily_briefing_time TIME NOT NULL DEFAULT '08:00:00',
  risk_threshold INTEGER NOT NULL DEFAULT 70 CHECK (risk_threshold >= 0 AND risk_threshold <= 100),
  preferred_ai_assistant TEXT NOT NULL DEFAULT 'gemini_live' CHECK (preferred_ai_assistant IN ('gemini_live', 'gemini_flash')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- === Indexes for performance ===
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_risk_scores_task_id ON public.risk_scores(task_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_schedules_user_id ON public.ai_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_briefings_user_id ON public.daily_briefings(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_briefings_date ON public.daily_briefings(date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);

-- === Row Level Security (RLS) ===
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- === RLS Policies ===

-- Users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Tasks table
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Risk Scores table
CREATE POLICY "Users can view risk scores for their tasks" ON public.risk_scores
  FOR SELECT USING (
    task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert risk scores for their tasks" ON public.risk_scores
  FOR INSERT WITH CHECK (
    task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
  );

-- AI Plans table
CREATE POLICY "Users can view plans for their tasks" ON public.ai_plans
  FOR SELECT USING (
    task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert plans for their tasks" ON public.ai_plans
  FOR INSERT WITH CHECK (
    task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
  );

-- AI Plan Steps table
CREATE POLICY "Users can view plan steps" ON public.ai_plan_steps
  FOR SELECT USING (
    plan_id IN (SELECT id FROM public.ai_plans WHERE task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid()))
  );

-- Calendar Events table
CREATE POLICY "Users can view their own calendar events" ON public.calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar events" ON public.calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" ON public.calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" ON public.calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- AI Schedules table
CREATE POLICY "Users can view their own schedules" ON public.ai_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules" ON public.ai_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" ON public.ai_schedules
  FOR UPDATE USING (auth.uid() = user_id);

-- Daily Briefings table
CREATE POLICY "Users can view their own briefings" ON public.daily_briefings
  FOR SELECT USING (auth.uid() = user_id);

-- Activity Logs table
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- User Preferences table
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- === User Synchronization Trigger ===

-- Create a trigger function that runs on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users with fallbacks for null values
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);

  -- Insert default user preferences, generating a secure UUID v4 natively
  INSERT INTO public.user_preferences (id, user_id, theme, notifications_enabled, daily_briefing_time, risk_threshold, preferred_ai_assistant)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    'dark',
    true,
    '08:00:00',
    70,
    'gemini_live'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
