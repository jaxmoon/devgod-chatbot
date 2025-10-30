# Agent Task 08: Unit Tests
## 단위 테스트 작성 (Jest + React Testing Library)

**Agent ID:** AGENT_08
**소요 시간:** 1.5일
**의존성:** AGENT_02-07 완료
**다음 Agent:** AGENT_09 (E2E Tests)

---

## 1. Context

### 작업 목표
Jest와 React Testing Library를 사용하여 핵심 로직의 단위 테스트를 작성합니다.

### 관련 요구사항
- TC-001: 메시지 전송 테스트
- TC-002: 스트리밍 응답 테스트
- TC-003: localStorage 저장 테스트
- TC-004: 에러 처리 테스트

---

## 2. Prerequisites

```bash
# AGENT_02-07 완료 확인
ls lib/utils.ts lib/gemini.ts hooks/useChat.ts components/
```

---

## 3. Task Details

### Step 1: Jest 설정

**패키지 설치:**
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
npm install -D @types/jest
```

**`jest.config.mjs` 생성:**
```javascript
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{js,ts,tsx}',
    'components/**/*.{js,ts,tsx}',
    'hooks/**/*.{js,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default createJestConfig(config);
```

**`jest.setup.js` 생성:**
```javascript
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

// Mock navigator.onLine
Object.defineProperty(window.navigator, 'onLine', {
  writable: true,
  value: true,
});
```

**`package.json` scripts 추가:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Step 2: 유틸리티 테스트

**`__tests__/lib/utils.test.ts` 생성:**
```typescript
import { formatTime, generateId, cn } from '@/lib/utils';

