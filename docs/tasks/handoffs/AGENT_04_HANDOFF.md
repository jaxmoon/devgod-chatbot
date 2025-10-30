# AGENT_04 Handoff Document

## 작업 완료 내역

### 생성된 컴포넌트
1. **ChatHeader.tsx** - KakaoTalk 스타일 헤더
2. **ChatMessage.tsx** - 말풍선 메시지 컴포넌트 (마크다운, 코드 하이라이팅)
3. **ChatInput.tsx** - 자동 리사이즈 입력창
4. **ChatContainer.tsx** - 임시 플레이스홀더 (AGENT_05에서 완전 구현 예정)

### 생성된 에셋
- **bot-avatar.svg** - 봇 아바타 이미지 (40x40px)

### 수정된 파일
- **tailwind.config.ts** - @tailwindcss/typography 플러그인 추가
- **app/globals.css** - Noto Sans KR 폰트, chat-background 클래스

---

## AGENT_05 (Container)를 위한 가이드

### 사용 예제

```typescript
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message } from '@/types/chat';
import { useState } from 'react';

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text: string) => {
    // 1. 사용자 메시지 추가
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    // 2. 봇 메시지 (스트리밍) 추가
    const botMessageId = generateId();
    const botMessage: Message = {
      id: botMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, botMessage]);

    // 3. API 호출 (스트리밍)
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10), // 최근 10개만
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6); // "data: " 제거
          if (data === '[DONE]') break;

          const parsed = JSON.parse(data);
          fullContent += parsed.text;

          // 메시지 업데이트
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId
              ? { ...msg, content: fullContent, isStreaming: true }
              : msg
          ));
        }
      }

      // 스트리밍 종료
      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? { ...msg, isStreaming: false }
          : msg
      ));
    } catch (error) {
      console.error('API Error:', error);
      // TODO: 에러 처리
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader />

      {/* 메시지 영역 - KakaoTalk 배경색 */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#B2C7DA]">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={isLoading}
        placeholder="메시지를 입력하세요..."
      />
    </div>
  );
}
```

---

## 컴포넌트 API

### ChatHeader
```typescript
export function ChatHeader(): JSX.Element
```
- Props: 없음
- 기능: 헤더 UI 렌더링 (뒤로가기, 제목, 검색, 메뉴)

### ChatMessage
```typescript
interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = memo(function ChatMessage(props: ChatMessageProps): JSX.Element)
```
- Props:
  - `message`: Message 타입 객체
- 기능:
  - role에 따른 레이아웃 (user: 오른쪽, assistant: 왼쪽)
  - 마크다운 렌더링 (코드 하이라이팅 포함)
  - 스트리밍 인디케이터 (isStreaming=true 시)
  - 시간 표시 (formatTime 활용)
- 최적화: React.memo로 불필요한 재렌더링 방지

### ChatInput
```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput(props: ChatInputProps): JSX.Element
```
- Props:
  - `onSend`: 메시지 전송 콜백 (trim된 텍스트)
  - `disabled`: 입력 비활성화 여부 (기본값: false)
  - `placeholder`: placeholder 텍스트 (기본값: "메시지를 입력하세요...")
- 기능:
  - 자동 리사이즈 (max-h-32)
  - Enter: 전송, Shift+Enter: 줄바꿈
  - 4000자 제한 (실시간 카운터)
  - 제한 초과 시 빨간색 border + 전송 불가

---

## 스타일링 가이드

### KakaoTalk 색상
```typescript
// Tailwind config에 정의됨
- 배경색: #B2C7DA (bg-[#B2C7DA])
- 사용자 말풍선: #FAE100 (bg-[#FAE100])
- 봇 말풍선: #FFFFFF (bg-white)
```

### 클래스 사용 예제
```tsx
// 채팅방 배경
<div className="bg-[#B2C7DA]">
  {/* 또는 */}
<div className="chat-background">

// 말풍선
<div className="rounded-2xl px-3 py-2.5 shadow-sm bg-[#FAE100]">

// 시간 표시
<span className="text-xs text-gray-600">
  {formatTime(timestamp)}
</span>
```

---

## 중요한 구현 노트

### 1. 메시지 스트리밍
- `isStreaming=true`일 때 깜빡이는 커서 표시
- 메시지 내용 업데이트마다 ChatMessage 재렌더링
- 완료 시 `isStreaming=false`로 변경

### 2. 메모이제이션
- ChatMessage는 memo()로 최적화됨
- 메시지가 변경되지 않으면 재렌더링 안 함
- 성능상 중요: 메시지 목록이 길어질수록 효과 큼

### 3. Auto-resize Textarea
- input 값 변경 시 자동 높이 조절
- max-h-32 (128px)로 제한
- useEffect + useRef 활용

### 4. 마크다운 렌더링
- prose 클래스로 기본 스타일링
- 코드 블록: SyntaxHighlighter (oneDark 테마)
- 이미지: Next.js Image 컴포넌트 (최적화)

---

## 알려진 제약사항

### 1. 번들 사이즈
- ReactMarkdown + SyntaxHighlighter: ~263 kB
- 필요 시 동적 import 고려 가능

### 2. 타입 캐스팅
```typescript
style={oneDark as any}  // eslint-disable-next-line
```
- react-syntax-highlighter 타입 정의 불완전
- 런타임 동작에는 문제없음

### 3. 봇 아바타
- 현재: SVG 플레이스홀더
- 추후: 실제 아바타 이미지로 교체 가능 (/public/bot-avatar.svg)

---

## 테스트 가이드

### 1. 컴포넌트 렌더링 테스트
```typescript
import { render, screen } from '@testing-library/react';
import { ChatMessage } from '@/components/chat/ChatMessage';

test('renders user message', () => {
  const message = {
    id: '1',
    role: 'user' as const,
    content: 'Hello',
    timestamp: Date.now(),
  };

  render(<ChatMessage message={message} />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### 2. ChatInput 상호작용 테스트
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '@/components/chat/ChatInput';

test('sends message on Enter', () => {
  const handleSend = jest.fn();
  render(<ChatInput onSend={handleSend} />);

  const textarea = screen.getByPlaceholderText('메시지를 입력하세요...');
  fireEvent.change(textarea, { target: { value: 'Test' } });
  fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

  expect(handleSend).toHaveBeenCalledWith('Test');
});
```

### 3. 마크다운 렌더링 테스트
```typescript
test('renders code block', () => {
  const message = {
    id: '1',
    role: 'assistant' as const,
    content: '```js\nconsole.log("hello");\n```',
    timestamp: Date.now(),
  };

  render(<ChatMessage message={message} />);
  expect(screen.getByText(/console.log/)).toBeInTheDocument();
});
```

---

## 다음 단계

### AGENT_05가 해야 할 일
1. ChatContainer.tsx 완전 구현
   - useChat 훅 통합
   - API 호출 로직
   - 에러 처리
   - 로딩 상태 관리

2. 스크롤 자동 이동
   - 새 메시지 추가 시 하단으로 스크롤
   - useRef + scrollIntoView 활용

3. localStorage 통합
   - 메시지 저장/불러오기
   - 세션 관리

---

## 문의사항
- ChatMessage 타입 이슈: types/chat.ts 참고
- 스타일 커스터마이징: tailwind.config.ts 수정
- 아바타 교체: /public/bot-avatar.svg 파일 교체

**Handoff 완료 ✅**
