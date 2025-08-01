import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabase';

interface UserData {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
  profile?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

interface UserContextType {
  userData: UserData | null;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
  clearUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

const CACHE_KEY = 'sensoai_user_data';
const CACHE_EXPIRY_KEY = 'sensoai_user_data_expiry';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function UserProvider({ children }: UserProviderProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Função para verificar se o cache é válido
  const isCacheValid = (): boolean => {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (!expiry) return false;
    return Date.now() < parseInt(expiry);
  };

  // Função para obter dados do cache
  const getCachedData = (): UserData | null => {
    if (!isCacheValid()) {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
      return null;
    }
    
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  };

  // Função para salvar dados no cache
  const setCachedData = (data: UserData) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
  };

  // Função para buscar dados do usuário
  const fetchUserData = async (forceRefresh: boolean = false): Promise<UserData | null> => {
    try {
      // Verificar se está autenticado primeiro
      if (isAuthenticated === false) {
        setUserData(null);
        setIsLoading(false);
        return null;
      }

      // Se ainda não sabemos o status de autenticação, aguardar
      if (isAuthenticated === null) {
        return null;
      }

      // Primeiro, verificar se há dados em cache (apenas se não for refresh forçado)
      if (!forceRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
          setUserData(cachedData);
          setIsLoading(false);
          return cachedData;
        }
      }

      // Se não há cache ou é refresh forçado, buscar do servidor
      const user = await authService.getUser();
      if (!user) {
        setUserData(null);
        setIsLoading(false);
        return null;
      }

      const data = await authService.getUserData();
      if (data) {
        setUserData(data);
        setCachedData(data);
      } else {
        setUserData(null);
      }
      
      setIsLoading(false);
      return data;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      setUserData(null);
      setIsLoading(false);
      return null;
    }
  };

  // Função para atualizar dados do usuário
  const refreshUserData = async (): Promise<void> => {
    setIsLoading(true);
    // Limpar cache para forçar busca nova
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    await fetchUserData(true);
  };

  // Função para limpar dados do usuário
  const clearUserData = (): void => {
    setUserData(null);
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  };

  // Verificar autenticação inicial e escutar mudanças
  useEffect(() => {
    let mounted = true;

    const checkInitialAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setIsAuthenticated(!!session);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação inicial:', error);
        if (mounted) {
          setIsAuthenticated(false);
        }
      }
    };

    checkInitialAuth();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        const isAuth = !!session;
        setIsAuthenticated(isAuth);
        
        if (event === 'SIGNED_OUT') {
          // Limpar dados quando fizer logout
          setUserData(null);
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_EXPIRY_KEY);
          setIsLoading(false);
        }
      }
    });

    // Listener para eventos de atualização de perfil
    const handleProfileUpdate = () => {
      refreshUserData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Buscar dados quando a autenticação mudar
  useEffect(() => {
    if (isAuthenticated === true) {
      fetchUserData();
    } else if (isAuthenticated === false) {
      setUserData(null);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const value: UserContextType = {
    userData,
    isLoading,
    refreshUserData,
    clearUserData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Hook para usar o contexto
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
}