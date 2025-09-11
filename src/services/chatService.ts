// Serviço de chat que integra com Supabase e AI providers
import { supabase } from '../lib/supabase';
import { chatWithAI, streamChatWithAI } from '../lib/aiProviders';
import type { AIMessage, AIResponse } from '../lib/aiProviders';
import logger from '../lib/clientLogger';

// Interface para arquivo anexado
export interface FileAttachment {
  id?: string;
  message_id?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url?: string;
  uploaded_at?: string;
  file_object?: File; // Objeto File original para conversão direta
  base64?: string; // Base64 já convertido
}

// Interface para resultado do upload
export interface UploadResult {
  success: boolean;
  fileAttachment?: FileAttachment;
  error?: string;
}

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
  timestamp?: Date;
  isCancelled?: boolean;
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
  fileAttachments?: File[];
}

export interface ChatResponse {
  message: ChatMessage;
  conversation: Conversation;
}

class ChatService {
  // Configurações de upload
  private readonly ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly STORAGE_BUCKET = 'chat-files';

  // Validar arquivo antes do upload
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Verificar tipo de arquivo
    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de arquivo não suportado: ${file.type}. Tipos permitidos: ${this.ALLOWED_FILE_TYPES.join(', ')}`
      };
    }

    // Verificar tamanho do arquivo
    if (file.size > this.MAX_FILE_SIZE) {
      const maxSizeMB = this.MAX_FILE_SIZE / (1024 * 1024);
      return {
        valid: false,
        error: `Arquivo muito grande: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Tamanho máximo: ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }

  // Sanitizar nome de arquivo removendo caracteres especiais
  private sanitizeFileName(fileName: string): string {
    // Remover acentos e caracteres especiais
    const normalized = fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Substitui caracteres especiais por underscore
      .replace(/_{2,}/g, '_') // Remove underscores duplos
      .replace(/^_+|_+$/g, ''); // Remove underscores no início e fim
    
    // Garantir que não fique vazio
    if (!normalized || normalized === '.') {
      return 'file';
    }
    
    return normalized;
  }

  // Validar se nome é seguro para Supabase Storage
  private isValidStorageName(name: string): boolean {
    // Supabase Storage aceita: a-z, A-Z, 0-9, -, _, .
    const validPattern = /^[a-zA-Z0-9._-]+$/;
    return validPattern.test(name) && name.length > 0 && name.length <= 255;
  }

  // Gerar caminho único para o arquivo
  private generateStoragePath(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = fileName.split('.').pop() || '';
    const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
    
    // Sanitizar nome do arquivo
    const sanitizedName = this.sanitizeFileName(nameWithoutExtension);
    const sanitizedExtension = this.sanitizeFileName(extension);
    
    // Construir nome final
    const finalName = sanitizedExtension ? 
      `${sanitizedName}.${sanitizedExtension}` : 
      sanitizedName;
    
    const storagePath = `uploads/${userId}/${timestamp}_${randomString}_${finalName}`;
    
    // Validar se o caminho é seguro
    if (!this.isValidStorageName(`${timestamp}_${randomString}_${finalName}`)) {
      // Fallback para nome seguro
      const safeName = sanitizedExtension ? 
        `file_${timestamp}.${sanitizedExtension}` : 
        `file_${timestamp}`;
      return `uploads/${userId}/${safeName}`;
    }
    
    return storagePath;
  }

  // Truncar nome de arquivo de forma inteligente
  private truncateFileName(fileName: string, maxLength: number = 200): string {
    if (fileName.length <= maxLength) {
      return fileName;
    }

    const extension = fileName.split('.').pop() || '';
    const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
    const extensionLength = extension ? extension.length + 1 : 0; // +1 para o ponto
    const availableLength = maxLength - extensionLength - 3; // -3 para "..."

    if (availableLength <= 0) {
      // Se o nome for muito longo mesmo truncado, usar apenas timestamp
      const timestamp = Date.now().toString();
      return extension ? `file_${timestamp}.${extension}` : `file_${timestamp}`;
    }

    const truncatedName = nameWithoutExtension.substring(0, availableLength) + '...';
    return extension ? `${truncatedName}.${extension}` : truncatedName;
  }

  // Tentar upload com fallback para nome sanitizado
  private async attemptUpload(file: File, storagePath: string, attempt: number = 1): Promise<{ success: boolean; error?: any }> {
    try {
      const { error: uploadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        logger.warn(`Upload attempt ${attempt} failed`, { uploadError, storagePath });
        return { success: false, error: uploadError };
      }

      return { success: true };
    } catch (error) {
      logger.warn(`Upload attempt ${attempt} threw exception`, { error, storagePath });
      return { success: false, error };
    }
  }

  // Upload de arquivo para Supabase Storage
  async uploadFile(file: File, userId: string): Promise<UploadResult> {
    try {
      // Validar arquivo
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Validar nome do arquivo antes do upload
      const sanitizedName = this.sanitizeFileName(file.name);
      logger.info('File name validation', {
        originalName: file.name,
        sanitizedName,
        isValid: this.isValidStorageName(sanitizedName)
      });

      // Gerar caminho único
      let storagePath = this.generateStoragePath(userId, file.name);
      
      // Primeira tentativa de upload
      let uploadResult = await this.attemptUpload(file, storagePath, 1);
      
      // Se falhou, tentar com nome completamente sanitizado
      if (!uploadResult.success) {
        logger.warn('First upload attempt failed, trying with sanitized name', {
          originalPath: storagePath,
          error: uploadResult.error?.message
        });
        
        // Gerar caminho com nome totalmente seguro
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split('.').pop() || '';
        const safeExtension = this.sanitizeFileName(extension);
        const safeName = safeExtension ? 
          `file_${timestamp}_${randomString}.${safeExtension}` : 
          `file_${timestamp}_${randomString}`;
        
        storagePath = `uploads/${userId}/${safeName}`;
        uploadResult = await this.attemptUpload(file, storagePath, 2);
      }
      
      // Se ainda falhou, usar nome mínimo
      if (!uploadResult.success) {
        logger.warn('Second upload attempt failed, using minimal name', {
          secondPath: storagePath,
          error: uploadResult.error?.message
        });
        
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const safeExtension = extension?.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
        storagePath = `uploads/${userId}/file_${timestamp}.${safeExtension}`;
        uploadResult = await this.attemptUpload(file, storagePath, 3);
      }

      if (!uploadResult.success) {
        logger.error('All upload attempts failed', { 
          fileName: file.name, 
          finalPath: storagePath,
          finalError: uploadResult.error 
        });
        return {
          success: false,
          error: `Erro no upload após múltiplas tentativas: ${uploadResult.error?.message || 'Erro desconhecido'}`
        };
      }

      // Gerar URL pública
      const { data: urlData } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(storagePath);

      const fileAttachment: FileAttachment = {
        file_name: file.name, // Manter nome original para exibição
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        public_url: urlData.publicUrl,
        uploaded_at: new Date().toISOString(),
        file_object: file // Incluir o objeto File original
      };

      logger.info('File uploaded successfully', {
        fileName: file.name,
        storagePath,
        fileSize: file.size,
        userId
      });

      return {
        success: true,
        fileAttachment
      };

    } catch (error) {
      logger.error('Error in uploadFile', { error, fileName: file.name, userId });
      return {
        success: false,
        error: 'Erro interno no upload do arquivo'
      };
    }
  }

  // Salvar metadados do arquivo na tabela file_attachments
  async saveFileAttachment(fileAttachment: FileAttachment, messageId: string, conversationId: string, userId: string): Promise<FileAttachment> {
    try {
      // Truncar nomes de arquivo para evitar erro de limite de caracteres
      const truncatedFileName = this.truncateFileName(fileAttachment.file_name, 200);
      const truncatedOriginalName = this.truncateFileName(fileAttachment.file_name, 200);
      const truncatedFileType = fileAttachment.file_type.substring(0, 100); // Limitar tipo de arquivo
      const truncatedMimeType = fileAttachment.file_type.substring(0, 100); // Limitar mime type

      const { data, error } = await supabase
        .from('file_attachments')
        .insert({
          conversation_id: conversationId,
          message_id: messageId,
          file_name: truncatedFileName,
          file_type: truncatedFileType,
          file_size: fileAttachment.file_size,
          file_url: fileAttachment.public_url, // Mapear public_url para file_url
          uploaded_at: fileAttachment.uploaded_at,
          user_id: userId,
          original_name: truncatedOriginalName,
          mime_type: truncatedMimeType,
          file_path: fileAttachment.storage_path
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving file attachment', { error, fileAttachment, messageId });
        throw new Error('Failed to save file attachment');
      }

      return {
        ...fileAttachment,
        id: data.id
      };
    } catch (error) {
      logger.error('Error in saveFileAttachment', { error, fileAttachment, messageId });
      throw error;
    }
  }

  // Buscar anexos de uma mensagem
  async getMessageAttachments(messageId: string): Promise<FileAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('message_id', messageId)
        .order('uploaded_at', { ascending: true });

      if (error) {
        logger.error('Error fetching message attachments', { error, messageId });
        throw new Error('Failed to fetch message attachments');
      }

      // Mapear dados da tabela para interface FileAttachment
      const attachments = (data || []).map(attachment => ({
        id: attachment.id,
        message_id: attachment.message_id,
        file_name: attachment.file_name,
        file_type: attachment.file_type || attachment.mime_type,
        file_size: attachment.file_size,
        storage_path: attachment.file_path,
        public_url: attachment.file_url, // URL do Supabase Storage
        uploaded_at: attachment.uploaded_at
      }));

      logger.info('Message attachments loaded', {
        messageId,
        attachmentCount: attachments.length,
        attachments: attachments.map(a => ({
          name: a.file_name,
          type: a.file_type,
          size: a.file_size,
          url: a.public_url
        }))
      });

      return attachments;
    } catch (error) {
      logger.error('Error in getMessageAttachments', { error, messageId });
      throw error;
    }
  }

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

      const messages = data || [];
      
      // Buscar file_attachments para cada mensagem
      for (const message of messages) {
        if (message.id) {
          const attachments = await this.getMessageAttachments(message.id);
          message.file_attachments = attachments;
        }
      }

      return messages;
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
      
      // Buscar file_attachments para cada mensagem
      for (const message of actualMessages) {
        if (message.id) {
          const attachments = await this.getMessageAttachments(message.id);
          message.file_attachments = attachments;
        }
      }
      
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
      const defaultModel = preferredProvider || userPreferences?.default_model || 'gpt-4o';
      
      // DEBUG: Log para verificar o modelo
      console.log('💾 PROCESS CHAT DEBUG:', {
        preferredProvider,
        userDefaultModel: userPreferences?.default_model,
        finalDefaultModel: defaultModel
      });

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

      // Processar uploads de arquivos se existirem
      let uploadedFiles: FileAttachment[] = [];
      const uploadErrors: string[] = [];
      
      if (fileAttachments && fileAttachments.length > 0) {
        logger.info('Processing file uploads', { fileCount: fileAttachments.length, userId });
        
        for (const file of fileAttachments) {
          const uploadResult = await this.uploadFile(file, userId);
          
          if (uploadResult.success && uploadResult.fileAttachment) {
            uploadedFiles.push(uploadResult.fileAttachment);
            logger.info('File uploaded successfully', {
              fileName: file.name,
              fileSize: file.size,
              userId
            });
          } else {
            const errorMsg = `Falha no upload do arquivo "${file.name}": ${uploadResult.error}`;
            uploadErrors.push(errorMsg);
            logger.error('File upload failed', {
              fileName: file.name,
              error: uploadResult.error,
              userId
            });
          }
        }
        
        // Se todos os uploads falharam e não há mensagem de texto, lançar erro
        if (uploadedFiles.length === 0 && fileAttachments.length > 0 && !message.trim()) {
          const errorMessage = `Todos os uploads falharam: ${uploadErrors.join(', ')}`;
          logger.error('All file uploads failed and no text message provided', {
            userId,
            uploadErrors,
            originalFileCount: fileAttachments.length
          });
          throw new Error(errorMessage);
        }
        
        // Se alguns uploads falharam, adicionar aviso à mensagem
        if (uploadErrors.length > 0 && uploadedFiles.length > 0) {
          // Não modificar a mensagem original aqui, será tratado no frontend
        }
      }

      // Salvar mensagem do usuário
      const userMessage = await this.saveMessage({
        conversation_id: conversation.id!,
        role: 'user',
        content: message,
        file_attachments: uploadedFiles.length > 0 ? uploadedFiles : null
      });

      // Salvar metadados dos arquivos na tabela file_attachments
      if (uploadedFiles.length > 0 && userMessage.id) {
        for (const fileAttachment of uploadedFiles) {
          try {
            await this.saveFileAttachment(fileAttachment, userMessage.id, conversation.id!, userId);
          } catch (error) {
            logger.error('Error saving file attachment metadata', {
              error,
              fileName: fileAttachment.file_name,
              messageId: userMessage.id
            });
          }
        }
      }

      // Preparar contexto para IA
      const aiMessages: AIMessage[] = [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          files: msg.file_attachments ? msg.file_attachments.map((attachment: any) => ({
            id: attachment.id || '',
            name: attachment.file_name,
            type: attachment.file_type,
            size: attachment.file_size,
            url: attachment.public_url || '',
            base64: attachment.base64,
            file_object: attachment.file_object
          })) : undefined
        })),
        {
          role: 'user',
          content: message,
          files: uploadedFiles.length > 0 ? uploadedFiles.map(file => ({
            id: file.id || '',
            name: file.file_name,
            type: file.file_type,
            size: file.file_size,
            url: file.public_url || '',
            base64: file.base64,
            file_object: file.file_object
          })) : undefined
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
        processingTime: aiResponse.processingTime,
        filesUploaded: uploadedFiles.length
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
      const defaultModel = preferredProvider || userPreferences?.default_model || 'gpt-4o';
      
      // DEBUG: Log para verificar o modelo
      console.log('🌊 STREAM CHAT DEBUG:', {
        preferredProvider,
        userDefaultModel: userPreferences?.default_model,
        finalDefaultModel: defaultModel
      });

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

      // Processar uploads de arquivos se existirem
      let uploadedFiles: FileAttachment[] = [];
      const uploadErrors: string[] = [];
      
      if (fileAttachments && fileAttachments.length > 0) {
        logger.info('Processing file uploads for streaming', { fileCount: fileAttachments.length, userId });
        
        for (const file of fileAttachments) {
          const uploadResult = await this.uploadFile(file, userId);
          
          if (uploadResult.success && uploadResult.fileAttachment) {
            uploadedFiles.push(uploadResult.fileAttachment);
            logger.info('File uploaded successfully for streaming', {
              fileName: file.name,
              fileSize: file.size,
              userId
            });
          } else {
            const errorMsg = `Falha no upload do arquivo "${file.name}": ${uploadResult.error}`;
            uploadErrors.push(errorMsg);
            logger.error('File upload failed for streaming', {
              fileName: file.name,
              error: uploadResult.error,
              userId
            });
          }
        }
        
        // Se todos os uploads falharam e não há mensagem de texto, lançar erro
        if (uploadedFiles.length === 0 && fileAttachments.length > 0 && !message.trim()) {
          const errorMessage = `Todos os uploads falharam: ${uploadErrors.join(', ')}`;
          logger.error('All file uploads failed and no text message provided for streaming', {
            userId,
            uploadErrors,
            originalFileCount: fileAttachments.length
          });
          throw new Error(errorMessage);
        }
      }

      // Salvar mensagem do usuário
      const userMessage = await this.saveMessage({
        conversation_id: conversation.id!,
        role: 'user',
        content: message,
        file_attachments: uploadedFiles.length > 0 ? uploadedFiles : null
      });

      // Salvar metadados dos arquivos na tabela file_attachments
      if (uploadedFiles.length > 0 && userMessage.id) {
        for (const fileAttachment of uploadedFiles) {
          try {
            await this.saveFileAttachment(fileAttachment, userMessage.id, conversation.id!, userId);
          } catch (error) {
            logger.error('Error saving file attachment metadata for streaming', {
              error,
              fileName: fileAttachment.file_name,
              messageId: userMessage.id
            });
          }
        }
      }

      yield {
        type: 'message',
        data: { userMessage, conversation, filesUploaded: uploadedFiles.length }
      };

      // Preparar contexto para IA
      const aiMessages: AIMessage[] = [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          files: msg.file_attachments ? msg.file_attachments.map((attachment: any) => ({
            id: attachment.id || '',
            name: attachment.file_name,
            type: attachment.file_type,
            size: attachment.file_size,
            url: attachment.public_url || '',
            base64: attachment.base64,
            file_object: attachment.file_object
          })) : undefined
        })),
        {
          role: 'user',
          content: message,
          files: uploadedFiles.length > 0 ? uploadedFiles.map(file => ({
            id: file.id || '',
            name: file.file_name,
            type: file.file_type,
            size: file.file_size,
            url: file.public_url || '',
            base64: file.base64,
            file_object: file.file_object
          })) : undefined
        }
      ];

      // Stream da resposta da IA
      let fullContent = '';
      let model = '';
      const startTime = Date.now();

      for await (const chunk of streamChatWithAI(aiMessages, userId, defaultModel)) {
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
export const uploadFile = (file: File, userId: string) => chatService.uploadFile(file, userId);
export const saveFileAttachment = (fileAttachment: FileAttachment, messageId: string, conversationId: string, userId: string) => 
  chatService.saveFileAttachment(fileAttachment, messageId, conversationId, userId);
export const getMessageAttachments = (messageId: string) => chatService.getMessageAttachments(messageId);

// Interfaces já exportadas no início do arquivo