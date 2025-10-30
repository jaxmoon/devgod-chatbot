# Agent Task 02: Type Definitions & Utilities
## 타입 정의 및 유틸리티 함수

**Agent ID:** AGENT_02
**소요 시간:** 0.5일
**의존성:** AGENT_01 완료
**다음 Agent:** AGENT_03 (API), AGENT_04 (UI) - 병렬 가능

---

## 1. Context

### 1.1 작업 목표
프로젝트 전체에서 사용할 TypeScript 타입 정의와 공통 유틸리티 함수를 작성합니다.

### 1.2 관련 요구사항
- FR-003: 대화 히스토리 표시 (Message 타입)
- FR-004: 대화 히스토리 저장 (ChatSession, ChatState 타입)
- NFR-006: 유지보수성 (타입 안전성)

### 1.3 현재 상태
- AGENT_01이 프로젝트 구조 생성 완료
- TypeScript strict mode 활성화
- 빈 `types/` 및 `lib/` 디렉토리 존재

---

## 2. Prerequisites

### 2.1 선행 작업 확인
```bash
# AGENT_01 완료 여부 확인
ls -la types/       # 디렉토리 존재 확인
ls -la lib/         # 디렉토리 존재 확인
cat tsconfig.json | grep "strict"  # strict: true 확인
```

### 2.2 필요한 지식
- TypeScript 고급 타입 (Union, Intersection, Utility Types)
- Date/Time 처리 (한국어 포맷)
- React 컴포넌트 props 타입

---

## 3. Input

### 3.1 AGENT_01로부터 받은 정보
- TypeScript 경로 alias: `@/*`
- Strict mode 활성화
- 디렉토리: `types/`, `lib/`

### 3.2 참조 문서
- `TECHSPEC.md` - Section 2 (Data Models)
- `REQUIREMENTS.md` - FR-003, FR-004

---

## 4. Task Details

### 4.1 Step 1: 핵심 타입 정의 (types/chat.ts)

**`types/chat.ts` 생성:**

```typescript
/**
 * Message
 * 개별 채팅 메시지를 나타내는 타입
 *
 * 요구사항: FR-003 (대화 히스토리 표시)
 */
export interface Message {
  /** 고유 식별자 (UUID v4) */
  id: string;

  /** 메시지 발신자 */
  role: 'user' | 'assistant';

  /** 메시지 내용 (1-4000자) */
  content: string;

  /** 생성 시간 (Unix timestamp, milliseconds) */
  timestamp: number;

  /** 스트리밍 중 여부 (assistant 메시지만 해당) */
  isStreaming?: boolean;
}

/**
 * ChatSession
 * 하나의 대화 세션을 나타내는 타입
 *
 * 요구사항: FR-004 (대화 히스토리 저장)
 */
export interface ChatSession {
  /** 세션 고유 식별자 (UUID v4) */
  id: string;

  /** 세션 제목 (첫 메시지 기반, 최대 30자) */
  title: string;

  /** 세션 내 모든 메시지 (최대 100개) */
  messages: Message[];

  /** 생성 시간 (Unix timestamp) */
  createdAt: number;

  /** 마지막 수정 시간 (Unix timestamp) */
  updatedAt: number;
}

/**
 * ChatState
 * localStorage에 저장되는 전체 채팅 상태
 *
 * 요구사항: FR-004 (localStorage 저장)
 */
export interface ChatState {
  /** 모든 채팅 세션 (최대 20개) */
  sessions: ChatSession[];

  /** 현재 활성화된 세션 ID */
  activeSessionId: string | null;

  /** 스키마 버전 (마이그레이션용) */
  version: number;
}

/**
 * Storage 제약사항
 */
export const STORAGE_CONSTRAINTS = {
  /** 최대 저장 용량 (5MB) */
  MAX_STORAGE_SIZE: 5 * 1024 * 1024,

  /** 최대 세션 개수 */
  MAX_SESSIONS: 20,

  /** 세션당 최대 메시지 개수 */
  MAX_MESSAGES_PER_SESSION: 100,

  /** localStorage 키 */
  STORAGE_KEY: 'devgod_chat_storage',
} as const;
```

---

### 4.2 Step 2: API 타입 정의 (types/api.ts)

**`types/api.ts` 생성:**

