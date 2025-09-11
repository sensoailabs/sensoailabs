// APIs REST para funcionalidades de chat e conversas
// import { supabase } from '../lib/supabase'; - removido, não utilizado
import { 
  getUserConversations,
  getUserConversationsPaginated,
  searchUserConversations,
  getConversationMessages,
  getConversationMessagesPaginated,
  getConversationContext,
  deleteConversation,
  processChat,
  // processChatStream - removido, não utilizado
  getActiveModelConfigurations,
  getUserPreferences,
  updateUserPreferences,
  generateSmartTitle
} from '../services/chatService';
import type { 
  ChatRequest,
  Conversation,
  ChatMessage,
  ModelConfiguration,
  UserPreferences
} from '../services/chatService';

// Interfaces para os endpoints
export interface ConversationsResponse {
  conversations: Conversation[];
  total?: number;
}

export interface PaginatedConversationsResponse {
  conversations: Conversation[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

export interface PaginatedMessagesResponse {
  messages: ChatMessage[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

export interface MessagesResponse {
  messages: ChatMessage[];
}

export interface ChatProcessResponse {
  message: ChatMessage;
  conversation: Conversation;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}

// ENDPOINT: GET /api/chat/conversations
export const getConversationsEndpoint = async (
  userId: string
): Promise<{ status: number; data: ConversationsResponse | ErrorResponse }> => {
  try {
    if (!userId) {
      return {
        status: 400,
        data: { error: 'ID do usuário é obrigatório' }
      };
    }

    const conversations = await getUserConversations(userId);
    
    return {
      status: 200,
      data: { conversations }
    };
  } catch (error) {
    console.error('Erro no endpoint getConversations:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// ENDPOINT: GET /api/chat/conversations/paginated
export const getConversationsPaginatedEndpoint = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ status: number; data: PaginatedConversationsResponse | ErrorResponse }> => {
  try {
    if (!userId) {
      return {
        status: 400,
        data: { error: 'ID do usuário é obrigatório' }
      };
    }

    const result = await getUserConversationsPaginated(userId, page, limit);
    
    return {
       status: 200,
       data: {
         conversations: result.conversations,
         totalCount: result.totalCount,
         hasMore: result.hasMore,
         currentPage: result.currentPage
       }
     };
  } catch (error) {
    console.error('Erro no endpoint getConversationsPaginated:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// ENDPOINT: GET /api/chat/search
export const searchConversationsEndpoint = async (
  userId: string,
  searchTerm?: string,
  modelFilter?: string,
  projectFilter?: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ status: number; data: ConversationsResponse | ErrorResponse }> => {
  try {
    if (!userId) {
      return {
        status: 400,
        data: { error: 'ID do usuário é obrigatório' }
      };
    }

    const result = await searchUserConversations(
      userId,
      searchTerm,
      modelFilter,
      projectFilter,
      limit,
      offset
    );
    
    return {
      status: 200,
      data: {
        conversations: result.conversations,
        total: result.total
      }
    };
  } catch (error) {
    console.error('Erro no endpoint searchConversations:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// ENDPOINT: GET /api/chat/conversation/:id/messages
export const getConversationMessagesEndpoint = async (
  conversationId: string
): Promise<{ status: number; data: MessagesResponse | ErrorResponse }> => {
  try {
    if (!conversationId) {
      return {
        status: 400,
        data: { error: 'ID da conversa é obrigatório' }
      };
    }

    const messages = await getConversationMessages(conversationId);
    
    return {
      status: 200,
      data: { messages }
    };
  } catch (error) {
    console.error('Erro no endpoint getConversationMessages:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// ENDPOINT: GET /api/chat/conversation/:id/messages/paginated
export const getConversationMessagesPaginatedEndpoint = async (
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ status: number; data: PaginatedMessagesResponse | ErrorResponse }> => {
  try {
    if (!conversationId) {
      return {
        status: 400,
        data: { error: 'ID da conversa é obrigatório' }
      };
    }

    const result = await getConversationMessagesPaginated(conversationId, page, limit);
    
    return {
      status: 200,
      data: {
        messages: result.messages,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        currentPage: result.currentPage
      }
    };
  } catch (error) {
    console.error('Erro no endpoint getConversationMessagesPaginated:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// ENDPOINT: GET /api/chat/conversation/:id/context
export const getConversationContextEndpoint = async (
  conversationId: string
): Promise<{ status: number; data: {
  conversation: Conversation;
  messages: ChatMessage[];
  modelConfig?: ModelConfiguration;
  totalMessages: number;
  totalTokens: number;
} | ErrorResponse }> => {
  try {
    if (!conversationId) {
      return {
        status: 400,
        data: { error: 'ID da conversa é obrigatório' }
      };
    }

    const context = await getConversationContext(conversationId);
    
    return {
      status: 200,
      data: context
    };
  } catch (error) {
    console.error('Erro no endpoint getConversationContext:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// ENDPOINT: DELETE /api/chat/conversation/:id
export const deleteConversationEndpoint = async (
  conversationId: string,
  userId: string
): Promise<{ status: number; data: { message: string } | ErrorResponse }> => {
  try {
    if (!conversationId || !userId) {
      return {
        status: 400,
        data: { error: 'ID da conversa e do usuário são obrigatórios' }
      };
    }

    await deleteConversation(conversationId, userId);
    
    return {
      status: 200,
      data: { message: 'Conversa deletada com sucesso' }
    };
  } catch (error) {
    console.error('Erro no endpoint deleteConversation:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// ENDPOINT: POST /api/chat/process
export const processChatEndpoint = async (
  request: ChatRequest
): Promise<{ status: number; data: ChatProcessResponse | ErrorResponse }> => {
  try {
    const { message, userId } = request;
    
    if (!message || !userId) {
      return {
        status: 400,
        data: { error: 'Mensagem e ID do usuário são obrigatórios' }
      };
    }

    const result = await processChat(request);
    
    return {
      status: 200,
      data: result
    };
  } catch (error) {
    console.error('Erro no endpoint processChat:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// ENDPOINT: POST /api/chat/generate-title
export const generateTitleEndpoint = async (
  firstMessage: string,
  userId: string
): Promise<{ status: number; data: { title: string } | ErrorResponse }> => {
  try {
    if (!firstMessage || !userId) {
      return {
        status: 400,
        data: { error: 'Primeira mensagem e ID do usuário são obrigatórios' }
      };
    }

    const title = await generateSmartTitle(firstMessage, userId);
    
    return {
      status: 200,
      data: { title }
    };
  } catch (error) {
    console.error('Erro no endpoint generateTitle:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// ENDPOINT: GET /api/config/models/active
export const getActiveModelsEndpoint = async (): Promise<{
  status: number;
  data: { models: ModelConfiguration[] } | ErrorResponse;
}> => {
  try {
    const models = await getActiveModelConfigurations();
    
    return {
      status: 200,
      data: { models }
    };
  } catch (error) {
    console.error('Erro no endpoint getActiveModels:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// ENDPOINT: GET /api/user/preferences
export const getUserPreferencesEndpoint = async (
  userId: string
): Promise<{ status: number; data: { preferences: UserPreferences | null } | ErrorResponse }> => {
  try {
    if (!userId) {
      return {
        status: 400,
        data: { error: 'ID do usuário é obrigatório' }
      };
    }

    const preferences = await getUserPreferences(userId);
    
    return {
      status: 200,
      data: { preferences }
    };
  } catch (error) {
    console.error('Erro no endpoint getUserPreferences:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};

// ENDPOINT: PUT /api/user/preferences
export const updateUserPreferencesEndpoint = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<{ status: number; data: { preferences: UserPreferences } | ErrorResponse }> => {
  try {
    if (!userId) {
      return {
        status: 400,
        data: { error: 'ID do usuário é obrigatório' }
      };
    }

    const updatedPreferences = await updateUserPreferences(userId, preferences);
    
    return {
      status: 200,
      data: { preferences: updatedPreferences }
    };
  } catch (error) {
    console.error('Erro no endpoint updateUserPreferences:', error);
    return {
      status: 500,
      data: { error: 'Erro interno do servidor' }
    };
  }
};