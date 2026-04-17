import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { api } from '../services/api';

const SUGGESTIONS = [
  'Search candidates for React developer',
  'Show analytics summary',
  'Show funnel by stage',
];

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I can help with candidate search, analytics, and funnel insights. Ask me something or use a suggestion below.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (text) => {
    const trimmed = (text ?? '').trim();
    if (!trimmed || isSending) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const res = await api.chat(trimmed, {});
      const data = res.data || {};

      const pretty =
        typeof data === 'string'
          ? data
          : data.reply ||
            data.summary ||
            data.funnel ||
            JSON.stringify(data, null, 2);

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: pretty,
        raw: data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const status = err?.response?.status;
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string'
          ? err.response.data
          : 'Something went wrong talking to the AI chat API.');
      setError(
        `Failed to send message${status ? ` (HTTP ${status})` : ''}: ${detail}`
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-full flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-sm text-gray-500">
            Ask questions about candidates, analytics, and your funnel.
          </p>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((sugg) => (
            <button
              key={sugg}
              type="button"
              onClick={() => sendMessage(sugg)}
              className="px-3 py-1.5 text-xs rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
              disabled={isSending}
            >
              {sugg}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 min-h-[320px] bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-2xl bg-gray-100 text-gray-500 text-xs flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 bg-white rounded-full shadow-sm border border-gray-200 px-3 py-1.5"
        >
          <input
            type="text"
            className="flex-1 px-3 py-1.5 text-sm outline-none border-none bg-transparent"
            placeholder="Ask about candidates, analytics, or your funnel..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Chat;