```typescript
/**
 * API 관련 타입 정의
 * Gemini API와의 통신에 사용
 */

/**
 * ChatMessage
 * API 요청 시 전달되는 간소화된 메시지 타입
 */
export interface ChatMessage {
  /** 메시지 발신자 */
  role: 'user' | 'assistant';

  /** 메시지 내용 */
  content: string;
}

/**
 * ChatRequest
 * POST /api/chat 요청 바디
 *
 * 참조: API_CONTRACT.yaml - /api/chat POST
 */
export interface ChatRequest {
  /** 사용자 메시지 (1-4000자) */
  message: string;

  /** 대화 히스토리 (최대 10개) */
  history?: ChatMessage[];
}

/**
 * StreamChunk
 * SSE 스트림으로 전달되는 개별 청크
 */
export interface StreamChunk {
  /** 청크 텍스트 */
  text: string;
}

/**
 * ErrorResponse
 * API 에러 응답
 */
export interface ErrorResponse {
  /** 사용자 친화적 에러 메시지 (한국어) */
  error: string;

  /** 머신 리더블 에러 코드 */
  code?: ErrorCode;

  /** 추가 에러 정보 (선택) */
  details?: Record<string, any>;
}

/**
 * ErrorCode
 * 가능한 모든 에러 코드
 */
export enum ErrorCode {
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  MESSAGE_TOO_LONG = 'MESSAGE_TOO_LONG',
  HISTORY_TOO_LONG = 'HISTORY_TOO_LONG',
  CONFIG_ERROR = 'CONFIG_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  API_ERROR = 'API_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT = 'TIMEOUT',
}

/**
 * API 제약사항
 */
export const API_CONSTRAINTS = {
  /** 메시지 최대 길이 */
  MAX_MESSAGE_LENGTH: 4000,

  /** 히스토리 최대 개수 */
  MAX_HISTORY_LENGTH: 10,

  /** 요청 타임아웃 (ms) */
  REQUEST_TIMEOUT: 30000,
} as const;
```

---

### 4.3 Step 3: Gemini 타입 정의 (types/gemini.ts)

**`types/gemini.ts` 생성:**

```typescript
/**
 * Gemini API 관련 타입
 * @google/generative-ai SDK와 상호작용하는 타입
 */

/**
 * GeminiMessage
 * Gemini API 형식의 메시지
 */
export interface GeminiMessage {
  /** 'user' 또는 'model' (Gemini는 'assistant' 대신 'model' 사용) */
  role: 'user' | 'model';

  /** 메시지 파트 (텍스트) */
  parts: Array<{ text: string }>;
}

/**
 * GeminiHistory
 * Gemini startChat()에 전달되는 히스토리
 */
export type GeminiHistory = GeminiMessage[];

/**
 * SystemPromptConfig
 * 시스템 프롬프트 설정
 */
export interface SystemPromptConfig {
  /** 프롬프트 파일 경로 */
  promptPath: string;

  /** 폴백 프롬프트 (파일 로드 실패 시) */
  fallbackPrompt: string;
}
```

---

### 4.4 Step 4: 유틸리티 함수 (lib/utils.ts)

**`lib/utils.ts` 생성:**

```typescript
/**
 * 공통 유틸리티 함수
 */

/**
 * formatTime
 * Unix timestamp를 한국어 시간 형식으로 변환
 *
 * @param timestamp - Unix timestamp (milliseconds)
 * @returns "오후 8:08" 형식의 문자열
 *
 * @example
 * formatTime(1706613480000) // "오후 8:08"
 *
 * 요구사항: FR-003 (시간 표시)
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // 오전/오후 결정
  const period = hours >= 12 ? '오후' : '오전';

  // 12시간 형식으로 변환
  const displayHours = hours % 12 || 12;

  // 분을 2자리로 패딩
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${period} ${displayHours}:${displayMinutes}`;
}

/**
 * cn (classNames)
 * 조건부 클래스명 결합 유틸리티
 *
 * @param classes - 클래스명 배열 (falsy 값은 무시)
 * @returns 결합된 클래스명 문자열
 *
 * @example
 * cn('base', isActive && 'active', undefined) // "base active"
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * generateId
 * UUID v4 생성 (crypto API 사용)
 *
 * @returns UUID 문자열
 *
 * @example
 * generateId() // "123e4567-e89b-12d3-a456-426614174000"
 */
