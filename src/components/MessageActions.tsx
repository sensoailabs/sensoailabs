import React, { useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';

// Importando os logos dos provedores
import gptLogo from "@/assets/_icons-model-ai/gpt.svg"
import claudeLogo from "@/assets/_icons-model-ai/claude.svg"
import geminiLogo from "@/assets/_icons-model-ai/gemini.svg"

interface MessageActionsProps {
  content: string;
  onRegenerate?: () => void;
  modelUsed?: string;
}

// Função para mapear modelo para logo e nome do provedor
const getProviderInfo = (model?: string) => {
  if (!model) return null;
  
  if (model.includes('gpt') || model.includes('openai')) {
    return {
      logo: gptLogo,
      name: 'OpenAI',
      model: model.includes('gpt-4o') ? 'GPT-4o' : model
    };
  }
  
  if (model.includes('claude')) {
    return {
      logo: claudeLogo,
      name: 'Anthropic',
      model: model.includes('claude-3-5-sonnet') ? 'Claude 3.5 Sonnet' : model
    };
  }
  
  if (model.includes('gemini')) {
    return {
      logo: geminiLogo,
      name: 'Google',
      model: model.includes('gemini-2.0-flash') ? 'Gemini 2.0 Flash' : model
    };
  }
  
  return null;
};

export const MessageActions: React.FC<MessageActionsProps> = ({
  content,
  onRegenerate,
  modelUsed
}) => {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Copiado!",
        description: "Mensagem copiada para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a mensagem.",
        variant: "destructive",
      });
    }
  };



  const providerInfo = getProviderInfo(modelUsed);

  return (
    <div className="flex items-center gap-1 mt-2 opacity-100">
      {providerInfo && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <img 
            src={providerInfo.logo} 
            alt={providerInfo.name}
            className="w-4 h-4 object-contain"
          />
          <span className="font-medium">{providerInfo.model}</span>
        </div>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 w-8 p-0 hover:bg-gray-100 transition-all duration-200"
        title="Copiar mensagem"
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-gray-500" />
        )}
      </Button>
      
      {onRegenerate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          className="h-8 w-8 p-0 hover:bg-gray-100 group"
          title="Regenerar mensagem"
        >
          <Sparkles className="h-4 w-4 text-gray-500" />
        </Button>
      )}
    </div>
  );
};