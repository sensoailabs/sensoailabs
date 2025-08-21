// Serviço de chat que integra com Supabase e AI providers
import { supabase } from '../lib/supabase';
import { chatWithAI, streamChatWithAI } from '../lib/aiProviders';
import type { AIMessage, AIResponse, StreamResponse } from '../lib/aiProviders';
import logger from '../lib/clientLogger';

// Interface para configurações de modelo
export interface ModelConfiguration {
  id?: string;
  model_name: string;
  display_name: string;
  provider: string;
  api_endpoint: string;
  max_tokens: number;
  supports_files: boolean;
  supported_file_types?: any;
  is_active: boolean;
  is_default: boolean;
}

// Interface para preferências do usuário
export interface UserPreferences {
  id?: string;
  user_id: string;
  default_model: string;
  theme: string;
  language: string;
  notifications_enabled: boolean;
  auto_save_enabled: boolean;
  history_enabled: boolean;
  response_format: string;
  streaming_enabled: boolean;
  max_tokens_usage: number;
}

export interface ChatMessage {
  id?: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  file_attachments?: any;
  model_used?: string;
  token_count?: number;
  processing_time?: number;
  created_at?: string;
}

export interface Conversation {
  id?: string;
  title: string;
  model_used: string;
  is_active?: boolean;
  user_id: string;
  project_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  userId: string;
  preferredProvider?: string;
  fileAttachments?: any[];
}

export interface ChatResponse {
  message: ChatMessage;
  conversation: Conversation;
}

