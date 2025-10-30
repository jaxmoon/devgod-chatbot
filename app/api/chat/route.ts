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
        } catch (error: unknown) {
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
  } catch (error: unknown) {
    console.error('[API] Error:', error);

    // Error handling
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'API 인증에 실패했습니다.', code: ErrorCode.PERMISSION_DENIED },
        { status: 401 }
      );
    }

    if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
