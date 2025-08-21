import React from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';

interface MessageActionsProps {
  content: string;
  onRegenerate?: () => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  content,
  onRegenerate
}) => {
  const { toast } = useToast();
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
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



  return (
    <div className="flex items-center gap-2 mt-2 opacity-100">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 w-8 p-0 hover:bg-gray-100"
        title="Copiar mensagem"
      >
        <Copy className="h-4 w-4 text-gray-500" />
      </Button>
      
      {onRegenerate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          className="h-8 w-8 p-0 hover:bg-gray-100"
          title="Regenerar mensagem"
        >
          <RotateCcw className="h-4 w-4 text-gray-500" />
        </Button>
      )}
      

    </div>
  );
};