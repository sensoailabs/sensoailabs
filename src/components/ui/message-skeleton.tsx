import { Skeleton } from './skeleton';

interface MessageSkeletonProps {
  count?: number;
}

export function MessageSkeleton({ count = 3 }: MessageSkeletonProps) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-start space-x-3">
          {/* Avatar skeleton */}
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          
          {/* Message content skeleton */}
          <div className="flex-1 space-y-2">
            {/* Message header */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            
            {/* Message content lines */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              {index % 2 === 0 && <Skeleton className="h-4 w-3/5" />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SingleMessageSkeleton() {
  return (
    <div className="flex items-start space-x-3 p-4">
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}