export function generateId(): string {
  // 브라우저 환경
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 폴백: 간단한 UUID v4 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * truncateText
 * 텍스트를 지정된 길이로 자르고 "..." 추가
 *
 * @param text - 원본 텍스트
 * @param maxLength - 최대 길이
 * @returns 잘린 텍스트
 *
 * @example
 * truncateText("Hello World", 8) // "Hello..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

/**
 * isValidMessage
 * 메시지 유효성 검증
 *
 * @param message - 검증할 메시지
 * @returns 유효 여부
 */
export function isValidMessage(message: string): boolean {
  // 빈 문자열 또는 공백만 있는 경우
  if (!message || message.trim().length === 0) {
    return false;
  }

  // 최대 길이 초과
  if (message.length > 4000) {
    return false;
  }

  return true;
}

/**
 * debounce
 * 함수 디바운싱 (연속 호출 방지)
 *
 * @param fn - 디바운싱할 함수
 * @param delay - 지연 시간 (ms)
 * @returns 디바운싱된 함수
 *
 * @example
 * const debouncedSave = debounce(saveData, 500);
 * debouncedSave(); // 500ms 후 실행
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}
```

---

### 4.5 Step 5: 타입 가드 함수 (lib/type-guards.ts)

**`lib/type-guards.ts` 생성:**

```typescript
import { Message, ChatSession, ChatState } from '@/types/chat';

/**
 * Type Guard Functions
 * 런타임 타입 검증 함수
 */

/**
 * isMessage
 * Message 타입 가드
 */
export function isMessage(value: unknown): value is Message {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const msg = value as Record<string, unknown>;

  return (
    typeof msg.id === 'string' &&
    (msg.role === 'user' || msg.role === 'assistant') &&
    typeof msg.content === 'string' &&
    typeof msg.timestamp === 'number' &&
    (msg.isStreaming === undefined || typeof msg.isStreaming === 'boolean')
  );
}

/**
 * isChatSession
 * ChatSession 타입 가드
 */
export function isChatSession(value: unknown): value is ChatSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const session = value as Record<string, unknown>;

  return (
    typeof session.id === 'string' &&
    typeof session.title === 'string' &&
    Array.isArray(session.messages) &&
    session.messages.every(isMessage) &&
    typeof session.createdAt === 'number' &&
    typeof session.updatedAt === 'number'
  );
}

/**
 * isChatState
 * ChatState 타입 가드
 */
export function isChatState(value: unknown): value is ChatState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const state = value as Record<string, unknown>;

  return (
    Array.isArray(state.sessions) &&
    state.sessions.every(isChatSession) &&
    (state.activeSessionId === null ||
      typeof state.activeSessionId === 'string') &&
    typeof state.version === 'number'
  );
}
```

---

### 4.6 Step 6: 상수 정의 (lib/constants.ts)

**`lib/constants.ts` 생성:**

```typescript
/**
 * 프로젝트 전역 상수
 */

/**
 * 스토리지 관련 상수
 */
export const STORAGE = {
  KEY: 'devgod_chat_storage',
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_SESSIONS: 20,
  MAX_MESSAGES_PER_SESSION: 100,
  SCHEMA_VERSION: 1,
} as const;

/**
 * API 관련 상수
 */
export const API = {
  ENDPOINT: '/api/chat',
  MAX_MESSAGE_LENGTH: 4000,
  MAX_HISTORY_LENGTH: 10,
  TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * UI 관련 상수
 */
export const UI = {
  COLORS: {
    USER_BUBBLE: '#FAE100',
    USER_BUBBLE_DARK: '#F5DC00',
    BOT_BUBBLE: '#FFFFFF',
    BACKGROUND: '#B2C7DA',
    BACKGROUND_LIGHT: '#ABC1D1',
  },
  MESSAGE_MAX_WIDTH: '75%',
  INPUT_MAX_HEIGHT: '128px',
  TYPING_INDICATOR: '▋',
} as const;

/**
 * 앱 정보
 */
export const APP = {
  NAME: '개발의신',
  DESCRIPTION: 'Software Development Assistant',
  BOT_NAME: '개발의신',
} as const;
```

---

## 5. Output

### 5.1 생성된 파일 목록

**타입 정의:**
- `types/chat.ts` - Message, ChatSession, ChatState
- `types/api.ts` - API 요청/응답 타입, 에러 코드
- `types/gemini.ts` - Gemini API 타입

**유틸리티:**
- `lib/utils.ts` - 시간 포맷, ID 생성, 유효성 검증 등
- `lib/type-guards.ts` - 타입 가드 함수
- `lib/constants.ts` - 프로젝트 상수

### 5.2 수정된 파일
- 없음

---

## 6. Verification

### 6.1 자동 검증

```bash
# 1. TypeScript 타입 체크
npx tsc --noEmit

# 예상 출력: No errors

# 2. ESLint 체크
npm run lint

# 예상 출력: ✓ No ESLint warnings or errors

# 3. Import 테스트 (임시 파일로 확인)
cat > test-imports.ts << 'EOF'
import { Message, ChatSession, ChatState } from './types/chat';
import { ChatRequest, ErrorCode } from './types/api';
import { formatTime, generateId, cn } from './lib/utils';
import { isMessage } from './lib/type-guards';
import { STORAGE, API, UI } from './lib/constants';

// 타입 체크
const msg: Message = {
  id: generateId(),
  role: 'user',
  content: 'Hello',
  timestamp: Date.now(),
};

console.log('Types imported successfully');
console.log(formatTime(Date.now()));
console.log(isMessage(msg));
EOF

npx tsx test-imports.ts
rm test-imports.ts

# 예상 출력: Types imported successfully, 오후 X:XX, true
```

### 6.2 수동 검증 체크리스트

**타입 정의 확인:**
- [ ] `types/chat.ts` 파일 존재 및 Message, ChatSession, ChatState 타입 정의
- [ ] `types/api.ts` 파일 존재 및 API 타입 정의
- [ ] `types/gemini.ts` 파일 존재 및 Gemini 타입 정의

**유틸리티 함수 확인:**
- [ ] `formatTime(Date.now())` 실행 시 "오전/오후 H:MM" 형식 반환
- [ ] `generateId()` 실행 시 UUID 형식 문자열 반환
- [ ] `cn('a', false, 'b')` 실행 시 "a b" 반환
- [ ] `isValidMessage('')` 실행 시 false 반환
- [ ] `isValidMessage('Valid message')` 실행 시 true 반환

**상수 확인:**
- [ ] `STORAGE.KEY === 'devgod_chat_storage'`
- [ ] `API.MAX_MESSAGE_LENGTH === 4000`
- [ ] `UI.COLORS.USER_BUBBLE === '#FAE100'`

### 6.3 테스트 코드 (선택)

**`lib/__tests__/utils.test.ts` 생성 (AGENT_08에서 상세히 작성):**

```typescript
import { formatTime, generateId, cn, isValidMessage, truncateText } from '../utils';

describe('utils', () => {
  describe('formatTime', () => {
    it('should format timestamp correctly', () => {
      // 2025-01-30 20:08:00
      const timestamp = new Date('2025-01-30T20:08:00').getTime();
      expect(formatTime(timestamp)).toBe('오후 8:08');
    });

    it('should format morning time correctly', () => {
      const timestamp = new Date('2025-01-30T09:30:00').getTime();
      expect(formatTime(timestamp)).toBe('오전 9:30');
    });
  });

  describe('generateId', () => {
    it('should generate UUID format', () => {
      const id = generateId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });
  });

  describe('cn', () => {
    it('should combine class names', () => {
      expect(cn('a', 'b', 'c')).toBe('a b c');
    });

    it('should filter falsy values', () => {
      expect(cn('a', false, 'b', undefined, null, 'c')).toBe('a b c');
    });
  });

  describe('isValidMessage', () => {
    it('should return false for empty string', () => {
      expect(isValidMessage('')).toBe(false);
      expect(isValidMessage('   ')).toBe(false);
    });

    it('should return true for valid message', () => {
      expect(isValidMessage('Hello')).toBe(true);
    });

    it('should return false for too long message', () => {
      const longMessage = 'a'.repeat(4001);
      expect(isValidMessage(longMessage)).toBe(false);
    });
  });
});
```

---

## 7. Handoff

### 7.1 다음 에이전트
- **AGENT_03** (API Integration) - 병렬 가능
- **AGENT_04** (UI Components) - 병렬 가능
- **AGENT_05** (Container) - 의존 (AGENT_03, 04 완료 후)
- **AGENT_06** (Storage) - 병렬 가능

### 7.2 전달 사항

**완료된 작업:**
- ✅ 핵심 타입 정의 (Message, ChatSession, ChatState)
- ✅ API 타입 정의 (ChatRequest, ErrorResponse, ErrorCode)
- ✅ Gemini 타입 정의 (GeminiMessage, GeminiHistory)
- ✅ 유틸리티 함수 (formatTime, generateId, cn 등)
- ✅ 타입 가드 함수 (isMessage, isChatSession 등)
- ✅ 프로젝트 상수 (STORAGE, API, UI)

**AGENT_03를 위한 정보:**
- API 타입: `types/api.ts`에서 import
- Gemini 타입: `types/gemini.ts`에서 import
- 상수: `lib/constants.ts`의 `API` 사용

**AGENT_04를 위한 정보:**
- UI 타입: `types/chat.ts`의 Message 사용
- 유틸리티: `lib/utils.ts`의 formatTime, cn 사용
- 상수: `lib/constants.ts`의 `UI` 사용

**AGENT_05를 위한 정보:**
- 모든 타입 사용 가능
- utils.ts의 generateId, debounce 사용

**AGENT_06를 위한 정보:**
- Storage 타입: `types/chat.ts`의 ChatState, ChatSession
- 상수: `lib/constants.ts`의 `STORAGE` 사용
- 타입 가드: `lib/type-guards.ts` 사용

**알려진 이슈:**
- 없음

**주의 사항:**
- 모든 타입 import 시 `@/` alias 사용
- formatTime은 한국 시간대 가정 (별도 timezone 처리 없음)

---

### 7.3 Handoff 문서 작성

**`docs/tasks/handoffs/AGENT_02_HANDOFF.md` 생성:**

```markdown
# Agent 02 Handoff

## Completed Tasks
- [x] 핵심 타입 정의 (types/chat.ts)
- [x] API 타입 정의 (types/api.ts)
- [x] Gemini 타입 정의 (types/gemini.ts)
- [x] 유틸리티 함수 (lib/utils.ts)
- [x] 타입 가드 (lib/type-guards.ts)
- [x] 상수 정의 (lib/constants.ts)

## Created Files
- types/chat.ts
- types/api.ts
- types/gemini.ts
- lib/utils.ts
- lib/type-guards.ts
- lib/constants.ts

## Exported Types
**types/chat.ts:**
- Message, ChatSession, ChatState
- STORAGE_CONSTRAINTS

**types/api.ts:**
- ChatMessage, ChatRequest, StreamChunk, ErrorResponse
- ErrorCode enum
- API_CONSTRAINTS

**types/gemini.ts:**
- GeminiMessage, GeminiHistory
- SystemPromptConfig

## Exported Functions
**lib/utils.ts:**
- formatTime(timestamp) - "오후 8:08" 형식
- generateId() - UUID v4
- cn(...classes) - 클래스명 결합
- truncateText(text, maxLength)
- isValidMessage(message)
- debounce(fn, delay)

**lib/type-guards.ts:**
- isMessage(value)
- isChatSession(value)
- isChatState(value)

## Constants
**lib/constants.ts:**
- STORAGE (KEY, MAX_SIZE, etc.)
- API (ENDPOINT, MAX_MESSAGE_LENGTH, etc.)
- UI (COLORS, MESSAGE_MAX_WIDTH, etc.)
- APP (NAME, BOT_NAME)

## Known Issues
- None

## Next Agent Notes
**For AGENT_03 (API):**
```typescript
import { ChatRequest, ErrorResponse, ErrorCode } from '@/types/api';
import { GeminiMessage } from '@/types/gemini';
import { API } from '@/lib/constants';
```

**For AGENT_04 (UI):**
```typescript
import { Message } from '@/types/chat';
import { formatTime, cn } from '@/lib/utils';
import { UI } from '@/lib/constants';
```

**For AGENT_06 (Storage):**
```typescript
import { ChatState, ChatSession } from '@/types/chat';
import { isMessage, isChatState } from '@/lib/type-guards';
import { STORAGE } from '@/lib/constants';
import { generateId } from '@/lib/utils';
```

## Verification Passed
- ✅ npx tsc --noEmit
- ✅ npm run lint
- ✅ All types properly exported
- ✅ Utility functions tested manually
```

---

**Agent 02 작업 완료 ✅**

다음: `AGENT_TASK_03_API.md` (병렬 가능)