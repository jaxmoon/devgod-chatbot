# Test Specifications
## 개발의신 챗봇 테스트 명세서

**문서 버전:** 1.0
**작성일:** 2025-01-30
**프로젝트:** 개발의신 - Gemini API 기반 개발 Q&A 챗봇

---

## 1. 테스트 전략

### 1.1 테스트 레벨

| 레벨 | 도구 | 목표 커버리지 | 실행 시점 |
|-----|------|-------------|----------|
| **Unit Tests** | Jest + React Testing Library | 80% | Pre-commit, CI |
| **Integration Tests** | Jest + MSW (Mock Service Worker) | 70% | CI |
| **E2E Tests** | Playwright | Key flows 100% | CI, Pre-deploy |
| **Performance Tests** | Lighthouse CI | Core Web Vitals | CI, Weekly |
| **Security Tests** | npm audit, OWASP ZAP | 0 high vulnerabilities | CI, Monthly |

### 1.2 테스트 환경

**Development:**
- Node.js 20+
- Jest 29+
- React Testing Library 14+
- Playwright 1.40+

**CI/CD:**
- GitHub Actions
- Vercel Preview Deployments

---

## 2. 단위 테스트 (Unit Tests)

### TC-001: ChatInput Component

**파일:** `components/chat/__tests__/ChatInput.test.tsx`

**목표:** 메시지 입력 및 전송 기능 검증

#### TC-001-1: Render and basic interaction
```typescript
describe('ChatInput', () => {
  it('should render textarea and send button', () => {
    render(<ChatInput onSend={jest.fn()} />);

    expect(screen.getByPlaceholderText('메시지를 입력하세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /전송/i })).toBeInTheDocument();
  });
});
```

**Expected:** ✅ Textarea와 전송 버튼이 렌더링됨

---

#### TC-001-2: Send message on Enter key
```typescript
it('should send message when Enter is pressed', () => {
  const mockOnSend = jest.fn();
  render(<ChatInput onSend={mockOnSend} />);

  const textarea = screen.getByPlaceholderText('메시지를 입력하세요');
  fireEvent.change(textarea, { target: { value: 'Hello' } });
  fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

  expect(mockOnSend).toHaveBeenCalledWith('Hello');
  expect(textarea).toHaveValue(''); // Input cleared
});
```

**Expected:** ✅ Enter 키로 메시지 전송, 입력창 비워짐

---

#### TC-001-3: Newline on Shift+Enter
```typescript
it('should add newline when Shift+Enter is pressed', () => {
  const mockOnSend = jest.fn();
  render(<ChatInput onSend={mockOnSend} />);

  const textarea = screen.getByPlaceholderText('메시지를 입력하세요');
  fireEvent.change(textarea, { target: { value: 'Line 1' } });
  fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

  expect(mockOnSend).not.toHaveBeenCalled();
  expect(textarea).toHaveValue('Line 1'); // No clear on Shift+Enter
});
```

**Expected:** ✅ Shift+Enter는 줄바꿈만 추가, 전송 안 됨

---

#### TC-001-4: Disable sending empty messages
```typescript
it('should not send empty messages', () => {
  const mockOnSend = jest.fn();
  render(<ChatInput onSend={mockOnSend} />);

  const textarea = screen.getByPlaceholderText('메시지를 입력하세요');
  fireEvent.change(textarea, { target: { value: '   ' } });
  fireEvent.keyDown(textarea, { key: 'Enter' });

  expect(mockOnSend).not.toHaveBeenCalled();
});
```

**Expected:** ✅ 빈 메시지(공백만)는 전송되지 않음

---

#### TC-001-5: Disable input while sending
```typescript
it('should disable input when disabled prop is true', () => {
  render(<ChatInput onSend={jest.fn()} disabled={true} />);

  const textarea = screen.getByPlaceholderText('메시지를 입력하세요');
  const button = screen.getByRole('button', { name: /전송/i });

  expect(textarea).toBeDisabled();
  expect(button).toBeDisabled();
});
```

**Expected:** ✅ disabled prop 전달 시 입력창과 버튼 비활성화

---

### TC-002: ChatMessage Component

**파일:** `components/chat/__tests__/ChatMessage.test.tsx`

**목표:** 메시지 표시 및 스타일링 검증

