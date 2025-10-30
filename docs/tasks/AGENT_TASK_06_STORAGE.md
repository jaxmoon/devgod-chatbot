# Agent Task 06: Storage & Hook
## localStorage 관리 및 useChat Hook 구현

**Agent ID:** AGENT_06
**소요 시간:** 1일
**의존성:** AGENT_02, AGENT_05 완료
**다음 Agent:** AGENT_07 (Error Handling)

---

## 1. Context

### 작업 목표
localStorage 기반 세션 관리와 useChat 커스텀 hook을 구현합니다.

### 관련 요구사항
- FR-005: 대화 히스토리 저장 (localStorage)
- FR-006: 새 대화 시작
- NFR-004: 데이터 영속성 (페이지 새로고침)

---

## 2. Prerequisites

```bash
# AGENT_02, 05 완료 확인
ls types/api.ts components/chat/ChatContainer.tsx
```

---

## 3. Task Details

### Step 1: Storage 유틸리티

**`lib/storage.ts` 생성:**
```typescript
import { ChatSession, Message } from '@/types/api';
import { generateId } from './utils';

const STORAGE_KEYS = {
  SESSIONS: 'chat_sessions',
  CURRENT_SESSION: 'current_session_id',
  SETTINGS: 'chat_settings',
} as const;

const MAX_SESSIONS = 20;

export const storage = {
  /**
   * getSessions
   * 모든 세션 목록 가져오기
   */
  getSessions(): ChatSession[] {
    if (typeof window === 'undefined') return [];

    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[Storage] Failed to get sessions:', error);
      return [];
    }
  },

  /**
   * getSession
   * 특정 세션 가져오기
   */
  getSession(sessionId: string): ChatSession | null {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === sessionId) || null;
  },

  /**
   * saveSession
   * 세션 저장 (생성 또는 업데이트)
   */
  saveSession(session: ChatSession): void {
    if (typeof window === 'undefined') return;

    try {
      let sessions = this.getSessions();

      // Update existing or add new
      const index = sessions.findIndex((s) => s.id === session.id);
      if (index >= 0) {
        sessions[index] = session;
      } else {
        sessions.unshift(session);
      }

      // Limit sessions
      if (sessions.length > MAX_SESSIONS) {
        sessions = sessions.slice(0, MAX_SESSIONS);
      }

      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('[Storage] Failed to save session:', error);

      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupOldSessions(5);
        // Retry
        try {
          localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([session]));
        } catch (retryError) {
          console.error('[Storage] Retry failed:', retryError);
        }
      }
    }
  },

  /**
   * deleteSession
   * 세션 삭제
   */
  deleteSession(sessionId: string): void {
    if (typeof window === 'undefined') return;

    try {
      const sessions = this.getSessions().filter((s) => s.id !== sessionId);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

      // Clear current session if deleted
      if (this.getCurrentSessionId() === sessionId) {
        this.setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('[Storage] Failed to delete session:', error);
    }
  },

  /**
   * createSession
   * 새 세션 생성
   */
  createSession(): ChatSession {
    const session: ChatSession = {
      id: generateId(),
      title: '새 대화',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.saveSession(session);
    this.setCurrentSessionId(session.id);

    return session;
  },

  /**
   * getCurrentSessionId
   * 현재 활성 세션 ID
   */
  getCurrentSessionId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  },

  /**
   * setCurrentSessionId
   * 현재 세션 설정
   */
  setCurrentSessionId(sessionId: string | null): void {
    if (typeof window === 'undefined') return;

    if (sessionId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }
  },

  /**
   * cleanupOldSessions
   * 오래된 세션 정리
   */
  cleanupOldSessions(keepCount: number): void {
    if (typeof window === 'undefined') return;

    const sessions = this.getSessions()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, keepCount);

    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  /**
   * updateSessionTitle
   * 세션 제목 업데이트 (첫 메시지 기반)
   */
  updateSessionTitle(sessionId: string, messages: Message[]): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    const firstUserMessage = messages.find((m) => m.role === 'user');
    if (firstUserMessage && session.title === '새 대화') {
      session.title = firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
      session.updatedAt = Date.now();
      this.saveSession(session);
    }
  },
};
```

