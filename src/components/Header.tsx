import { useId } from "react"
import {
  HomeIcon,
  Bell,
  MessageSquare,
  ArrowRightIcon,
  SearchIcon,
} from "lucide-react"

import Logo from "@/components/navbar-components/logo"
import UserMenu from "@/components/navbar-components/user-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Navigation links with icons for desktop icon-only navigation
const navigationLinks = [
  { href: "#", label: "Dashboard", icon: HomeIcon, active: true },
  { href: "#", label: "Chat com IA", icon: MessageSquare, active: false },
]

export default function Header() {
  const id = useId()

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-md px-4 md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex flex-1 items-center gap-2">
          {/* Mobile menu trigger */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="group size-8 md:hidden"
                variant="ghost"
                size="icon"
              >
                <svg
                  className="pointer-events-none"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12L20 12"
                    className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                  />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-36 p-1 md:hidden">
              <NavigationMenu className="max-w-none *:w-full">
                <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
                  {navigationLinks.map((link, index) => {
                    const Icon = link.icon
                    return (
                      <NavigationMenuItem key={index} className="w-full">
                        <NavigationMenuLink
                          href={link.href}
                          className="flex-row items-center gap-2 py-1.5"
                          active={link.active}
                        >
                          <Icon
                            size={16}
                            className="text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span>{link.label}</span>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    )
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-6">
            {/* Logo */}
            <a href="#" className="text-primary hover:text-primary/90">
              <Logo />
            </a>
            {/* Desktop navigation - icon only */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="gap-2">
                <TooltipProvider>
                  {navigationLinks.map((link) => (
                    <NavigationMenuItem key={link.label}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavigationMenuLink
                            href={link.href}
                            className="flex size-8 items-center justify-center p-1.5"
                          >
                            <link.icon size={20} aria-hidden="true" />
                            <span className="sr-only">{link.label}</span>
                          </NavigationMenuLink>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="px-2 py-1 text-xs"
                        >
                          <p>{link.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </NavigationMenuItem>
                  ))}
                </TooltipProvider>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        
        {/* Center - Search Component */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
          <div className="relative w-80">
            <Input 
              className="bg-muted border-transparent shadow-none rounded-full peer ps-9 pr-4" 
              placeholder="Search..." 
              type="search" 
            /> 
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50"> 
              <SearchIcon size={16} /> 
            </div> 
          </div>
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Feedback button */}
          <Button 
            variant="outline" 
            className="hidden md:flex text-white border-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #4E67FF 0%, #4EAFFF 79.07%, #98D4F8 102.23%)'
            }}
          >
            Enviar feedback
            <ArrowRightIcon className="-me-1 opacity-60" size={16} aria-hidden="true" />
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