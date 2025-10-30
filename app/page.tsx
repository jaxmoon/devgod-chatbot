'use client';

import dynamic from 'next/dynamic';

const ChatContainer = dynamic(
  () => import('@/components/chat/ChatContainer').then((mod) => ({ default: mod.ChatContainer })),
  { ssr: false }
);

export default function HomePage() {
  return <ChatContainer />;
}
