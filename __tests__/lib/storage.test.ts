import { storage } from '@/lib/storage';
import { ChatSession } from '@/types/chat';
import { generateId } from '@/lib/utils';

jest.mock('@/lib/utils', () => ({
  generateId: jest.fn(),
}));

const mockedGenerateId = generateId as jest.MockedFunction<typeof generateId>;

const buildSession = (overrides: Partial<ChatSession> = {}): ChatSession => ({
  id: overrides.id ?? `session-${Math.random().toString(16).slice(2, 10)}`,
  title: overrides.title ?? '세션',
  messages: overrides.messages ?? [],
  createdAt: overrides.createdAt ?? 1700000000000,
  updatedAt: overrides.updatedAt ?? 1700000000000,
});

describe('storage.getSessions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns an empty array when nothing is persisted', () => {
    expect(storage.getSessions()).toEqual([]);
  });

  it('returns parsed sessions from localStorage', () => {
    const sessions = [buildSession({ id: 'a' }), buildSession({ id: 'b' })];
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));

    expect(storage.getSessions()).toEqual(sessions);
  });

  it('returns an empty array when stored data is invalid JSON', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    localStorage.setItem('chat_sessions', 'not-valid-json');

    expect(storage.getSessions()).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

describe('storage.saveSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores a new session at the beginning of the list', () => {
    const session = buildSession({ id: 'new-session' });

    storage.saveSession(session);

    const stored = JSON.parse(
      localStorage.getItem('chat_sessions') ?? '[]'
    ) as ChatSession[];

    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(session);
  });

  it('updates an existing session without duplicating entries', () => {
    const session = buildSession({ id: 'session-1', title: '초기' });
    storage.saveSession(session);

    const updated = { ...session, title: '업데이트' };
    storage.saveSession(updated);

    const stored = JSON.parse(
      localStorage.getItem('chat_sessions') ?? '[]'
    ) as ChatSession[];

    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(updated);
  });

  it('enforces the maximum sessions limit of 20 items', () => {
    const totalToAdd = 25;
    for (let index = 0; index < totalToAdd; index += 1) {
      storage.saveSession(
        buildSession({
          id: `session-${index}`,
          updatedAt: 1700000000000 + index,
        })
      );
    }

    const stored = JSON.parse(
      localStorage.getItem('chat_sessions') ?? '[]'
    ) as ChatSession[];

    expect(stored).toHaveLength(20);
    const storedIds = stored.map((session) => session.id);
    expect(storedIds).toEqual(
      Array.from({ length: 20 }, (_, i) => `session-${24 - i}`)
    );
  });

  it('handles quota exceeded errors by cleaning up and retrying', () => {
    const session = buildSession({ id: 'quota-session' });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const cleanupSpy = jest.spyOn(storage, 'cleanupOldSessions');
    const originalSetItem = window.localStorage.setItem;
    const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');

    const setItemMock = jest
      .fn<void, [string, string]>()
      .mockImplementationOnce(() => {
        throw quotaError;
      })
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => undefined);

    window.localStorage.setItem = setItemMock;

    storage.saveSession(session);

    expect(cleanupSpy).toHaveBeenCalledWith(5);
    expect(setItemMock).toHaveBeenCalledTimes(3);

    window.localStorage.setItem = originalSetItem;
    cleanupSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('logs a retry failure when the second write attempt throws', () => {
    const session = buildSession({ id: 'quota-retry-session' });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const cleanupSpy = jest.spyOn(storage, 'cleanupOldSessions');
    const originalSetItem = window.localStorage.setItem;
    const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
    const retryError = new Error('retry failed');

    const setItemMock = jest
      .fn<void, [string, string]>()
      .mockImplementationOnce(() => {
        throw quotaError;
      })
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw retryError;
      });

    window.localStorage.setItem = setItemMock;

    storage.saveSession(session);

    expect(cleanupSpy).toHaveBeenCalledWith(5);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Storage] Retry failed:',
      retryError
    );

    window.localStorage.setItem = originalSetItem;
    cleanupSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

describe('storage.createSession', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedGenerateId.mockReset();
  });

  it('creates and persists a session with default values', () => {
    mockedGenerateId.mockReturnValueOnce('generated-id');
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000001234);

    const session = storage.createSession();

    expect(session).toMatchObject({
      id: 'generated-id',
      title: '새 대화',
      messages: [],
      createdAt: 1700000001234,
      updatedAt: 1700000001234,
    });

    const stored = JSON.parse(
      localStorage.getItem('chat_sessions') ?? '[]'
    ) as ChatSession[];

    expect(stored[0]).toMatchObject(session);
    expect(storage.getCurrentSessionId()).toBe('generated-id');

    nowSpy.mockRestore();
  });
});

