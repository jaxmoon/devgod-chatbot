'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message, ChatSession } from '@/types/chat';
import { storage } from '@/lib/storage';

export function useChat() {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Initialize
  useEffect(() => {
    const sessionId = storage.getCurrentSessionId();
    const allSessions = storage.getSessions();
    setSessions(allSessions);

    if (sessionId) {
      const session = storage.getSession(sessionId);
      if (session) {
        setCurrentSession(session);
        setMessages(session.messages);
        return;
      }
    }

    // No current session, create new one
    const newSession = storage.createSession();
    setCurrentSession(newSession);
    setMessages([]);
    setSessions([newSession, ...allSessions]);
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (!currentSession) return;

    const session: ChatSession = {
      ...currentSession,
      messages,
      updatedAt: Date.now(),
    };

    storage.saveSession(session);
    storage.updateSessionTitle(currentSession.id, messages);

    // Update sessions list
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? session : s))
    );
  }, [messages, currentSession]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const createNewSession = useCallback(() => {
    const newSession = storage.createSession();
    setCurrentSession(newSession);
    setMessages([]);
    setSessions((prev) => [newSession, ...prev]);
  }, []);

  const switchSession = useCallback((sessionId: string) => {
    const session = storage.getSession(sessionId);
    if (session) {
      setCurrentSession(session);
      setMessages(session.messages);
      storage.setCurrentSessionId(sessionId);
    }
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    storage.deleteSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    if (currentSession?.id === sessionId) {
      const newSession = storage.createSession();
      setCurrentSession(newSession);
      setMessages([]);
      setSessions((prev) => [newSession, ...prev]);
    }
  }, [currentSession]);

  return {
    currentSession,
    messages,
    sessions,
    addMessage,
    updateMessage,
    removeMessage,
    createNewSession,
    switchSession,
    deleteSession,
  };
}
