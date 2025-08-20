// Serviço de chat que integra com Supabase e AI providers
import { supabase } from '../lib/supabase';
import { chatWithAI, streamChatWithAI } from '../lib/aiProviders';
import type { AIMessage, AIResponse, StreamResponse } from '../lib/aiProviders';
import logger from '../lib/clientLogger';

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
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
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

      return data || [];
    } catch (error) {
      logger.error('Error in getUserConversations', { error, userId });
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

      // Se não há conversationId, criar nova conversa
      if (!conversationId) {
        const title = this.generateConversationTitle(message);
        conversation = await this.createConversation(
          userId,
          title,
          preferredProvider || 'auto'
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

      // Configurar conversa (mesmo processo do chat normal)
      if (!conversationId) {
        const title = this.generateConversationTitle(message);
        conversation = await this.createConversation(
          userId,
          title,
          preferredProvider || 'auto'
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
export const getConversationMessages = (conversationId: string) => chatService.getConversationMessages(conversationId);
export const deleteConversation = (conversationId: string, userId: string) => 
  chatService.deleteConversation(conversationId, userId);