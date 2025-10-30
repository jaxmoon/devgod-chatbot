/**
 * 공통 유틸리티 함수
 */

/**
 * formatTime
 * Unix timestamp를 한국어 시간 형식으로 변환
 *
 * @param timestamp - Unix timestamp (milliseconds)
 * @returns "오후 8:08" 형식의 문자열
 *
 * @example
 * formatTime(1706613480000) // "오후 8:08"
 *
 * 요구사항: FR-003 (시간 표시)
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // 오전/오후 결정
  const period = hours >= 12 ? '오후' : '오전';

  // 12시간 형식으로 변환
  const displayHours = hours % 12 || 12;

  // 분을 2자리로 패딩
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${period} ${displayHours}:${displayMinutes}`;
}

/**
 * cn (classNames)
 * 조건부 클래스명 결합 유틸리티
 *
 * @param classes - 클래스명 배열 (falsy 값은 무시)
 * @returns 결합된 클래스명 문자열
 *
 * @example
 * cn('base', isActive && 'active', undefined) // "base active"
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * generateId
 * UUID v4 생성 (crypto API 사용)
 *
 * @returns UUID 문자열
 *
 * @example
 * generateId() // "123e4567-e89b-12d3-a456-426614174000"
 */
export function generateId(): string {
  // 브라우저 환경
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 폴백: 간단한 UUID v4 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * truncateText
 * 텍스트를 지정된 길이로 자르고 "..." 추가
 *
 * @param text - 원본 텍스트
 * @param maxLength - 최대 길이
 * @returns 잘린 텍스트
 *
 * @example
 * truncateText("Hello World", 8) // "Hello..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

/**
 * isValidMessage
 * 메시지 유효성 검증
 *
 * @param message - 검증할 메시지
 * @returns 유효 여부
 */
export function isValidMessage(message: string): boolean {
  // 빈 문자열 또는 공백만 있는 경우
  if (!message || message.trim().length === 0) {
    return false;
  }

  // 최대 길이 초과
  if (message.length > 4000) {
    return false;
  }

  return true;
}

/**
 * debounce
 * 함수 디바운싱 (연속 호출 방지)
 *
 * @param fn - 디바운싱할 함수
 * @param delay - 지연 시간 (ms)
 * @returns 디바운싱된 함수
 *
 * @example
 * const debouncedSave = debounce(saveData, 500);
 * debouncedSave(); // 500ms 후 실행
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}
