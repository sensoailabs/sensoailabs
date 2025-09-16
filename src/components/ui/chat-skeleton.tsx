import { Skeleton } from './skeleton';

interface ChatSkeletonProps {
  messageCount?: number;
  showHeader?: boolean;
  variant?: 'full' | 'messages-only';
}

export function ChatSkeleton({ 
  messageCount = 3, 
  showHeader = false, 
  variant = 'messages-only' 
}: ChatSkeletonProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto space-y-4 py-6">
        {/* Messages skeleton - simplified and minimal */}
        <div className="space-y-6">
          {Array.from({ length: messageCount }).map((_, i) => (
            <div 
              key={i} 
              className={`flex gap-3 ${
                i % 2 === 0 ? '' : 'flex-row-reverse'
              }`}
            >
              {/* Avatar skeleton - smaller and subtle */}
              <Skeleton className="w-6 h-6 rounded-full flex-shrink-0 opacity-60" />
              
              {/* Message content skeleton - minimal */}
              <div className="flex-1 max-w-[60%]">
                <Skeleton className="h-3 w-full opacity-40" />
                <Skeleton className="h-3 w-3/4 mt-1 opacity-30" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact version for quick loading states
export function ChatSkeletonCompact({ messageCount = 2 }: { messageCount?: number }) {
  return (
    <div className="space-y-6 p-4">
      {Array.from({ length: messageCount }).map((_, i) => (
        <div key={i} className="flex items-start space-x-3">
          <Skeleton className="h-6 w-6 rounded-full flex-shrink-0 opacity-50" />
          <div className="flex-1">
            <Skeleton className="h-3 w-2/3 opacity-40" />
            <Skeleton className="h-3 w-1/2 mt-1 opacity-30" />
          </div>
        </div>
      ))}
    </div>
  );
}