describe('storage.deleteSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes the specified session and clears current session when needed', () => {
    const keepSession = buildSession({ id: 'keep' });
    const removeSession = buildSession({ id: 'remove' });

    localStorage.setItem('chat_sessions', JSON.stringify([removeSession, keepSession]));
    localStorage.setItem('current_session_id', 'remove');

    storage.deleteSession('remove');

    const stored = JSON.parse(
      localStorage.getItem('chat_sessions') ?? '[]'
    ) as ChatSession[];

    expect(stored).toEqual([keepSession]);
    expect(storage.getCurrentSessionId()).toBeNull();
  });

  it('removes the specified session while leaving current session intact when different', () => {
    const keepSession = buildSession({ id: 'keep' });
    const removeSession = buildSession({ id: 'remove' });

    localStorage.setItem('chat_sessions', JSON.stringify([removeSession, keepSession]));
    localStorage.setItem('current_session_id', 'keep');

    storage.deleteSession('remove');

    const stored = JSON.parse(
      localStorage.getItem('chat_sessions') ?? '[]'
    ) as ChatSession[];

    expect(stored).toEqual([keepSession]);
    expect(storage.getCurrentSessionId()).toBe('keep');
  });

  it('logs an error when deletion fails', () => {
    const session = buildSession({ id: 'error' });
    localStorage.setItem('chat_sessions', JSON.stringify([session]));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const originalSetItem = window.localStorage.setItem;

    window.localStorage.setItem = jest.fn(() => {
      throw new Error('failed');
    });

    storage.deleteSession('error');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Storage] Failed to delete session:',
      expect.any(Error)
    );

    window.localStorage.setItem = originalSetItem;
    consoleErrorSpy.mockRestore();
  });
});

describe('storage.getSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the matching session when found', () => {
    const target = buildSession({ id: 'target' });
    const other = buildSession({ id: 'other' });
    localStorage.setItem('chat_sessions', JSON.stringify([target, other]));

    expect(storage.getSession('target')).toEqual(target);
  });

  it('returns null when session cannot be found', () => {
    localStorage.setItem('chat_sessions', JSON.stringify([]));

    expect(storage.getSession('missing')).toBeNull();
  });
});

describe('storage current session helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves the current session identifier', () => {
    storage.setCurrentSessionId('current');
    expect(storage.getCurrentSessionId()).toBe('current');

    storage.setCurrentSessionId(null);
    expect(storage.getCurrentSessionId()).toBeNull();
  });
});

describe('storage.cleanupOldSessions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the newest sessions according to updatedAt', () => {
    const sessions = [
      buildSession({ id: 'oldest', updatedAt: 1 }),
      buildSession({ id: 'newest', updatedAt: 3 }),
      buildSession({ id: 'middle', updatedAt: 2 }),
    ];

    localStorage.setItem('chat_sessions', JSON.stringify(sessions));

    storage.cleanupOldSessions(2);

    const stored = JSON.parse(
      localStorage.getItem('chat_sessions') ?? '[]'
    ) as ChatSession[];

    expect(stored.map((session) => session.id)).toEqual(['newest', 'middle']);
  });
});

describe('storage.updateSessionTitle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('updates the title using the first user message when title is default', () => {
    const session = buildSession({ id: 'title-session', title: '새 대화' });
    localStorage.setItem('chat_sessions', JSON.stringify([session]));

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000009999);
    const userMessageContent =
      '이것은 사용자의 첫 번째 메시지로 제목을 업데이트해야 합니다';

    storage.updateSessionTitle('title-session', [
      { id: '1', role: 'assistant', content: 'hi', timestamp: 1 },
      {
        id: '2',
        role: 'user',
        content: userMessageContent,
        timestamp: 2,
      },
    ]);

    const updated = storage.getSession('title-session');

    const expectedTitle = userMessageContent.slice(0, 30) + '...';
    expect(updated?.title).toBe(expectedTitle);
    expect(updated?.updatedAt).toBe(1700000009999);

    nowSpy.mockRestore();
  });

  it('does not update the title when no user message exists', () => {
    const session = buildSession({ id: 'no-user', title: '새 대화' });
    localStorage.setItem('chat_sessions', JSON.stringify([session]));

    storage.updateSessionTitle('no-user', [
      { id: '1', role: 'assistant', content: '안녕', timestamp: 1 },
    ]);

    expect(storage.getSession('no-user')?.title).toBe('새 대화');
  });

  it('does not update the title when the session already has a custom title', () => {
    const session = buildSession({ id: 'custom', title: '완료된 세션' });
    localStorage.setItem('chat_sessions', JSON.stringify([session]));

    storage.updateSessionTitle('custom', [
      {
        id: '2',
        role: 'user',
        content: '새로운 메시지',
        timestamp: 2,
      },
    ]);

    expect(storage.getSession('custom')?.title).toBe('완료된 세션');
  });
});
