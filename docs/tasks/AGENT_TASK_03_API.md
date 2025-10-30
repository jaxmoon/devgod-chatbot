# Agent Task 03: Gemini API Integration
## Gemini API 통합 및 스트리밍 구현

**Agent ID:** AGENT_03
**소요 시간:** 1일
**의존성:** AGENT_01, AGENT_02 완료
**다음 Agent:** AGENT_05 (Container)

---

## 1. Context

### 작업 목표
Gemini API를 통합하고 Server-Sent Events(SSE) 스트리밍 엔드포인트를 구현합니다.

### 관련 요구사항
- FR-002: AI 응답 수신 (스트리밍)
- FR-007: 컨텍스트 유지 (히스토리 전달)
- NFR-002: 보안 (API 키 보호)

---

## 2. Prerequisites

```bash
# AGENT_01, 02 완료 확인
ls types/api.ts types/gemini.ts lib/constants.ts
# .env.local에 GEMINI_API_KEY 설정
grep GEMINI_API_KEY .env.local
```

---

## 3. Task Details

### Step 1: 시스템 프롬프트 파일 생성

**`lib/systemPrompt.txt` 생성:**
```
당신은 "개발의신"이라는 이름의 소프트웨어 개발 전문가입니다.

역할:
1. 프로그래밍 언어, 프레임워크, 알고리즘에 대한 명확한 설명 제공
2. 실용적인 코드 예제와 함께 솔루션 제시
3. 베스트 프랙티스와 디자인 패턴 추천
4. 디버깅 및 성능 최적화 지원
5. 최신 기술 트렌드 및 도구 추천

응답 스타일:
- 친근하고 전문적인 한국어로 대화
- 코드는 마크다운 코드 블록 사용
- 복잡한 개념은 단계별로 설명
- 필요시 다이어그램이나 예시 제공

제약사항:
- 소프트웨어 개발 관련 질문에만 답변
- 불확실한 정보는 추측하지 않고 솔직히 표현
- 보안 취약점이나 악의적인 코드는 제공하지 않음
```

### Step 2: Gemini 클라이언트 구현

**`lib/gemini.ts` 생성:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { GeminiMessage, GeminiHistory } from '@/types/gemini';
import { ChatMessage } from '@/types/api';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('[GEMINI] API key not configured');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * loadSystemPrompt
 * 시스템 프롬프트 파일 로드
 */
export function loadSystemPrompt(): string {
  const promptPath = path.join(process.cwd(), 'lib/systemPrompt.txt');

  try {
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('[GEMINI] Failed to load system prompt:', error);
    return '당신은 친절한 소프트웨어 개발 전문가입니다.';
  }
}

/**
 * getGeminiModel
 * Gemini 모델 인스턴스 반환
 */
export function getGeminiModel() {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const systemPrompt = loadSystemPrompt();

  return genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    systemInstruction: systemPrompt,
  });
}

/**
 * convertHistoryToGeminiFormat
 * ChatMessage[] → GeminiHistory 변환
 */
export function convertHistoryToGeminiFormat(
  history: ChatMessage[]
): GeminiHistory {
  return history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
}
```

### Step 3: API Route 구현

**`app/api/chat/route.ts` 생성:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  getGeminiModel,
  convertHistoryToGeminiFormat,
} from '@/lib/gemini';
import { ChatRequest, ErrorCode } from '@/types/api';
import { API } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, history = [] } = body;

    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: '메시지가 유효하지 않습니다.', code: ErrorCode.INVALID_MESSAGE },
        { status: 400 }
      );
    }

    if (message.length > API.MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: '메시지가 너무 깁니다. (최대 4000자)', code: ErrorCode.MESSAGE_TOO_LONG },
        { status: 400 }
      );
    }

    if (history.length > API.MAX_HISTORY_LENGTH) {
      return NextResponse.json(
        { error: '대화 히스토리가 너무 깁니다. (최대 10개)', code: ErrorCode.HISTORY_TOO_LONG },
        { status: 400 }
      );
    }

    // Get Gemini model
    const model = getGeminiModel();

    // Convert history
    const geminiHistory = convertHistoryToGeminiFormat(history);

    // Start chat
    const chat = model.startChat({
      history: geminiHistory,
    });

    // Send message with streaming
    const result = await chat.sendMessageStream(message);

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            const data = JSON.stringify({ text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: any) {
          console.error('[API] Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('[API] Error:', error);

    // Error handling
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'API 인증에 실패했습니다.', code: ErrorCode.PERMISSION_DENIED },
        { status: 401 }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.', code: ErrorCode.RATE_LIMIT_EXCEEDED },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: '메시지 처리 중 오류가 발생했습니다.', code: ErrorCode.API_ERROR },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
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

# 4. API 테스트
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "history": []}'

# 예상: SSE 스트림 반환
```

---

## 5. Handoff

### 완료 사항
- ✅ Gemini 클라이언트 구현 (lib/gemini.ts)
- ✅ 시스템 프롬프트 파일 (lib/systemPrompt.txt)
- ✅ API Route 구현 (app/api/chat/route.ts)
- ✅ SSE 스트리밍
- ✅ 에러 처리

### AGENT_05를 위한 정보
```typescript
// API 사용법
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'User message',
    history: [
      { role: 'user', content: 'Previous message' },
      { role: 'assistant', content: 'Previous response' },
    ],
  }),
});

// SSE 스트림 읽기
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Parse "data: {\"text\":\"...\"}\n\n"
}
```

**Handoff 문서:** `docs/tasks/handoffs/AGENT_03_HANDOFF.md`

---

**Agent 03 작업 완료 ✅**
