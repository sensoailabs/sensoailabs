// Configuração das APIs de IA com fallback
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from './clientLogger';
import { userRateLimiter } from './rateLimiter';

// Tipos
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokenCount?: number;
  processingTime: number;
}

export interface StreamResponse {
  content: string;
  isComplete: boolean;
  model: string;
}

// Configuração dos provedores
class AIProviderManager {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private googleAI: GoogleGenerativeAI | null = null;
  
  private providers: string[] = [];
  
  constructor() {
    this.initializeProviders();
  }
  
  private initializeProviders() {
    // OpenAI
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true, // APENAS para desenvolvimento
      });
      this.providers.push('openai');
      logger.info('OpenAI provider initialized');
    }
    
    // Anthropic
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true, // APENAS para desenvolvimento
      });
      this.providers.push('anthropic');
      logger.info('Anthropic provider initialized');
    }
    
    // Google AI
    if (import.meta.env.VITE_GOOGLE_AI_API_KEY) {
      this.googleAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
      this.providers.push('google');
      logger.info('Google AI provider initialized');
    }
    
    if (this.providers.length === 0) {
      logger.error('No AI providers configured');
      throw new Error('No AI providers available');
    }
    
    logger.info(`AI providers initialized: ${this.providers.join(', ')}`);
  }
  
  // Método principal para chat com fallback
  async chat(
    messages: AIMessage[],
    userId: string,
    preferredProvider?: string
  ): Promise<AIResponse> {
    // Rate limiting
    if (!userRateLimiter.isAllowed(userId)) {
      throw new Error('Rate limit exceeded');
    }
    
    const startTime = Date.now();
    
    // Determinar ordem dos provedores
    const providerOrder = this.getProviderOrder(preferredProvider);
    
    for (const provider of providerOrder) {
      try {
        logger.info(`Attempting chat with provider: ${provider}`, { userId, provider });
        
        const response = await this.chatWithProvider(provider, messages);
        const processingTime = Date.now() - startTime;
        
        logger.info('Chat completed successfully', {
          userId,
          provider,
          model: response.model,
          processingTime,
          tokenCount: response.tokenCount
        });
        
        return {
          ...response,
          processingTime
        };
        
      } catch (error) {
        logger.error(`Provider ${provider} failed`, {
          userId,
          provider,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Se não é o último provedor, continua para o próximo
        if (provider !== providerOrder[providerOrder.length - 1]) {
          continue;
        }
        
        // Se é o último provedor, lança o erro
        throw error;
      }
    }
    
    throw new Error('All AI providers failed');
  }
  
  // Chat com streaming
  async *chatStream(
    messages: AIMessage[],
    userId: string,
    preferredProvider?: string
  ): AsyncGenerator<StreamResponse> {
    // Rate limiting
    if (!userRateLimiter.isAllowed(userId)) {
      throw new Error('Rate limit exceeded');
    }
    
    const providerOrder = this.getProviderOrder(preferredProvider);
    
    for (const provider of providerOrder) {
      try {
        logger.info(`Attempting streaming chat with provider: ${provider}`, { userId, provider });
        
        yield* this.streamWithProvider(provider, messages);
        return; // Se chegou aqui, foi bem-sucedido
        
      } catch (error) {
        logger.error(`Streaming provider ${provider} failed`, {
          userId,
          provider,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Se não é o último provedor, continua para o próximo
        if (provider !== providerOrder[providerOrder.length - 1]) {
          continue;
        }
        
        throw error;
      }
    }
  }
  
  private getProviderOrder(preferredProvider?: string): string[] {
    if (preferredProvider && this.providers.includes(preferredProvider)) {
      return [preferredProvider, ...this.providers.filter(p => p !== preferredProvider)];
    }
    return [...this.providers];
  }
  
  private async chatWithProvider(provider: string, messages: AIMessage[]): Promise<AIResponse> {
    switch (provider) {
      case 'openai':
        return this.chatWithOpenAI(messages);
      case 'anthropic':
        return this.chatWithAnthropic(messages);
      case 'google':
        return this.chatWithGoogle(messages);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
  
  private async *streamWithProvider(
    provider: string,
    messages: AIMessage[]
  ): AsyncGenerator<StreamResponse> {
    switch (provider) {
      case 'openai':
        yield* this.streamWithOpenAI(messages);
        break;
      case 'anthropic':
        yield* this.streamWithAnthropic(messages);
        break;
      case 'google':
        yield* this.streamWithGoogle(messages);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
  
  // Implementações específicas dos provedores
  private async chatWithOpenAI(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.openai) throw new Error('OpenAI not initialized');
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
    });
    
    return {
      content: response.choices[0]?.message?.content || '',
      model: response.model,
      tokenCount: response.usage?.total_tokens,
      processingTime: 0 // Será preenchido pelo método principal
    };
  }
  
  private async *streamWithOpenAI(messages: AIMessage[]): AsyncGenerator<StreamResponse> {
    if (!this.openai) throw new Error('OpenAI not initialized');
    
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      stream: true,
    });
    
    let content = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      content += delta;
      
      yield {
        content: delta,
        isComplete: false,
        model: chunk.model
      };
    }
    
    yield {
      content: '',
      isComplete: true,
      model: 'gpt-4o-mini'
    };
  }
  
  private async chatWithAnthropic(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.anthropic) throw new Error('Anthropic not initialized');
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      messages: messages.filter(msg => msg.role !== 'system').map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      system: messages.find(msg => msg.role === 'system')?.content
    });
    
    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    
    return {
      content,
      model: response.model,
      tokenCount: response.usage.input_tokens + response.usage.output_tokens,
      processingTime: 0
    };
  }
  
  private async *streamWithAnthropic(messages: AIMessage[]): AsyncGenerator<StreamResponse> {
    if (!this.anthropic) throw new Error('Anthropic not initialized');
    
    const stream = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      messages: messages.filter(msg => msg.role !== 'system').map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      system: messages.find(msg => msg.role === 'system')?.content,
      stream: true
    });
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield {
          content: chunk.delta.text,
          isComplete: false,
          model: 'claude-3-haiku-20240307'
        };
      }
    }
    
    yield {
      content: '',
      isComplete: true,
      model: 'claude-3-haiku-20240307'
    };
  }
  
  private async chatWithGoogle(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.googleAI) throw new Error('Google AI not initialized');
    
    const model = this.googleAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Converter mensagens para formato do Google
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    const lastMessage = messages[messages.length - 1];
    
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    
    return {
      content: result.response.text(),
      model: 'gemini-1.5-flash',
      tokenCount: result.response.usageMetadata?.totalTokenCount,
      processingTime: 0
    };
  }
  
  private async *streamWithGoogle(messages: AIMessage[]): AsyncGenerator<StreamResponse> {
    if (!this.googleAI) throw new Error('Google AI not initialized');
    
    const model = this.googleAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    const lastMessage = messages[messages.length - 1];
    
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield {
          content: text,
          isComplete: false,
          model: 'gemini-1.5-flash'
        };
      }
    }
    
    yield {
      content: '',
      isComplete: true,
      model: 'gemini-1.5-flash'
    };
  }
  
  // Métodos utilitários
  getAvailableProviders(): string[] {
    return [...this.providers];
  }
  
  isProviderAvailable(provider: string): boolean {
    return this.providers.includes(provider);
  }
}

// Instância singleton
export const aiProviderManager = new AIProviderManager();

// Funções de conveniência
export const chatWithAI = (messages: AIMessage[], userId: string, preferredProvider?: string) => 
  aiProviderManager.chat(messages, userId, preferredProvider);

export const streamChatWithAI = (messages: AIMessage[], userId: string, preferredProvider?: string) => 
  aiProviderManager.chatStream(messages, userId, preferredProvider);

export const getAvailableAIProviders = () => aiProviderManager.getAvailableProviders();