### Step 2: useChat Hook

**`hooks/useChat.ts` 생성:**
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message, ChatSession } from '@/types/api';
import { storage } from '@/lib/storage';
import { generateId } from '@/lib/utils';

export function useChat() {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Initialize
  useEffect(() => {
    const sessionId = storage.getCurrentSessionId();
    const allSessions = storage.getSessions();
    setSessions(allSessions);

    if (sessionId) {
      const session = storage.getSession(sessionId);
      if (session) {
        setCurrentSession(session);
        setMessages(session.messages);
        return;
      }
    }

    // No current session, create new one
    const newSession = storage.createSession();
    setCurrentSession(newSession);
    setMessages([]);
    setSessions([newSession, ...allSessions]);
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (!currentSession) return;

    const session: ChatSession = {
      ...currentSession,
      messages,
      updatedAt: Date.now(),
    };

    storage.saveSession(session);
    storage.updateSessionTitle(currentSession.id, messages);

    // Update sessions list
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? session : s))
    );
  }, [messages, currentSession]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const createNewSession = useCallback(() => {
    const newSession = storage.createSession();
    setCurrentSession(newSession);
    setMessages([]);
    setSessions((prev) => [newSession, ...prev]);
  }, []);

  const switchSession = useCallback((sessionId: string) => {
    const session = storage.getSession(sessionId);
    if (session) {
      setCurrentSession(session);
      setMessages(session.messages);
      storage.setCurrentSessionId(sessionId);
    }
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    storage.deleteSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    if (currentSession?.id === sessionId) {
      const newSession = storage.createSession();
      setCurrentSession(newSession);
      setMessages([]);
      setSessions((prev) => [newSession, ...prev]);
    }
  }, [currentSession]);

  return {
    currentSession,
    messages,
    sessions,
    addMessage,
    updateMessage,
    removeMessage,
    createNewSession,
    switchSession,
    deleteSession,
  };
}
```

### Step 3: ChatContainer 통합

**`components/chat/ChatContainer.tsx` 업데이트:**
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Message } from '@/types/api';
import { generateId } from '@/lib/utils';
import { streamSSE } from '@/lib/sseClient';
import { useChat } from '@/hooks/useChat';
import { AlertCircle } from 'lucide-react';

export function ChatContainer() {
  const {
    messages,
    addMessage,
    updateMessage,
    removeMessage,
  } = useChat();

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
        updateMessage(assistantId, { content: fullContent, isStreaming: true });
      }

      // Mark streaming complete
      updateMessage(assistantId, { isStreaming: false });
    } catch (err: any) {
      console.error('[ChatContainer] Error:', err);

      if (err.name === 'AbortError') {
        setError('요청이 취소되었습니다.');
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

---

## 4. Verification

```bash
# 1. 타입 체크
npx tsc --noEmit

# 2. 빌드
npm run build

# 3. 개발 서버
npm run dev

# 4. 브라우저 테스트
# - 메시지 전송 후 localStorage 확인 (DevTools > Application > Local Storage)
# - 페이지 새로고침 후 메시지 복원 확인
# - 새 대화 생성 후 세션 전환 확인
```

### 수동 체크리스트
- [ ] 메시지가 localStorage에 저장되는가?
- [ ] 페이지 새로고침 시 메시지가 복원되는가?
- [ ] 세션 제목이 첫 메시지로 자동 업데이트되는가?
- [ ] 20개 이상 세션 생성 시 오래된 세션이 삭제되는가?
- [ ] localStorage quota 초과 시 정리 로직이 작동하는가?

---

## 5. Handoff

### 완료 사항
- ✅ localStorage 관리 유틸리티
- ✅ useChat hook 구현
- ✅ 세션 관리 (생성, 전환, 삭제)
- ✅ ChatContainer 통합
- ✅ Quota 관리

### AGENT_07을 위한 정보
```typescript
// 에러 처리 통합 지점:
// 1. storage.ts에서 QuotaExceededError 처리
// 2. useChat에서 에러 상태 추가
// 3. ChatContainer에서 에러 바운더리 적용
```

**Handoff 문서:** `docs/tasks/handoffs/AGENT_06_HANDOFF.md`

---

**Agent 06 작업 완료 ✅**
