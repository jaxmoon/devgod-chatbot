# Error Recovery Strategy
## 개발의신 챗봇 에러 복구 전략

**문서 버전:** 1.0
**작성일:** 2025-01-30
**프로젝트:** 개발의신 - Gemini API 기반 개발 Q&A 챗봇

---

## 1. 에러 분류

### 1.1 에러 카테고리

| 카테고리 | 심각도 | 사용자 영향 | 복구 가능성 |
|---------|-------|-----------|-----------|
| **Network Errors** | High | 서비스 불가 | Auto-retry |
| **API Errors** | High | 일부 기능 불가 | Manual retry |
| **Storage Errors** | Medium | 히스토리 손실 | Cleanup + retry |
| **UI Errors** | Low | 화면 일부 깨짐 | Component reload |
| **Validation Errors** | Low | 입력 거부 | User fix |

---

## 2. Network Errors

### 2.1 Offline Detection

**시나리오:** 사용자의 네트워크 연결이 끊어진 경우

#### Detection
```typescript
// hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

#### UI Response
```typescript
// components/ui/OfflineBanner.tsx
export function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;

  return (
    <div className="bg-red-500 text-white px-4 py-2 text-center text-sm">
      ⚠️ 인터넷 연결이 끊어졌습니다. 연결을 확인해주세요.
    </div>
  );
}
```

#### Recovery Strategy
1. **Detection:** `navigator.onLine` 및 `online/offline` 이벤트
2. **Notification:** 상단 배너 표시
3. **Action Blocking:** 메시지 전송 버튼 비활성화
4. **Message Queueing:** (Optional) 메시지를 로컬에 큐잉, 재연결 시 전송

```typescript
// Message queue implementation
const [messageQueue, setMessageQueue] = useState<string[]>([]);

