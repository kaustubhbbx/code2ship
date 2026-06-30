'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import { createClientSupabase } from '@/lib/supabase';
import { UserPreferences } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClientSupabase();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!data) {
          // Create default preferences
          const defaultPrefs = {
            user_id: user.id,
            theme: 'dark',
            notifications_enabled: true,
            daily_briefing_time: '08:00',
            risk_threshold: 70,
            preferred_ai_assistant: 'gemini_live',
          };

          const { data: created } = await supabase.from('user_preferences').insert(defaultPrefs).select().single();

          setPreferences(created);
        } else {
          setPreferences(data);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [supabase, router]);

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update(preferences)
        .eq('user_id', preferences.user_id);

      if (error) throw error;

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save settings');
      console.error('Error:', error);
    } finally {
      setSaving(false);
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
      <h1 className="text-4xl font-bold mb-8">Settings</h1>

      <div className="max-w-2xl">
        <div className="card space-y-6">
          {/* Notifications */}
          <div>
            <label className="label">
              <input
                type="checkbox"
                checked={preferences?.notifications_enabled || false}
                onChange={(e) =>
                  setPreferences({ ...preferences!, notifications_enabled: e.target.checked })
                }
                className="w-4 h-4 mr-2 rounded"
              />
              <span>Enable Notifications</span>
            </label>
            <p className="text-sm text-muted mt-2">
              Receive alerts for high-risk tasks and upcoming deadlines
            </p>
          </div>

          {/* Daily Briefing Time */}
          <div>
            <label htmlFor="briefingTime" className="label">
              Daily Briefing Time
            </label>
            <input
              id="briefingTime"
              type="time"
              value={preferences?.daily_briefing_time || '08:00'}
              onChange={(e) => setPreferences({ ...preferences!, daily_briefing_time: e.target.value })}
              className="input"
            />
            <p className="text-sm text-muted mt-2">When should you receive your morning briefing?</p>
          </div>

          {/* Risk Threshold */}
          <div>
            <label htmlFor="riskThreshold" className="label">
              Risk Alert Threshold: {preferences?.risk_threshold}%
            </label>
            <input
              id="riskThreshold"
              type="range"
              min="0"
              max="100"
              value={preferences?.risk_threshold || 70}
              onChange={(e) => setPreferences({ ...preferences!, risk_threshold: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-sm text-muted mt-2">
              Alert me when task risk exceeds this threshold
            </p>
          </div>

          {/* Theme */}
          <div>
            <label htmlFor="theme" className="label">
              Theme
            </label>
            <select
              id="theme"
              value={preferences?.theme || 'dark'}
              onChange={(e) => setPreferences({ ...preferences!, theme: e.target.value as any })}
              className="input"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          {/* AI Assistant Preference */}
          <div>
            <label htmlFor="aiAssistant" className="label">
              Preferred AI Assistant
            </label>
            <select
              id="aiAssistant"
              value={preferences?.preferred_ai_assistant || 'gemini_live'}
              onChange={(e) =>
                setPreferences({ ...preferences!, preferred_ai_assistant: e.target.value as any })
              }
              className="input"
            >
              <option value="gemini_live">Gemini Live (Voice)</option>
              <option value="gemini_flash">Gemini 3.1 Flash Lite (Fast)</option>
            </select>
            <p className="text-sm text-muted mt-2">Choose your default AI assistant</p>
          </div>

          {/* Save Button */}
          <div>
            {message && (
              <div className={`p-3 rounded-lg mb-4 ${
                message.includes('success')
                  ? 'bg-success/10 text-success border border-success/30'
                  : 'bg-danger/10 text-danger border border-danger/30'
              }`}>
                {message}
              </div>
            )}
            <button onClick={handleSave} className="btn-primary w-full" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
