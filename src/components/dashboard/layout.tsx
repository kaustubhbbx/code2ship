'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';
import { createClientSupabase } from '@/lib/supabase';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const supabase = createClientSupabase();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-background font-bold">A</span>
            </div>
            <span className="font-bold text-lg text-text">DURA</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-text hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/tasks" className="text-text hover:text-primary transition-colors">
              Tasks
            </Link>
            <Link href="/calendar" className="text-text hover:text-primary transition-colors">
              Calendar
            </Link>
            <Link href="/briefings" className="text-text hover:text-primary transition-colors">
              Briefings
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/settings" className="text-text hover:text-primary transition-colors">
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="btn-secondary text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
