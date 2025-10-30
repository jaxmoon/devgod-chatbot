# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

개발의신 (Development God) - A KakaoTalk-style software development Q&A chatbot powered by Google Gemini API and built with Next.js 14.

**Tech Stack:**
- Next.js 14 (App Router) - Unified frontend/backend framework
- Google Gemini API - AI responses with streaming
- Tailwind CSS - KakaoTalk-style UI
- localStorage - Client-side chat history persistence
- TypeScript - Full type safety

## Directory Structure

```
chatbot/
├── docs/              # Task documentation (TASK_01-05.md)
├── scripts/           # Setup and deployment scripts
├── docker/            # Docker configuration
└── src/
    ├── app/
    │   ├── api/chat/  # Gemini streaming API route
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── components/
    │   ├── chat/      # ChatContainer, ChatMessage, ChatInput, ChatHeader
    │   └── ui/        # Reusable UI components
    ├── lib/           # Utilities (gemini.ts, storage.ts, utils.ts)
    ├── types/         # TypeScript definitions (chat.ts, api.ts)
    └── hooks/         # React hooks (useChat.ts)
```

**Important:** All project files must be organized into `/docs`, `/scripts`, or `/docker` directories as per user requirements.

## Development Commands

```bash
# Initial setup
npm install
./scripts/setup.sh              # Creates .env.local and installs dependencies

# Development
npm run dev                     # Start dev server on http://localhost:3000
npm run build                   # Production build
npm start                       # Start production server
npm run lint                    # Run ESLint

# Deployment
./scripts/deploy-vercel.sh      # Deploy to Vercel
./scripts/deploy-docker.sh      # Build and run Docker container
vercel --prod                   # Direct Vercel deployment
```

## Environment Variables

Required in `.env.local`:
```env
GEMINI_API_KEY=your_api_key_here
```

Get API key from: https://makersuite.google.com/app/apikey

## Architecture

### API Routes (Server-Side)

**`/api/chat` - POST** - Gemini streaming endpoint
- Input: `{ message: string, history: ChatMessage[] }`
- Output: Server-Sent Events (SSE) stream
- Returns chunks as `data: {"text": "..."}\n\n`
- Ends with `data: [DONE]\n\n`

**Key files:**
- `src/app/api/chat/route.ts` - API route handler
- `src/lib/gemini.ts` - Gemini client, system prompt loader, history converter
- `src/lib/systemPrompt.txt` - AI personality and behavior (editable)

### Client-Side Architecture

**State Management:**
- `useChat` hook manages chat sessions and localStorage
- `ChatStorage` class handles persistence (5MB limit, auto-cleanup)
- Messages update in real-time during streaming

**Component Hierarchy:**
```
ChatContainer (state management)
├── ChatHeader (title, actions)
├── ChatMessage[] (KakaoTalk-style bubbles)
│   └── Message (user: yellow, bot: white)
└── ChatInput (textarea + send button)
```

**Storage Schema:**
```typescript
{
  sessions: ChatSession[],
  activeSessionId: string | null,
  version: number
}
```

### Streaming Implementation

**Server (API Route):**
```typescript
// Creates ReadableStream with SSE format
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of result.stream) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
    }
    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
  }
});
```

**Client (ChatContainer):**
```typescript
// Reads SSE stream and updates message in real-time
const reader = response.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  // Parse SSE format and update message content
  updateMessage(messageId, { content: fullContent });
}
```

## Key Implementation Details

### System Prompt Management
- Stored in `src/lib/systemPrompt.txt` (separate file for easy editing)
- Loaded server-side via `loadSystemPrompt()` in `src/lib/gemini.ts`
- Applied to Gemini model with `systemInstruction` parameter

### KakaoTalk UI Styling
- Background: `#B2C7DA` (light blue)
- User messages: `#FAE100` (yellow), right-aligned
- Bot messages: `#FFFFFF` (white), left-aligned with avatar
- Font: Noto Sans KR
- Time format: "오후 8:08" via `formatTime()` utility

### Chat History Context
- Only last 10 messages sent to Gemini API (context window optimization)
- Full history stored in localStorage (up to 100 messages per session)
- History converted to Gemini format: `{ role: 'user'|'model', parts: [{ text }] }`

### Storage Limits
- Max storage: 5MB
- Max sessions: 20
- Max messages per session: 100
- Auto-cleanup when limits exceeded (keeps newest data)

## Implementation Tasks

Follow these task documents in order:
1. `docs/TASK_01_SETUP.md` - Project initialization
2. `docs/TASK_02_API.md` - Gemini API integration
3. `docs/TASK_03_UI.md` - KakaoTalk UI components
4. `docs/TASK_04_STORAGE.md` - localStorage integration
5. `docs/TASK_05_DEPLOYMENT.md` - Production deployment

## Testing

**API Test (cURL):**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "TypeScript의 장점은?", "history": []}'
```

**Browser Console Test:**
```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'React의 장점은?', history: [] })
}).then(async response => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(decoder.decode(value));
  }
});
```

## Deployment

**Vercel (Recommended):**
- Zero-config Next.js deployment
- Set `GEMINI_API_KEY` in environment variables
- Automatic deployment on git push

**Docker:**
- Standalone output configured in `next.config.js`
- Build: `docker build -t chatbot -f docker/Dockerfile .`
- Run: `docker-compose -f docker/docker-compose.yml up -d`

## Troubleshooting

**Streaming not working:**
- Check `GEMINI_API_KEY` is set in `.env.local`
- Restart dev server after changing env vars
- Verify SSE headers in Network tab

**localStorage issues:**
- Check browser console for quota errors
- Run `localStorage.getItem('devgod_chat_storage')` to inspect
- Clear with `localStorage.removeItem('devgod_chat_storage')`

**Build failures:**
- Clear cache: `rm -rf .next node_modules && npm install`
- Check TypeScript errors: `npm run build`

## Important Notes

- System prompt defines chatbot personality - edit `src/lib/systemPrompt.txt` to customize
- Chat history is client-side only (localStorage) - no database required
- Streaming provides better UX than waiting for full response
- Message updates trigger re-renders, so `ChatMessage` is memoized
- Path alias `@/*` maps to `src/*` for cleaner imports