import {
  HomeIcon,
  Bell,
  MessageSquare,
  ArrowRightIcon,
  ShieldCheck,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import Logo from "@/components/Logo"
import UserMenu from "@/components/UserMenu"
import SearchCommand from "@/components/SearchCommand"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function Header() {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleChatClick = () => {
    navigate('/chat');
  };

  const handleAnonClick = () => {
    navigate('/anonimizador');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/30 bg-white/70 backdrop-blur-md backdrop-saturate-150 px-4 md:px-6 shadow-sm supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Left side - Logo and Navigation Icons */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <button 
            onClick={handleHomeClick}
            className="text-primary hover:text-primary/90 transition-colors cursor-pointer"
          >
            <Logo />
          </button>
          {/* Navigation Icons - Para implementação futura */}
          <div className="hidden md:flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleHomeClick}
                  >
                    <HomeIcon size={16} />
                    <span className="sr-only">Página Inicial</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="px-2 py-1 text-xs">
                  <p>Página Inicial</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleChatClick}
                  >
                    <MessageSquare size={16} />
                    <span className="sr-only">Chat com IA</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="px-2 py-1 text-xs">
                  <p>Chat com IA</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleAnonClick}
                  >
                    <ShieldCheck size={16} />
                    <span className="sr-only">Anonimizador</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="px-2 py-1 text-xs">
                  <p>Anonimizador</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Center - Search Command Component */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
          <SearchCommand />
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Feedback button - Para implementação futura */}
          <Button 
            variant="outline" 
            size="sm"
            className="hidden md:flex text-white border-0 rounded-full px-3 py-1 h-8 text-xs"
            style={{
              background: 'linear-gradient(90deg, #4E67FF 0%, #4EAFFF 79.07%, #98D4F8 102.23%)'
            }}
          >
            Enviar feedback
            <ArrowRightIcon className="-me-1 opacity-60" size={14} aria-hidden="true" />
          </Button>
          {/* Notification icon */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Bell size={16} />
                  <span className="sr-only">Notificações</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="px-2 py-1 text-xs">
                <p>Notificações</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* User menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}