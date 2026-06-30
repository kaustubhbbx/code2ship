'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClientSupabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AssistantOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const supabase = createClientSupabase();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dura_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        setMessages([
          {
            role: 'assistant',
            content: "Hi! I'm DURA, your AI Executive Assistant. Ask me anything or tell me to schedule a task!",
          },
        ]);
      }
    } else {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm DURA, your AI Executive Assistant. Ask me anything or tell me to schedule a task!",
        },
      ]);
    }
  }, []);

  // Save chat history to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('dura_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Fetch tasks for matching links
  useEffect(() => {
    const fetchTasks = async () => {
      const { data } = await supabase.from('tasks').select('*');
      if (data) setTasks(data);
    };
    if (isOpen) {
      fetchTasks();
    }
  }, [supabase, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
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
      let responseText = data.data.content;
      let taskToCreate = null;

      // Extract CREATE_TASK_CMD
      const cmdIndex = responseText.indexOf('[CREATE_TASK_CMD]');
      if (cmdIndex !== -1) {
        const cmdBlock = responseText.substring(cmdIndex + '[CREATE_TASK_CMD]'.length).trim();
        responseText = responseText.substring(0, cmdIndex).trim();

        try {
          taskToCreate = JSON.parse(cmdBlock);
        } catch (err) {
          console.error('Failed to parse task JSON:', err);
        }
      }

      if (taskToCreate) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { error: insertError, data: createdTask } = await supabase
            .from('tasks')
            .insert({
              user_id: userData.user.id,
              title: taskToCreate.title,
              description: taskToCreate.description || '',
              category: taskToCreate.category || 'other',
              deadline: taskToCreate.deadline || new Date().toISOString(),
              estimated_duration: taskToCreate.estimated_duration || 60,
              complexity: taskToCreate.complexity || 5,
              urgency: taskToCreate.urgency || 50,
              status: 'pending',
              priority: 'medium',
            })
            .select()
            .single();

          if (insertError) {
            console.error('Failed to insert task:', insertError);
            responseText += '\n\n*(Error: Failed to auto-create this task in your database)*';
          } else {
            responseText += `\n\n✅ **Created task: "${createdTask.title}"** (Click [here](/tasks/${createdTask.id}) to view details).`;
          }
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error('Overlay chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I encountered an error. Please try again.' },
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
      // 1. Parse markdown headers (like ### Header or ## Header)
      const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const textVal = headerMatch[2];
        const headingClass = level === 1 ? 'text-sm font-extrabold' : level === 2 ? 'text-xs font-bold' : 'text-xs font-semibold';
        return (
          <div key={lineIdx} className={`${headingClass} text-text mt-2 mb-0.5 border-l-2 border-primary pl-1.5`}>
            {textVal}
          </div>
        );
      }

      // 2. Detect list item
      const listMatch = line.match(/^\s*[-\*]\s+(.*)$/);
      const isListItem = !!listMatch;
      let content = isListItem ? listMatch[1] : line;

      let parts: (string | React.ReactNode)[] = [content];

      // 3. Scan and replace exact task titles with links
      if (tasks.length > 0) {
        const sortedTasks = [...tasks].sort((a, b) => b.title.length - a.title.length);

        sortedTasks.forEach((task) => {
          const titleEscaped = task.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
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

      // 4. Scan and convert bold markers **text** into strong tags
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

      // 5. Scan and convert dates/times/deadlines into styled accent badges
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
              className="px-1 py-0.5 mx-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-semibold text-primary"
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
          <li key={lineIdx} className="ml-3 list-disc text-muted pl-0.5 mb-0.5">
            {parts}
          </li>
        );
      }

      return (
        <p key={lineIdx} className="min-h-[0.8rem]">
          {parts}
        </p>
      );
    });
  };

  const handleClearHistory = () => {
    localStorage.removeItem('dura_chat_history');
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I'm DURA, your AI Executive Assistant. Ask me anything or tell me to schedule a task!",
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window Overlay */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-card border border-surface rounded-xl shadow-2xl flex flex-col mb-4 overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="px-4 py-3 bg-surface border-b border-surface flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-background font-bold text-xs">D</span>
              </div>
              <span className="font-bold text-sm text-text">DURA Assistant</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleClearHistory}
                title="Clear Chat History"
                className="text-xs text-muted hover:text-primary transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-text text-lg font-semibold px-1"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-background">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-xs ${
                    message.role === 'user'
                      ? 'bg-primary text-background'
                      : 'bg-card border border-surface leading-relaxed'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="space-y-1">
                      {formatText(message.content)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-surface px-3 py-2 rounded-lg">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-surface bg-surface flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask DURA to create a task..."
              className="input text-xs py-1.5 flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              className="btn-primary text-xs px-3 py-1.5"
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary text-background rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-all duration-200 active:scale-95 group relative"
      >
        {isOpen ? (
          <span className="text-xl font-bold">✕</span>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-xs font-black tracking-widest leading-none">DURA</span>
            <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-background animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}
