import React from 'react';
import logoChatImg from '@/assets/logo-chat.png';

interface TypingIndicatorProps {
  isVisible: boolean;
  modelName?: string;
}

export default function TypingIndicator({ isVisible, modelName = 'Senso AI' }: TypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="flex items-center justify-start">
      <img 
        src={logoChatImg} 
        alt="Pensando..." 
        className="w-6 h-6"
      />
    </div>
  );
}