"use client"

import * as React from "react"
import {
  SearchIcon,
  MessageSquare,
  Grid3X3,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  DialogTitle,
} from "@/components/ui/dialog"
import EditProfileDialog from "@/components/EditProfileDialog"
import iconAppAnonimizador from '../assets/_icons-modulos/icon-app-anonimizador.png'
import iconAppSensoChat from '../assets/_icons-modulos/icon-app-senso-chat.png'
import iconAppRecrutamento from '../assets/_icons-modulos/icon-app-recrutamento.png'

interface SearchCommandProps {
  isCollapsed?: boolean
}

export default function SearchCommand({ isCollapsed = false }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false)
  const [showEditProfile, setShowEditProfile] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleNewChat = () => {
    setOpen(false)
    // Simular clique na aba "Novo chat"
    const newChatTab = document.querySelector('[value="novo-chat"]') as HTMLElement
    if (newChatTab) {
      newChatTab.click()
    }
  }

  const handleMeusAplicativos = () => {
    setOpen(false)
    // Simular clique na aba "Meus aplicativos"
    const appsTab = document.querySelector('[value="meus-aplicativos"]') as HTMLElement
    if (appsTab) {
      appsTab.click()
    }
  }

  const handleEditProfile = () => {
    setOpen(false)
    setShowEditProfile(true)
  }

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Clique no ícone de pesquisa (collapsed)');
            setOpen(true);
          }}
          className="w-8 h-8 p-0 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </SidebarMenuItem>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-9 px-3 py-2 text-sm bg-background border border-input rounded-full shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-center justify-center transition-all duration-200"
      >
        <span className="flex grow items-center">
          <SearchIcon
            className="text-muted-foreground/80 -ms-1 me-3"
            size={16}
            aria-hidden="true"
          />
          <span className="text-muted-foreground/70 font-normal">Buscar...</span>
        </span>
        <kbd className="bg-gray-100 text-muted-foreground/70 ms-auto -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Buscar comandos e aplicativos</DialogTitle>
        <CommandInput placeholder="Digite um comando ou busque..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Ações rápidas">
            <CommandItem onSelect={handleNewChat}>
              <MessageSquare
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>Novo chat</span>
              <CommandShortcut className="justify-center">⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={handleMeusAplicativos}>
              <Grid3X3
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>Meus aplicativos</span>
              <CommandShortcut className="justify-center">⌘A</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={handleEditProfile}>
              <User
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>Editar meu perfil</span>
              <CommandShortcut className="justify-center">⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Aplicativos">
            <CommandItem>
              <img
                src={iconAppAnonimizador}
                alt="Anonimizador"
                className="w-4 h-4"
                aria-hidden="true"
              />
              <span>Anonimizador de dados</span>
            </CommandItem>
            <CommandItem>
              <img
                src={iconAppSensoChat}
                alt="Senso Chat"
                className="w-4 h-4"
                aria-hidden="true"
              />
              <span>Senso Chat</span>
            </CommandItem>
            <CommandItem>
              <img
                src={iconAppRecrutamento}
                alt="Recrutamento"
                className="w-4 h-4"
                aria-hidden="true"
              />
              <span>Assistente de recrutamento</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Dialog de edição de perfil */}
      <EditProfileDialog>
        <button 
          onClick={() => setShowEditProfile(true)}
          style={{ display: showEditProfile ? 'block' : 'none', opacity: 0, position: 'absolute', pointerEvents: 'none' }}
          ref={(el) => {
            if (el && showEditProfile) {
              setTimeout(() => {
                el.click()
                setShowEditProfile(false)
              }, 10)
            }
          }}
        />
      </EditProfileDialog>
    </>
  )
}