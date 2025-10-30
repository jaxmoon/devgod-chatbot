'use client';

import { memo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Message } from '@/types/chat';
import { formatTime } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = memo(function ChatMessage({
  message,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className={`flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      data-testid="chat-message"
      data-role={message.role}
    >
      {/* 봇 아바타 (왼쪽만) */}
      {!isUser && (
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            <Image
              src="/bot-avatar.svg"
              alt="개발의신"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {/* 봇 이름 (봇 메시지만) */}
        {!isUser && (
          <span className="text-xs text-gray-700 mb-1 px-1">개발의신</span>
        )}

        {/* 말풍선과 시간을 같은 줄에 배치 */}
        <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* 말풍선 */}
          <div
            className={`rounded-2xl px-3 py-2.5 break-words shadow-sm ${
              isUser
                ? 'bg-[#FAE100] text-black'
                : 'bg-white text-gray-900'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            ) : isMounted ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    code({ className, children }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isCodeBlock = match && className?.includes('language-');

                      return isCodeBlock ? (
                        <SyntaxHighlighter
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          style={oneDark as any}
                          language={match[1]}
                          PreTag="div"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className}>
                          {children}
                        </code>
                      );
                    },
                    img({ src, alt }) {
                      if (!src) return null;
                      return (
                        <Image
                          src={src}
                          alt={alt || ''}
                          width={300}
                          height={200}
                          className="rounded-lg max-w-full h-auto"
                        />
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            )}

            {message.isStreaming && (
              <span className="inline-block w-1 h-4 bg-gray-900 animate-pulse ml-1" />
            )}
          </div>

          {/* 시간 표시 */}
          <span className="text-xs text-gray-600 whitespace-nowrap pb-1">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
});
