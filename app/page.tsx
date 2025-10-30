export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-white to-slate-100 p-8 text-center">
      <span className="rounded-full bg-kakao-yellow px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-900 shadow-sm">
        Agent 01 Setup Complete
      </span>
      <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
        Welcome to the Chatbot project
      </h1>
      <p className="max-w-xl text-base text-slate-600 sm:text-lg">
        Start building the Gemini-powered chatbot by editing <code>app/page.tsx</code>. Tailwind CSS, TypeScript strict mode, and testing tools are already configured.
      </p>
    </main>
  )
}