#### TC-002-1: User message style
```typescript
describe('ChatMessage', () => {
  it('should render user message with yellow background and right alignment', () => {
    const message: Message = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: Date.now(),
    };

    render(<ChatMessage message={message} />);

    const bubble = screen.getByText('Hello').closest('div');
    expect(bubble).toHaveClass('bg-[#FAE100]');
    expect(bubble?.parentElement).toHaveClass('justify-end');
  });
});
```

**Expected:** ✅ 사용자 메시지는 노란 배경, 우측 정렬

---

#### TC-002-2: Assistant message style
```typescript
it('should render assistant message with white background and left alignment', () => {
  const message: Message = {
    id: '2',
    role: 'assistant',
    content: 'Hi there',
    timestamp: Date.now(),
  };

  render(<ChatMessage message={message} />);

  const bubble = screen.getByText('Hi there').closest('div');
  expect(bubble).toHaveClass('bg-white');
  expect(bubble?.parentElement?.parentElement).toHaveClass('justify-start');
});
```

**Expected:** ✅ 봇 메시지는 흰 배경, 좌측 정렬

---

#### TC-002-3: Timestamp format
```typescript
it('should format timestamp correctly', () => {
  const timestamp = new Date('2025-01-30T20:08:00').getTime();
  const message: Message = {
    id: '3',
    role: 'user',
    content: 'Test',
    timestamp,
  };

  render(<ChatMessage message={message} />);

  expect(screen.getByText('오후 8:08')).toBeInTheDocument();
});
```

**Expected:** ✅ 시간이 "오후 8:08" 형식으로 표시됨

---

#### TC-002-4: Streaming indicator
```typescript
it('should show typing indicator for streaming messages', () => {
  const message: Message = {
    id: '4',
    role: 'assistant',
    content: 'Typing',
    timestamp: Date.now(),
    isStreaming: true,
  };

  render(<ChatMessage message={message} />);

  expect(screen.getByText('▋')).toBeInTheDocument();
  expect(screen.getByText('Typing').closest('div')).toHaveClass('animate-pulse');
});
```

**Expected:** ✅ 스트리밍 중 타이핑 인디케이터(▋) 표시

---

### TC-003: ChatStorage Service

**파일:** `lib/__tests__/storage.test.ts`

**목표:** localStorage 관리 기능 검증

#### TC-003-1: Create new session
```typescript
describe('ChatStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create new session with default title', () => {
    const session = ChatStorage.createSession();

    expect(session.id).toBeDefined();
    expect(session.title).toBe('새 대화');
    expect(session.messages).toEqual([]);
    expect(session.createdAt).toBeLessThanOrEqual(Date.now());
  });
});
```

**Expected:** ✅ 새 세션이 기본 제목으로 생성됨

---

#### TC-003-2: Add message to session
```typescript
it('should add message and update session title from first message', () => {
  const session = ChatStorage.createSession();
  const message: Message = {
    id: 'm1',
    role: 'user',
    content: 'This is a very long message that should be truncated to 30 characters',
    timestamp: Date.now(),
  };

  ChatStorage.addMessage(session.id, message);

  const updatedSession = ChatStorage.getActiveSession();
  expect(updatedSession?.messages).toHaveLength(1);
  expect(updatedSession?.title).toBe('This is a very long message...');
});
```

**Expected:** ✅ 메시지 추가, 첫 메시지로 제목 설정 (30자 제한)

---

#### TC-003-3: Enforce storage limits - sessions
```typescript
it('should keep only 20 most recent sessions', () => {
  // Create 25 sessions
  for (let i = 0; i < 25; i++) {
    const session = ChatStorage.createSession(`Session ${i}`);
    ChatStorage.addMessage(session.id, {
      id: `m${i}`,
      role: 'user',
      content: `Message ${i}`,
      timestamp: Date.now() + i,
    });
  }

  const data = ChatStorage.getData();
  expect(data.sessions).toHaveLength(20);
  // Most recent sessions should be kept
  expect(data.sessions[0].title).toContain('Message 24');
});
```

**Expected:** ✅ 최대 20개 세션만 유지, 오래된 세션 삭제

---

