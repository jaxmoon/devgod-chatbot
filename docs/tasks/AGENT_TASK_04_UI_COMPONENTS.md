# Agent Task 04: UI Components
## 기본 UI 컴포넌트 구현

**Agent ID:** AGENT_04
**소요 시간:** 1.5일
**의존성:** AGENT_02 완료
**다음 Agent:** AGENT_05 (Container)

---

## 1. Context

### 작업 목표
KakaoTalk 스타일 채팅 UI 컴포넌트(ChatHeader, ChatMessage, ChatInput)를 구현합니다.

### 관련 요구사항
- FR-003: 대화 히스토리 표시 (말풍선 스타일)
- FR-004: 시각적 피드백 (스트리밍 애니메이션)
- NFR-003: 반응형 UI

---

## 2. Prerequisites

```bash
# AGENT_01, 02 완료 확인
ls types/api.ts components/
npm run dev  # 개발 서버 동작 확인
```

---

## 3. Task Details

### UI 디자인 스펙 (KakaoTalk 스타일)

**참고 이미지 기반 상세 스타일 가이드:**

#### 배경 및 레이아웃
- **채팅방 배경색**: `#B2C7DA` (연한 파란색)
- **헤더 배경색**: `#FFFFFF` (흰색)
- **메시지 간격**: 각 메시지 간 `mb-3` (12px)

#### 봇 메시지 스타일
- **말풍선 배경**: `#FFFFFF` (흰색)
- **테두리**: 없음 (그림자 사용)
- **둥근 모서리**: `rounded-2xl` (16px)
- **패딩**: `px-3 py-2.5`
- **최대 너비**: `max-w-[75%]`
- **그림자**: `shadow-sm`
- **아바타 위치**: 왼쪽 상단
- **아바타 크기**: `w-10 h-10` (40px)
- **봇 이름 표시**: 아바타 위에 "개발의신" 텍스트 (`text-xs text-gray-700 mb-1`)
- **시간 표시**: 말풍선 바깥 오른쪽 하단 (`text-xs text-gray-600`)

#### 사용자 메시지 스타일
- **말풍선 배경**: `#FAE100` (카카오톡 노란색)
- **텍스트 색상**: `#000000` (검정)
- **둥근 모서리**: `rounded-2xl` (16px)
- **패딩**: `px-3 py-2.5`
- **최대 너비**: `max-w-[75%]`
- **그림자**: `shadow-sm`
- **정렬**: 오른쪽
- **시간 표시**: 말풍선 바깥 왼쪽 하단 (`text-xs text-gray-600`)

#### 시간 포맷
- **형식**: "오후 8:08" (12시간 형식, 한글)
- **위치**: 말풍선과 같은 줄, 약간의 간격(`gap-2`)

#### 이미지 지원
- 봇이 이미지를 전송할 수 있어야 함
- 이미지는 말풍선 내부에 표시
- 최대 너비: 말풍선 최대 너비와 동일
- 둥근 모서리: `rounded-lg`

---

### Step 1: ChatHeader 컴포넌트

**`components/chat/ChatHeader.tsx` 생성:**
```typescript
'use client';

import { ArrowLeft, Search, Menu } from 'lucide-react';

export function ChatHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button className="text-gray-700 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-semibold text-gray-900 text-lg">개발의신</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-gray-700 hover:text-gray-900">
          <Search className="w-5 h-5" />
        </button>
        <button className="text-gray-700 hover:text-gray-900">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
```

### Step 2: ChatMessage 컴포넌트

