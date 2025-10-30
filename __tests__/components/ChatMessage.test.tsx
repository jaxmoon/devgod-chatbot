import React from 'react';
import { render, screen } from '@testing-library/react';

import { ChatMessage } from '@/components/chat/ChatMessage';
import { Message } from '@/types/chat';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'img'>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { src, alt, ...rest } = props;
    return <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} {...rest} />;
  },
}));

jest.mock('react-syntax-highlighter', () => ({
  __esModule: true,
  Prism: ({ children }: { children: React.ReactNode }) => <pre>{children}</pre>,
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({}));

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({
    components,
    children,
  }: {
    components?: {
      code?: (props: { className?: string; children: React.ReactNode }) => React.ReactNode;
      img?: (props: { src?: string; alt?: string }) => React.ReactNode;
    };
    children: React.ReactNode;
  }) => {
    let renderedCodeBlock: React.ReactNode = null;
    let renderedInlineCode: React.ReactNode = null;
    let renderedImage: React.ReactNode = null;

    if (typeof children === 'string') {
      if (components?.code) {
        if (children.includes('```')) {
          renderedCodeBlock = components.code({
            className: 'language-ts',
            children: ['console.log("hi");\n'],
          });
        }
        renderedInlineCode = components.code({
          className: undefined,
          children: ['inline snippet'],
        });
      }

      if (components?.img && children.includes('![')) {
        renderedImage = components.img({
          src: '/image.png',
          alt: '샘플 이미지',
        });
      }
    }

    return (
      <div>
        {renderedCodeBlock}
        {renderedInlineCode}
        {renderedImage}
        {children}
      </div>
    );
  },
}));

const buildMessage = (overrides: Partial<Message> = {}): Message => ({
  id: overrides.id ?? 'message-1',
  role: overrides.role ?? 'user',
  content: overrides.content ?? '내용',
  timestamp: overrides.timestamp ?? new Date(2024, 0, 1, 9, 5).getTime(),
  isStreaming: overrides.isStreaming,
});

describe('ChatMessage', () => {
  it('renders user messages with a yellow background bubble', () => {
    const message = buildMessage({ role: 'user', content: '사용자 메시지' });

    render(<ChatMessage message={message} />);

    const wrapper = screen.getByTestId('chat-message');
    expect(wrapper.dataset.role).toBe('user');

    const bubble = wrapper.querySelector('.rounded-2xl');
    expect(bubble).not.toBeNull();
    expect(bubble?.className).toContain('bg-[#FAE100]');
  });

  it('renders assistant messages with a white background bubble', () => {
    const message = buildMessage({
      role: 'assistant',
      content: '안녕하세요',
    });

    render(<ChatMessage message={message} />);

    const wrapper = screen.getByTestId('chat-message');
    expect(wrapper.dataset.role).toBe('assistant');

    const bubble = wrapper.querySelector('.rounded-2xl');
    expect(bubble).not.toBeNull();
    expect(bubble?.className).toContain('bg-white');
  });

  it('shows the streaming indicator when the message is streaming', () => {
    const message = buildMessage({
      role: 'assistant',
      isStreaming: true,
    });

    render(<ChatMessage message={message} />);

    const wrapper = screen.getByTestId('chat-message');
    const indicator = wrapper.querySelector('.animate-pulse');

    expect(indicator).toBeInTheDocument();
  });

  it('formats the timestamp using the Korean time format', () => {
    const message = buildMessage({
      role: 'assistant',
      timestamp: new Date(2024, 0, 1, 13, 5).getTime(),
    });

    render(<ChatMessage message={message} />);

    expect(screen.getByText('오후 1:05')).toBeInTheDocument();
  });

  it('renders markdown code blocks and images with custom components', () => {
    const message = buildMessage({
      role: 'assistant',
      content: '```ts\nconsole.log("hi");\n```\ninline\n![샘플](/image.png)',
    });

    render(<ChatMessage message={message} />);

    expect(screen.getByText('console.log("hi");')).toBeInTheDocument();
    expect(screen.getByText('inline snippet')).toBeInTheDocument();
    expect(screen.getByAltText('샘플 이미지')).toBeInTheDocument();
  });
});
