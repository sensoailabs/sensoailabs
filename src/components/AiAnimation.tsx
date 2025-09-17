import Lottie from 'lottie-react';
import aiAnimation from '@/assets/ai-animation.json';

interface AiAnimationProps {
  className?: string;
  isVisible?: boolean;
}

export default function AiAnimation({ className = '', isVisible = true }: AiAnimationProps) {
  return (
    <div 
      className={`transition-opacity duration-500 ease-in-out ${className} ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <Lottie 
        animationData={aiAnimation}
        loop={true}
        autoplay={true}
        style={{ width: '200px', height: '200px' }}
      />
    </div>
  );
}