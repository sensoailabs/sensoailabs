import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { UserProvider } from './contexts/UserContext';
import { ToastProvider } from './components/providers/toast-provider';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import SensoChatPage from './pages/SensoChatPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar se usuário está autenticado
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <Router>
      <UserProvider>
        <ToastProvider>
          <Routes>
          {/* Rotas protegidas - só acessíveis se autenticado */}
          <Route 
            path="/home" 
            element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/chat" 
            element={isAuthenticated ? <SensoChatPage /> : <Navigate to="/login" />} 
          />
          
          {/* Rotas públicas - só acessíveis se não autenticado */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/home" />} 
          />
          <Route 
            path="/signup" 
            element={!isAuthenticated ? <SignupPage /> : <Navigate to="/home" />} 
          />
          <Route 
            path="/forgot-password" 
            element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/home" />} 
          />
          <Route 
            path="/reset-password" 
            element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/home" />} 
          />
          
          {/* Rota raiz - redireciona baseado na autenticação */}
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/home" : "/login"} />} 
          />
          
          {/* Rota catch-all */}
          <Route 
            path="*" 
            element={<Navigate to={isAuthenticated ? "/home" : "/login"} />} 
          />
          </Routes>
        </ToastProvider>
      </UserProvider>
    </Router>
  );
}

export default App;