describe('formatTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-30 15:30:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should format time in Korean 12-hour format', () => {
    const timestamp = new Date('2024-01-30 15:30:00').getTime();
    expect(formatTime(timestamp)).toBe('오후 3:30');
  });

  it('should format AM time', () => {
    const timestamp = new Date('2024-01-30 09:15:00').getTime();
    expect(formatTime(timestamp)).toBe('오전 9:15');
  });

  it('should pad single digit minutes', () => {
    const timestamp = new Date('2024-01-30 14:05:00').getTime();
    expect(formatTime(timestamp)).toBe('오후 2:05');
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate IDs with correct format', () => {
    const id = generateId();
    expect(id).toMatch(/^msg_\d+_[a-z0-9]+$/);
  });
});

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
```

### Step 3: Storage 테스트

**`__tests__/lib/storage.test.ts` 생성:**
```typescript
import { storage } from '@/lib/storage';
import { ChatSession } from '@/types/api';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getSessions', () => {
    it('should return empty array when no sessions', () => {
      localStorage.getItem.mockReturnValue(null);
      expect(storage.getSessions()).toEqual([]);
    });

    it('should return parsed sessions', () => {
      const sessions: ChatSession[] = [
        {
          id: '1',
          title: 'Test',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(sessions));
      expect(storage.getSessions()).toEqual(sessions);
    });

    it('should handle JSON parse error', () => {
      localStorage.getItem.mockReturnValue('invalid json');
      expect(storage.getSessions()).toEqual([]);
    });
  });

  describe('saveSession', () => {
    it('should save new session', () => {
      const session: ChatSession = {
        id: '1',
        title: 'Test',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      storage.saveSession(session);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'chat_sessions',
        expect.stringContaining('"id":"1"')
      );
    });

    it('should update existing session', () => {
      const session1: ChatSession = {
        id: '1',
        title: 'Test',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      storage.saveSession(session1);

      const session2: ChatSession = {
        ...session1,
        title: 'Updated',
      };

      storage.saveSession(session2);

      const saved = JSON.parse(
        localStorage.setItem.mock.calls[1][1]
      );
      expect(saved[0].title).toBe('Updated');
    });

    it('should limit sessions to MAX_SESSIONS', () => {
      for (let i = 0; i < 25; i++) {
        storage.saveSession({
          id: `${i}`,
          title: `Session ${i}`,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      const saved = JSON.parse(
        localStorage.setItem.mock.calls[24][1]
      );
      expect(saved).toHaveLength(20);
    });
  });

  describe('createSession', () => {
    it('should create new session with default title', () => {
      const session = storage.createSession();

      expect(session.title).toBe('새 대화');
      expect(session.messages).toEqual([]);
      expect(session.id).toBeDefined();
    });

    it('should set as current session', () => {
      const session = storage.createSession();
      expect(storage.getCurrentSessionId()).toBe(session.id);
    });
  });

  describe('deleteSession', () => {
    it('should delete session', () => {
      const session = storage.createSession();
      storage.deleteSession(session.id);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'chat_sessions',
        '[]'
      );
    });

    it('should clear current session if deleted', () => {
      const session = storage.createSession();
      storage.deleteSession(session.id);

      expect(storage.getCurrentSessionId()).toBeNull();
    });
  });
});
```

### Step 4: useChat Hook 테스트

**`__tests__/hooks/useChat.test.ts` 생성:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useChat } from '@/hooks/useChat';
import { storage } from '@/lib/storage';
import { Message } from '@/types/api';

jest.mock('@/lib/storage');

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getCurrentSessionId as jest.Mock).mockReturnValue(null);
    (storage.getSessions as jest.Mock).mockReturnValue([]);
    (storage.createSession as jest.Mock).mockReturnValue({
      id: 'test-session',
      title: '새 대화',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
  });

  it('should add message', () => {
    const { result } = renderHook(() => useChat());

    const message: Message = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: Date.now(),
    };

    act(() => {
      result.current.addMessage(message);
    });

    expect(result.current.messages).toContainEqual(message);
  });

  it('should update message', () => {
    const { result } = renderHook(() => useChat());

    const message: Message = {
      id: '1',
      role: 'assistant',
      content: 'Hello',
      timestamp: Date.now(),
      isStreaming: true,
    };

    act(() => {
      result.current.addMessage(message);
    });

    act(() => {
      result.current.updateMessage('1', {
        content: 'Hello World',
        isStreaming: false,
      });
    });

    expect(result.current.messages[0].content).toBe('Hello World');
    expect(result.current.messages[0].isStreaming).toBe(false);
  });

  it('should remove message', () => {
    const { result } = renderHook(() => useChat());

    const message: Message = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: Date.now(),
    };

    act(() => {
      result.current.addMessage(message);
    });

    act(() => {
      result.current.removeMessage('1');
    });

    expect(result.current.messages).toEqual([]);
  });

  it('should create new session', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.createNewSession();
    });

    expect(storage.createSession).toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });
});
```

### Step 5: ChatMessage 컴포넌트 테스트

**`__tests__/components/ChatMessage.test.tsx` 생성:**
```typescript
import { render, screen } from '@testing-library/react';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { Message } from '@/types/api';

describe('ChatMessage', () => {
  it('should render user message with yellow background', () => {
    const message: Message = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: Date.now(),
    };

    const { container } = render(<ChatMessage message={message} />);
    const bubble = container.querySelector('.bg-\\[\\#FAE100\\]');
    expect(bubble).toBeInTheDocument();
    expect(bubble).toHaveTextContent('Hello');
  });

  it('should render assistant message with white background', () => {
    const message: Message = {
      id: '2',
      role: 'assistant',
      content: 'Hi there',
      timestamp: Date.now(),
    };

    const { container } = render(<ChatMessage message={message} />);
    const bubble = container.querySelector('.bg-white');
    expect(bubble).toBeInTheDocument();
    expect(bubble?.textContent).toContain('Hi there');
  });

  it('should show streaming indicator', () => {
    const message: Message = {
      id: '3',
      role: 'assistant',
      content: 'Typing',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const { container } = render(<ChatMessage message={message} />);
    const cursor = container.querySelector('.animate-pulse');
    expect(cursor).toBeInTheDocument();
  });

  it('should format timestamp', () => {
    const timestamp = new Date('2024-01-30 15:30:00').getTime();
    const message: Message = {
      id: '4',
      role: 'user',
      content: 'Test',
      timestamp,
    };

    render(<ChatMessage message={message} />);
    expect(screen.getByText(/오후 3:30/)).toBeInTheDocument();
  });
});
```

---

## 4. Verification

```bash
# 1. 테스트 실행
npm test

# 2. 커버리지 확인
npm run test:coverage

# 3. Watch 모드 (개발 중)
npm run test:watch

# 예상 결과: 모든 테스트 통과, 커버리지 >= 80%
```

---

## 5. Handoff

### 완료 사항
- ✅ Jest 설정
- ✅ 유틸리티 테스트
- ✅ Storage 테스트
- ✅ Hook 테스트
- ✅ 컴포넌트 테스트
- ✅ 80% 이상 커버리지

### AGENT_09를 위한 정보
```typescript
// E2E 테스트 시나리오:
// 1. 메시지 전송 및 응답 수신
// 2. 새 대화 생성 및 전환
// 3. 페이지 새로고침 후 복원
// 4. 오프라인 모드 처리
// 5. 에러 발생 시 토스트 표시
```

**Handoff 문서:** `docs/tasks/handoffs/AGENT_08_HANDOFF.md`

---

**Agent 08 작업 완료 ✅**
