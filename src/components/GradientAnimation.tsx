import Lottie from 'lottie-react';
import gradientAnimation from '@/assets/gradient.json';

interface GradientAnimationProps {
  className?: string;
  isVisible?: boolean;
}

export default function GradientAnimation({ className = '', isVisible = false }: GradientAnimationProps) {
  return (
    <div 
      className={`fixed bottom-0 transition-opacity duration-500 ease-in-out z-0 ${className} ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        width: '100vw',
        height: '300px',
        left: '0',
        right: '0',
        margin: '0',
        padding: '0',
      }}
    >
      <Lottie
        animationData={gradientAnimation}
        loop={true}
        autoplay={true}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}