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
