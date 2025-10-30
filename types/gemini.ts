/**
 * Gemini API 관련 타입
 * @google/generative-ai SDK와 상호작용하는 타입
 */

/**
 * GeminiMessage
 * Gemini API 형식의 메시지
 */
export interface GeminiMessage {
  /** 'user' 또는 'model' (Gemini는 'assistant' 대신 'model' 사용) */
  role: 'user' | 'model';

  /** 메시지 파트 (텍스트) */
  parts: Array<{ text: string }>;
}

/**
 * GeminiHistory
 * Gemini startChat()에 전달되는 히스토리
 */
export type GeminiHistory = GeminiMessage[];

/**
 * SystemPromptConfig
 * 시스템 프롬프트 설정
 */
export interface SystemPromptConfig {
  /** 프롬프트 파일 경로 */
  promptPath: string;

  /** 폴백 프롬프트 (파일 로드 실패 시) */
  fallbackPrompt: string;
}
