"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Settings,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useUser } from "@/contexts/UserContext"
import { authService } from "@/services/authService"
import { EditProfileDialog } from "@/components/EditProfileDialog"
import { useState } from "react"

interface NavUserProps {
  onDropdownOpenChange?: (open: boolean) => void
}

export function NavUser({ onDropdownOpenChange }: NavUserProps) {
  const { isMobile } = useSidebar()
  const { userData } = useUser()

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!userData) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={onDropdownOpenChange}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage src={userData.photo_url || ''} alt={userData.name || ''} />
              <AvatarFallback className="rounded-full">
                {userData.name ? getInitials(userData.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{userData.name || 'Usuário'}</span>
              <span className="truncate text-xs">{userData.email || ''}</span>
            </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={userData.photo_url || ''} alt={userData.name || ''} />
                <AvatarFallback className="rounded-full">
                  {userData.name ? getInitials(userData.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{userData.name || 'Usuário'}</span>
                <span className="truncate text-xs">{userData.email || ''}</span>
              </div>
            </div>
          </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
            <EditProfileDialog>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Settings className="mr-2 h-4 w-4" />
                Editar Perfil
              </DropdownMenuItem>
            </EditProfileDialog>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut />
            Sair da Conta
          </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

    </SidebarMenuItem>
  </SidebarMenu>
)
}
