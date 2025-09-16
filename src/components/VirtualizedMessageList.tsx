import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { List } from 'react-window';
import StreamingMessage from '@/components/StreamingMessage';
import type { StreamingMessage as StreamingMessageType } from '@/hooks/useChatStream';
import { MessageSkeleton } from './ui/message-skeleton';


interface VirtualizedMessageListProps {
  messages: StreamingMessageType[];
  height?: number;
  isLoading?: boolean;
  isLoadingConversation?: boolean;
}

interface MessageRowProps {
  messages: StreamingMessageType[];
  isLoading: boolean;
}

interface MessageItemRendererProps extends MessageRowProps {
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number;
  style: React.CSSProperties;
}

export interface VirtualizedMessageListRef {
  scrollToBottom: () => void;
  scrollToIndex: (index: number) => void;
}

// Wrapper component for react-window compatibility
const MessageItemWrapper = ({ index, style, data }: { index: number; style: React.CSSProperties; data: { messages: StreamingMessageType[]; isLoading: boolean } }) => {
  const { messages, isLoading } = data;
  const ariaAttributes = {
    "aria-posinset": index + 1,
    "aria-setsize": messages.length,
    role: "listitem" as const
  };
  if (index >= messages.length) {
    return (
      <div style={style} className="p-4" {...ariaAttributes}>
        <div className="animate-pulse">
          <div className="flex space-x-4">
            <div className="rounded-full bg-gray-300 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const message = messages[index];
  if (!message) {
    return <div style={style} {...ariaAttributes} />;
  }

  return (
    <div style={style} className="p-4 border-b border-gray-100" {...ariaAttributes}>
      <StreamingMessage 
          message={message}
          getModelIcon={() => '🤖'}
        />
    </div>
  );
};

MessageItemWrapper.displayName = 'MessageItemWrapper';

const VirtualizedMessageList = forwardRef<VirtualizedMessageListRef, VirtualizedMessageListProps>(
    ({ messages, height = 400, isLoading = false, isLoadingConversation = false }, ref) => {
    const listRef = useRef<any>(null);
    
    // Garantir que messages seja sempre um array válido
    const safeMessages = Array.isArray(messages) ? messages : [];

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        if (listRef.current && safeMessages.length > 0) {
          // Usar requestAnimationFrame para garantir que o DOM foi atualizado
          requestAnimationFrame(() => {
            listRef.current?.scrollToItem(safeMessages.length - 1, 'end');
          });
        }
      },
      scrollToIndex: (index: number) => {
        if (listRef.current && index >= 0 && index < safeMessages.length) {
          requestAnimationFrame(() => {
            listRef.current?.scrollToItem(index, 'start');
          });
        }
      }
    }));

    // Altura estimada por mensagem (pode ser ajustada conforme necessário)
    const ITEM_HEIGHT = 120;

    // Show empty state when there are no messages and we're not loading
    if (safeMessages.length === 0 && !isLoading) {
      return (
        <div style={{ height }} className="flex items-center justify-center text-gray-500">
          <p>No messages yet. Start a conversation!</p>
        </div>
      );
    }

    // Show skeleton when loading conversation or when loading
    if (isLoadingConversation || isLoading) {
      return (
        <div style={{ height }} className="overflow-auto">
          <MessageSkeleton count={5} />
        </div>
      );
    }

    const totalItems = safeMessages.length + (isLoading ? 1 : 0);
    
    // Garantir que itemData seja sempre um objeto válido
    const itemData = {
      messages: safeMessages,
      isLoading: Boolean(isLoading)
    };

    return (
      <List
          ref={listRef}
          style={{ height, overflowX: 'hidden' }}
          itemCount={totalItems}
          itemSize={ITEM_HEIGHT}
          itemData={itemData}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        >
          {MessageItemWrapper}
        </List>
    );
  }
);

VirtualizedMessageList.displayName = 'VirtualizedMessageList';

export default VirtualizedMessageList;