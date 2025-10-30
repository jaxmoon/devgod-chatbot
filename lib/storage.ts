import { ChatSession, Message } from '@/types/chat';
import { generateId } from './utils';

const STORAGE_KEYS = {
  SESSIONS: 'chat_sessions',
  CURRENT_SESSION: 'current_session_id',
  SETTINGS: 'chat_settings',
} as const;

const MAX_SESSIONS = 20;

export const storage = {
  /**
   * getSessions
   * 모든 세션 목록 가져오기
   */
  getSessions(): ChatSession[] {
    if (typeof window === 'undefined') return [];

    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[Storage] Failed to get sessions:', error);
      return [];
    }
  },

  /**
   * getSession
   * 특정 세션 가져오기
   */
  getSession(sessionId: string): ChatSession | null {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === sessionId) || null;
  },

  /**
   * saveSession
   * 세션 저장 (생성 또는 업데이트)
   */
  saveSession(session: ChatSession): void {
    if (typeof window === 'undefined') return;

    try {
      let sessions = this.getSessions();

      // Update existing or add new
      const index = sessions.findIndex((s) => s.id === session.id);
      if (index >= 0) {
        sessions[index] = session;
      } else {
        sessions.unshift(session);
      }

      // Limit sessions
      if (sessions.length > MAX_SESSIONS) {
        sessions = sessions.slice(0, MAX_SESSIONS);
      }

      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('[Storage] Failed to save session:', error);

      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupOldSessions(5);
        // Retry
        try {
          localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([session]));
        } catch (retryError) {
          console.error('[Storage] Retry failed:', retryError);
        }
      }
    }
  },

  /**
   * deleteSession
   * 세션 삭제
   */
  deleteSession(sessionId: string): void {
    if (typeof window === 'undefined') return;

    try {
      const sessions = this.getSessions().filter((s) => s.id !== sessionId);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

      // Clear current session if deleted
      if (this.getCurrentSessionId() === sessionId) {
        this.setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('[Storage] Failed to delete session:', error);
    }
  },

  /**
   * createSession
   * 새 세션 생성
   */
  createSession(): ChatSession {
    const session: ChatSession = {
      id: generateId(),
      title: '새 대화',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.saveSession(session);
    this.setCurrentSessionId(session.id);

    return session;
  },

  /**
   * getCurrentSessionId
   * 현재 활성 세션 ID
   */
  getCurrentSessionId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  },

  /**
   * setCurrentSessionId
   * 현재 세션 설정
   */
  setCurrentSessionId(sessionId: string | null): void {
    if (typeof window === 'undefined') return;

    if (sessionId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }
  },

  /**
   * cleanupOldSessions
   * 오래된 세션 정리
   */
  cleanupOldSessions(keepCount: number): void {
    if (typeof window === 'undefined') return;

    const sessions = this.getSessions()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, keepCount);

    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  /**
   * updateSessionTitle
   * 세션 제목 업데이트 (첫 메시지 기반)
   */
  updateSessionTitle(sessionId: string, messages: Message[]): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    const firstUserMessage = messages.find((m) => m.role === 'user');
    if (firstUserMessage && session.title === '새 대화') {
      session.title = firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
      session.updatedAt = Date.now();
      this.saveSession(session);
    }
  },
};
