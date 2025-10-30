import {
  formatTime,
  generateId,
  cn,
  truncateText,
  isValidMessage,
  debounce,
} from '@/lib/utils';

describe('formatTime', () => {
  it('returns a morning timestamp in Korean format', () => {
    const morningTimestamp = new Date(2024, 0, 1, 8, 5).getTime();

    expect(formatTime(morningTimestamp)).toBe('오전 8:05');
  });

  it('returns an afternoon timestamp in Korean format', () => {
    const afternoonTimestamp = new Date(2024, 0, 1, 13, 7).getTime();

    expect(formatTime(afternoonTimestamp)).toBe('오후 1:07');
  });
});

describe('generateId', () => {
  it('produces a valid UUID v4 string', () => {
    const id = generateId();

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique identifiers on successive calls', () => {
    const idA = generateId();
    const idB = generateId();

    expect(idA).not.toBe(idB);
  });
});

describe('cn', () => {
  it('merges truthy class names while skipping falsy values', () => {
    const result = cn('base', undefined, 'active', false && 'hidden', null, 'rounded');

    expect(result).toBe('base active rounded');
  });
});

describe('truncateText', () => {
  it('returns the original text when under max length', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('truncates and appends ellipsis when exceeding max length', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
  });
});

describe('isValidMessage', () => {
  it('validates non-empty messages within length', () => {
    expect(isValidMessage('안녕하세요')).toBe(true);
  });

  it.each(['', '   '])('returns false for empty or whitespace-only input "%s"', (value) => {
    expect(isValidMessage(value)).toBe(false);
  });

  it('returns false when message exceeds 4000 characters', () => {
    expect(isValidMessage('a'.repeat(4001))).toBe(false);
  });
});

describe('debounce', () => {
  it('delays execution and only invokes the latest call', () => {
    jest.useFakeTimers();

    const fn = jest.fn();
    const debounced = debounce(fn, 200);

    debounced('first');
    jest.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    debounced('second');
    jest.advanceTimersByTime(200);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('second');

    jest.useRealTimers();
  });
});
