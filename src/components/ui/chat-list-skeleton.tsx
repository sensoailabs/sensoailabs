import { Skeleton } from "@/components/ui/skeleton"
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function ChatListSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <SidebarMenuItem key={index} className="animate-pulse">
          <SidebarMenuButton className="flex flex-col items-start gap-1 h-auto py-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  )
}