# Technical Specification
## 개발의신 챗봇 기술 사양서

**문서 버전:** 1.0
**작성일:** 2025-01-30
**프로젝트:** 개발의신 - Gemini API 기반 개발 Q&A 챗봇

---

## 1. 시스템 아키텍처

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React Client (Next.js)                    │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ChatContainer│  │  ChatMessage │  │  ChatInput   │  │  │
│  │  └──────┬──────┘  └──────────────┘  └──────┬───────┘  │  │
│  │         │                                    │          │  │
│  │         └────────────┬───────────────────────┘          │  │
│  │                      │                                  │  │
│  │           ┌──────────▼──────────┐                       │  │
│  │           │   useChat Hook      │                       │  │
│  │           └──────────┬──────────┘                       │  │
│  │                      │                                  │  │
│  │     ┌────────────────┼────────────────┐                │  │
│  │     │                │                │                │  │
│  │  ┌──▼──────────┐  ┌─▼────────────┐  │                │  │
│  │  │localStorage │  │  Fetch API   │  │                │  │
│  │  └─────────────┘  └──────┬───────┘  │                │  │
│  └──────────────────────────┼──────────────────────────┘  │  │
└────────────────────────────┼───────────────────────────────┘
                              │ HTTPS
                              │
                    ┌─────────▼──────────┐
                    │  Vercel Platform   │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                                       │
    ┌─────▼──────┐                    ┌──────────▼─────────┐
    │ Static Assets │                    │  API Routes       │
    │  (HTML/CSS/JS)│                    │  /api/chat        │
    └──────────────┘                    └──────────┬─────────┘
                                                   │
                                                   │ Server-Sent Events
                                                   │
                                         ┌─────────▼──────────┐
                                         │   Gemini Service   │
                                         │  (Google AI API)   │
                                         └────────────────────┘
```

### 1.2 Component Architecture

```
app/                              # Next.js App Router
├── api/
│   └── chat/
│       └── route.ts              # POST /api/chat - SSE streaming endpoint
├── layout.tsx                    # Root layout with fonts, metadata
├── page.tsx                      # Main page (renders ChatContainer)
└── globals.css                   # Global styles (Tailwind + custom)

components/                       # React Components
├── chat/
│   ├── ChatContainer.tsx         # Main chat logic, state management
│   ├── ChatMessage.tsx           # Individual message bubble
│   ├── ChatInput.tsx             # Message input with auto-resize
│   └── ChatHeader.tsx            # App header with title
└── ui/                           # Reusable UI components

lib/                              # Business Logic
├── gemini.ts                     # Gemini API client & formatters
├── storage.ts                    # localStorage management
├── utils.ts                      # Helper functions (formatTime, cn)
└── systemPrompt.txt              # AI personality definition

hooks/                            # Custom React Hooks
└── useChat.ts                    # Chat state & localStorage integration

