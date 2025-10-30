'use client';

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, WifiOff, X } from 'lucide-react';

type ErrorToastType = 'error' | 'offline';

interface ErrorToastProps {
  message: ReactNode;
  onDismiss: () => void;
  duration?: number;
  type?: ErrorToastType;
}

const ICONS: Record<ErrorToastType, typeof AlertCircle> = {
  error: AlertCircle,
  offline: WifiOff,
};

const EXIT_DURATION = 200;

export function ErrorToast({
  message,
  onDismiss,
  duration = 5000,
  type = 'error',
}: ErrorToastProps) {
  const [visible, setVisible] = useState(false);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDismissedRef = useRef(false);

  const Icon = useMemo(() => ICONS[type] ?? AlertCircle, [type]);
  const palette =
    type === 'offline'
      ? {
          border: 'border-yellow-200',
          icon: 'text-yellow-500',
        }
      : {
          border: 'border-red-200',
          icon: 'text-red-500',
        };

  const clearAutoClose = useCallback(() => {
    if (autoCloseRef.current) {
      clearTimeout(autoCloseRef.current);
      autoCloseRef.current = null;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    if (hasDismissedRef.current) {
      return;
    }

    hasDismissedRef.current = true;
    setVisible(false);
    clearAutoClose();

    // Wait for exit animation before notifying parent
    setTimeout(onDismiss, EXIT_DURATION);
  }, [clearAutoClose, onDismiss]);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));

    return () => {
      cancelAnimationFrame(enter);
    };
  }, []);

  useEffect(() => {
    if (!duration) {
      return;
    }

    autoCloseRef.current = setTimeout(handleDismiss, duration);

    return clearAutoClose;
  }, [clearAutoClose, duration, handleDismiss]);

  useEffect(() => clearAutoClose, [clearAutoClose]);

  return (
    <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm justify-end">
      <div
        className={`flex min-w-[240px] items-start gap-3 rounded-lg border ${palette.border} bg-white p-4 shadow-lg transition-transform duration-200 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="alert"
      >
        <Icon className={`h-5 w-5 ${palette.icon}`} />
        <div className="flex-1 text-sm text-gray-800">{message}</div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-gray-400 transition hover:text-gray-600"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
