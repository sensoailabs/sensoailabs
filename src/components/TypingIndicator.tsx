import React from 'react';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  isVisible: boolean;
  modelName?: string;
}

export default function TypingIndicator({ isVisible, modelName = 'Senso AI' }: TypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="flex items-start gap-4 animate-smooth-fade-up">
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600">
        <Bot className="w-4 h-4" />
      </div>
      
      <div className="flex-1">
        <div className="inline-block bg-gray-100 text-gray-900 rounded-lg rounded-tl-sm p-4 min-w-[60px]">
          <div className="flex items-center justify-center">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s', animationDuration: '1.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}