class ChatService {
  // Buscar configurações de modelos ativos
  async getActiveModelConfigurations(): Promise<ModelConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from('model_configurations')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) {
        logger.error('Error fetching model configurations', { error });
        throw new Error('Failed to fetch model configurations');
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getActiveModelConfigurations', { error });
      throw error;
    }
  }

  // Buscar preferências do usuário
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching user preferences', { error, userId });
        throw new Error('Failed to fetch user preferences');
      }

      return data || null;
    } catch (error) {
      logger.error('Error in getUserPreferences', { error, userId });
      throw error;
    }
  }

  // Gerar título inteligente para conversa usando IA
  async generateSmartTitle(firstMessage: string, userId: string): Promise<string> {
    try {
      // Prompt para gerar título conciso
      const titlePrompt = `Crie um título conciso e direto (máximo 30 caracteres) para esta conversa: "${firstMessage.substring(0, 200)}". Use substantivos e verbos no infinitivo. Evite gerúndio (-ndo). Seja objetivo e curto. Responda apenas com o título, sem aspas ou explicações.`;
      
      const aiMessages: AIMessage[] = [{
        role: 'user',
        content: titlePrompt
      }];

      const response = await chatWithAI(aiMessages, userId, 'gpt-4o-mini');
      
      let title = response.content.trim();
      
      // Limpar título e garantir tamanho máximo
      title = title.replace(/["']/g, '').substring(0, 30);
      
      return title || this.generateConversationTitle(firstMessage);
    } catch (error) {
      logger.error('Error generating smart title', { error, firstMessage });
      // Fallback para título simples
      return this.generateConversationTitle(firstMessage);
    }
  }

  // Criar nova conversa
  async createConversation(
    userId: string,
    title: string,
    modelUsed: string
  ): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          title,
          model_used: modelUsed,
          user_id: userId,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating conversation', { error, userId });
        throw new Error('Failed to create conversation');
      }

      logger.info('Conversation created', { conversationId: data.id, userId });
      return data;
    } catch (error) {
      logger.error('Error in createConversation', { error, userId });
      throw error;
    }
  }

  // Buscar conversas do usuário
  // Função auxiliar para converter user_id para UUID se necessário


  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      logger.info('getUserConversations called', { userId });
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Error fetching conversations', { error, userId });
        throw new Error('Failed to fetch conversations');
      }

      logger.info('getUserConversations completed', { userId, resultCount: data?.length || 0 });
      return data || [];
    } catch (error) {
      logger.error('Error in getUserConversations', { error, userId });
      throw error;
    }
  }

  // Buscar conversas do usuário com paginação
  async getUserConversationsPaginated(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    conversations: Conversation[];
    totalCount: number;
    hasMore: boolean;
    currentPage: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      // Primeiro, tentar buscar com o userId original
      let { data, error, count } = await supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);



      if (error) {
        logger.error('Error fetching paginated conversations', { error, userId, page, limit });
        throw new Error('Failed to fetch conversations');
      }

      const totalCount = count || 0;
      const hasMore = offset + limit < totalCount;

      logger.info('Paginated conversations loaded', {
        userId,
        page,
        limit,
        totalCount,
        hasMore,
        loadedCount: data?.length || 0
      });

      return {
        conversations: data || [],
        totalCount,
        hasMore,
        currentPage: page
      };
    } catch (error) {
      logger.error('Error in getUserConversationsPaginated', { error, userId, page, limit });
      throw error;
    }
  }

  // Buscar conversas com filtros e paginação
  async searchUserConversations(
    userId: string,
    searchTerm?: string,
    modelFilter?: string,
    projectFilter?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ conversations: Conversation[]; total: number }> {
    try {
      let query = supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Aplicar filtros
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }
      
      if (modelFilter) {
        query = query.eq('model_used', modelFilter);
      }
      
      if (projectFilter) {
        query = query.eq('project_id', projectFilter);
      }

      // Aplicar paginação e ordenação
      const { data, error, count } = await query
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Error searching conversations', { error, userId, searchTerm });
        throw new Error('Failed to search conversations');
      }

      return {
        conversations: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error in searchUserConversations', { error, userId });
      throw error;
    }
  }

  // Atualizar preferências do usuário
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error updating user preferences', { error, userId, preferences });
        throw new Error('Failed to update user preferences');
      }

      return data;
    } catch (error) {
      logger.error('Error in updateUserPreferences', { error, userId });
      throw error;
    }
  }

  // Buscar mensagens de uma conversa
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error fetching messages', { error, conversationId });
        throw new Error('Failed to fetch messages');
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getConversationMessages', { error, conversationId });
      throw error;
    }
  }

  // Buscar mensagens de uma conversa com paginação
  async getConversationMessagesPaginated(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: ChatMessage[];
    totalCount: number;
    hasMore: boolean;
    currentPage: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      // Buscar mensagens paginadas (pegamos limit + 1 para verificar se há mais)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit);

      if (error) {
        logger.error('Error fetching paginated messages', { error, conversationId, page, limit });
        throw new Error('Failed to fetch messages');
      }

      const messages = data || [];
      const hasMore = messages.length > limit;
      const actualMessages = hasMore ? messages.slice(0, limit) : messages;
      
      // Estimativa do total baseada na paginação
      const totalCount = hasMore ? (page * limit) + 1 : offset + actualMessages.length;

      logger.info('Paginated messages loaded', {
        conversationId,
        page,
        limit,
        totalCount,
        hasMore,
        loadedCount: actualMessages.length
      });

      return {
        messages: actualMessages,
        totalCount,
        hasMore,
        currentPage: page
      };
    } catch (error) {
      logger.error('Error in getConversationMessagesPaginated', { error, conversationId, page, limit });
      throw error;
    }
  }

  // Buscar contexto completo de uma conversa (conversa + mensagens + configurações)
  async getConversationContext(conversationId: string): Promise<{
    conversation: Conversation;
    messages: ChatMessage[];
    modelConfig?: ModelConfiguration;
    totalMessages: number;
    totalTokens: number;
  }> {
    try {
      // Buscar conversa
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        throw new Error('Conversation not found');
      }

      // Buscar mensagens
      const messages = await this.getConversationMessages(conversationId);

      // Buscar configuração do modelo usado
      const { data: modelConfig } = await supabase
        .from('model_configurations')
        .select('*')
        .eq('model_name', conversation.model_used)
        .single();

      // Calcular estatísticas
      const totalMessages = messages.length;
      const totalTokens = messages.reduce((sum, msg) => sum + (msg.token_count || 0), 0);

      logger.info('Conversation context loaded', {
        conversationId,
        totalMessages,
        totalTokens,
        model: conversation.model_used
      });

      return {
        conversation,
        messages,
        modelConfig: modelConfig || undefined,
        totalMessages,
        totalTokens
      };
    } catch (error) {
      logger.error('Error in getConversationContext', { error, conversationId });
      throw error;
    }
  }

  // Salvar mensagem no banco
  async saveMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) {
        logger.error('Error saving message', { error, message });
        throw new Error('Failed to save message');
      }

      return data;
    } catch (error) {
      logger.error('Error in saveMessage', { error, message });
      throw error;
    }
  }

  // Atualizar timestamp da conversa
  async updateConversationTimestamp(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        logger.error('Error updating conversation timestamp', { error, conversationId });
      }
    } catch (error) {
      logger.error('Error in updateConversationTimestamp', { error, conversationId });
    }
  }

  // Processar chat (método principal)
  async processChat(request: ChatRequest): Promise<ChatResponse> {
    const { message, conversationId, userId, preferredProvider, fileAttachments } = request;

    try {
      let conversation: Conversation;
      let messages: ChatMessage[] = [];
      
      // Buscar preferências do usuário
      const userPreferences = await this.getUserPreferences(userId);
      const autoSaveEnabled = userPreferences?.auto_save_enabled ?? true;
      const defaultModel = userPreferences?.default_model || preferredProvider || 'gpt-4o';

      // Se não há conversationId, criar nova conversa
      if (!conversationId) {
        // Gerar título inteligente se auto-save estiver habilitado
        const title = autoSaveEnabled 
          ? await this.generateSmartTitle(message, userId)
          : this.generateConversationTitle(message);
          
        conversation = await this.createConversation(
          userId,
          title,
          defaultModel
        );
      } else {
        // Buscar conversa existente
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (error || !data) {
          throw new Error('Conversation not found');
        }

        conversation = data;
        messages = await this.getConversationMessages(conversationId);
      }

      // Salvar mensagem do usuário
      const userMessage = await this.saveMessage({
        conversation_id: conversation.id!,
        role: 'user',
        content: message,
        file_attachments: fileAttachments
      });

      // Preparar contexto para IA
      const aiMessages: AIMessage[] = [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ];

      // Obter resposta da IA
      const aiResponse: AIResponse = await chatWithAI(
        aiMessages,
        userId,
        preferredProvider
      );

      // Salvar resposta da IA
      const assistantMessage = await this.saveMessage({
        conversation_id: conversation.id!,
        role: 'assistant',
        content: aiResponse.content,
        model_used: aiResponse.model,
        token_count: aiResponse.tokenCount,
        processing_time: aiResponse.processingTime
      });

      // Atualizar timestamp da conversa
      await this.updateConversationTimestamp(conversation.id!);

      logger.info('Chat processed successfully', {
        conversationId: conversation.id,
        userId,
        model: aiResponse.model,
        processingTime: aiResponse.processingTime
      });

      return {
        message: assistantMessage,
        conversation
      };

    } catch (error) {
      logger.error('Error processing chat', { error, request });
      throw error;
    }
  }

  // Processar chat com streaming
  async *processChatStream(
    request: ChatRequest
  ): AsyncGenerator<{ type: 'message' | 'chunk' | 'complete'; data: any }> {
    const { message, conversationId, userId, preferredProvider, fileAttachments } = request;

    try {
      let conversation: Conversation;
      let messages: ChatMessage[] = [];
      
      // Buscar preferências do usuário
      const userPreferences = await this.getUserPreferences(userId);
      const autoSaveEnabled = userPreferences?.auto_save_enabled ?? true;
      const streamingEnabled = userPreferences?.streaming_enabled ?? true;
      const defaultModel = userPreferences?.default_model || preferredProvider || 'gpt-4o';

      // Configurar conversa (mesmo processo do chat normal)
      if (!conversationId) {
        // Gerar título inteligente se auto-save estiver habilitado
        const title = autoSaveEnabled 
          ? await this.generateSmartTitle(message, userId)
          : this.generateConversationTitle(message);
          
        conversation = await this.createConversation(
          userId,
          title,
          defaultModel
        );
      } else {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (error || !data) {
          throw new Error('Conversation not found');
        }

        conversation = data;
        messages = await this.getConversationMessages(conversationId);
      }

      // Salvar mensagem do usuário
      const userMessage = await this.saveMessage({
        conversation_id: conversation.id!,
        role: 'user',
        content: message,
        file_attachments: fileAttachments
      });

      yield {
        type: 'message',
        data: { userMessage, conversation }
      };

      // Preparar contexto para IA
      const aiMessages: AIMessage[] = [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ];

      // Stream da resposta da IA
      let fullContent = '';
      let model = '';
      const startTime = Date.now();

      for await (const chunk of streamChatWithAI(aiMessages, userId, preferredProvider)) {
        if (!chunk.isComplete) {
          fullContent += chunk.content;
          model = chunk.model;
          
          yield {
            type: 'chunk',
            data: {
              content: chunk.content,
              model: chunk.model
            }
          };
        } else {
          // Salvar resposta completa da IA
          const processingTime = Date.now() - startTime;
          
          const assistantMessage = await this.saveMessage({
            conversation_id: conversation.id!,
            role: 'assistant',
            content: fullContent,
            model_used: model,
            processing_time: processingTime
          });

          // Atualizar timestamp da conversa
          await this.updateConversationTimestamp(conversation.id!);

          yield {
            type: 'complete',
            data: {
              message: assistantMessage,
              conversation,
              processingTime
            }
          };

          logger.info('Streaming chat completed', {
            conversationId: conversation.id,
            userId,
            model,
            processingTime
          });
        }
      }

    } catch (error) {
      logger.error('Error in streaming chat', { error, request });
      throw error;
    }
  }

  // Deletar conversa
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_active: false })
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting conversation', { error, conversationId, userId });
        throw new Error('Failed to delete conversation');
      }

      logger.info('Conversation deleted', { conversationId, userId });
    } catch (error) {
      logger.error('Error in deleteConversation', { error, conversationId, userId });
      throw error;
    }
  }

  // Testar conexão com Supabase
  async testConnection(): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('count')
        .limit(1);
      
      return { data, error };
    } catch (error) {
      logger.error('Error testing Supabase connection', { error });
      return { data: null, error };
    }
  }

  // Gerar título da conversa baseado na primeira mensagem
  private generateConversationTitle(message: string): string {
    const maxLength = 50;
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength - 3) + '...';
  }
}