#### TC-003-4: Enforce storage limits - messages per session
```typescript
it('should keep only 100 most recent messages per session', () => {
  const session = ChatStorage.createSession();

  // Add 150 messages
  for (let i = 0; i < 150; i++) {
    ChatStorage.addMessage(session.id, {
      id: `m${i}`,
      role: 'user',
      content: `Message ${i}`,
      timestamp: Date.now() + i,
    });
  }

  const updatedSession = ChatStorage.getActiveSession();
  expect(updatedSession?.messages).toHaveLength(100);
  // Most recent messages should be kept
  expect(updatedSession?.messages[99].content).toBe('Message 149');
});
```

**Expected:** ✅ 세션당 최대 100개 메시지만 유지

---

#### TC-003-5: Handle QuotaExceededError
```typescript
it('should handle QuotaExceededError with cleanup', () => {
  // Mock localStorage.setItem to throw QuotaExceededError
  const originalSetItem = Storage.prototype.setItem;
  let callCount = 0;

  Storage.prototype.setItem = jest.fn((key, value) => {
    if (callCount === 0 && value.length > 1000000) {
      callCount++;
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    }
    originalSetItem.call(localStorage, key, value);
  });

  // Create large sessions
  for (let i = 0; i < 30; i++) {
    const session = ChatStorage.createSession();
    for (let j = 0; j < 100; j++) {
      ChatStorage.addMessage(session.id, {
        id: `m${i}-${j}`,
        role: 'user',
        content: 'A'.repeat(1000), // Large message
        timestamp: Date.now(),
      });
    }
  }

  // Should trigger cleanup and succeed on retry
  const data = ChatStorage.getData();
  expect(data.sessions.length).toBeLessThan(30);

  Storage.prototype.setItem = originalSetItem;
});
```

**Expected:** ✅ 용량 초과 시 자동 정리 후 재시도

---

### TC-004: Gemini Service

**파일:** `lib/__tests__/gemini.test.ts`

**목표:** Gemini API 통합 로직 검증

#### TC-004-1: Load system prompt
```typescript
describe('Gemini Service', () => {
  it('should load system prompt from file', () => {
    const prompt = loadSystemPrompt();

    expect(prompt).toContain('개발의신');
    expect(prompt).toContain('소프트웨어 개발 전문가');
  });

  it('should return fallback prompt if file not found', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('File not found');
    });

    const prompt = loadSystemPrompt();
    expect(prompt).toBe('당신은 친절한 소프트웨어 개발 전문가입니다.');
  });
});
```

**Expected:** ✅ 시스템 프롬프트 로드, 실패 시 폴백

---

#### TC-004-2: Convert history format
```typescript
it('should convert chat history to Gemini format', () => {
  const history: ChatMessage[] = [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi' },
  ];

  const converted = convertHistoryToGeminiFormat(history);

  expect(converted).toEqual([
    { role: 'user', parts: [{ text: 'Hello' }] },
    { role: 'model', parts: [{ text: 'Hi' }] },
  ]);
});
```

**Expected:** ✅ `assistant` → `model` 변환

---

## 3. 통합 테스트 (Integration Tests)

### TC-INT-001: API Route - POST /api/chat

**파일:** `app/api/chat/__tests__/route.test.ts`

**목표:** API 엔드포인트 통합 검증

#### TC-INT-001-1: Successful streaming response
```typescript
import { POST } from '../route';
import { NextRequest } from 'next/server';

describe('POST /api/chat', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('should return streaming response for valid request', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
        history: [],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    // Read stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      result += decoder.decode(value);
    }

    expect(result).toContain('data: {');
    expect(result).toContain('[DONE]');
  });
});
```

**Expected:** ✅ 200 응답, SSE 스트림, [DONE] 마커

---

#### TC-INT-001-2: Invalid message error
```typescript
it('should return 400 for empty message', async () => {
  const request = new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: '',
      history: [],
    }),
  });

  const response = await POST(request);

  expect(response.status).toBe(400);

  const data = await response.json();
  expect(data.error).toBe('메시지가 유효하지 않습니다.');
});
```

**Expected:** ✅ 400 응답, 에러 메시지

---

#### TC-INT-001-3: Missing API key error
```typescript
it('should return 500 if GEMINI_API_KEY is missing', async () => {
  delete process.env.GEMINI_API_KEY;

  const request = new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: 'Hello',
      history: [],
    }),
  });

  const response = await POST(request);

  expect(response.status).toBe(500);

  const data = await response.json();
  expect(data.error).toContain('오류');
});
```

