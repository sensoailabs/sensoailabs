import { useRef, useCallback } from 'react';

export interface SmartScrollOptions {
  behavior?: 'smooth' | 'instant';
  block?: 'start' | 'center' | 'end' | 'nearest';
  inline?: 'start' | 'center' | 'end' | 'nearest';
  offset?: number;
}

export interface SmartScrollReturn {
  scrollToElement: (elementId: string, options?: SmartScrollOptions) => Promise<void>;
  scrollToBottom: (options?: SmartScrollOptions) => Promise<void>;
  scrollToTop: (options?: SmartScrollOptions) => Promise<void>;
  isScrolling: boolean;
}

/**
 * Hook para rolagem inteligente usando requestAnimationFrame
 * Substitui setTimeout por uma solução mais robusta e performática
 */
export function useSmartScroll(containerRef?: React.RefObject<HTMLElement | null>): SmartScrollReturn {
  const isScrollingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const cancelCurrentScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isScrollingRef.current = false;
  }, []);

  const smoothScrollTo = useCallback(
    (target: { x?: number; y?: number; element?: HTMLElement }, options: SmartScrollOptions = {}): Promise<void> => {
      return new Promise((resolve) => {
        // Cancelar rolagem anterior se existir
        cancelCurrentScroll();
        
        const container = containerRef?.current || document.documentElement;
        const startTime = performance.now();
        const duration = 300; // 300ms para rolagem suave
        
        let startX = container.scrollLeft;
        let startY = container.scrollTop;
        let targetX = startX;
        let targetY = startY;

        // Determinar posição alvo
        if (target.element) {
          const rect = target.element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          targetX = startX + rect.left - containerRect.left;
          targetY = startY + rect.top - containerRect.top;
          
          // Aplicar offset se fornecido
          if (options.offset) {
            targetY += options.offset;
          }
          
          // Ajustar baseado no block
          switch (options.block) {
            case 'center':
              targetY -= (containerRect.height - rect.height) / 2;
              break;
            case 'end':
              targetY -= containerRect.height - rect.height;
              break;
            // 'start' e 'nearest' usam a posição calculada
          }
        } else {
          if (target.x !== undefined) targetX = target.x;
          if (target.y !== undefined) targetY = target.y;
        }

        // Função de easing (ease-out)
        const easeOut = (t: number): number => {
          return 1 - Math.pow(1 - t, 3);
        };

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          if (options.behavior === 'instant') {
            // Rolagem instantânea
            container.scrollTo(targetX, targetY);
            isScrollingRef.current = false;
            resolve();
            return;
          }

          // Aplicar easing
          const easedProgress = easeOut(progress);
          
          const currentX = startX + (targetX - startX) * easedProgress;
          const currentY = startY + (targetY - startY) * easedProgress;
          
          container.scrollTo(currentX, currentY);

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            isScrollingRef.current = false;
            animationFrameRef.current = null;
            resolve();
          }
        };

        isScrollingRef.current = true;
        animationFrameRef.current = requestAnimationFrame(animate);
      });
    },
    [containerRef, cancelCurrentScroll]
  );

  const scrollToElement = useCallback(
    async (elementId: string, options: SmartScrollOptions = {}): Promise<void> => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`Elemento com ID '${elementId}' não encontrado`);
        return;
      }

      return smoothScrollTo({ element }, {
        behavior: 'smooth',
        block: 'start',
        ...options,
      });
    },
    [smoothScrollTo]
  );

  const scrollToBottom = useCallback(
    async (options: SmartScrollOptions = {}): Promise<void> => {
      const container = containerRef?.current || document.documentElement;
      const targetY = container.scrollHeight - container.clientHeight;
      
      return smoothScrollTo({ y: targetY }, {
        behavior: 'smooth',
        ...options,
      });
    },
    [containerRef, smoothScrollTo]
  );

  const scrollToTop = useCallback(
    async (options: SmartScrollOptions = {}): Promise<void> => {
      return smoothScrollTo({ y: 0 }, {
        behavior: 'smooth',
        ...options,
      });
    },
    [smoothScrollTo]
  );

  // Cleanup na desmontagem
  const cleanup = useCallback(() => {
    cancelCurrentScroll();
  }, [cancelCurrentScroll]);

  // Expor cleanup para uso externo se necessário
  (scrollToElement as any).cleanup = cleanup;
  (scrollToBottom as any).cleanup = cleanup;
  (scrollToTop as any).cleanup = cleanup;

  return {
    scrollToElement,
    scrollToBottom,
    scrollToTop,
    isScrolling: isScrollingRef.current,
  };
}

export default useSmartScroll;