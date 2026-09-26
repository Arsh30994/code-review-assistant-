// src/components/chat/message-list.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Loader2, Sparkles, User } from 'lucide-react';
import { ChatMessage } from '@/lib/types';

interface MessageListProps {
  messages: ChatMessage[];
  loading?: boolean;
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border bg-[#0d1117] text-xs font-mono">
      <div className="flex items-center justify-between px-3 py-1.5 bg-background border-b border-border text-[11px] text-gray-400">
        <span className="uppercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 hover:text-white transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-gray-200 leading-relaxed whitespace-pre font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderFormattedContent(text: string) {
  // Simple markdown parser for code fences ```lang\ncode```
  const parts = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim(),
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return (
    <div className="space-y-2">
      {parts.map((p, idx) =>
        p.type === 'code' ? (
          <CodeBlock key={idx} code={p.content} language={p.language} />
        ) : (
          <div key={idx} className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
            {p.content}
          </div>
        ),
      )}
    </div>
  );
}

export function MessageList({ messages, loading }: MessageListProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-3">
        <div className="p-3 rounded-xl bg-primary-600/10 border border-primary-500/20 text-primary-400">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-white">Ask anything about this codebase</h3>
        <p className="text-xs text-gray-400 max-w-sm">
          The AI assistant is grounded in your uploaded project files. Mention files like <code className="text-primary-400 font-mono bg-background px-1.5 py-0.5 rounded border border-border">auth.service.ts</code> or ask for architectural guidance.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {messages.map((message) => {
        const isUser = message.role?.toLowerCase() === 'user';

        return (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                isUser
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface border border-primary-500/30 text-primary-400 shadow-sm'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-4 text-xs sm:text-sm shadow-sm ${
                isUser
                  ? 'bg-primary-600 text-white rounded-tr-none'
                  : 'bg-surface border border-border text-gray-200 rounded-tl-none'
              }`}
            >
              {isUser ? (
                <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
              ) : (
                renderFormattedContent(message.content)
              )}

              <div
                className={`mt-2 text-[10px] ${
                  isUser ? 'text-primary-200 text-right' : 'text-gray-500'
                }`}
              >
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="flex items-start space-x-3">
          <div className="w-7 h-7 rounded-lg bg-surface border border-primary-500/30 text-primary-400 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="bg-surface border border-border rounded-xl rounded-tl-none p-4 text-xs text-gray-400 flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
            <span>Analyzing codebase context & generating response...</span>
          </div>
        </div>
      )}

      <div ref={scrollEndRef} />
    </div>
  );
}
