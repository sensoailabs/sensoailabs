import { useEffect, useState } from 'react';
import { CheckCircleIcon, AlertCircleIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationProps {
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
  className?: string;
}

export function Notification({ type, title, message, onClose, className }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const isSuccess = type === 'success';

  useEffect(() => {
    // Trigger entrada animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    // Aguarda a animação de saída antes de fechar
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 max-w-[400px] rounded-md border p-4 shadow-lg bg-background",
      "transition-all duration-300 ease-in-out transform",
      isVisible && !isExiting 
        ? "translate-x-0 opacity-100 scale-100" 
        : "translate-x-full opacity-0 scale-95",
      className
    )}>
      <div className="flex items-center gap-2">
        <div 
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border",
            isSuccess ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          )}
          aria-hidden="true"
        >
          {isSuccess ? (
            <CheckCircleIcon className="text-green-600" size={16} />
          ) : (
            <AlertCircleIcon className="text-red-600" size={16} />
          )}
        </div>
        <div className="flex grow items-start gap-2">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-muted-foreground text-xs">
              {message}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent" 
          aria-label="Fechar notificação"
          onClick={handleClose}
        > 
          <XIcon 
            size={16} 
            className="opacity-60 transition-opacity group-hover:opacity-100" 
            aria-hidden="true" 
          /> 
        </Button>
      </div>
    </div>
  );
}

// Hook para gerenciar notificações
export function useNotification() {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', title: string, message: string) => {
    setNotification({ type, title, message });
    
    // Auto-close após 5 segundos
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    showNotification,
    hideNotification
  };
}