**Expected:** ✅ 500 응답, API 키 누락 처리

---

### TC-INT-002: ChatContainer with useChat hook

**파일:** `components/chat/__tests__/ChatContainer.integration.test.tsx`

**목표:** 컴포넌트와 hook 통합 검증

#### TC-INT-002-1: Complete message flow
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatContainer from '../ChatContainer';
import { server } from '@/mocks/server';
import { rest } from 'msw';

describe('ChatContainer Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should send message and receive streaming response', async () => {
    render(<ChatContainer />);

    const input = screen.getByPlaceholderText('메시지를 입력하세요');
    const sendButton = screen.getByRole('button', { name: /전송/i });

    // Send message
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    // User message should appear
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    // Streaming bot response should appear
    await waitFor(() => {
      expect(screen.getByText(/Hi there/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Streaming indicator should disappear
    await waitFor(() => {
      expect(screen.queryByText('▋')).not.toBeInTheDocument();
    });
  });
});
```

**Expected:** ✅ 메시지 전송 → 사용자 말풍선 → 스트리밍 응답 → 완료

---

## 4. E2E 테스트 (End-to-End Tests)

### TC-E2E-001: Complete chat flow

**파일:** `e2e/chat-flow.spec.ts`

**도구:** Playwright

#### TC-E2E-001-1: User can send message and receive response
```typescript
import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test('user can send message and receive streaming response', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for page load
    await expect(page.getByText('개발의신')).toBeVisible();

    // Type message
    const input = page.getByPlaceholder('메시지를 입력하세요');
    await input.fill('TypeScript의 장점은?');

    // Send with Enter
    await input.press('Enter');

    // User message should appear
    await expect(page.getByText('TypeScript의 장점은?')).toBeVisible({ timeout: 2000 });

    // Wait for streaming response
    await expect(page.getByText(/TypeScript/i).last()).toBeVisible({ timeout: 10000 });

    // Typing indicator should disappear
    await expect(page.locator('text=▋')).not.toBeVisible({ timeout: 30000 });

    // Check message styling
    const userBubble = page.locator('text=TypeScript의 장점은?').locator('..');
    await expect(userBubble).toHaveClass(/bg-\[#FAE100\]/);
  });
});
```

**Expected:** ✅ 메시지 입력 → 전송 → 스트리밍 응답 → 스타일 검증

---

#### TC-E2E-001-2: Messages persist after refresh
```typescript
test('messages persist after page refresh', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Send message
  await page.fill('[placeholder="메시지를 입력하세요"]', 'Test message');
  await page.press('[placeholder="메시지를 입력하세요"]', 'Enter');

  await expect(page.getByText('Test message')).toBeVisible();

  // Wait for response
  await page.waitForTimeout(3000);

  // Refresh page
  await page.reload();

  // Messages should still be visible
  await expect(page.getByText('Test message')).toBeVisible();
});
```

**Expected:** ✅ 페이지 새로고침 후에도 메시지 유지

---

### TC-E2E-002: Accessibility

**파일:** `e2e/accessibility.spec.ts`

#### TC-E2E-002-1: Keyboard navigation
```typescript
test('keyboard navigation works correctly', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Tab to input
  await page.keyboard.press('Tab');
  await expect(page.getByPlaceholder('메시지를 입력하세요')).toBeFocused();

  // Type and send with Enter
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');

  await expect(page.getByText('Hello')).toBeVisible();
});
```

**Expected:** ✅ Tab 키로 네비게이션, Enter로 전송

---

#### TC-E2E-002-2: Screen reader support
```typescript
test('has proper ARIA labels', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const input = page.getByRole('textbox', { name: /메시지 입력/i });
  await expect(input).toBeVisible();

  const sendButton = page.getByRole('button', { name: /전송/i });
  await expect(sendButton).toBeVisible();
});
```

**Expected:** ✅ 적절한 ARIA 레이블 존재

---

## 5. 성능 테스트 (Performance Tests)

### TC-PERF-001: Core Web Vitals

**파일:** `.github/workflows/lighthouse-ci.yml`

**도구:** Lighthouse CI

#### TC-PERF-001-1: Lighthouse scores
```yaml
lighthouserc.json:
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.95}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}]
      }
    }
  }
}
```

**Expected:**
- ✅ Performance >= 90
- ✅ Accessibility >= 95
- ✅ LCP < 2.5s
- ✅ CLS < 0.1

---

### TC-PERF-002: Bundle size

**파일:** `package.json`

```json
{
  "scripts": {
    "test:bundle": "bundlesize"
  },
  "bundlesize": [
    {
      "path": ".next/static/**/*.js",
      "maxSize": "200 kB"
    }
  ]
}
```

**Expected:** ✅ JS 번들 < 200KB (gzipped)

---

## 6. 보안 테스트 (Security Tests)

### TC-SEC-001: Dependency vulnerabilities

```bash
npm audit --audit-level=high
```

**Expected:** ✅ 0 high/critical vulnerabilities

---

### TC-SEC-002: API key exposure

**파일:** `e2e/security.spec.ts`

```typescript
test('API key not exposed to client', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Check window object
  const apiKey = await page.evaluate(() => {
    return (window as any).GEMINI_API_KEY;
  });

  expect(apiKey).toBeUndefined();

  // Check localStorage
  const storage = await page.evaluate(() => localStorage.getItem('GEMINI_API_KEY'));
  expect(storage).toBeNull();

  // Check network requests
  const requests: string[] = [];
  page.on('request', (request) => {
    requests.push(request.url());
  });

  await page.fill('[placeholder="메시지를 입력하세요"]', 'Test');
  await page.press('[placeholder="메시지를 입력하세요"]', 'Enter');
  await page.waitForTimeout(2000);

  // No requests should contain API key in URL
  requests.forEach(url => {
    expect(url).not.toContain(process.env.GEMINI_API_KEY || 'test-key');
  });
});
```

**Expected:** ✅ API 키가 클라이언트에 노출되지 않음

---

## 7. 테스트 실행 가이드

### 7.1 로컬 실행

```bash
# 단위 + 통합 테스트
npm test

