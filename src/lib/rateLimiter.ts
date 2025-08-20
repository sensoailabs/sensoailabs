import logger from './clientLogger';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      windowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
      maxRequests: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_REQUESTS || '100'),
      ...config
    };
  }

  /**
   * Verifica se uma requisição pode ser feita
   * @param key Chave única (ex: userId, apiKey, etc.)
   * @returns true se permitido, false se excedeu o limite
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    // Se não existe entrada ou o tempo resetou
    if (!entry || now >= entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    // Se ainda está dentro do limite
    if (entry.count < this.config.maxRequests) {
      entry.count++;
      return true;
    }

    // Excedeu o limite
    logger.warn('Rate limit exceeded', {
      key,
      count: entry.count,
      maxRequests: this.config.maxRequests,
      resetTime: new Date(entry.resetTime).toISOString()
    });

    return false;
  }

  /**
   * Obtém informações sobre o limite atual
   * @param key Chave única
   * @returns Informações do rate limit
   */
  getStatus(key: string): {
    remaining: number;
    resetTime: number;
    isLimited: boolean;
  } {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now >= entry.resetTime) {
      return {
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
        isLimited: false
      };
    }

    return {
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      isLimited: entry.count >= this.config.maxRequests
    };
  }

  /**
   * Limpa entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Reseta o limite para uma chave específica
   * @param key Chave única
   */
  reset(key: string): void {
    this.limits.delete(key);
  }
}

// Instâncias globais para diferentes tipos de rate limiting
export const userRateLimiter = new RateLimiter();
export const apiRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minuto
  maxRequests: 20   // 20 requisições por minuto por API
});

// Cleanup automático a cada 5 minutos
setInterval(() => {
  userRateLimiter.cleanup();
  apiRateLimiter.cleanup();
}, 300000);

export default RateLimiter;