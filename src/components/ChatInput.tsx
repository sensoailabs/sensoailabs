import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Paperclip, 
  Search, 
  Globe, 
  Send,
  Sparkles
} from 'lucide-react';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      console.log('Enviando mensagem:', message);
      // Aqui será implementada a lógica de envio
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Seletor de Modelo */}
      <div className="mb-4">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-64 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <SelectValue placeholder="Selecione o modelo" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                GPT-4
              </div>
            </SelectItem>
            <SelectItem value="gpt-3.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                GPT-3.5 Turbo
              </div>
            </SelectItem>
            <SelectItem value="claude">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Claude 3
              </div>
            </SelectItem>
            <SelectItem value="gemini">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Gemini Pro
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Container do Input */}
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Textarea */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="min-h-[120px] max-h-[300px] resize-none border-0 bg-transparent p-4 text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ 
              fontSize: '16px',
              lineHeight: '1.5'
            }}
          />
          
          {/* Barra de ferramentas */}
          <div className="flex items-center justify-between p-3 border-t border-gray-100">
            {/* Botões de ação à esquerda */}
            <div className="flex items-center gap-2">
              {/* Upload de arquivos */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                title="Anexar arquivo"
              >
                <Paperclip className="w-4 h-4 text-gray-500" />
              </Button>
              
              {/* Deep Research */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                title="Deep Research"
              >
                <Search className="w-4 h-4 text-gray-500" />
              </Button>
              
              {/* Pesquisa na Web */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                title="Pesquisar na web"
              >
                <Globe className="w-4 h-4 text-gray-500" />
              </Button>
            </div>

            {/* Botão de envio à direita */}
            <Button
              type="submit"
              disabled={!message.trim()}
              className="h-8 w-8 p-0 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg"
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </div>
        </form>
      </div>

      {/* Texto informativo */}
      <p className="text-xs text-gray-500 text-center mt-3">
        Senso AI pode cometer erros. Considere verificar informações importantes.
      </p>
    </div>
  );
}