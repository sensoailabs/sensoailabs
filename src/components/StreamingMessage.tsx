// React import removido - não utilizado
import type { StreamingMessage } from '@/hooks/useChatStream';
import logoChatImg from '@/assets/logo-chat.png';
import { MessageActions } from './MessageActions';
import MarkdownRenderer from './MarkdownRenderer';
import { Spinner } from '@/components/ui/spinner';

interface StreamingMessageProps {
  message: StreamingMessage;
  getModelIcon: (model?: string) => string;
  modelUsed?: string;
}

export default function StreamingMessageComponent({ 
  message, 
  // getModelIcon removido - não utilizado
  modelUsed 
}: StreamingMessageProps) {
  return (
    <div className="inline-block max-w-fit group">
      <div className="mb-2">
        <MarkdownRenderer content={message.content} />
      </div>
      <div className="flex items-center gap-2">
         {message.isStreaming ? (
           <Spinner size="sm" className="opacity-70" />
         ) : (
           <img 
             src={logoChatImg} 
             alt="IA" 
             className="w-4 h-4 opacity-70"
           />
         )}
         <div className="flex items-center gap-1">
            <span className=" text-gray-500">Senso AI</span>
            {message.isStreaming && (
              <span className="text-xs text-gray-500">digitando...</span>
            )}
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