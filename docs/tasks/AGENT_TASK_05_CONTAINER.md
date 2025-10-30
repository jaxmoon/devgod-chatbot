# Agent Task 05: Container
## 메인 컨테이너 및 스트리밍 로직 구현

**Agent ID:** AGENT_05
**소요 시간:** 1일
**의존성:** AGENT_03, AGENT_04 완료
**다음 Agent:** AGENT_06 (Storage)

---

## 1. Context

### 작업 목표
ChatContainer 컴포넌트를 구현하고 SSE 스트리밍 로직을 통합합니다.

### 관련 요구사항
- FR-001: 메시지 전송
- FR-002: AI 응답 수신 (스트리밍)
- FR-004: 시각적 피드백

---

## 2. Prerequisites

```bash
# AGENT_03, 04 완료 확인
ls app/api/chat/route.ts components/chat/ChatMessage.tsx
# .env.local 확인
grep GEMINI_API_KEY .env.local
```

---

## 3. Task Details

### Step 1: SSE 클라이언트 유틸리티

**`lib/sseClient.ts` 생성:**
```typescript
export interface SSEChunk {
  text: string;
}

export async function* streamSSE(
  url: string,
  options: RequestInit
): AsyncGenerator<SSEChunk, void, unknown> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const chunk: SSEChunk = JSON.parse(data);
            yield chunk;
          } catch (e) {
            console.error('[SSE] Parse error:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

### Step 2: ChatContainer 컴포넌트

**`components/chat/ChatContainer.tsx` 생성:**
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Message } from '@/types/api';
import { generateId } from '@/lib/utils';
import { streamSSE } from '@/lib/sseClient';
import { AlertCircle } from 'lucide-react';

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
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

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Include the pending user message when preparing history
    const baseMessages = [...messages, userMessage];
    setMessages((prev) => [...prev, userMessage]);

    // Create assistant message placeholder
    const assistantId = generateId();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      // Prepare history (exclude current streaming message)
      const history = baseMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Stream response
      const stream = streamSSE('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history }),
        signal: abortControllerRef.current.signal,
      });

      let fullContent = '';

      for await (const chunk of stream) {
        fullContent += chunk.text;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: fullContent, isStreaming: true }
              : msg
          )
        );
      }

      // Mark streaming complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (err: any) {
      console.error('[ChatContainer] Error:', err);

      if (err.name === 'AbortError') {
        setError('요청이 취소되었습니다.');
      } else {
        setError(err.message || '메시지 전송 중 오류가 발생했습니다.');
      }

      // Remove failed assistant message
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
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

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
```

### Step 3: 메인 페이지 통합

**`app/page.tsx` 수정:**
```typescript
import { ChatContainer } from '@/components/chat/ChatContainer';

export default function Home() {
  return <ChatContainer />;
}
```

---

## 4. Verification

```bash
# 1. 타입 체크
npx tsc --noEmit

# 2. 빌드
npm run build

# 3. 개발 서버 시작
npm run dev

# 4. 브라우저 테스트
# http://localhost:3000
# - 메시지 입력 후 전송
# - 스트리밍 응답 확인
# - 에러 발생 시 에러 메시지 표시 확인
```

### 수동 체크리스트
- [ ] 메시지 전송 시 사용자 메시지가 즉시 표시되는가?
- [ ] AI 응답이 실시간으로 스트리밍되는가?
- [ ] 스트리밍 중 커서 애니메이션이 표시되는가?
- [ ] 스트리밍 완료 후 커서가 사라지는가?
- [ ] 에러 발생 시 에러 메시지가 표시되는가?
- [ ] 메시지 목록이 자동으로 스크롤되는가?
- [ ] 대화 히스토리가 API에 올바르게 전달되는가?

---

## 5. Handoff

### 완료 사항
- ✅ SSE 스트리밍 클라이언트 구현
- ✅ ChatContainer 구현
- ✅ 메시지 상태 관리
- ✅ 에러 처리 UI
- ✅ 자동 스크롤
- ✅ 메인 페이지 통합

### AGENT_06을 위한 정보
```typescript
// 현재 메시지 상태
const [messages, setMessages] = useState<Message[]>([]);

// localStorage 통합 시 필요한 작업:
// 1. messages를 localStorage에 세션 단위로 저장
// 2. 컴포넌트 마운트 시 localStorage에서 복원
// 3. 세션 관리 UI 추가 (새 대화, 대화 목록)

// 통합 지점:
// - ChatContainer에서 useChat() hook 사용
// - useChat()이 localStorage 읽기/쓰기 담당
```

**Handoff 문서:** `docs/tasks/handoffs/AGENT_05_HANDOFF.md`

---

**Agent 05 작업 완료 ✅**
