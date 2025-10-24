'use client';

import { useTheme } from '../providers/ThemeProvider';
import type { ChatMessage as ChatMessageType } from '@/lib/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const { theme } = useTheme();

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] p-3 rounded-lg ${
        message.role === 'user'
          ? theme === 'dark'
            ? 'bg-amber-700 text-white'
            : 'bg-amber-800 text-white'
          : theme === 'dark'
            ? 'bg-[#3d2f1f] text-[#e8dcc8] border border-[#6b5943]'
            : 'bg-gray-100 text-gray-800 border border-gray-200'
      }`}>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        
        {message.citations && message.citations.length > 0 && (
          <div className={`mt-3 pt-3 border-t ${
            message.role === 'user' 
              ? 'border-white border-opacity-20' 
              : theme === 'dark'
                ? 'border-[#6b5943]'
                : 'border-gray-300'
          }`}>
            <p className={`text-xs font-medium mb-2 ${
              message.role === 'user' 
                ? 'text-white text-opacity-75' 
                : theme === 'dark'
                  ? 'text-amber-300'
                  : 'text-amber-700'
            }`}>
              Sources:
            </p>
            <div className="space-y-1">
              {message.citations.slice(0, 3).map((post, i) => (
                <a 
                  key={i} 
                  href={post.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`block text-xs underline transition-opacity hover:opacity-100 ${
                    message.role === 'user' 
                      ? 'text-white text-opacity-75 hover:text-opacity-100' 
                      : theme === 'dark'
                        ? 'text-amber-400 opacity-75'
                        : 'text-amber-600 opacity-75'
                  }`}
                >
                  <span className="font-medium">[{i + 1}]</span> {post.title.substring(0, 60)}
                  {post.title.length > 60 ? '...' : ''}
                  <span className={`ml-1 text-xs ${
                    message.role === 'user' 
                      ? 'text-white text-opacity-50' 
                      : theme === 'dark'
                        ? 'text-[#d4c5ae] opacity-50'
                        : 'text-gray-500'
                  }`}>
                    ({post.platform})
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
        
        <div className={`mt-2 text-xs ${
          message.role === 'user'
            ? 'text-white text-opacity-50'
            : theme === 'dark'
              ? 'text-[#d4c5ae] opacity-50'
              : 'text-gray-500'
        }`}>
          {message.timestamp?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || '...'}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;