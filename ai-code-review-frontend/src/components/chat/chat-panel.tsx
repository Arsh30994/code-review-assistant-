// src/components/chat/chat-panel.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Database,
  FileCode,
  Info,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ChatMessage, ChatSession, Project } from '@/lib/types';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';

interface ChatPanelProps {
  project: Project;
}

export function ChatPanel({ project }: ChatPanelProps) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileCount = project.files?.length ?? 0;

  // 1. Initialize or load existing chat session for this project
  const initSession = async () => {
    setLoadingSession(true);
    setError(null);

    try {
      // Find sessions for user and check if one exists for this project
      const allSessions = await apiClient<ChatSession[]>('/chat/sessions');
      const existing = allSessions.find((s) => s.projectId === project.id);

      if (existing) {
        // Load messages
        const fullSession = await apiClient<ChatSession>(`/chat/sessions/${existing.id}`);
        setSession(fullSession);
        setMessages(fullSession.messages || []);
      } else {
        // Create new session
        const newSession = await apiClient<ChatSession>('/chat/sessions', {
          method: 'POST',
          body: JSON.stringify({
            projectId: project.id,
            title: `${project.name} Chat`,
          }),
        });
        setSession(newSession);
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize chat session.');
    } finally {
      setLoadingSession(false);
    }
  };

  const handleCreateNewSession = async () => {
    setLoadingSession(true);
    try {
      const newSession = await apiClient<ChatSession>('/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project.id,
          title: `${project.name} Chat`,
        }),
      });
      setSession(newSession);
      setMessages([]);
    } catch (err: any) {
      setError(err.message || 'Failed to create new session.');
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    if (project.id) {
      initSession();
    }
  }, [project.id]);

  // 2. Send message handler
  const handleSendMessage = async (content: string) => {
    if (!session) return;

    setSendingMessage(true);
    setError(null);

    // Optimistically add user message to UI
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await apiClient<{ userMessage: ChatMessage; assistantMessage: ChatMessage }>(
        `/chat/sessions/${session.id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content }),
        },
      );

      // Update message list with persisted records
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        result.userMessage,
        result.assistantMessage,
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
      // Remove optimistic message if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex flex-col h-[750px] bg-surface border border-border rounded-xl overflow-hidden shadow-xl">
      {/* Chat Top Header */}
      <div className="px-5 py-3.5 bg-background/80 border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary-600/10 border border-primary-500/20 text-primary-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-tight">AI Pair Programmer</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live
              </span>
            </div>

            {/* Context Indicator */}
            <div className="flex items-center space-x-1.5 text-[11px] text-gray-400 mt-0.5">
              <Database className="w-3 h-3 text-primary-400" />
              <span>
                Using <span className="text-white font-medium">{fileCount}</span> project files as RAG context
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCreateNewSession}
            disabled={loadingSession || sendingMessage}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-xs text-gray-300 hover:text-white transition disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-gray-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Message List or Loading View */}
      {loadingSession ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <p className="text-xs">Loading chat context...</p>
        </div>
      ) : (
        <MessageList messages={messages} loading={sendingMessage} />
      )}

      {/* Bottom Message Input */}
      <ChatInput onSend={handleSendMessage} disabled={loadingSession || sendingMessage} />
    </div>
  );
}