types/                            # TypeScript Definitions
├── chat.ts                       # Message, ChatSession, ChatState
└── api.ts                        # ChatRequest, StreamChunk, ErrorResponse
```

---

## 2. 데이터 모델

### 2.1 Core Data Types

#### Message
```typescript
interface Message {
  id: string;                    // UUID v4
  role: 'user' | 'assistant';   // Message sender
  content: string;               // Message text (1-4000 chars)
  timestamp: number;             // Unix timestamp (milliseconds)
  isStreaming?: boolean;         // True during active streaming
}
```

**Constraints:**
- `id`: Must be unique within session
- `content`: Max 4000 characters
- `timestamp`: Must be valid Unix timestamp
- `isStreaming`: Only applicable to assistant messages

---

#### ChatSession
```typescript
interface ChatSession {
  id: string;                    // UUID v4
  title: string;                 // Session title (max 30 chars)
  messages: Message[];           // Conversation history
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp (auto-updated)
}
```

**Constraints:**
- `id`: Must be unique globally
- `title`: Defaults to first message (truncated to 30 chars)
- `messages`: Max 100 messages per session
- `updatedAt`: Updated on every message add/update

---

#### ChatState (localStorage)
```typescript
interface ChatState {
  sessions: ChatSession[];       // All chat sessions
  activeSessionId: string | null; // Currently active session
  version: number;                // Schema version (for migration)
}
```

**Storage Key:** `devgod_chat_storage`
**Max Size:** 5MB
**Constraints:**
- Max 20 sessions
- Oldest sessions auto-deleted on quota exceed

---

### 2.2 API Data Types

#### ChatRequest (POST /api/chat)
```typescript
interface ChatRequest {
  message: string;               // User message (1-4000 chars)
  history?: ChatMessage[];       // Last 10 messages max
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

**Validation Rules:**
- `message`: Required, non-empty, max 4000 chars
- `history`: Optional, max 10 items

---

#### StreamChunk (SSE Response)
```
data: {"text": "chunk of text"}\n\n
data: {"text": "more text"}\n\n
data: [DONE]\n\n
```

**Format:** Server-Sent Events (text/event-stream)
**Encoding:** UTF-8
**Terminator:** `data: [DONE]\n\n`

---

### 2.3 Gemini API Format

#### History Conversion
```typescript
// Client format → Gemini format
{
  role: 'user' | 'assistant',
  content: string
}
    ↓ convertHistoryToGeminiFormat()
    ↓
{
  role: 'user' | 'model',      // 'assistant' → 'model'
  parts: [{ text: string }]
}
```

---

## 3. API 사양

### 3.1 POST /api/chat

**Endpoint:** `/api/chat`
**Method:** `POST`
**Content-Type:** `application/json`
**Response-Type:** `text/event-stream`

#### Request Schema
```json
{
  "message": "TypeScript의 장점은?",
  "history": [
    { "role": "user", "content": "안녕하세요" },
    { "role": "assistant", "content": "안녕하세요! 무엇을 도와드릴까요?" }
  ]
}
```

#### Success Response (200 OK)
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"text":"TypeScript는 "}\n\n
data: {"text":"정적 타입을 제공하여 "}\n\n
data: {"text":"런타임 에러를 줄입니다."}\n\n
data: [DONE]\n\n
```

#### Error Responses

**400 Bad Request - Invalid Message**
```json
{
  "error": "메시지가 유효하지 않습니다.",
  "code": "INVALID_MESSAGE"
}
```

**500 Internal Server Error - API Key Missing**
```json
{
  "error": "서비스 구성 오류입니다.",
  "code": "CONFIG_ERROR"
}
```

**500 Internal Server Error - Gemini API Failure**
```json
{
  "error": "메시지 처리 중 오류가 발생했습니다.",
  "code": "API_ERROR"
}
```

**504 Gateway Timeout - Request Timeout**
```json
{
  "error": "응답 시간이 초과되었습니다.",
  "code": "TIMEOUT"
}
```

---

### 3.2 Streaming Protocol

**Server-Sent Events (SSE) Specification**

```
event: (optional, default: message)
data: <JSON string>
id: (optional, for reconnection)

// Newline separators
```

**Implementation:**
1. Server creates `ReadableStream`
2. For each Gemini chunk:
   - Encode as JSON: `{"text": "..."}`
   - Prefix with `data: `
   - Suffix with `\n\n`
3. On completion, send `data: [DONE]\n\n`
4. Close stream

**Client Handling:**
1. Use `fetch()` with streaming
2. Get `ReadableStream` from response.body
3. Use `TextDecoder` to decode chunks
4. Parse `data: ` lines
5. Stop on `[DONE]` marker

---

### 3.3 Error Handling Strategy

#### Gemini API Errors

| Gemini Error | HTTP Status | Client Message | Recovery |
|-------------|-------------|----------------|----------|
| `PERMISSION_DENIED` | 401 | "API 인증 실패" | Check API key |
| `RESOURCE_EXHAUSTED` | 429 | "할당량 초과" | Rate limiting |
| `INVALID_ARGUMENT` | 400 | "잘못된 요청" | Validate input |
| `DEADLINE_EXCEEDED` | 504 | "응답 시간 초과" | Retry with timeout |
| `INTERNAL` | 500 | "서비스 오류" | Exponential backoff |

#### Client-Side Errors

| Error | Detection | Recovery |
|-------|-----------|----------|
| Network offline | `fetch()` throws | Show offline banner, queue message |
| localStorage full | `QuotaExceededError` | Auto-cleanup, show warning |
| SSE parse error | `JSON.parse()` throws | Skip chunk, continue stream |
| API timeout | 30s timer | Abort fetch, show retry button |

---

## 4. 시스템 컴포넌트 상세

### 4.1 ChatContainer Component

**책임:**
- 전체 채팅 UI 관리
- 메시지 송수신 로직
- 스트리밍 상태 관리
- 스크롤 자동 조정

**State:**
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [isStreaming, setIsStreaming] = useState(false);
const messagesEndRef = useRef<HTMLDivElement>(null);
```

**Key Methods:**
- `sendMessage(content: string): Promise<void>` - Send user message, handle streaming response
- Auto-scroll effect on messages change

**Dependencies:**
- `useChat()` hook for localStorage integration
- `ChatHeader`, `ChatMessage`, `ChatInput` subcomponents

---

### 4.2 useChat Hook

**책임:**
- localStorage와 React state 동기화
- 세션 관리 (CRUD)
- 메시지 추가/업데이트

**API:**
```typescript
interface UseChatReturn {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  createNewSession: () => ChatSession;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  clearHistory: () => void;
}
```

**Implementation:**
- On mount: Load `ChatStorage.getActiveSession()`
- On `addMessage`: Save to localStorage + update state
- On `updateMessage`: Debounced save during streaming

---

### 4.3 ChatStorage Service

**책임:**
- localStorage CRUD 작업
- 용량 관리 및 자동 정리
- 데이터 마이그레이션

**Key Methods:**
```typescript
class ChatStorage {
  static getData(): ChatState;
  static saveData(data: ChatState): void;
  static getActiveSession(): ChatSession | null;
  static createSession(title?: string): ChatSession;
  static addMessage(sessionId: string, message: Message): void;
  static updateMessage(sessionId: string, messageId: string, updates: Partial<Message>): void;
  static deleteSession(sessionId: string): void;
  static enforceStorageLimit(data: ChatState): void;
  static cleanup(data: ChatState): void;
}
```

**Storage Limits:**
- `MAX_STORAGE_SIZE`: 5MB
- `MAX_SESSIONS`: 20
- `MAX_MESSAGES_PER_SESSION`: 100

**Cleanup Logic:**
1. Sort sessions by `updatedAt` (newest first)
2. Keep top 20 sessions
3. For each session, keep last 100 messages
4. If still exceeds 5MB, keep top 10 sessions

---

### 4.4 Gemini Service

**책임:**
- Gemini API 초기화
- 시스템 프롬프트 로드
- 히스토리 형식 변환

**Key Functions:**
```typescript
function getGeminiModel(): GenerativeModel;
function loadSystemPrompt(): string;
function convertHistoryToGeminiFormat(history: ChatMessage[]): GeminiHistory[];
```

**System Prompt:**
- **Location:** `lib/systemPrompt.txt`
- **Encoding:** UTF-8
- **Purpose:** Define chatbot personality and behavior
- **Fallback:** Default prompt if file read fails

**Model Configuration:**
```typescript
{
  model: 'gemini-1.5-pro',
  systemInstruction: loadSystemPrompt(),
  // Temperature, topK, topP use Gemini defaults
}
```

---

## 5. 성능 최적화

### 5.1 Code Splitting

**Next.js Automatic Splitting:**
- Each route is separate chunk
- Components dynamically imported as needed

**Manual Splitting (Future):**
```typescript
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false
});
```

---

### 5.2 Message Rendering

**Current:**
- Render all messages in list
- Auto-scroll on every message update

**Optimization (Future - if >50 messages):**
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <ChatMessage message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

---

### 5.3 Streaming Updates

**Problem:** Every chunk triggers state update → re-render

**Solution:** Batching
```typescript
// Current: Immediate update
updateMessage(id, { content: fullContent });

// Optimized: Debounced batching
const debouncedUpdate = useMemo(
  () => debounce((id, content) => {
    updateMessage(id, { content });
  }, 100), // Update max once per 100ms
  []
);
```

---

### 5.4 Bundle Size

**Target:** < 200KB gzipped

**Strategies:**
- Tree-shaking (automatic with Next.js)
- Remove unused dependencies
- Use `next/dynamic` for large components
- Compress images with `next/image`

**Measurement:**
```bash
ANALYZE=true npm run build
# Opens bundle analyzer in browser
```

---

## 6. 보안 사양

### 6.1 API Key Protection

**Requirements:**
- NEVER send GEMINI_API_KEY to client
- Store in server-side environment variable
- Validate at runtime (not module load)

**Implementation:**
```typescript
// app/api/chat/route.ts
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Log server-side, safe message to client
    console.error('[SECURITY] GEMINI_API_KEY not configured');
    return NextResponse.json(
      { error: '서비스 구성 오류입니다.' },
      { status: 500 }
    );
  }
  // ... rest of handler
}
```

---

### 6.2 Content Security Policy

```javascript
// next.config.js
headers: [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval'",  // Next.js requirement
      "style-src 'self' 'unsafe-inline'", // Tailwind requirement
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://generativelanguage.googleapis.com"
    ].join('; ')
  }
]
```

---

### 6.3 Rate Limiting

**Vercel Edge Middleware (Future):**
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 req/min
});

export async function middleware(req: NextRequest) {
  const ip = req.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}
```

---

### 6.4 Input Sanitization

**User Input:**
- Max length validation (4000 chars)
- HTML escaping (React automatic)
- No script injection (CSP blocks)

**Markdown Rendering:**
- Use safe markdown parser (`react-markdown`)
- Disable HTML in markdown
- Sanitize URLs

```typescript
import ReactMarkdown from 'react-markdown';

<ReactMarkdown
  disallowedElements={['script', 'iframe']}
  unwrapDisallowed={true}
