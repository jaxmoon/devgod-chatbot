import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const notoSans = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-noto-sans-kr',
})

export const metadata: Metadata = {
  title: 'Chatbot',
  description: 'Next.js chatbot project scaffolded by AGENT_01',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${notoSans.variable} font-sans bg-white text-slate-900`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  )
}
