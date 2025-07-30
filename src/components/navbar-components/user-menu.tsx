import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { authService } from '@/services/authService';

export default function UserMenu() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const user = await authService.getUser();
      if (user) {
        const userData = await authService.getUserData();
        const name = userData?.name || user.email?.split('@')[0] || 'Usuário';
        setUserName(name);
      }
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Logout manual em caso de erro
      localStorage.removeItem('supabase.auth.token');
      navigate('/login');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {getInitials(userName)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-sm font-medium">
            {userName}
          </div>
          <div className="h-px bg-border" />
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 px-2"
            onClick={() => setIsOpen(false)}
          >
            <User className="h-4 w-4" />
            Perfil
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 px-2"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
          <div className="h-px bg-border" />
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 px-2 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}