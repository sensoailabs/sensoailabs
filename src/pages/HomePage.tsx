import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from '@/services/authService';

export default function HomePage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const user = await authService.getUser();
      if (user) {
        // Buscar dados completos do usuário
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bem-vindo!
          </h1>
          <p className="text-xl text-gray-600">
            Olá, <span className="font-semibold text-indigo-600">{userName}</span>
          </p>
        </div>

        <Button 
          onClick={handleLogout}
          variant="outline"
          className="flex items-center gap-2 mx-auto"
        >
          <LogOut size={18} />
          Sair da conta
        </Button>
      </div>
    </div>
  );
}