"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { chatService, getUserConversationsPaginated, type Conversation } from "@/services/chatService"
import { useUser } from "@/contexts/UserContext"
import logger from "@/lib/clientLogger"

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

interface SidebarChatProps extends React.ComponentProps<typeof Sidebar> {
  projects?: Project[]
  onConversationSelect?: (conversation: Conversation) => void
  onNewChat?: () => void
  currentConversationId?: string
  refreshTrigger?: number // Trigger para forçar recarregamento das conversas
}

// Dados padrão para projetos
const defaultProjects = [
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
]

export function SidebarChat({ 
  projects = defaultProjects,
  onConversationSelect,
  onNewChat,
  currentConversationId,
  refreshTrigger,
  ...props 
}: SidebarChatProps) {
  const { userData } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)


  // Carregar conversas do usuário com paginação
  const loadConversations = async (page: number = 1, reset: boolean = false): Promise<void> => {
    if (!userData?.id) {
      return Promise.resolve()
    }
    
    setIsLoading(true)
    try {
      const result = await getUserConversationsPaginated(userData.id, page, 20)
      
      if (reset) {
        setConversations(result.conversations)
      } else {
        setConversations(prev => [...prev, ...result.conversations])
      }
      
      setHasMore(result.hasMore)
      setTotalCount(result.totalCount)
      setCurrentPage(result.currentPage)
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
      logger.error('Erro ao carregar conversas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar mais conversas (apenas adiciona novos itens)
  const loadMoreConversations = () => {
    if (!isLoading && hasMore) {
      loadConversations(currentPage + 1, false)
    }
  }

  // Efeito para carregar conversas iniciais
  useEffect(() => {
    setCurrentPage(1)
    setHasMore(true)
    loadConversations(1, true)
  }, [userData?.id, refreshTrigger])



  // Filtrar conversas
  const filteredConversations = conversations
    .filter(conversation => {
      // Filtro por texto
      return conversation.title.toLowerCase().includes(searchTerm.toLowerCase())
    })
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || '')
      const dateB = new Date(b.updated_at || b.created_at || '')
      
      // Ordenar por data mais recente primeiro
      return dateB.getTime() - dateA.getTime()
    })

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Hoje'
    if (diffDays === 2) return 'Ontem'
    if (diffDays <= 7) return `${diffDays} dias atrás`
    return date.toLocaleDateString('pt-BR')
  }

  // Função para lidar com novo chat
  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat()
    }
  }

  // Função para selecionar conversa
  const handleConversationSelect = (conversation: Conversation) => {
    if (onConversationSelect) {
      onConversationSelect(conversation)
    }
  }


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="animate-smooth-fade-up" style={{ animationDelay: '80ms', willChange: 'transform, opacity' }} />
      
      <SidebarContent className="animate-smooth-fade-up" style={{ animationDelay: '120ms', willChange: 'transform, opacity' }}>
        {/* Ações do Chat */}
        <SidebarGroup className="animate-smooth-fade-up" style={{ animationDelay: '160ms' }}>
          <SidebarMenu>
            <SidebarMenuItem className="animate-smooth-fade-up" style={{ animationDelay: '200ms' }}>
              <SidebarMenuButton onClick={handleNewChat} className="font-medium text-primary hover:text-primary/80">
                <MessageCircle className="text-primary" />
                <span>Novo chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="animate-smooth-fade-up" style={{ animationDelay: '240ms' }}>
              <div className="px-2 space-y-2">
                <div className="flex gap-1">
                  <Input
                    type="text"
                    placeholder="Buscar em chats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 flex-1"
                  />
                </div>

              </div>
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

        {/* Histórico de Conversas */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden animate-smooth-fade-up" style={{ animationDelay: '240ms' }}>
          <SidebarGroupLabel>
            Histórico de conversas
          </SidebarGroupLabel>
          <SidebarMenu>
            {isLoading ? (
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <span>Carregando...</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : filteredConversations.length === 0 ? (
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <span className="text-muted-foreground">
                    {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              filteredConversations.map((conversation, idx) => (
                <SidebarMenuItem 
                  key={conversation.id} 
                  className="animate-smooth-fade-up" 
                  style={{ animationDelay: `${260 + idx * 80}ms` }}
                >
                  <SidebarMenuButton 
                    onClick={() => handleConversationSelect(conversation)}
                    className={`flex flex-col items-start gap-1 h-auto py-2 ${
                      currentConversationId === conversation.id ? 'bg-accent' : ''
                    }`}
                  >
                    <span className="truncate text-sm font-medium">
                      {conversation.title}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            )}
            
            {/* Botão Carregar Mais */}
            {!searchTerm && hasMore && !isLoading && filteredConversations.length > 0 && (
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={loadMoreConversations}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                  <span>Carregar mais conversas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            
            {/* Indicador de carregamento */}
            {isLoading && conversations.length > 0 && (
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <span className="text-muted-foreground">Carregando mais...</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            
            {/* Contador de conversas */}
            {!searchTerm && totalCount > 0 && (
              <SidebarMenuItem>
                <div className="px-2 py-1 text-xs text-muted-foreground text-center">
                  {conversations.length} de {totalCount} conversas
                </div>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail className="animate-smooth-fade-up" style={{ animationDelay: '100ms' }} />
    </Sidebar>
  )
}