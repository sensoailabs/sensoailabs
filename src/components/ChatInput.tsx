import React, { useState, useId } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ModelCombobox } from "@/components/ui/combobox";
import { 
  Paperclip, 
  Telescope, 
  Globe, 
  Send
} from 'lucide-react';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [deepResearch, setDeepResearch] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const id = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      console.log('Enviando mensagem:', message);
      console.log('Deep Research:', deepResearch);
      console.log('Web Search:', webSearch);
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
    <div className="w-[680px] mx-auto">
      {/* Container do Input */}
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Textarea */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte-me qualquer coisa..."
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
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-input hover:bg-gray-50"
                title="Anexar arquivo"
              >
                <Paperclip className="w-4 h-4 text-gray-500" />
              </Button>
              
              {/* Seletor de Modelo */}
              <div className="border border-input rounded-lg">
                <ModelCombobox 
                  value={selectedModel} 
                  onValueChange={setSelectedModel} 
                />
              </div>
              
              {/* Deep Research Checkbox */}
              <label 
                className={`relative flex h-8 px-3 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-center transition-all outline-none hover:bg-gray-50 ${
                  deepResearch 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-input text-gray-500 hover:border-gray-300'
                }`}
                title="Deep Research"
              >
                <Checkbox 
                  id={`${id}-deep-research`}
                  checked={deepResearch}
                  onCheckedChange={setDeepResearch}
                  className="sr-only" 
                />
                <Telescope className="w-4 h-4" />
                <span className="text-xs font-medium">Investigar</span>
              </label>
              
              {/* Web Search Checkbox */}
              <label 
                className={`relative flex h-8 px-3 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-center transition-all outline-none hover:bg-gray-50 ${
                  webSearch 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-input text-gray-500 hover:border-gray-300'
                }`}
                title="Pesquisar na web"
              >
                <Checkbox 
                  id={`${id}-web-search`}
                  checked={webSearch}
                  onCheckedChange={setWebSearch}
                  className="sr-only" 
                />
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium">Web</span>
              </label>
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