"use client"

import * as React from "react"
import {
  MessageCircle,
  Search,
  Plus,
  ChevronRight,
  Folder,
  type LucideIcon,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface Project {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

interface Chat {
  name: string
  url: string
}

interface SidebarChatProps extends React.ComponentProps<typeof Sidebar> {
  projects?: Project[]
  chats?: Chat[]
}

// Dados mockados adaptados para o contexto de chat
const defaultData = {
  projects: [
    {
      title: "SensoAI Labs",
      url: "#",
      icon: Folder,
      isActive: true,
      items: [
        { title: "Configurações", url: "#" },
        { title: "Histórico", url: "#" },
        { title: "Favoritos", url: "#" },
      ],
    },
    {
      title: "Análise de Dados",
      url: "#",
      icon: Folder,
      items: [
        { title: "Dashboard", url: "#" },
        { title: "Relatórios", url: "#" },
        { title: "Métricas", url: "#" },
      ],
    },
    {
      title: "Documentação",
      url: "#",
      icon: Folder,
      items: [
        { title: "Guia Inicial", url: "#" },
        { title: "API Reference", url: "#" },
        { title: "Tutoriais", url: "#" },
      ],
    },
    {
      title: "Configurações",
      url: "#",
      icon: Folder,
      items: [
        { title: "Geral", url: "#" },
        { title: "Equipe", url: "#" },
        { title: "Integrações", url: "#" },
      ],
    },
  ],
  chats: [
    { name: "Chat sobre IA Generativa", url: "#chat-1" },
    { name: "Análise de Sentimentos", url: "#chat-2" },
    { name: "Processamento de Linguagem", url: "#chat-3" },
    { name: "Machine Learning Básico", url: "#chat-4" },
    { name: "Deep Learning Avançado", url: "#chat-5" },
  ],
}

export function SidebarChat({ 
  projects = defaultData.projects, 
  chats = defaultData.chats, 
  ...props 
}: SidebarChatProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="animate-smooth-fade-up" style={{ animationDelay: '80ms', willChange: 'transform, opacity' }} />
      
      <SidebarContent className="animate-smooth-fade-up" style={{ animationDelay: '120ms', willChange: 'transform, opacity' }}>
        {/* Ações do Chat */}
        <SidebarGroup className="animate-smooth-fade-up" style={{ animationDelay: '160ms' }}>
          <SidebarMenu>
            <SidebarMenuItem className="animate-smooth-fade-up" style={{ animationDelay: '200ms' }}>
              <SidebarMenuButton asChild>
                <a href="#" className="font-medium text-primary hover:text-primary/80">
                  <MessageCircle className="text-primary" />
                  <span>Novo chat</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="animate-smooth-fade-up" style={{ animationDelay: '240ms' }}>
              <SidebarMenuButton asChild>
                <a href="#" className="font-medium">
                  <Search />
                  <span>Buscar em chats</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Meus Projetos */}
        <SidebarGroup className="animate-smooth-fade-up" style={{ animationDelay: '200ms' }}>
          <SidebarGroupLabel>Meus projetos</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#" className="font-medium text-primary hover:text-primary/80">
                  <Plus className="text-primary" />
                  <span>Novo projeto</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {projects.map((project, idx) => (
              <Collapsible
                key={project.title}
                asChild
                defaultOpen={project.isActive}
                className="group/collapsible animate-smooth-fade-up"
                style={{ animationDelay: `${240 + idx * 100}ms`, willChange: 'transform, opacity' }}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={project.title}>
                      <project.icon />
                      <span>{project.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {project.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Meus Chats */}
          <SidebarGroup className="group-data-[collapsible=icon]:hidden animate-smooth-fade-up" style={{ animationDelay: '240ms' }}>
          <SidebarGroupLabel>Meus chats</SidebarGroupLabel>
          <SidebarMenu>
              {chats.map((chat, idx) => (
                <SidebarMenuItem key={chat.name} className="animate-smooth-fade-up" style={{ animationDelay: `${260 + idx * 80}ms` }}>
                  <SidebarMenuButton asChild>
                  <a href={chat.url}>
                    
                    <span>{chat.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail className="animate-smooth-fade-up" style={{ animationDelay: '100ms' }} />
    </Sidebar>
  )
}