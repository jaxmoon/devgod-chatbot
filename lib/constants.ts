/**
 * 프로젝트 전역 상수
 */

/**
 * 스토리지 관련 상수
 */
export const STORAGE = {
  KEY: 'devgod_chat_storage',
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_SESSIONS: 20,
  MAX_MESSAGES_PER_SESSION: 100,
  SCHEMA_VERSION: 1,
} as const;

/**
 * API 관련 상수
 */
export const API = {
  ENDPOINT: '/api/chat',
  MAX_MESSAGE_LENGTH: 4000,
  MAX_HISTORY_LENGTH: 10,
  TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * UI 관련 상수
 */
export const UI = {
  COLORS: {
    USER_BUBBLE: '#FAE100',
    USER_BUBBLE_DARK: '#F5DC00',
    BOT_BUBBLE: '#FFFFFF',
    BACKGROUND: '#B2C7DA',
    BACKGROUND_LIGHT: '#ABC1D1',
  },
  MESSAGE_MAX_WIDTH: '75%',
  INPUT_MAX_HEIGHT: '128px',
  TYPING_INDICATOR: '▋',
} as const;

/**
 * 앱 정보
 */
export const APP = {
  NAME: '개발의신',
  DESCRIPTION: 'Software Development Assistant',
  BOT_NAME: '개발의신',
} as const;
