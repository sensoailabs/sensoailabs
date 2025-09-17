import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Grid3X3,
  Home,
  Map,
  MessageSquare,
  PieChart,
  Send,
  Settings2,
  Shield,
  SquareTerminal,
  TrendingUp,
  UserCog,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import SearchCommand from "@/components/SearchCommand"
import Logo from "@/components/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Mais acessados",
      url: "#",
      icon: TrendingUp,
      isActive: true,
      items: [
        {
          title: "Senso chat",
          url: "/chat",
        },
        {
          title: "Anonimizador",
          url: "/anonimizador",
        },
        {
          title: "Editar meu perfil",
          url: "#",
        },
      ],
    },
    {
      title: "Senso chat",
      url: "/chat",
      icon: MessageSquare,
    },
    {
      title: "Anonimizador",
      url: "/anonimizador",
      icon: Shield,
    },
    {
      title: "Todos aplicativos",
      url: "#",
      icon: Grid3X3,
    },
  ],
  navSecondary: [
    {
      title: "Envie seu Feedback",
      url: "#",
      icon: Send,
    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar()
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open)
  }

  return (
    <Sidebar 
      collapsible="icon" 
      variant="inset" 
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                {state === "collapsed" ? (
                  <div className="flex items-center justify-center w-full">
                    <Logo />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Logo />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Senso AI</span>
                    </div>
                  </div>
                )}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {state === "collapsed" && (
            <>
              <div className="mt-2">
                <SearchCommand isCollapsed={true} />
              </div>
              <SidebarMenuItem className="mt-2">
                <SidebarMenuButton size="lg" asChild tooltip="Página inicial">
                  <a href="/" className="flex items-center justify-center w-full">
                    <Home className="h-5 w-5" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
        {state !== "collapsed" && (
          <div className="px-3 py-2">
            <SearchCommand isCollapsed={false} />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={state === "collapsed" ? data.navMain.filter(item => item.title !== "Mais acessados") : data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser onDropdownOpenChange={handleDropdownOpenChange} />
      </SidebarFooter>
    </Sidebar>
  )
}