# 특정 파일만
npm test ChatInput.test.tsx

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# E2E 테스트
npx playwright test

# E2E with UI
npx playwright test --ui

# E2E specific test
npx playwright test e2e/chat-flow.spec.ts
```

### 7.2 CI 실행

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm start & npx wait-on http://localhost:3000
      - run: npx playwright test

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 8. 테스트 커버리지 목표

### 8.1 전체 목표

| 항목 | 목표 | 현재 | 상태 |
|-----|------|------|------|
| Line Coverage | 80% | - | 🟡 Pending |
| Branch Coverage | 75% | - | 🟡 Pending |
| Function Coverage | 85% | - | 🟡 Pending |
| Statement Coverage | 80% | - | 🟡 Pending |

### 8.2 파일별 목표

| 파일 | 목표 | 우선순위 |
|-----|------|---------|
| `lib/storage.ts` | 90% | Critical |
| `lib/gemini.ts` | 85% | Critical |
| `app/api/chat/route.ts` | 80% | Critical |
| `components/chat/*` | 75% | High |
| `hooks/useChat.ts` | 85% | High |

---

## 9. 테스트 데이터

### 9.1 Mock Gemini API Response

**파일:** `mocks/handlers.ts`

```typescript
import { rest } from 'msw';

export const handlers = [
  rest.post('http://localhost:3000/api/chat', async (req, res, ctx) => {
    const { message } = await req.json();

    const stream = new ReadableStream({
      start(controller) {
        const chunks = [
          'TypeScript는 ',
          '정적 타입을 ',
          '제공하여 ',
          '코드 안정성을 높입니다.',
        ];

        chunks.forEach((chunk, i) => {
          setTimeout(() => {
            controller.enqueue(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            if (i === chunks.length - 1) {
              controller.enqueue('data: [DONE]\n\n');
              controller.close();
            }
          }, i * 100);
        });
      },
    });

    return res(
      ctx.status(200),
      ctx.set('Content-Type', 'text/event-stream'),
      ctx.body(stream)
    );
  }),
];
```

---

## 10. 참고 문서

- `REQUIREMENTS.md` - 요구사항과 테스트 케이스 매핑
- `API_CONTRACT.yaml` - API 테스트 스펙
- `TECHSPEC.md` - 기술 구현 세부사항
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)

---

**문서 종료**