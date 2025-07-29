import React, { useState } from 'react';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';

function App() {
  const [currentPage, setCurrentPage] = useState<'signup' | 'login'>('signup');

  if (currentPage === 'login') {
    return <LoginPage />;
  }

  return <SignupPage />;
}

export default App;