>
  {message.content}
</ReactMarkdown>
```

---

## 7. 배포 아키텍처

### 7.1 Vercel Deployment

**Platform:** Vercel (Serverless)
**Region:** Auto (Edge Network)
**Build Command:** `npm run build`
**Output Directory:** `.next`
**Install Command:** `npm install`

**Environment Variables:**
```
GEMINI_API_KEY=<secret>
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

**Automatic Features:**
- HTTPS (Let's Encrypt)
- CDN caching for static assets
- Serverless function per API route
- Preview deployments on PR

---

### 7.2 Docker Deployment (Alternative)

**Dockerfile:** `docker/Dockerfile`

**Multi-stage Build:**
1. **deps:** Install dependencies
2. **builder:** Build Next.js app
3. **runner:** Production image (standalone)

**Build:**
```bash
docker build -t devgod-chatbot -f docker/Dockerfile .
```

**Run:**
```bash
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  devgod-chatbot
```

---

### 7.3 CI/CD Pipeline (Future)

**GitHub Actions Workflow:**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 8. 모니터링 및 로깅

### 8.1 클라이언트 모니터링

**Vercel Analytics:**
- Core Web Vitals (LCP, FID, CLS)
- Real user monitoring
- Geographic distribution

**Custom Events:**
```typescript
// Track user actions
function trackEvent(name: string, properties?: object) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, properties);
  }
}

// Usage
trackEvent('message_sent', { message_length: content.length });
trackEvent('session_created');
trackEvent('storage_cleanup_triggered');
```

---

### 8.2 서버 로깅

**Console Logging (Development):**
```typescript
console.log('[API] Received message:', { length: message.length });
console.error('[ERROR] Gemini API failed:', error);
```

**Structured Logging (Production):**
```typescript
// Future: Use pino or winston
logger.info({
  event: 'message_received',
  messageLength: message.length,
  historyLength: history.length,
  timestamp: new Date().toISOString()
});

logger.error({
  event: 'gemini_api_error',
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

---

### 8.3 Error Tracking (Future)

**Sentry Integration:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Automatic error capture
try {
  // ... code
} catch (error) {
  Sentry.captureException(error, {
    extra: { context: 'chat_api' }
  });
  throw error;
}
```

---

## 9. 확장 가능성 (Future Enhancements)

### 9.1 다국어 지원 (i18n)

**Libraries:** `next-intl` or `react-i18next`

**Structure:**
```
├── locales/
│   ├── ko.json
│   ├── en.json
│   └── ja.json
└── lib/
    ├── systemPrompt.ko.txt
    ├── systemPrompt.en.txt
    └── systemPrompt.ja.txt
```

---

### 9.2 음성 입력

**Web Speech API:**
```typescript
const recognition = new webkitSpeechRecognition();
recognition.lang = 'ko-KR';
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  setInput(transcript);
};
```

---

### 9.3 코드 실행 환경

**Sandboxed Execution:**
- Integrate with CodeSandbox API
- Run user code examples
- Show output in chat

---

### 9.4 대화 공유

**Share Session:**
```typescript
// Generate shareable link
const shareSession = (sessionId: string) => {
  const session = ChatStorage.getSession(sessionId);
  const encoded = btoa(JSON.stringify(session));
  return `${window.location.origin}/share/${encoded}`;
};
```

---

## 10. 참고 자료

### 10.1 기술 스택 문서
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Gemini API Reference](https://ai.google.dev/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### 10.2 프로젝트 문서
- `REQUIREMENTS.md` - 요구사항 명세
- `API_CONTRACT.yaml` - API 계약서
- `TEST_SPECIFICATIONS.md` - 테스트 명세
- `ERROR_RECOVERY.md` - 에러 복구 전략
- `EXECUTION_PLAN.md` - 실행 계획

### 10.3 코드 레퍼런스
- `app/api/chat/route.ts` - API 구현
- `lib/gemini.ts` - Gemini 클라이언트
- `lib/storage.ts` - 스토리지 관리
- `components/chat/ChatContainer.tsx` - 메인 컴포넌트

---

## 11. 용어 정의

| 용어 | 정의 |
|-----|------|
| SSE | Server-Sent Events - 서버에서 클라이언트로 단방향 실시간 스트리밍 |
| Gemini | Google의 대규모 언어 모델 (LLM) |
| localStorage | 브라우저 로컬 스토리지 (최대 5-10MB) |
| Streaming | 데이터를 청크 단위로 점진적 전송 |
| Hydration | 서버 렌더링된 HTML에 React 이벤트 핸들러 연결 |
| Edge Network | 전 세계 분산 CDN 노드 |
| Serverless | 서버 관리 없이 함수 단위 실행 |

---

**문서 종료**
