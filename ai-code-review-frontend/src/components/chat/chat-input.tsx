// src/components/chat/chat-input.tsx
'use client';

import { useState } from 'react';
import { ArrowUp, CornerDownLeft, Loader2, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  'Explain the overall architecture and data flow',
  'Find security vulnerabilities or sensitive data leaks',
  'How can I optimize performance or query bottlenecks?',
  'Suggest unit test cases for core services',
];

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || disabled) return;

    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 bg-surface border-t border-border space-y-3">
      {/* Quick Prompt Suggestions */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] text-gray-500 flex items-center space-x-1 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-primary-400" />
          <span>Quick:</span>
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => {
              setInput(prompt);
            }}
            className="px-2.5 py-1 rounded-full bg-background hover:bg-surface-hover border border-border text-[11px] text-gray-300 hover:text-white transition flex-shrink-0 truncate max-w-xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="relative flex items-end">
        <textarea
          rows={2}
          value={input}
          disabled={disabled}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this codebase... (Enter to send, Shift+Enter for newline)"
          className="w-full pl-4 pr-12 py-3 rounded-xl bg-background border border-border focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-xs sm:text-sm text-white placeholder-gray-500 outline-none transition resize-none leading-relaxed"
        />

        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="absolute right-2.5 bottom-2.5 p-2 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:hover:bg-primary-600 text-white transition flex items-center justify-center shadow-md shadow-primary-600/20"
        >
          {disabled ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
