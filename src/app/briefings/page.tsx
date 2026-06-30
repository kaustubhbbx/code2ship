'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import { createClientSupabase } from '@/lib/supabase';
import { DailyBriefing } from '@/types';
import Link from 'next/link';

export default function BriefingsPage() {
  const router = useRouter();
  const supabase = createClientSupabase();
  const [briefings, setBriefings] = useState<DailyBriefing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBriefings = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data, error } = await supabase
          .from('daily_briefings')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(30);

        if (error) throw error;
        setBriefings(data || []);
      } catch (error) {
        console.error('Error loading briefings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBriefings();
  }, [supabase, router]);

  const handleGenerateTodaysBriefing = async () => {
    try {
      const response = await fetch('/api/ai/generate-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date() }),
      });

      if (!response.ok) throw new Error('Failed to generate briefing');

      const data = await response.json();
      setBriefings([data.data, ...briefings]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-screen bg-surface rounded-lg animate-pulse" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Executive Briefings</h1>
        <button onClick={handleGenerateTodaysBriefing} className="btn-primary">
          Generate Today's Briefing
        </button>
      </div>

      {briefings.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-muted text-lg mb-4">No briefings yet</p>
          <button onClick={handleGenerateTodaysBriefing} className="btn-primary">
            Create Your First Briefing
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {briefings.map((briefing) => (
            <div key={briefing.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted mb-1">
                    {new Date(briefing.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <h3 className="text-2xl font-bold">Daily Executive Briefing</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">Active Commitments</p>
                  <p className="text-3xl font-bold text-primary">{briefing.active_commitments}</p>
                </div>
              </div>

              <div className="p-4 bg-surface rounded-lg mb-6">
                <p className="text-text whitespace-pre-wrap">{briefing.summary}</p>
              </div>

              {briefing.recommended_actions && briefing.recommended_actions.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted mb-3">Recommended Actions:</p>
                  <ul className="space-y-2">
                    {briefing.recommended_actions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className="text-primary flex-shrink-0">→</span>
                        <span className="text-text">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {briefing.highest_risk_task_id && (
                <div className="mt-6 pt-6 border-t border-card">
                  <p className="text-xs text-muted mb-2">Highest Risk Task</p>
                  <Link
                    href={`/tasks/${briefing.highest_risk_task_id}`}
                    className="text-primary hover:underline font-semibold"
                  >
                    View Task
                  </Link>
                  {briefing.highest_risk_score && (
                    <p className="text-sm text-muted mt-1">Risk Score: {briefing.highest_risk_score}%</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