// Instância singleton
export const chatService = new ChatService();

// Funções de conveniência
export const processChat = (request: ChatRequest) => chatService.processChat(request);
export const processChatStream = (request: ChatRequest) => chatService.processChatStream(request);
export const getUserConversations = (userId: string) => chatService.getUserConversations(userId);
export const getUserConversationsPaginated = (
  userId: string,
  page?: number,
  limit?: number
) => chatService.getUserConversationsPaginated(userId, page, limit);
export const searchUserConversations = (
  userId: string,
  searchTerm?: string,
  modelFilter?: string,
  projectFilter?: string,
  limit?: number,
  offset?: number
) => chatService.searchUserConversations(userId, searchTerm, modelFilter, projectFilter, limit, offset);
export const getConversationMessages = (conversationId: string) => chatService.getConversationMessages(conversationId);
export const getConversationMessagesPaginated = (
  conversationId: string,
  page?: number,
  limit?: number
) => chatService.getConversationMessagesPaginated(conversationId, page, limit);
export const getConversationContext = (conversationId: string) => chatService.getConversationContext(conversationId);
export const deleteConversation = (conversationId: string, userId: string) => 
  chatService.deleteConversation(conversationId, userId);
export const getActiveModelConfigurations = () => chatService.getActiveModelConfigurations();
export const getUserPreferences = (userId: string) => chatService.getUserPreferences(userId);
export const updateUserPreferences = (userId: string, preferences: Partial<UserPreferences>) => 
  chatService.updateUserPreferences(userId, preferences);
export const generateSmartTitle = (firstMessage: string, userId: string) => 
  chatService.generateSmartTitle(firstMessage, userId);