useEffect(() => {
  if (isOnline && messageQueue.length > 0) {
    // Send queued messages
    messageQueue.forEach(msg => sendMessage(msg));
    setMessageQueue([]);
  }
}, [isOnline, messageQueue]);
```

**Expected Behavior:**
- ✅ 오프라인 시 즉시 배너 표시
- ✅ 전송 버튼 비활성화
- ✅ 온라인 복구 시 배너 자동 사라짐

---

### 2.2 Fetch Timeout

**시나리오:** API 요청이 30초 이내에 응답하지 않는 경우

#### Detection & Timeout
```typescript
// lib/fetchWithTimeout.ts
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다.');
    }
    throw error;
  }
}
```

#### UI Response
```typescript
// Error message in ChatContainer
if (error.message.includes('초과')) {
  updateMessage(assistantMessage.id, {
    content: '⏱️ 응답 시간이 초과되었습니다. 네트워크를 확인하거나 다시 시도해주세요.',
    isStreaming: false,
  });

  // Show retry button
  setShowRetry(true);
}
```

#### Recovery Strategy
1. **Timeout:** 30초 후 자동 중단
2. **User Notification:** 타임아웃 메시지 표시
3. **Retry Option:** 재시도 버튼 제공
4. **Max Retries:** 최대 3회 자동 재시도 (지수 백오프)

```typescript
async function sendWithRetry(message: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await sendMessage(message);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**Expected Behavior:**
- ✅ 30초 후 타임아웃
- ✅ 에러 메시지 + 재시도 버튼
- ✅ 자동 재시도 (최대 3회)

---

## 3. API Errors

### 3.1 Gemini API Permission Denied (401)

**시나리오:** GEMINI_API_KEY가 잘못되었거나 만료된 경우

#### Server-Side Detection
```typescript
// app/api/chat/route.ts
try {
  const result = await chat.sendMessageStream(message);
  // ...
} catch (error: any) {
  if (error.message?.includes('PERMISSION_DENIED')) {
    console.error('[AUTH ERROR] Invalid API key:', {
      timestamp: new Date().toISOString(),
      // Do NOT log the actual key
    });

    return NextResponse.json(
      {
        error: 'API 인증에 실패했습니다. 관리자에게 문의하세요.',
        code: 'PERMISSION_DENIED'
      },
      { status: 401 }
    );
  }
}
```

#### Client-Side Handling
```typescript
// In ChatContainer
if (response.status === 401) {
  const data = await response.json();

  updateMessage(assistantMessage.id, {
    content: `🔒 ${data.error}\n\n관리자가 API 키를 확인해야 합니다.`,
    isStreaming: false,
  });

  // Log to monitoring service
  logError('API_AUTH_FAILED', { code: data.code });
}
```

#### Recovery Strategy
1. **Detection:** Gemini API 401 응답
2. **Server Logging:** 서버 사이드에서 상세 로그 (키는 제외)
3. **User Message:** 안전한 메시지 표시 (API 키 노출 금지)
4. **Admin Alert:** (Optional) 관리자에게 이메일/Slack 알림
5. **No Retry:** 사용자가 재시도해도 계속 실패 (서버 설정 필요)

**Expected Behavior:**
- ✅ 사용자에게 안전한 메시지만 표시
- ✅ 서버 로그에 상세 에러
- ✅ 재시도 버튼 제공하지 않음

---

### 3.2 Gemini API Rate Limit (429)

**시나리오:** API 사용량이 할당량을 초과한 경우

#### Server-Side Detection
```typescript
if (error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429) {
  return NextResponse.json(
    {
      error: '일시적으로 요청이 많아 처리할 수 없습니다. 1분 후 다시 시도해주세요.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60 // seconds
    },
    {
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    }
  );
}
```

#### Client-Side Handling
```typescript
if (response.status === 429) {
  const data = await response.json();
  const retryAfter = data.retryAfter || 60;

  updateMessage(assistantMessage.id, {
    content: `⏳ ${data.error}\n\n${retryAfter}초 후 자동으로 재시도합니다.`,
    isStreaming: false,
  });

  // Auto-retry after delay
  setTimeout(() => {
    sendMessage(content);
  }, retryAfter * 1000);
}
```

#### Recovery Strategy
1. **Detection:** 429 응답 또는 RESOURCE_EXHAUSTED 에러
2. **Exponential Backoff:** 60초 대기 후 재시도
3. **User Notification:** 대기 시간 표시
4. **Auto-Retry:** 대기 후 자동 재시도
5. **Rate Limiting:** (Future) 클라이언트 사이드 throttling

**Expected Behavior:**
- ✅ 사용자에게 대기 시간 안내
- ✅ 60초 후 자동 재시도
- ✅ 여러 번 실패 시 수동 재시도

---

### 3.3 Gemini API Service Error (500)

**시나리오:** Gemini API 내부 오류

#### Server-Side Handling
```typescript
catch (error: any) {
  console.error('[GEMINI API ERROR]', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      error: '일시적인 서비스 오류입니다. 잠시 후 다시 시도해주세요.',
      code: 'SERVICE_ERROR'
    },
    { status: 500 }
  );
}
```

#### Client-Side Handling
```typescript
if (response.status === 500) {
  const data = await response.json();

  updateMessage(assistantMessage.id, {
    content: `❌ ${data.error}`,
    isStreaming: false,
  });

  // Show retry button
  setRetryFunction(() => () => sendMessage(content));
}
```

#### Recovery Strategy
1. **Detection:** 500 응답
2. **Logging:** 서버 상세 로그
3. **User Message:** 일반적 에러 메시지
4. **Retry:** 수동 재시도 버튼
5. **Monitoring:** (Optional) Sentry로 에러 추적

**Expected Behavior:**
- ✅ 안전한 에러 메시지
- ✅ 재시도 버튼
- ✅ 서버 로그 남김

---

## 4. Storage Errors

### 4.1 LocalStorage QuotaExceededError

**시나리오:** localStorage 용량(5MB) 초과

#### Detection
```typescript
// lib/storage.ts
static saveData(data: ChatState): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('[STORAGE] Quota exceeded, cleaning up...');

      // Trigger cleanup
      this.cleanup(data);

      // Retry
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (retryError) {
        console.error('[STORAGE] Failed even after cleanup');
        throw new Error('저장 공간이 부족합니다. 오래된 대화를 삭제해주세요.');
      }
    } else {
      throw error;
    }
  }
}
```

#### Cleanup Strategy
```typescript
private static cleanup(data: ChatState): void {
  console.log('[STORAGE] Cleaning up old sessions...');

  // Keep only 10 most recent sessions (instead of 20)
  data.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  data.sessions = data.sessions.slice(0, 10);

  // Keep only 50 messages per session (instead of 100)
  data.sessions.forEach(session => {
    if (session.messages.length > 50) {
      session.messages = session.messages.slice(-50);
    }
  });
}
```

#### User Notification
```typescript
// In ChatContainer or useChat
try {
  ChatStorage.addMessage(sessionId, message);
} catch (error) {
  if (error.message.includes('저장 공간')) {
    setShowStorageWarning(true);
  }
}

// UI Component
{showStorageWarning && (
  <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
    <p className="font-bold">저장 공간 경고</p>
    <p>대화 내역이 너무 많아 자동으로 오래된 대화를 삭제했습니다.</p>
    <button onClick={() => {
      ChatStorage.clear();
      window.location.reload();
    }}>
      모든 대화 삭제
    </button>
  </div>
)}
```

#### Recovery Strategy
1. **Auto Cleanup:** 자동으로 세션/메시지 50% 삭제
2. **Retry:** 정리 후 재시도
3. **User Notification:** 경고 메시지 표시
4. **Manual Clear:** 사용자가 수동 삭제 옵션
5. **Export:** (Optional) 삭제 전 데이터 내보내기

**Expected Behavior:**
- ✅ 자동 정리 후 재시도
- ✅ 경고 배너 표시
- ✅ 수동 삭제 옵션

---

### 4.2 LocalStorage Unavailable (Incognito Mode)

**시나리오:** 시크릿 모드 또는 localStorage 비활성화

#### Detection
```typescript
// lib/storage.ts
static isAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}
```

#### Fallback Strategy
```typescript
// hooks/useChat.ts
const [sessionStorage, setSessionStorage] = useState<ChatSession | null>(null);

useEffect(() => {
  if (!ChatStorage.isAvailable()) {
    console.warn('[STORAGE] localStorage not available, using in-memory storage');
    // Use React state only (lost on refresh)
    setSession(ChatStorage.createSession());
  } else {
    // Normal localStorage flow
    setSession(ChatStorage.getActiveSession());
  }
}, []);
```

#### User Notification
```typescript
{!ChatStorage.isAvailable() && (
  <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-4">
    <p className="font-bold">ℹ️ 제한된 모드</p>
    <p>
      시크릿 모드에서는 대화 내역이 저장되지 않습니다.
      브라우저를 닫으면 모든 대화가 삭제됩니다.
    </p>
  </div>
)}
```

#### Recovery Strategy
1. **Detection:** localStorage 쓰기 테스트
2. **Fallback:** React state로 대체 (세션만 유지)
3. **User Warning:** 영구 저장 불가 안내
4. **Graceful Degradation:** 기능은 정상 작동, 새로고침 시 손실

**Expected Behavior:**
- ✅ localStorage 없어도 앱 작동
- ✅ 경고 메시지 표시
- ✅ 세션 동안만 데이터 유지

---

## 5. UI Errors

### 5.1 Component Crash (Error Boundary)

**시나리오:** React 컴포넌트에서 예상치 못한 에러 발생

#### Error Boundary Implementation
```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ERROR BOUNDARY]', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Send to error tracking service
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen bg-[#B2C7DA] p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                ⚠️ 오류가 발생했습니다
              </h2>
              <p className="text-gray-700 mb-6">
                죄송합니다. 예상치 못한 오류가 발생했습니다.
              </p>
              <button
                onClick={this.handleReset}
                className="bg-[#FAE100] text-gray-900 px-6 py-2 rounded-lg hover:bg-[#F5DC00]"
              >
                다시 시도
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

#### Usage
```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

#### Recovery Strategy
1. **Catch:** Error Boundary가 에러 캐치
2. **Log:** 콘솔 + 모니터링 서비스에 로그
3. **Fallback UI:** 에러 화면 표시
4. **Reset:** "다시 시도" 버튼으로 컴포넌트 리셋
5. **Prevent Cascade:** 다른 컴포넌트에 영향 없음

**Expected Behavior:**
- ✅ 앱 전체 크래시 방지
- ✅ 사용자 친화적 에러 화면
- ✅ 리셋 후 정상 작동

---

### 5.2 Streaming Parse Error

**시나리오:** SSE 스트림에서 잘못된 JSON 수신

#### Detection & Handling
```typescript
// In ChatContainer
for (const line of lines) {
  if (line.startsWith('data: ')) {
    const data = line.slice(6);

    if (data === '[DONE]') {
      // Normal completion
      break;
    }

    try {
      const parsed = JSON.parse(data);
      fullContent += parsed.text;
      updateMessage(assistantMessage.id, { content: fullContent });
    } catch (parseError) {
      console.warn('[STREAMING] Failed to parse chunk:', data.slice(0, 100));
      // Skip this chunk, continue with next
      continue;
    }
  }
}
```

#### Recovery Strategy
1. **Try-Catch:** JSON.parse 에러 캐치
2. **Skip Chunk:** 해당 청크 무시, 다음 청크 계속
3. **Log Warning:** 파싱 실패 로그 (청크 일부)
4. **Threshold:** 5개 연속 실패 시 스트림 중단
5. **User Notification:** 5개 이상 실패 시 에러 메시지

```typescript
let consecutiveFailures = 0;

try {
  const parsed = JSON.parse(data);
  consecutiveFailures = 0; // Reset on success
  // ... process
} catch (parseError) {
  consecutiveFailures++;

  if (consecutiveFailures > 5) {
    updateMessage(assistantMessage.id, {
      content: '응답을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.',
      isStreaming: false,
    });
    break; // Abort stream
  }
}
```

**Expected Behavior:**
- ✅ 1-2개 실패는 무시하고 계속
- ✅ 5개 이상 실패 시 중단 + 에러 표시
- ✅ 부분 응답이라도 사용자에게 표시

---

## 6. Validation Errors

### 6.1 Message Too Long

**시나리오:** 사용자가 4000자 이상 입력

#### Client-Side Validation
```typescript
// In ChatInput
const MAX_LENGTH = 4000;

const handleSend = () => {
  if (input.length > MAX_LENGTH) {
    setError(`메시지가 너무 깁니다. (${input.length}/${MAX_LENGTH}자)`);
    return;
  }

  onSend(input.trim());
  setInput('');
  setError('');
};
```

#### UI Feedback
```typescript
<div className="relative">
  <textarea
    value={input}
    onChange={(e) => setInput(e.target.value)}
    maxLength={MAX_LENGTH}
    className={error ? 'border-red-500' : ''}
  />

  <div className="flex justify-between mt-1 text-xs">
    <span className={input.length > MAX_LENGTH ? 'text-red-500' : 'text-gray-500'}>
      {input.length}/{MAX_LENGTH}자
    </span>
    {error && <span className="text-red-500">{error}</span>}
  </div>
</div>
```

#### Recovery Strategy
1. **Prevention:** `maxLength` 속성으로 입력 제한
2. **Validation:** 전송 전 길이 체크
3. **User Feedback:** 글자 수 표시 + 에러 메시지
4. **Action Block:** 초과 시 전송 버튼 비활성화

**Expected Behavior:**
- ✅ 4000자 이상 입력 불가
- ✅ 실시간 글자 수 표시
- ✅ 초과 시 빨간색 경고

---

## 7. 모니터링 및 로깅

### 7.1 Error Logging

```typescript
// lib/logger.ts
interface LogContext {
  component?: string;
  action?: string;
  [key: string]: any;
}

export function logError(message: string, context?: LogContext) {
  const logData = {
    level: 'error',
    message,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };

  console.error('[ERROR]', logData);

  // Production: Send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(new Error(message), { extra: logData });
  }
}
```

### 7.2 Error Metrics

**Track these metrics:**
- API error rate (per error code)
- Storage errors frequency
- Component crashes
- Network failures
- Average recovery time

---

## 8. 사용자 가이드

### 8.1 일반 에러 발생 시

**사용자 안내:**
1. 페이지 새로고침 (F5 or Cmd+R)
2. 브라우저 캐시 삭제
3. 다른 브라우저로 시도
4. 문제 지속 시 개발팀에 문의

### 8.2 대화 내역 손실 방지

**권장사항:**
- 중요한 대화는 스크린샷 저장
- 정기적으로 브라우저 데이터 백업
- 시크릿 모드 사용 시 주의

---

## 9. 참고 문서

- `REQUIREMENTS.md` - 에러 관련 요구사항
- `TECHSPEC.md` - 에러 처리 구현 세부사항
- `TEST_SPECIFICATIONS.md` - 에러 시나리오 테스트
- `API_CONTRACT.yaml` - API 에러 응답 스펙

---

**문서 종료**