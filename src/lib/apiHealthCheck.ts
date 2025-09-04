// Verificação simples de configuração das APIs
export const isApiConfigured = (provider: string): boolean => {
  switch (provider) {
    case 'openai':
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      return !!openaiKey && openaiKey !== 'your_openai_api_key' && openaiKey.startsWith('sk-');
    case 'anthropic':
      const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      return !!anthropicKey && anthropicKey !== 'your_anthropic_api_key';
    case 'google':
      const googleKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
      return !!googleKey && googleKey !== 'your_google_ai_api_key';
    default:
      return false;
  }
};

export const getConfigurationStatus = () => {
  return {
    openai: isApiConfigured('openai'),
    anthropic: isApiConfigured('anthropic'),
    google: isApiConfigured('google')
  };
};