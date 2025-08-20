import React from 'react';
import { Bot, Loader2 } from 'lucide-react';
import type { StreamingMessage } from '@/hooks/useChatStream';

interface StreamingMessageProps {
  message: StreamingMessage;
  getModelIcon: (model?: string) => string;
}

export default function StreamingMessageComponent({ 
  message, 
  getModelIcon 
}: StreamingMessageProps) {
  return (
    <div className="flex items-start gap-4 animate-smooth-fade-up">
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1">
        <div className="inline-block max-w-[85%] bg-gray-100 text-gray-900 rounded-lg rounded-tl-sm p-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
            {message.isStreaming && (
              <span className="inline-flex items-center ml-1">
                <span className="animate-pulse">▋</span>
              </span>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-2 text-left">
          {message.isStreaming ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Digitando...
            </span>
          ) : (
            <span>Agora</span>
          )}
        </div>
      </div>
    </div>
  );
}