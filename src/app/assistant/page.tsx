'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/layout';
import { createClientSupabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const router = useRouter();
  const supabase = createClientSupabase();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Good morning! I'm your AI Executive Assistant. I'm here to help you manage your commitments, analyze priorities, and create actionable plans. What can I help you with today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [supabase, router]);

  // Fetch tasks for matching links in assistant replies
  useEffect(() => {
    const fetchTasks = async () => {
      const { data } = await supabase.from('tasks').select('*');
      if (data) setTasks(data);
    };
    fetchTasks();
  }, [supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.data]);
      
      // Refresh tasks in case new ones were added
      const { data: updatedTasks } = await supabase.from('tasks').select('*');
      if (updatedTasks) setTasks(updatedTasks);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper using regular expressions to format message text effectively
  const formatText = (text: string) => {
    if (!text) return '';

    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      // 1. Detect list item
      const listMatch = line.match(/^\s*[-\*]\s+(.*)$/);
      const isListItem = !!listMatch;
      let content = isListItem ? listMatch[1] : line;

      let parts: (string | React.ReactNode)[] = [content];

      // 2. Scan and replace exact task titles with links
      if (tasks.length > 0) {
        // Sort tasks by length to prevent partial matching conflicts
        const sortedTasks = [...tasks].sort((a, b) => b.title.length - a.title.length);

        sortedTasks.forEach((task) => {
          const titleEscaped = task.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          // Match either "Title", **Title**, or Title (word boundaries)
          const regex = new RegExp(`("(${titleEscaped})")|(\\*\\*(${titleEscaped})\\*\\*)`, 'gi');

          parts = parts.flatMap((part) => {
            if (typeof part !== 'string') return [part];

            const result: (string | React.ReactNode)[] = [];
            let lastIndex = 0;
            let match;

            regex.lastIndex = 0;
            while ((match = regex.exec(part)) !== null) {
              const matchIndex = match.index;
              const matchedText = match[0];

              if (matchIndex > lastIndex) {
                result.push(part.substring(lastIndex, matchIndex));
              }

              result.push(
                <Link
                  key={`${task.id}-${matchIndex}`}
                  href={`/tasks/${task.id}`}
                  className="text-primary font-bold hover:underline underline-offset-4 cursor-pointer"
                >
                  {matchedText.replace(/[\*"]/g, '')}
                </Link>
              );

              lastIndex = regex.lastIndex;
            }

            if (lastIndex < part.length) {
              result.push(part.substring(lastIndex));
            }

            return result;
          });
        });
      }

      // 3. Scan and convert bold markers **text** into strong tags
      parts = parts.flatMap((part) => {
        if (typeof part !== 'string') return [part];

        const boldRegex = /\*\*(.*?)\*\*/g;
        const result: (string | React.ReactNode)[] = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(part)) !== null) {
          const matchIndex = match.index;
          if (matchIndex > lastIndex) {
            result.push(part.substring(lastIndex, matchIndex));
          }
          result.push(
            <strong key={matchIndex} className="font-bold text-text">
              {match[1]}
            </strong>
          );
          lastIndex = boldRegex.lastIndex;
        }

        if (lastIndex < part.length) {
          result.push(part.substring(lastIndex));
        }
        return result;
      });

      // 4. Scan and convert dates/times/deadlines into styled accent badges
      const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)|tomorrow|today|yesterday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/g;

      parts = parts.flatMap((part) => {
        if (typeof part !== 'string') return [part];

        const result: (string | React.ReactNode)[] = [];
        let lastIndex = 0;
        let match;

        while ((match = dateRegex.exec(part)) !== null) {
          const matchIndex = match.index;
          if (matchIndex > lastIndex) {
            result.push(part.substring(lastIndex, matchIndex));
          }
          result.push(
            <span
              key={matchIndex}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-primary/10 border border-primary/20 text-xs font-semibold text-primary"
            >
              {match[1]}
            </span>
          );
          lastIndex = dateRegex.lastIndex;
        }

        if (lastIndex < part.length) {
          result.push(part.substring(lastIndex));
        }
        return result;
      });

      if (isListItem) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-muted pl-1 mb-1">
            {parts}
          </li>
        );
      }

      return (
        <p key={lineIdx} className="min-h-[1rem]">
          {parts}
        </p>
      );
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-[80vh] flex flex-col">
        <h1 className="text-3xl font-bold mb-6">AI Executive Assistant</h1>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4 bg-surface rounded-lg p-6">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-background'
                    : 'bg-card border border-surface'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="text-sm space-y-1.5 leading-relaxed">
                    {formatText(message.content)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-surface px-4 py-3 rounded-lg">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your tasks, deadlines, or priorities..."
            className="input flex-1"
            disabled={loading}
          />
          <button type="submit" className="btn-primary px-6" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>

        {/* Help Text */}
        <p className="text-xs text-muted mt-4 text-center">
          I can help you analyze priorities, create execution plans, suggest schedules, and answer productivity questions.
        </p>
      </div>
    </DashboardLayout>
  );
}
