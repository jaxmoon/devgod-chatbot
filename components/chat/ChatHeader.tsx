'use client';

import { ArrowLeft, Search, Menu } from 'lucide-react';

export function ChatHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button className="text-gray-700 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-semibold text-gray-900 text-lg">개발의신</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-gray-700 hover:text-gray-900">
          <Search className="w-5 h-5" />
        </button>
        <button className="text-gray-700 hover:text-gray-900">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