**`components/chat/ChatMessage.tsx` 생성:**
```typescript
'use client';

import { memo } from 'react';
import { Message } from '@/types/api';
import { formatTime } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Image from 'next/image';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = memo(function ChatMessage({
  message,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* 봇 아바타 (왼쪽만) */}
      {!isUser && (
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            <Image
              src="/bot-avatar.png"
              alt="개발의신"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {/* 봇 이름 (봇 메시지만) */}
        {!isUser && (
          <span className="text-xs text-gray-700 mb-1 px-1">개발의신</span>
        )}

        {/* 말풍선과 시간을 같은 줄에 배치 */}
        <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* 말풍선 */}
          <div
            className={`rounded-2xl px-3 py-2.5 break-words shadow-sm ${
              isUser
                ? 'bg-[#FAE100] text-black'
                : 'bg-white text-gray-900'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    img({ node, src, alt, ...props }) {
                      return (
                        <Image
                          src={src || ''}
                          alt={alt || ''}
                          width={300}
                          height={200}
                          className="rounded-lg max-w-full h-auto"
                          {...props}
                        />
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {message.isStreaming && (
              <span className="inline-block w-1 h-4 bg-gray-900 animate-pulse ml-1" />
            )}
          </div>

          {/* 시간 표시 */}
          <span className="text-xs text-gray-600 whitespace-nowrap pb-1">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
});
```

### Step 3: ChatInput 컴포넌트

**`components/chat/ChatInput.tsx` 생성:**
```typescript
'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { API } from '@/lib/constants';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
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

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled && trimmed.length <= API.MAX_MESSAGE_LENGTH) {
      onSend(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
}
```

### Step 4: 패키지 설치

```bash
npm install react-markdown remark-gfm rehype-raw
npm install react-syntax-highlighter
npm install -D @types/react-syntax-highlighter
```

### Step 5: Tailwind Typography 설정

**`tailwind.config.ts` 수정:**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'kakao-bg': '#B2C7DA',
        'kakao-yellow': '#FAE100',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
```

```bash
npm install -D @tailwindcss/typography
```

### Step 6: 글로벌 스타일 설정 (배경색)

**`app/globals.css` 수정:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* 채팅방 배경색 */
.chat-background {
  background-color: #B2C7DA;
}
```

---

## 4. Verification

```bash
# 1. 타입 체크
npx tsc --noEmit

# 2. 빌드
npm run build

# 3. 개발 서버에서 확인
npm run dev
# http://localhost:3000 접속 후 컴포넌트 렌더링 확인
```

### 수동 체크리스트 (KakaoTalk 스타일 검증)
- [ ] **배경색**: 채팅방 배경이 `#B2C7DA` (연한 파란색)인가?
- [ ] **헤더**: 뒤로가기, 제목, 검색, 메뉴 아이콘이 표시되는가?
- [ ] **봇 메시지**:
  - [ ] 왼쪽 정렬인가?
  - [ ] 아바타 이미지가 왼쪽 상단에 표시되는가?
  - [ ] "개발의신" 이름이 아바타 위에 표시되는가?
  - [ ] 말풍선이 흰색 배경 + 그림자 (`shadow-sm`)인가?
  - [ ] 둥근 모서리가 `rounded-2xl` (16px)인가?
  - [ ] 시간이 말풍선 오른쪽에 "오후 8:08" 형식으로 표시되는가?
- [ ] **사용자 메시지**:
  - [ ] 오른쪽 정렬인가?
  - [ ] 말풍선이 노란색 배경 (`#FAE100`)인가?
  - [ ] 둥근 모서리가 `rounded-2xl` (16px)인가?
  - [ ] 시간이 말풍선 왼쪽에 표시되는가?
- [ ] **이미지 지원**: 봇이 이미지를 전송했을 때 말풍선 안에 표시되는가?
- [ ] **마크다운 렌더링**: 코드 블록, 링크 등이 올바르게 렌더링되는가?
- [ ] **입력창**:
  - [ ] Enter로 전송 가능한가?
  - [ ] Shift+Enter로 줄바꿈 가능한가?
  - [ ] 4000자 제한이 작동하는가?

---

## 5. Handoff

### 완료 사항
- ✅ ChatHeader 구현 (KakaoTalk 스타일 헤더)
- ✅ ChatMessage 구현 (마크다운, 코드 하이라이팅, 이미지 지원)
- ✅ ChatInput 구현 (자동 리사이즈, 문자 제한)
- ✅ 반응형 디자인
- ✅ KakaoTalk 스타일 완벽 재현:
  - 연한 파란색 배경 (#B2C7DA)
  - 둥근 말풍선 (rounded-2xl)
  - 봇 아바타 + 이름 표시
  - 시간 표시 위치 (말풍선 바깥)
  - 노란색 사용자 메시지 (#FAE100)
  - 그림자 효과

### AGENT_05를 위한 정보
```typescript
// 컴포넌트 사용 예제
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';

function ChatContainer() {
  const messages: Message[] = [/* ... */];

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader />

      {/* KakaoTalk 스타일 배경색 적용 */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#B2C7DA]">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>

      <ChatInput
        onSend={(text) => {/* API 호출 */}}
        disabled={isLoading}
      />
    </div>
  );
}

// 중요: /public/bot-avatar.png 파일 추가 필요
// 개발의신 봇 아바타 이미지 (40x40px 권장)

```

**Handoff 문서:** `docs/tasks/handoffs/AGENT_04_HANDOFF.md`

---

**Agent 04 작업 완료 ✅**
