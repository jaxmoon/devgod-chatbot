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
