# Agent Task 07: Error Handling
## 에러 처리 및 복구 메커니즘 구현

**Agent ID:** AGENT_07
**소요 시간:** 1일
**의존성:** AGENT_05, AGENT_06 완료
**다음 Agent:** AGENT_08 (Unit Tests)

---

## 1. Context

### 작업 목표
포괄적인 에러 처리, ErrorBoundary, 오프라인 감지, 재시도 로직을 구현합니다.

### 관련 요구사항
- NFR-001: 에러 처리
- NFR-005: 오프라인 모드
- FR-004: 시각적 피드백

---

## 2. Prerequisites

```bash
# AGENT_05, 06 완료 확인
ls components/chat/ChatContainer.tsx hooks/useChat.ts
```

---

## 3. Task Details

### Step 1: ErrorBoundary 컴포넌트

**`components/ErrorBoundary.tsx` 생성:**
```typescript
'use client';

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center max-w-md p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              오류가 발생했습니다
            </h1>
            <p className="text-gray-600 mb-6">
              예기치 않은 오류가 발생했습니다. 페이지를 새로고침해주세요.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              페이지 새로고침
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  에러 상세 정보
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Step 2: 네트워크 상태 Hook

**`hooks/useNetworkStatus.ts` 생성:**
```typescript
'use client';

import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
```

### Step 3: 재시도 유틸리티

**`lib/retry.ts` 생성:**
```typescript
export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (400-499)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (attempt < maxAttempts) {
        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        onRetry?.(attempt, error);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}
```

### Step 4: 에러 토스트 컴포넌트

**`components/ErrorToast.tsx` 생성:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X, WifiOff } from 'lucide-react';

interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
  type?: 'error' | 'offline';
}

export function ErrorToast({
  message,
  onDismiss,
  duration = 5000,
  type = 'error',
}: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);

      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300);
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm bg-white border-l-4 rounded-lg shadow-lg p-4 transition-all duration-300 z-50 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${
        type === 'offline'
          ? 'border-orange-500'
          : 'border-red-500'
      }`}
    >
      <div className="flex items-start gap-3">
        {type === 'offline' ? (
          <WifiOff className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {type === 'offline' ? '오프라인 모드' : '오류 발생'}
          </p>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

### Step 5: ChatContainer 업데이트

**`components/chat/ChatContainer.tsx`에 통합:**
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ErrorToast } from '../ErrorToast';
import { Message } from '@/types/api';
import { generateId } from '@/lib/utils';
import { streamSSE } from '@/lib/sseClient';
import { useChat } from '@/hooks/useChat';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { retry } from '@/lib/retry';
import { AlertCircle, WifiOff } from 'lucide-react';

export function ChatContainer() {
  const {
    messages,
    addMessage,
    updateMessage,
    removeMessage,
  } = useChat();

  const { isOnline } = useNetworkStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string) => {
    setError(null);

    // Check online status
    if (!isOnline) {
      setError('인터넷 연결이 끊어졌습니다. 연결을 확인해주세요.');
      return;
    }

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
    abortControllerRef.current = new AbortController();

    try {
      // Prepare history
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Stream response with retry
      await retry(
        async () => {
          const stream = streamSSE('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: content, history }),
            signal: abortControllerRef.current!.signal,
          });

          let fullContent = '';

          for await (const chunk of stream) {
            fullContent += chunk.text;
            updateMessage(assistantId, { content: fullContent, isStreaming: true });
          }

          // Mark streaming complete
          updateMessage(assistantId, { isStreaming: false });
        },
        {
          maxAttempts: 3,
          delay: 1000,
          backoff: true,
          onRetry: (attempt, error) => {
            console.log(`[ChatContainer] Retry attempt ${attempt}:`, error);
          },
        }
      );
    } catch (err: any) {
      console.error('[ChatContainer] Error:', err);

      if (err.name === 'AbortError') {
        setError('요청이 취소되었습니다.');
      } else if (!isOnline) {
        setError('인터넷 연결이 끊어졌습니다.');
      } else {
        setError(err.message || '메시지 전송 중 오류가 발생했습니다.');
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
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <ChatHeader />

      {!isOnline && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-orange-600" />
          <p className="text-sm text-orange-700">
            오프라인 모드입니다. 메시지를 전송하려면 인터넷에 연결하세요.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 bg-[#B2C7D9]">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 mt-8">
            <p className="text-lg font-semibold">안녕하세요! 개발의신입니다.</p>
            <p className="text-sm mt-2">소프트웨어 개발에 대해 무엇이든 물어보세요.</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={isLoading || !isOnline} />

      <ErrorToast
        message={error}
        onDismiss={() => setError(null)}
        type={isOnline ? 'error' : 'offline'}
      />
    </div>
  );
}
```

### Step 6: 메인 레이아웃 업데이트

**`app/layout.tsx` 수정:**
```typescript
import type { Metadata } from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: '개발의신 - AI 챗봇',
  description: '소프트웨어 개발 Q&A 챗봇',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
```

---

## 4. Verification

```bash
# 1. 타입 체크
npx tsc --noEmit

# 2. 빌드
npm run build

# 3. 개발 서버
npm run dev

# 4. 테스트
# - DevTools > Network > Offline 모드로 전환
# - 메시지 전송 시 오프라인 경고 확인
# - 온라인 복구 후 메시지 전송 확인
# - 컴포넌트 에러 발생 시 ErrorBoundary 확인
```

### 수동 체크리스트
- [ ] 오프라인 시 경고 배너가 표시되는가?
- [ ] 오프라인 시 입력이 비활성화되는가?
- [ ] 에러 발생 시 토스트가 표시되는가?
- [ ] 재시도 로직이 작동하는가?
- [ ] ErrorBoundary가 크래시를 잡는가?
- [ ] 5초 후 토스트가 자동으로 사라지는가?

---

## 5. Handoff

### 완료 사항
- ✅ ErrorBoundary 구현
- ✅ 네트워크 상태 감지
- ✅ 재시도 로직
- ✅ 에러 토스트
- ✅ 오프라인 모드 UI
- ✅ ChatContainer 통합

### AGENT_08을 위한 정보
```typescript
// 테스트 대상:
// 1. ErrorBoundary: 에러 발생 시 fallback UI
// 2. useNetworkStatus: online/offline 이벤트 처리
// 3. retry(): 재시도 로직, backoff
// 4. ErrorToast: 자동 닫힘, 타입별 아이콘
// 5. ChatContainer: 오프라인 시 비활성화
```

**Handoff 문서:** `docs/tasks/handoffs/AGENT_07_HANDOFF.md`

---

**Agent 07 작업 완료 ✅**
