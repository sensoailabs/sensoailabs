import React, { useState, useEffect, useId, useRef, useCallback } from 'react'
import { Plus, LoaderCircleIcon, SearchIcon, PlusIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  user_id: string
  model_used: string
}

interface ChatSidebarProps {
  onNewChat?: () => void
  currentConversationId?: string
  onConversationSelect?: (conversation: Conversation) => void
  refreshTrigger?: number
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ onNewChat, currentConversationId, onConversationSelect, refreshTrigger }) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const conversationsContainerRef = useRef<HTMLDivElement>(null)
  
  // Estados para busca
  const searchId = useId()
  const [searchValue, setSearchValue] = useState("")
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false)
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  
  // Estado para rotação do ícone do botão Novo Chat
  const [isNewChatRotating, setIsNewChatRotating] = useState(false)
  
  const navigate = useNavigate()

  const { userData } = useUser()

  const loadConversations = async (pageNum: number = 1, reset: boolean = false) => {
    if (!userData?.id) return

    try {
      if (pageNum === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const limit = 30
      const offset = (pageNum - 1) * limit

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userData.id)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Erro ao carregar conversas:', error)
        return
      }

      const sortedData = data?.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ) || []

      if (reset || pageNum === 1) {
        setConversations(sortedData)
      } else {
        setConversations(prev => [...prev, ...sortedData])
      }

      setHasMore((data?.length || 0) === limit)
      setPage(pageNum)
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Função para carregar mais conversas usando useCallback
  const loadMoreConversations = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadConversations(page + 1, false)
    }
  }, [hasMore, isLoadingMore, page, conversations.length])



  useEffect(() => {
    loadConversations()
  }, [userData])

  useEffect(() => {
    if (refreshTrigger) {
      loadConversations(1, true)
    }
  }, [refreshTrigger])

  // Implementar scroll infinito
  useEffect(() => {
    const container = conversationsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      
      // Carregar mais quando estiver a 10px do final
      if (distanceFromBottom <= 10 && hasMore && !isLoadingMore) {
        loadMoreConversations();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Verificar se já precisa carregar mais na inicialização
    const checkInitialLoad = () => {
      const { scrollHeight, clientHeight } = container;
      
      // Se o conteúdo não preenche o container, carregar mais
      if (scrollHeight <= clientHeight && hasMore && !isLoadingMore) {
        loadMoreConversations();
      }
    };
    
    // Verificar após um pequeno delay para garantir que o DOM foi renderizado
    const timeoutId = setTimeout(checkInitialLoad, 100);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [hasMore, isLoadingMore, loadMoreConversations, filteredConversations.length]);

  // Effect para filtrar conversas baseado na busca
  useEffect(() => {
    if (searchValue) {
      setIsSearchLoading(true)
      const timer = setTimeout(() => {
        const filtered = conversations.filter(conversation => 
          conversation.title.toLowerCase().includes(searchValue.toLowerCase())
        )
        setFilteredConversations(filtered)
        setIsSearchLoading(false)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setFilteredConversations(conversations)
      setIsSearchLoading(false)
    }
  }, [searchValue, conversations])

  const handleNewChat = () => {
    setIsNewChatRotating(true)
    setTimeout(() => setIsNewChatRotating(false), 500)
    
    if (onNewChat) {
      onNewChat()
    } else {
      navigate('/chat')
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    if (onConversationSelect) {
      onConversationSelect(conversation)
    } else {
      navigate(`/chat/${conversation.id}`)
    }
  }



  return (
    <div className="bg-white border-l border-r border-b border-gray-200 rounded-l-lg rounded-tr-none flex flex-col flex-shrink-0 w-80 overflow-hidden h-full">
      {/* Header - Fixo */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center">
          <SidebarTrigger className="mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Senso Chat</h2>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNewChat}
                className="group rounded-full border-0 text-white"
                style={{
                  background: 'linear-gradient(90deg, #4E67FF -92.26%, #4EAFFF 130.17%, #98D4F8 195.3%)'
                }}
                aria-expanded={isNewChatRotating}
              >
                <Plus className={`h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] ${
                  isNewChatRotating ? 'rotate-[135deg]' : ''
                }`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Novo Chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Busca - Fixo */}
      <div className="p-4 mt-4 sticky top-[73px] bg-white z-10">
          <div className="relative">
            <Input
              id={searchId}
              className="peer ps-9 pe-3 rounded-full"
              placeholder="Buscar conversas..."
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              {isSearchLoading ? (
                <LoaderCircleIcon
                  className="animate-spin"
                  size={16}
                  role="status"
                  aria-label="Loading..."
                />
              ) : (
                <SearchIcon size={16} aria-hidden="true" />
              )}
            </div>
          </div>
        </div>

      {/* Content - Área rolável */}
      <div ref={conversationsContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Meus Projetos */}
        <div className="p-2">
          <div className="mb-2">
            <div className="flex items-center justify-between w-full p-2 text-sm font-medium text-gray-700">
              <span>Meus Projetos</span>
              <Button
                className="group rounded-full"
                variant="outline"
                size="icon"
                onClick={() => {}}
                aria-label="Criar novo projeto"
              >
                <PlusIcon
                  className="transition-transform duration-500 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] group-hover:rotate-[135deg]"
                  size={16}
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
          
          <div className="ml-2 space-y-1">
            <div className="p-2 text-sm text-gray-500">
              Nenhum projeto encontrado
            </div>
          </div>
        </div>

        {/* Mais recentes */}
        <div className="p-2">
          <div className="mb-2">
            <div className="flex items-center w-full p-2 text-sm font-medium text-gray-700">
              Mais recentes
            </div>
          </div>
          
          <div className="ml-2 space-y-1">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center p-2 space-x-2">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse flex-shrink-0" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">
                  {searchValue ? 'Nenhuma conversa encontrada para a busca' : 'Nenhuma conversa encontrada'}
                </div>
              ) : (
                <>
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`flex items-center w-full p-2 text-sm text-left hover:bg-gray-100 rounded-md ${
                        currentConversationId === conversation.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600'
                      }`}
                    >
                      <span className="truncate">{conversation.title}</span>
                    </button>
                  ))}
                  
                  {/* Indicador de loading no final da lista */}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center p-4">
                      <Spinner className="w-4 h-4" />
                      <span className="ml-2 text-xs text-muted-foreground">Carregando mais...</span>
                    </div>
                  )}
                </>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatSidebar