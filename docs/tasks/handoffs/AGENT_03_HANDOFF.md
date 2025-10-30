# Agent 03 Handoff - Gemini API Integration

## Completed Tasks
- [x] System prompt file created (lib/systemPrompt.txt)
- [x] Gemini client implementation (lib/gemini.ts)
- [x] API route with SSE streaming (app/api/chat/route.ts)
- [x] Type definitions for API and Gemini (types/api.ts, types/gemini.ts)
- [x] Constants and utilities (lib/constants.ts)
- [x] Comprehensive error handling
- [x] CORS support (OPTIONS handler)

## Created Files

### Core Implementation
- `/Users/kyungwonmoon/Documents/GitHub/lecture/chatbot/lib/systemPrompt.txt` - AI personality prompt
- `/Users/kyungwonmoon/Documents/GitHub/lecture/chatbot/lib/gemini.ts` - Gemini client wrapper
- `/Users/kyungwonmoon/Documents/GitHub/lecture/chatbot/app/api/chat/route.ts` - API endpoint

### Type Definitions (from AGENT_02 prerequisites)
- `/Users/kyungwonmoon/Documents/GitHub/lecture/chatbot/types/api.ts` - API request/response types
- `/Users/kyungwonmoon/Documents/GitHub/lecture/chatbot/types/gemini.ts` - Gemini-specific types
- `/Users/kyungwonmoon/Documents/GitHub/lecture/chatbot/types/chat.ts` - Chat message types
- `/Users/kyungwonmoon/Documents/GitHub/lecture/chatbot/lib/constants.ts` - Project constants

## API Contract

### POST /api/chat

**Request Body:**
```typescript
{
  message: string;        // User message (1-4000 characters)
  history?: ChatMessage[]; // Up to 10 previous messages
}
```

**Response:**
- Content-Type: `text/event-stream`
- Format: Server-Sent Events (SSE)

**SSE Stream Format:**
```
data: {"text":"chunk content"}\n\n
data: {"text":"more content"}\n\n
data: [DONE]\n\n
```

**Error Responses:**
- 400: Invalid message / Too long / History too long
- 401: API authentication failed (missing/invalid GEMINI_API_KEY)
- 429: Rate limit exceeded
- 500: Internal server error

## Exported Functions

### lib/gemini.ts
```typescript
// Load system prompt from file
loadSystemPrompt(): string

// Get configured Gemini model instance
getGeminiModel(): GenerativeModel

// Convert ChatMessage[] to Gemini format
convertHistoryToGeminiFormat(history: ChatMessage[]): GeminiHistory
```

## Environment Variables

**Required:**
```env
GEMINI_API_KEY=your_api_key_here
```

Get API key from: https://makersuite.google.com/app/apikey

**Note:** The .env.local currently has placeholder value. Replace with actual key to test.

## Usage Example

```typescript
// Client-side usage
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'React의 장점은?',
    history: [
      { role: 'user', content: 'TypeScript란?' },
      { role: 'assistant', content: 'TypeScript는...' }
    ]
  })
});

// Read SSE stream
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;

      const parsed = JSON.parse(data);
      console.log(parsed.text);
    }
  }
}
```

## Verification Results

### Type Check
```bash
npx tsc --noEmit
# Result: PASSED - No type errors
```

### Build
```bash
npm run build
# Result: PASSED - Production build successful
```

### Lint
```bash
npm run lint
# Result: PASSED - No ESLint errors
```

## Known Issues
- API key is placeholder value in .env.local
- Runtime testing requires valid GEMINI_API_KEY
- No API key = proper error handling (401 response)

## Next Agent Notes

### For AGENT_05 (Container/Chat UI)
You can now use the `/api/chat` endpoint to:
1. Send user messages to Gemini
2. Receive streaming responses
3. Handle errors gracefully

Example integration:
```typescript
import { ChatRequest, ErrorResponse } from '@/types/api';

async function sendMessage(message: string, history: ChatMessage[]) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history } as ChatRequest)
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error);
  }

  return response; // ReadableStream for SSE
}
```

### Important Notes
- Maximum message length: 4000 characters (enforced by API)
- Maximum history length: 10 messages (enforced by API)
- Stream ends with `data: [DONE]\n\n`
- All errors return JSON with Korean user-friendly messages
- CORS enabled for cross-origin requests

## Testing

### Manual API Test (requires valid API key)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "history": []}'
```

Expected: SSE stream with AI response

### Without API Key
Expected: 401 error with message "API 인증에 실패했습니다."

---

**Status:** COMPLETED
**Date:** 2025-10-30
**Agent:** AGENT_03 (API Architect)
