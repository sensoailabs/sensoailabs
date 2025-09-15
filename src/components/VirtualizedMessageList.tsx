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
const MessageItemWrapper = ({ index, style, messages, ariaAttributes }: MessageItemRendererProps) => {
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

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        if (listRef.current && messages.length > 0) {
          listRef.current.scrollToRow({ index: messages.length - 1, align: 'end' });
        }
      },
      scrollToIndex: (index: number) => {
        if (listRef.current) {
          listRef.current.scrollToItem(index, 'start');
        }
      }
    }));

    // Altura estimada por mensagem (pode ser ajustada conforme necessário)
    const ITEM_HEIGHT = 120;

    // Show empty state when there are no messages and we're not loading
    if (messages.length === 0 && !isLoading) {
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

    const totalItems = messages.length + (isLoading ? 1 : 0);

    return (
      <List<MessageRowProps>
          listRef={listRef}
          style={{ height, overflowX: 'hidden' }}
          rowCount={totalItems}
          rowHeight={ITEM_HEIGHT}
          rowProps={{ messages, isLoading }}
          rowComponent={MessageItemWrapper}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        />
    );
  }
);

VirtualizedMessageList.displayName = 'VirtualizedMessageList';

export default VirtualizedMessageList;