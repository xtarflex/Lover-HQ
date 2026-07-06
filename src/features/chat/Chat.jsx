import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreVertical, Paperclip, Mic, Image as ImageIcon } from 'lucide-react';

/**
 * @file Chat.jsx
 * @description Scaffolding for the Chat interface frame and layout.
 */
const Chat = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 w-full overflow-hidden">
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center overflow-hidden border border-indigo-200 dark:border-indigo-800">
              <span className="text-indigo-600 dark:text-indigo-300 font-medium text-lg">P</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
                Partner Name
              </span>
              <span className="text-xs text-green-500 font-medium">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full transition-colors">
            <MoreVertical size={24} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Message List Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-gray-900">
        {/* Date Divider Placeholder */}
        <div className="flex justify-center">
          <span className="text-xs font-medium px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
            Today
          </span>
        </div>

        {/* Incoming Message Scaffold */}
        <div className="flex items-end gap-2 max-w-[85%]">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex-none hidden sm:flex items-center justify-center">
            <span className="text-indigo-600 dark:text-indigo-300 text-xs">P</span>
          </div>
          <div className="flex flex-col gap-1 items-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-2.5 text-gray-800 dark:text-gray-100 shadow-sm">
              <p className="text-[15px] leading-relaxed">Hey! How is your day going? 💕</p>
            </div>
            <span className="text-[11px] text-gray-400 ml-1">10:42 AM</span>
          </div>
        </div>

        {/* Outgoing Message Scaffold */}
        <div className="flex items-end gap-2 max-w-[85%] ml-auto justify-end">
          <div className="flex flex-col gap-1 items-end">
            <div className="bg-indigo-600 dark:bg-indigo-500 rounded-2xl rounded-br-sm px-4 py-2.5 text-white shadow-sm">
              <p className="text-[15px] leading-relaxed">
                It&apos;s going well! Just wrapping up some work. Miss you! 🥰
              </p>
            </div>
            <span className="text-[11px] text-gray-400 mr-1">10:45 AM</span>
          </div>
        </div>
      </main>

      {/* Input Footer */}
      <footer className="flex-none p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
        <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
          <button className="flex-none p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors">
            <Paperclip size={22} strokeWidth={2} />
          </button>

          <div className="flex-1 min-h-[44px] bg-gray-100 dark:bg-gray-900 border border-transparent focus-within:border-indigo-300 dark:focus-within:border-indigo-500/50 rounded-2xl flex items-center px-3 py-1 transition-colors">
            <textarea
              rows="1"
              placeholder="Message..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-[15px] max-h-32 py-2 text-gray-900 dark:text-white placeholder-gray-400"
              style={{ minHeight: '24px' }}
            />
            <button className="flex-none p-1.5 text-gray-400 hover:text-indigo-500 transition-colors ml-1">
              <ImageIcon size={20} strokeWidth={2} />
            </button>
          </div>

          <button className="flex-none w-11 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-95">
            <Mic size={20} strokeWidth={2.5} />
            {/* Toggle to Send when typing: <Send size={18} strokeWidth={2.5} className="ml-0.5" /> */}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
