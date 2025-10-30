/**
 * API 관련 타입 정의
 * Gemini API와의 통신에 사용
 */

/**
 * ChatMessage
 * API 요청 시 전달되는 간소화된 메시지 타입
 */
export interface ChatMessage {
  /** 메시지 발신자 */
  role: 'user' | 'assistant';

  /** 메시지 내용 */
  content: string;
}

/**
 * ChatRequest
 * POST /api/chat 요청 바디
 *
 * 참조: API_CONTRACT.yaml - /api/chat POST
 */
export interface ChatRequest {
  /** 사용자 메시지 (1-4000자) */
  message: string;

  /** 대화 히스토리 (최대 10개) */
  history?: ChatMessage[];
}

/**
 * StreamChunk
 * SSE 스트림으로 전달되는 개별 청크
 */
export interface StreamChunk {
  /** 청크 텍스트 */
  text: string;
}

/**
 * ErrorResponse
 * API 에러 응답
 */
export interface ErrorResponse {
  /** 사용자 친화적 에러 메시지 (한국어) */
  error: string;

  /** 머신 리더블 에러 코드 */
  code?: ErrorCode;

  /** 추가 에러 정보 (선택) */
  details?: Record<string, any>;
}

/**
 * ErrorCode
 * 가능한 모든 에러 코드
 */
export enum ErrorCode {
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  MESSAGE_TOO_LONG = 'MESSAGE_TOO_LONG',
  HISTORY_TOO_LONG = 'HISTORY_TOO_LONG',
  CONFIG_ERROR = 'CONFIG_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  API_ERROR = 'API_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT = 'TIMEOUT',
}

/**
 * API 제약사항
 */
export const API_CONSTRAINTS = {
  /** 메시지 최대 길이 */
  MAX_MESSAGE_LENGTH: 4000,

  /** 히스토리 최대 개수 */
  MAX_HISTORY_LENGTH: 10,

  /** 요청 타임아웃 (ms) */
  REQUEST_TIMEOUT: 30000,
} as const;
