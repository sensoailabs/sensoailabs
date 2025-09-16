 
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useUser } from '../contexts/UserContext'
import { Skeleton } from '@/components/ui/skeleton'
import ChatInput from '../components/ChatInput'

export default function HomePage() {
  const { userData, isLoading } = useUser();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = userData?.name || 'Usuário';
  const userPhoto = userData?.photo_url || '';
  const firstName = userName.split(' ')[0];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Senso AI Labs
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Home</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center p-4 pt-0">
          {/* Seção de Saudação */}
          <div className="flex flex-col items-center space-y-6 w-full max-w-4xl">
            {/* Foto do usuário */}
            {isLoading ? (
              <Skeleton className="w-24 h-24 rounded-full animate-smooth-fade-up" />
            ) : (
              <div
                className="w-24 h-24 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold animate-smooth-fade-up"
                style={{ animationDelay: '120ms', willChange: 'transform, opacity' }}
              >
                {userPhoto ? (
                  <img 
                    src={userPhoto} 
                    alt="Foto do usuário" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getInitials(userName)}</span>
                )}
              </div>
            )}

            {/* Mensagem de boas-vindas */}
            <div className="space-y-2 text-center w-full">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-8 w-3/5 animate-smooth-fade-up" />
                </div>
              ) : (
                <h1
                  className="text-[22px] font-bold text-foreground animate-smooth-fade-up"
                  style={{ animationDelay: '240ms', willChange: 'transform, opacity' }}
                >
                  Hello {firstName}, que bom ter você de volta ao Senso AI =)
                </h1>
              )}
            </div>

            {/* Chat Input */}
            <div className="mt-8 w-full max-w-2xl">
              <ChatInput />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}