'use client';

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ListChildComponentProps,
  VariableSizeList,
} from 'react-window';
import { ChatMessage } from './ChatMessage';
import { Message } from '@/types/chat';

const DEFAULT_ITEM_HEIGHT = 140;

interface ItemData {
  messages: Message[];
  setSize: (index: number, size: number) => void;
}

const OuterElement = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function OuterElement({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`overflow-y-auto p-4 ${className ?? ''}`}
        {...props}
      />
    );
  },
);

const VirtualizedRow = memo(
  ({ index, style, data }: ListChildComponentProps<ItemData>) => {
    const { messages, setSize } = data;
    const message = messages[index];
    const rowRef = useCallback((node: HTMLDivElement | null) => {
      if (node) {
        const height = node.getBoundingClientRect().height;
        setSize(index, height);
      }
    }, [index, setSize]);

    return (
      <div style={style}>
        <div ref={rowRef}>
          <ChatMessage message={message} />
        </div>
      </div>
    );
  },
);
VirtualizedRow.displayName = 'VirtualizedRow';

interface VirtualizedMessageListProps {
  messages: Message[];
}

export function VirtualizedMessageList({ messages }: VirtualizedMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<VariableSizeList<ItemData> | null>(null);
  const sizeMap = useRef<Map<number, number>>(new Map());
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const isInitialRender = useRef(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(element);
    setDimensions({
      width: element.clientWidth,
      height: element.clientHeight,
    });

    return () => observer.disconnect();
  }, []);

  const isVirtualized = messages.length > 50;
  const lastMessage = messages[messages.length - 1];

  const scrollToBottom = useCallback((smooth = false) => {
    if (scrollContainerRef.current) {
      if (smooth) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }
  }, []);

  // 초기 로드 시 즉시 스크롤 (동기적)
  useLayoutEffect(() => {
    if (!isMounted || messages.length === 0 || !isInitialRender.current) {
      return;
    }

    if (!isVirtualized) {
      // 초기 렌더링 시 즉시 스크롤
      scrollToBottom(false);
      isInitialRender.current = false;
    }
  }, [isMounted, messages.length, isVirtualized, scrollToBottom]);

  // 이후 메시지 추가 시 부드럽게 스크롤
  useEffect(() => {
    if (!isMounted || messages.length === 0 || isInitialRender.current) {
      return;
    }

    if (isVirtualized) {
      sizeMap.current.clear();
      listRef.current?.resetAfterIndex(0, true);
      listRef.current?.scrollToItem(messages.length - 1, 'end');
    } else {
      // 약간의 지연 후 부드럽게 스크롤
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
    }
  }, [
    isMounted,
    isVirtualized,
    messages.length,
    lastMessage?.id,
    lastMessage?.content,
    lastMessage?.isStreaming,
    scrollToBottom,
  ]);

  const getSize = useCallback((index: number) => {
    return sizeMap.current.get(index) ?? DEFAULT_ITEM_HEIGHT;
  }, []);

  const setSize = useCallback((index: number, size: number) => {
    const current = sizeMap.current.get(index);
    if (current !== size) {
      sizeMap.current.set(index, size);
      listRef.current?.resetAfterIndex(index);
    }
  }, []);

  const itemData = useMemo<ItemData>(() => ({ messages, setSize }), [messages, setSize]);

  const shouldRenderVirtualized =
    isMounted && isVirtualized && dimensions && dimensions.width > 0 && dimensions.height > 0;

  if (!isMounted) {
    return (
      <div ref={containerRef} className="h-full w-full bg-[#B2C7D9]">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-600 mt-8">
              <p className="text-lg font-semibold">안녕하세요! 개발의신입니다.</p>
              <p className="text-sm mt-2">소프트웨어 개발에 대해 무엇이든 물어보세요.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full bg-[#B2C7D9]">
      {messages.length === 0 && (
        <div ref={scrollContainerRef} className="h-full overflow-y-auto p-4">
          <div className="text-center text-gray-600 mt-8">
            <p className="text-lg font-semibold">안녕하세요! 개발의신입니다.</p>
            <p className="text-sm mt-2">소프트웨어 개발에 대해 무엇이든 물어보세요.</p>
          </div>
        </div>
      )}

      {!isVirtualized && messages.length > 0 && (
        <div ref={scrollContainerRef} className="h-full overflow-y-auto p-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {isVirtualized && (
        shouldRenderVirtualized ? (
          <VariableSizeList
            ref={listRef}
            height={dimensions.height}
            width={dimensions.width}
            itemCount={messages.length}
            itemSize={getSize}
            itemKey={(index) => messages[index].id}
            itemData={itemData}
            outerElementType={OuterElement}
            className="bg-[#B2C7D9]"
          >
            {VirtualizedRow}
          </VariableSizeList>
        ) : (
          <div className="h-full overflow-y-auto p-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
