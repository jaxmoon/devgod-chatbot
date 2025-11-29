'use client';

import dynamic from 'next/dynamic';

const ChatContainer = dynamic(
  () => import('@/components/chat/ChatContainer').then((mod) => ({ default: mod.ChatContainer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-gray-500">로딩 중...</div>
      </div>
    ),
  }
);

export default function HomePage() {
  return <ChatContainer />;
}
