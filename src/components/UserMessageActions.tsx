import React from 'react';
import { Copy, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';

interface UserMessageActionsProps {
  content: string;
  onEdit?: () => void;
}

export const UserMessageActions: React.FC<UserMessageActionsProps> = ({
  content,
  onEdit
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
    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 w-8 p-0 hover:bg-gray-100"
        title="Copiar mensagem"
      >
        <Copy className="h-4 w-4 text-gray-500" />
      </Button>
      
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 w-8 p-0 hover:bg-gray-100"
          title="Editar mensagem"
        >
          <Edit className="h-4 w-4 text-gray-500" />
        </Button>
      )}
    </div>
  );
};