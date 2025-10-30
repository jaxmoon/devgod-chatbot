import { renderHook, act, waitFor } from '@testing-library/react';

import { useChat } from '@/hooks/useChat';
import { storage } from '@/lib/storage';
import { ChatSession, Message } from '@/types/chat';

jest.mock('@/lib/storage', () => ({
  storage: {
    getCurrentSessionId: jest.fn(),
    getSessions: jest.fn(),
    getSession: jest.fn(),
    saveSession: jest.fn(),
    updateSessionTitle: jest.fn(),
    createSession: jest.fn(),
    setCurrentSessionId: jest.fn(),
    deleteSession: jest.fn(),
  },
}));

const mockedStorage = storage as jest.Mocked<typeof storage>;

const baseSession: ChatSession = {
  id: 'session-1',
  title: '새 대화',
  messages: [],
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
};

const buildMessage = (overrides: Partial<Message> = {}): Message => ({
  id: overrides.id ?? 'message-1',
  role: overrides.role ?? 'user',
  content: overrides.content ?? '내용',
  timestamp: overrides.timestamp ?? 1700000000000,
  isStreaming: overrides.isStreaming,
});

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes by creating a new session when none exists', async () => {
    const createdSession: ChatSession = { ...baseSession, id: 'created-session' };

    mockedStorage.getCurrentSessionId.mockReturnValue(null);
    mockedStorage.getSessions.mockReturnValue([]);
    mockedStorage.createSession.mockReturnValue(createdSession);

    const { result } = renderHook(() => useChat());

    await waitFor(() =>
      expect(result.current.currentSession).toEqual(createdSession)
    );

    expect(result.current.messages).toEqual([]);
    expect(result.current.sessions[0]).toMatchObject({
      id: createdSession.id,
      messages: [],
    });
    expect(mockedStorage.saveSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'created-session' })
    );
  });

  it('adds a new message via addMessage', async () => {
    const storedSession: ChatSession = {
      ...baseSession,
      messages: [],
    };

    mockedStorage.getCurrentSessionId.mockReturnValue(storedSession.id);
    mockedStorage.getSessions.mockReturnValue([storedSession]);
    mockedStorage.getSession.mockReturnValue(storedSession);

    const { result } = renderHook(() => useChat());

    await waitFor(() =>
      expect(result.current.currentSession?.id).toBe(storedSession.id)
    );

    const newMessage = buildMessage({ id: 'message-new', content: '안녕' });

    act(() => {
      result.current.addMessage(newMessage);
    });

    await waitFor(() =>
      expect(result.current.messages).toEqual([newMessage])
    );

    expect(mockedStorage.saveSession).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: storedSession.id,
        messages: [newMessage],
      })
    );
  });

  it('updates an existing message via updateMessage', async () => {
    const existingMessage = buildMessage({
      id: 'msg-1',
      content: '초기',
      isStreaming: true,
    });
    const storedSession: ChatSession = {
      ...baseSession,
      messages: [existingMessage],
    };

    mockedStorage.getCurrentSessionId.mockReturnValue(storedSession.id);
    mockedStorage.getSessions.mockReturnValue([storedSession]);
    mockedStorage.getSession.mockReturnValue(storedSession);

    const { result } = renderHook(() => useChat());

    await waitFor(() =>
      expect(result.current.messages).toHaveLength(1)
    );

    act(() => {
      result.current.updateMessage(existingMessage.id, {
        content: '업데이트됨',
        isStreaming: false,
      });
    });

    await waitFor(() =>
      expect(result.current.messages[0]).toMatchObject({
        id: existingMessage.id,
        content: '업데이트됨',
        isStreaming: false,
      })
    );
  });

  it('removes a message via removeMessage', async () => {
    const messageA = buildMessage({ id: 'msg-a' });
    const messageB = buildMessage({ id: 'msg-b' });
    const storedSession: ChatSession = {
      ...baseSession,
      messages: [messageA, messageB],
    };

    mockedStorage.getCurrentSessionId.mockReturnValue(storedSession.id);
    mockedStorage.getSessions.mockReturnValue([storedSession]);
    mockedStorage.getSession.mockReturnValue(storedSession);

    const { result } = renderHook(() => useChat());

    await waitFor(() =>
      expect(result.current.messages).toHaveLength(2)
    );

    act(() => {
      result.current.removeMessage('msg-a');
    });

    await waitFor(() =>
      expect(result.current.messages).toEqual([messageB])
    );
  });

  it('creates a new session via createNewSession and resets state', async () => {
    const storedSession: ChatSession = {
      ...baseSession,
      id: 'existing-session',
      messages: [buildMessage({ id: 'existing-message' })],
    };
    const freshSession: ChatSession = {
      ...baseSession,
      id: 'fresh-session',
      messages: [],
    };

    mockedStorage.getCurrentSessionId.mockReturnValue(storedSession.id);
    mockedStorage.getSessions.mockReturnValue([storedSession]);
    mockedStorage.getSession.mockReturnValue(storedSession);
    mockedStorage.createSession.mockReturnValue(freshSession);

    const { result } = renderHook(() => useChat());

    await waitFor(() =>
      expect(result.current.currentSession?.id).toBe(storedSession.id)
    );

    act(() => {
      result.current.createNewSession();
    });

    await waitFor(() =>
      expect(result.current.currentSession?.id).toBe(freshSession.id)
    );

    expect(result.current.messages).toEqual([]);
    expect(result.current.sessions[0].id).toBe(freshSession.id);
  });

  it('switches to another session and updates local state', async () => {
    const currentSession: ChatSession = {
      ...baseSession,
      id: 'session-current',
      messages: [buildMessage({ id: 'curr-message' })],
    };
    const otherSession: ChatSession = {
      ...baseSession,
      id: 'session-other',
      messages: [buildMessage({ id: 'other-message' })],
    };

    mockedStorage.getCurrentSessionId.mockReturnValue(currentSession.id);
    mockedStorage.getSessions.mockReturnValue([currentSession, otherSession]);
    mockedStorage.getSession.mockImplementation((id: string) =>
      id === currentSession.id ? currentSession : otherSession
    );

    const { result } = renderHook(() => useChat());

    await waitFor(() =>
      expect(result.current.currentSession?.id).toBe(currentSession.id)
    );

    act(() => {
      result.current.switchSession(otherSession.id);
    });

    await waitFor(() =>
      expect(result.current.currentSession?.id).toBe(otherSession.id)
    );

    expect(result.current.messages).toEqual(otherSession.messages);
    expect(mockedStorage.setCurrentSessionId).toHaveBeenCalledWith(otherSession.id);
  });

  it('deletes the current session and creates a replacement when necessary', async () => {
    const currentSession: ChatSession = {
      ...baseSession,
      id: 'current-session',
      messages: [buildMessage({ id: 'current-message' })],
    };
    const otherSession: ChatSession = {
      ...baseSession,
      id: 'other-session',
      messages: [],
    };
    const replacementSession: ChatSession = {
      ...baseSession,
      id: 'replacement-session',
      messages: [],
    };

    mockedStorage.getCurrentSessionId.mockReturnValue(currentSession.id);
    mockedStorage.getSessions.mockReturnValue([currentSession, otherSession]);
    mockedStorage.getSession.mockImplementation((id: string) =>
      id === currentSession.id ? currentSession : otherSession
    );
    mockedStorage.createSession.mockReturnValue(replacementSession);

    const { result } = renderHook(() => useChat());

    await waitFor(() =>
      expect(result.current.currentSession?.id).toBe(currentSession.id)
    );

    act(() => {
      result.current.deleteSession(currentSession.id);
    });

    await waitFor(() =>
      expect(result.current.currentSession?.id).toBe(replacementSession.id)
    );

    expect(result.current.sessions.map((session) => session.id)).toEqual([
      replacementSession.id,
      otherSession.id,
    ]);
    expect(mockedStorage.deleteSession).toHaveBeenCalledWith(currentSession.id);
    expect(mockedStorage.createSession).toHaveBeenCalled();
  });
});
