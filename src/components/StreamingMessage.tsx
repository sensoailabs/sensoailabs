import React from 'react';
import type { StreamingMessage } from '@/hooks/useChatStream';
import logoChatImg from '@/assets/logo-chat.png';
import { MessageActions } from './MessageActions';
import MarkdownRenderer from './MarkdownRenderer';

interface StreamingMessageProps {
  message: StreamingMessage;
  getModelIcon: (model?: string) => string;
  modelUsed?: string;
}

export default function StreamingMessageComponent({ 
  message, 
  getModelIcon,
  modelUsed 
}: StreamingMessageProps) {
  return (
    <div className="inline-block max-w-fit group">
      <div className="mb-2">
        <MarkdownRenderer content={message.content} />
      </div>
      <div className="flex items-center gap-2">
         <img 
           src={logoChatImg} 
           alt="IA criando..." 
           className="w-4 h-4 opacity-70 animate-pulse"
         />
         <div className="flex items-center gap-1">
            <span className=" text-gray-500">Senso AI</span>
            <span className="text-xs text-gray-500 animate-pulse">...</span>
          </div>
       </div>
       {!message.isStreaming && (
         <MessageActions 
           content={message.content}
           modelUsed={modelUsed}
         />
       )}
    </div>
  );
}