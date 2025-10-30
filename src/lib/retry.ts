export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_DELAY = 500;
const DEFAULT_MAX_ATTEMPTS = 3;

const isClientError = (error: unknown) => {
  if (error && typeof error === 'object') {
    const status =
      (error as { status?: number }).status ??
      (error as { response?: { status?: number } }).response?.status;

    if (typeof status === 'number' && status >= 400 && status < 500) {
      return true;
    }
  }

  return false;
};

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === 'AbortError';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    delay = DEFAULT_DELAY,
    backoff = false,
    onRetry,
  } = options;

  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;

    try {
      return await operation();
    } catch (error) {
      if (isAbortError(error) || isClientError(error) || attempt >= maxAttempts) {
        throw error;
      }

      onRetry?.(attempt, error);

      const waitTime = backoff ? delay * 2 ** (attempt - 1) : delay;
      if (waitTime > 0) {
        await sleep(waitTime);
      }
    }
  }

  throw new Error('Retry attempts exhausted');
}
