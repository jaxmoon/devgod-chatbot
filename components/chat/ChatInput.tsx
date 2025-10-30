'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { API } from '@/lib/constants';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = memo(function ChatInput({
  onSend,
  disabled = false,
  placeholder = '메시지를 입력하세요...',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Auto-focus when enabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed && !disabled && trimmed.length <= API.MAX_MESSAGE_LENGTH) {
      onSend(trimmed);
      setInput('');
    }
  }, [disabled, input, onSend]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const charCount = input.length;
  const isOverLimit = charCount > API.MAX_MESSAGE_LENGTH;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`w-full resize-none rounded-lg border px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-gray-100 disabled:cursor-not-allowed max-h-32 overflow-y-auto ${
              isOverLimit ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <span
            className={`absolute right-3 bottom-3 text-xs ${
              isOverLimit ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            {charCount}/{API.MAX_MESSAGE_LENGTH}
          </span>
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || !input.trim() || isOverLimit}
          className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 rounded-lg p-3 transition-colors flex-shrink-0 h-12 w-12 flex items-center justify-center"
          aria-label="전송"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});
