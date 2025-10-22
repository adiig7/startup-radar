'use client';

import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../providers/ThemeProvider';
import ChatMessage from './ChatMessage';
import type { ChatMessage as ChatMessageType, SocialPost } from '@/lib/types';

interface ChatPanelProps {
  searchResults: SocialPost[];
  searchQuery: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatPanel({ searchResults, searchQuery, isOpen, onToggle }: ChatPanelProps) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchResults.length > 0 && messages.length === 0) {
      const welcomeMessage: ChatMessageType = {
        role: 'assistant',
        content: `Hi! I can help you analyze the ${searchResults.length} search results for "${searchQuery}". Ask me anything about the discussions, trends, problems, or opportunities you see here.

Some example questions:
• What are the main problems mentioned?
• Which posts show the most engagement?
• What opportunities do you see?
• Summarize the key themes`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [searchResults, searchQuery, messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessageType = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const streamingMessageIndex = messages.length + 1;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          searchResults: searchResults,
          context: {
            messages: messages,
            filters: {
              platforms: ['reddit', 'hackernews', 'youtube', 'producthunt'] as const
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let messageCreated = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.done) {
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[streamingMessageIndex] = {
                      role: 'assistant',
                      content: data.fullContent,
                      citations: data.citations,
                      timestamp: new Date(data.timestamp),
                    };
                    return updated;
                  });
                } else {
                  fullContent += data.content;

                  setMessages(prev => {
                    const updated = [...prev];

                    if (!messageCreated) {
                      updated[streamingMessageIndex] = {
                        role: 'assistant',
                        content: fullContent,
                        timestamp: new Date(),
                      };
                    } else {
                      updated[streamingMessageIndex] = {
                        ...updated[streamingMessageIndex],
                        content: fullContent,
                      };
                    }
                    return updated;
                  });

                  if (!messageCreated) {
                    messageCreated = true;
                    setLoading(false);
                  }
                }
              } catch (e) {
                // Ignore invalid JSON
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessageType = {
        role: 'assistant',
        content: error.message?.includes('Authentication error')
          ? 'Sorry, there\'s an authentication issue with the AI service. The search results are still available above.'
          : error.message?.includes('quota') || error.message?.includes('rate limit')
          ? 'The AI service is temporarily unavailable due to rate limits. Please try again in a few minutes.'
          : 'Sorry, I encountered an error analyzing the results. Please try again or check the search results above.',
        timestamp: new Date(),
      };
      setMessages(prev => {
        const updated = [...prev];
        updated[streamingMessageIndex] = errorMessage;
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onToggle}
      />
      
      <div className={`fixed right-0 top-0 h-full w-full lg:w-96 backdrop-blur-sm z-50 flex flex-col ${
        theme === 'dark'
          ? 'bg-[#1f1a17] border-l border-[#4a3824]'
          : 'bg-[#ffffff] border-l border-[#e8dcc8]'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${
          theme === 'dark' ? 'border-[#4a3824]' : 'border-[#e8dcc8]'
        }`}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <ChatBubbleLeftIcon className={`w-5 h-5 flex-shrink-0 ${
              theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
            }`} />
            <div className="min-w-0 flex-1">
              <h3 className={`font-semibold text-sm ${
                theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
              }`}>
                Chat about Results
              </h3>
              <p className={`text-xs truncate ${
                theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
              }`}>
                "{searchQuery}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {messages.length > 1 && (
              <button
                onClick={clearChat}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  theme === 'dark'
                    ? 'text-[#d4c5ae] hover:text-amber-300 hover:bg-[#3d2f1f]'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Clear
              </button>
            )}
            <button 
              onClick={onToggle}
              title="Close chat"
              className={`p-1 rounded transition-colors ${
                theme === 'dark'
                  ? 'text-[#d4c5ae] hover:text-amber-300 hover:bg-[#3d2f1f]'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((message, idx) => (
            <ChatMessage key={idx} message={message} />
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className={`p-3 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-[#3d2f1f] border-[#6b5943] text-[#e8dcc8]'
                  : 'bg-gray-100 border-gray-200 text-gray-800'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm">Analyzing results...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className={`p-4 border-t flex-shrink-0 ${
          theme === 'dark' ? 'border-[#4a3824]' : 'border-[#e8dcc8]'
        }`}>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about the results..."
              disabled={loading}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
                theme === 'dark'
                  ? 'bg-[#3d2f1f] border-[#6b5943] text-amber-100 placeholder-[#a8906e] focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  : 'bg-white border-[#d4c5ae] text-gray-900 placeholder-gray-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
              }`}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${
                theme === 'dark'
                  ? 'bg-amber-700 text-white hover:bg-amber-600 disabled:hover:bg-amber-700'
                  : 'bg-amber-800 text-white hover:bg-amber-900 disabled:hover:bg-amber-800'
              }`}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          
          <p className={`text-xs mt-2 ${
            theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
          }`}>
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
