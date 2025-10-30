'use client';

import { useState, useRef, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { VirtualizedMessageList } from './VirtualizedMessageList';
import { Message } from '@/types/chat';
import { generateId } from '@/lib/utils';
import { streamSSE } from '@/lib/sseClient';
import { useChat } from '@/hooks/useChat';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { retry } from '@/lib/retry';
import { ErrorToast } from '@/components/ErrorToast';

export function ChatContainer() {
  const {
    messages,
    addMessage,
    updateMessage,
    removeMessage,
  } = useChat();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; type: 'error' | 'offline' } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const wasOnlineRef = useRef(true);
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (!isOnline && wasOnlineRef.current) {
      setError({
        message: '인터넷 연결이 끊어졌습니다. 연결을 확인해주세요.',
        type: 'offline',
      });
    }

    if (isOnline && !wasOnlineRef.current) {
      setError((prev) => (prev?.type === 'offline' ? null : prev));
    }

    wasOnlineRef.current = isOnline;
  }, [isOnline]);

  const handleSend = async (content: string) => {
    if (!isOnline) {
      setError({
        message: '오프라인 상태에서는 메시지를 보낼 수 없습니다.',
        type: 'offline',
      });
      return;
    }

    setError((prev) => (prev?.type === 'offline' ? prev : null));

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    // Create assistant message placeholder
    const assistantId = generateId();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    addMessage(assistantMessage);

    setIsLoading(true);
    const performRequest = async () => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      updateMessage(assistantId, { content: '', isStreaming: true });

      // Prepare history (최근 10개만 전송)
      const history = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const stream = streamSSE('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history }),
        signal: controller.signal,
      });

      let fullContent = '';

      for await (const chunk of stream) {
        fullContent += chunk.text;
        updateMessage(assistantId, { content: fullContent, isStreaming: true });
      }

      updateMessage(assistantId, { isStreaming: false });
    };

    try {
      await retry(performRequest, {
        maxAttempts: 3,
        backoff: true,
        onRetry: (attempt, err) => {
          console.warn(`[ChatContainer] 재시도 ${attempt}회 실패`, err);
        },
      });
    } catch (err) {
      console.error('[ChatContainer] Error:', err);

      const errorMessage = err instanceof Error ? err.message : '메시지 전송 중 오류가 발생했습니다.';

      if (err instanceof Error && err.name === 'AbortError') {
        setError({
          message: '요청이 취소되었습니다.',
          type: 'error',
        });
      } else {
        setError({
          message: errorMessage,
          type: isOnline ? 'error' : 'offline',
        });
      }

      removeMessage(assistantId);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto overflow-hidden">
      {error && (
        <ErrorToast
          message={error.message}
          type={error.type}
          duration={error.type === 'offline' ? 0 : undefined}
          onDismiss={() =>
            setError((prev) => {
              if (prev?.type === 'offline' && !isOnline) {
                return prev;
              }
              return null;
            })
          }
        />
      )}

      {/* 고정 헤더 */}
      <div className="flex-shrink-0">
        <ChatHeader />
        {!isOnline && (
          <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 text-sm text-yellow-800">
            <WifiOff className="h-4 w-4" />
            <span>오프라인 상태입니다. 연결이 복원되면 자동으로 다시 시도할 수 있습니다.</span>
          </div>
        )}
      </div>

      {/* 스크롤 가능한 메시지 영역 */}
      <div className="flex-1 overflow-hidden">
        <VirtualizedMessageList messages={messages} />
      </div>

      {/* 고정 입력창 */}
      <div className="flex-shrink-0">
        <ChatInput onSend={handleSend} disabled={isLoading || !isOnline} />
      </div>
    </div>
  );
}
