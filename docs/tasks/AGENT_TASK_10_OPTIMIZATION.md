# Agent Task 10: Optimization
## 성능 최적화 및 프로덕션 준비

**Agent ID:** AGENT_10
**소요 시간:** 0.5일
**의존성:** AGENT_01-09 완료
**다음 Agent:** 없음 (최종)

---

## 1. Context

### 작업 목표
번들 최적화, 메모이제이션, 가상화를 통해 성능을 향상시키고 프로덕션 배포를 준비합니다.

### 관련 요구사항
- NFR-006: 성능 (LCP < 2.5s, 번들 < 500KB)
- NFR-003: 반응형 UI

---

## 2. Prerequisites

```bash
# AGENT_01-09 완료 확인
npm run test
npm run test:e2e
npm run build
```

---

## 3. Task Details

### Step 1: 번들 분석 및 최적화

**패키지 설치:**
```bash
npm install -D @next/bundle-analyzer
```

**`next.config.mjs` 업데이트:**
```javascript
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Optimize dependencies
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-markdown',
      'react-syntax-highlighter',
    ],
  },

  // Production optimizations
  swcMinify: true,
};

export default bundleAnalyzer(nextConfig);
```

**`package.json` scripts 추가:**
```json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build"
  }
}
```

### Step 2: 코드 스플리팅

**`components/chat/ChatMessage.tsx` 업데이트 (동적 import):**
```typescript
'use client';

import { memo, lazy, Suspense } from 'react';
import { Message } from '@/types/api';
import { formatTime } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

// Dynamic imports for heavy dependencies
const ReactMarkdown = lazy(() => import('react-markdown'));
const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter').then((mod) => ({
    default: mod.Prism,
  }))
);

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = memo(function ChatMessage({
  message,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-2 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-gray-800" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-lg px-4 py-2 max-w-[70%] break-words ${
            isUser
              ? 'bg-[#FAE100] text-gray-900'
              : 'bg-white border border-gray-200 text-gray-900'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Suspense fallback={<div className="animate-pulse">로딩 중...</div>}>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <Suspense fallback={<pre>{children}</pre>}>
                          <SyntaxHighlighter
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </Suspense>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </Suspense>
          )}

          {message.isStreaming && (
            <span className="inline-block w-1 h-4 bg-gray-900 animate-pulse ml-1" />
          )}
        </div>

        <span className="text-xs text-gray-500 mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-gray-700" />
        </div>
      )}
    </div>
  );
});
```

### Step 3: 가상화 (많은 메시지 처리)

**패키지 설치:**
```bash
npm install react-window
npm install -D @types/react-window
```

**`components/chat/VirtualizedMessageList.tsx` 생성:**
```typescript
'use client';

import { useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import { ChatMessage } from './ChatMessage';
import { Message } from '@/types/api';

interface VirtualizedMessageListProps {
  messages: Message[];
  height: number;
}

export function VirtualizedMessageList({
  messages,
  height,
}: VirtualizedMessageListProps) {
  const listRef = useRef<List>(null);
  const rowHeights = useRef<{ [key: number]: number }>({});

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages]);

  const getRowHeight = (index: number) => {
    return rowHeights.current[index] || 100; // Default estimated height
  };

  const setRowHeight = (index: number, size: number) => {
    if (listRef.current && rowHeights.current[index] !== size) {
      rowHeights.current[index] = size;
      listRef.current.resetAfterIndex(index);
    }
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const rowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.clientHeight);
      }
    }, [index]);

    return (
      <div style={style} ref={rowRef}>
        <ChatMessage message={messages[index]} />
      </div>
    );
  };

  // Only use virtualization for > 50 messages
  if (messages.length <= 50) {
    return (
      <>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </>
    );
  }

  return (
    <List
      ref={listRef}
      height={height}
      itemCount={messages.length}
      itemSize={getRowHeight}
      width="100%"
      overscanCount={5}
    >
      {Row}
    </List>
  );
}
```

### Step 4: 메모이제이션 최적화

**`components/chat/ChatInput.tsx` 업데이트:**
```typescript
'use client';

import { useState, KeyboardEvent, useRef, useEffect, memo, useCallback } from 'react';
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

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed && !disabled && trimmed.length <= API.MAX_MESSAGE_LENGTH) {
      onSend(trimmed);
      setInput('');
    }
  }, [input, disabled, onSend]);

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
      <div className="flex gap-2 items-end">
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
          className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 rounded-lg p-3 transition-colors flex-shrink-0"
          aria-label="전송"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});
```

### Step 5: 프로덕션 환경 변수 설정

**`.env.production` 생성:**
```bash
GEMINI_API_KEY=your_production_key_here
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**`.gitignore` 업데이트:**
```
.env*.local
.env.production
```

### Step 6: Vercel 배포 설정

**`vercel.json` 생성:**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["icn1"],
  "env": {
    "GEMINI_API_KEY": "@gemini-api-key"
  }
}
```

---

## 4. Verification

```bash
# 1. 번들 분석
npm run analyze

# 2. 빌드 크기 확인
npm run build
# 예상: First Load JS < 500KB

# 3. Lighthouse 점수 확인
npx lighthouse http://localhost:3000 --view

# 목표:
# - Performance: >= 90
# - Accessibility: >= 95
# - Best Practices: >= 90
# - SEO: >= 90

# 4. 전체 테스트
npm test
npm run test:e2e
```

### 성능 목표
- ✅ LCP < 2.5s
- ✅ FID < 100ms
- ✅ CLS < 0.1
- ✅ First Load JS < 500KB
- ✅ Build time < 2min

---

## 5. Final Handoff

### 완료 사항
- ✅ 번들 최적화 (동적 import)
- ✅ 코드 스플리팅
- ✅ 메모이제이션 (memo, useCallback)
- ✅ 가상화 (50개 이상 메시지)
- ✅ 프로덕션 설정
- ✅ Vercel 배포 준비

### 배포 체크리스트
- [ ] `.env.production` 설정
- [ ] Vercel 환경 변수 설정 (GEMINI_API_KEY)
- [ ] 도메인 연결 (선택)
- [ ] 모니터링 설정 (Vercel Analytics)
- [ ] 에러 트래킹 (Sentry 등, 선택)

### 프로젝트 완료 메트릭
```
✅ 10개 에이전트 작업 완료
✅ 단위 테스트 커버리지 >= 80%
✅ E2E 테스트 통과
✅ Lighthouse Performance >= 90
✅ 번들 크기 < 500KB
✅ 프로덕션 배포 준비 완료
```

---

**🎉 Agent 10 작업 완료 - 전체 프로젝트 완료! 🎉**
