'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { FaReddit, FaYoutube } from 'react-icons/fa';
import { SiProducthunt } from 'react-icons/si';
import { useTheme } from '../providers/ThemeProvider';
import { formatContentForDisplay } from '@/lib/utils/text';
import type { SocialPost } from '@/lib/types';

interface PostCardProps {
  post: SocialPost;
  isExpanded: boolean;
  onToggleExpand: (postId: string) => void;
}

export default function PostCard({ post, isExpanded, onToggleExpand }: PostCardProps) {
  const { theme } = useTheme();

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'reddit':
        return <FaReddit className="w-5 h-5 text-orange-500" />;
      case 'hackernews':
        return (
          <div className="w-5 h-5 rounded bg-orange-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">Y</span>
          </div>
        );
      case 'youtube':
        return <FaYoutube className="w-5 h-5 text-red-600" />;
      case 'producthunt':
        return <SiProducthunt className="w-5 h-5 text-orange-500" />;
      default:
        return (
          <div className="w-5 h-5 rounded bg-gray-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">?</span>
          </div>
        );
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'hackernews':
        return 'Hacker News';
      case 'producthunt':
        return 'Product Hunt';
      default:
        return platform.charAt(0).toUpperCase() + platform.slice(1);
    }
  };

  const contentData = formatContentForDisplay(post.content || '', undefined, false);
  const displayContent = isExpanded ? contentData.originalContent : contentData.content;

  return (
    <div className={`backdrop-blur-sm rounded-lg border p-4 sm:p-6 transition-all ${
      theme === 'dark'
        ? 'bg-[#1f1a1733] border-[#4a3824] hover:border-amber-600'
        : 'bg-[#ffffff99] border-[#e8dcc8] hover:border-[#a8906e]'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
          theme === 'dark' 
            ? 'bg-[#2a2520] border-[#4a3824]' 
            : 'bg-white border-[#e8dcc8]'
        }`}>
          <div className="flex-shrink-0">{getPlatformIcon(post.platform)}</div>
          <span className={`text-sm font-medium ${
            theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
          }`}>
            {getPlatformName(post.platform)}
          </span>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <div className={`flex items-center gap-1 text-xs ${
            theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
          }`}>
            <span className="text-green-500">▲</span>
            <span className="font-medium">{post.score}</span>
          </div>
          <div className={`flex items-center gap-1 text-xs ${
            theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
          }`}>
            <span className="text-blue-500">💬</span>
            <span className="font-medium">{post.num_comments}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-lg sm:text-xl font-semibold transition-colors block leading-tight ${
            theme === 'dark'
              ? 'text-amber-300 hover:text-amber-200'
              : 'text-amber-800 hover:text-amber-900'
          }`}
        >
          {post.title}
        </a>
        
        <div>
          <p className={`text-sm sm:text-base leading-relaxed ${
            theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'
          }`}>
            {displayContent}
          </p>
          
          {contentData.isTruncated && (
            <button
              onClick={() => onToggleExpand(post.id)}
              className={`mt-2 flex items-center gap-1 text-xs font-medium transition-colors ${
                theme === 'dark'
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-amber-700 hover:text-amber-800'
              }`}
            >
              {isExpanded ? (
                <>
                  <ChevronUpIcon className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-3 h-3" />
                  Show more ({contentData.originalLength - contentData.truncatedLength} more characters)
                </>
              )}
            </button>
          )}
        </div>

        <div className={`flex flex-wrap items-center gap-3 pt-2 border-t text-xs ${
          theme === 'dark' 
            ? 'border-[#4a3824] text-[#d4c5ae]' 
            : 'border-[#e8dcc8] text-gray-600'
        }`}>
          <span className="font-medium">by {post.author}</span>
          <span>•</span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          {post.tags && post.tags.length > 0 && (
            <>
              <span>•</span>
              <div className="flex flex-wrap gap-1">
                {post.tags.slice(0, 2).map((tag, idx) => (
                  <span key={idx} className={`px-2 py-0.5 rounded text-xs ${
                    theme === 'dark'
                      ? 'bg-[#a8907033] text-amber-300'
                      : 'bg-[#fbe8b880] text-amber-800'
                  }`}>
                    {tag}
                  </span>
                ))}
                {post.tags.length > 2 && (
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
                  }`}>
                    +{post.tags.length - 2} more
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
