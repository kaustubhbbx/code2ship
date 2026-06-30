'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import { ExecutiveBriefing } from '@/components/dashboard/executive-briefing';
import { RiskOverview } from '@/components/dashboard/risk-overview';
import { TodaysPriorities } from '@/components/dashboard/todays-priorities';
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines';
import { createClientSupabase } from '@/lib/supabase';
import { Task, RiskScore } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClientSupabase();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [riskScores, setRiskScores] = useState<Record<string, RiskScore>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        setUser(currentUser);

        // Fetch tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('deadline', { ascending: true });

        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        // Fetch risk scores
        if (tasksData && tasksData.length > 0) {
          const taskIds = tasksData.map((t: Task) => t.id);
          const { data: riskData, error: riskError } = await supabase
            .from('risk_scores')
            .select('*')
            .in('task_id', taskIds);

          if (riskError) throw riskError;

          const riskMap = (riskData || []).reduce(
            (acc: Record<string, RiskScore>, risk: RiskScore) => {
              acc[risk.task_id] = risk;
              return acc;
            },
            {}
          );
          setRiskScores(riskMap);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-40 bg-surface rounded-lg" />
          <div className="h-32 bg-surface rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  const highestRiskTask = tasks.reduce((max, task) => {
    const taskRisk = riskScores[task.id];
    const maxRisk = riskScores[max.id];
    if (!taskRisk) return max;
    if (!maxRisk) return task;
    return taskRisk.score > maxRisk.score ? task : max;
  }, tasks[0]);

  const activeCommitments = tasks.filter((t) => t.status !== 'completed').length;
  const recommendedActions = highestRiskTask
    ? riskScores[highestRiskTask.id]?.recommended_actions || []
    : [];

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted mt-2">Welcome back, {user?.user_metadata?.full_name || 'User'}</p>
        </div>
        <Link href="/tasks/new" className="btn-primary">
          + New Task
        </Link>
      </div>

      {/* Executive Briefing */}
      <ExecutiveBriefing
        highestRiskTask={
          highestRiskTask && riskScores[highestRiskTask.id]
            ? {
                title: highestRiskTask.title,
                riskScore: riskScores[highestRiskTask.id].score,
              }
            : undefined
        }
        activeCommitments={activeCommitments}
        recommendedActions={recommendedActions}
      />

      {/* Risk Overview */}
      <RiskOverview tasks={tasks} riskScores={riskScores} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Priorities */}
        <TodaysPriorities tasks={tasks} />

        {/* Upcoming Deadlines */}
        <UpcomingDeadlines tasks={tasks} />
      </div>

      {/* Call to Action for Gemini Live */}
      <div className="mt-8 card bg-gradient-to-r from-primary/10 to-orange-600/10 border-primary/30 text-center p-8">
        <h3 className="text-2xl font-semibold mb-3">Need Help Planning Your Day?</h3>
        <p className="text-muted mb-6">
          Use our AI-powered voice assistant to create tasks, analyze priorities, and build schedules.
        </p>
        <Link href="/assistant" className="btn-primary inline-block">
          Open AI Assistant
        </Link>
      </div>
    </DashboardLayout>
  );
}
