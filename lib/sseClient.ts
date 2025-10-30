export interface SSEChunk {
  text: string;
}

export async function* streamSSE(
  url: string,
  options: RequestInit
): AsyncGenerator<SSEChunk, void, unknown> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const chunk: SSEChunk = JSON.parse(data);
            yield chunk;
          } catch (e) {
            console.error('[SSE] Parse error:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
