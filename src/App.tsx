import React, { useState, useEffect } from 'react';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

type PageType = 'signup' | 'login' | 'forgot-password' | 'reset-password';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('login');

  // Detectar rota baseada na URL
  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    
    if (path === '/signup') {
      setCurrentPage('signup');
    } else if (path === '/forgot-password') {
      setCurrentPage('forgot-password');
    } else if (path === '/reset-password' && search.includes('token=')) {
      setCurrentPage('reset-password');
    } else {
      setCurrentPage('login');
    }
  }, []);

  const navigateToLogin = () => {
    setCurrentPage('login');
    window.history.pushState({}, '', '/login');
  };
  
  const navigateToSignup = () => {
    setCurrentPage('signup');
    window.history.pushState({}, '', '/signup');
  };

  const navigateToForgotPassword = () => {
    setCurrentPage('forgot-password');
    window.history.pushState({}, '', '/forgot-password');
  };

  // Renderizar página baseada no estado
  switch (currentPage) {
    case 'signup':
      return <SignupPage onNavigateToLogin={navigateToLogin} />;
    case 'forgot-password':
      return <ForgotPasswordPage onNavigateToLogin={navigateToLogin} />;
    case 'reset-password':
      return <ResetPasswordPage />;
    default:
      return <LoginPage onNavigateToSignup={navigateToSignup} onNavigateToForgotPassword={navigateToForgotPassword} />;
  }
}

export default App;
