import { supabase } from '@/lib/supabase';

export interface ProjectResponse {
  id: string;
  name: string;
  customInstructions: string | null;
  chatCount: number;
  createdAt: string;
}

export interface CreateProjectRequest {
  name: string;
  customInstructions?: string;
}

export interface UpdateProjectRequest {
  name: string;
  customInstructions?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

class ProjectService {
  /**
   * Lista todos os projetos do usuário autenticado
   * GET /api/projects
   */
  async getProjects(): Promise<ProjectResponse[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar projetos
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, name, custom_instructions, created_at')
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar projetos: ${error.message}`);
      }

      if (!projects) {
        return [];
      }

      // Buscar contadores de chats em uma única consulta otimizada
      const projectIds = projects.map(p => p.id);
      
      let chatCounts: Record<string, number> = {};
      
      if (projectIds.length > 0) {
        const { data: chatCountData, error: chatError } = await supabase
          .from('chats')
          .select('project_id')
          .eq('user_id', user.user.id)
          .eq('is_active', true)
          .in('project_id', projectIds);

        if (chatError) {
          console.warn('Erro ao buscar contadores de chat:', chatError);
          // Continuar sem os contadores em caso de erro
        } else if (chatCountData) {
          // Contar chats por projeto
          chatCounts = chatCountData.reduce((acc, chat) => {
            acc[chat.project_id] = (acc[chat.project_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      // Mapear projetos com contadores de chat
      const projectsWithChatCount = projects.map(project => ({
        id: project.id,
        name: project.name,
        customInstructions: project.custom_instructions,
        chatCount: chatCounts[project.id] || 0,
        createdAt: project.created_at
      }));

      return projectsWithChatCount;

    } catch (error) {
      console.error('Erro no getProjects:', error);
      throw error;
    }
  }

  /**
   * Cria um novo projeto
   * POST /api/projects
   */
  async createProject(data: CreateProjectRequest): Promise<ApiResponse<{ id: string }>> {
    try {
      // Validações
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Nome do projeto é obrigatório');
      }
      
      if (data.name.length > 50) {
        throw new Error('Nome do projeto deve ter no máximo 50 caracteres');
      }

      if (data.customInstructions && data.customInstructions.length > 2000) {
        throw new Error('Instruções customizadas devem ter no máximo 2000 caracteres');
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      // Sanitizar inputs
      const sanitizedData = {
        name: data.name.trim(),
        custom_instructions: data.customInstructions?.trim() || null,
        user_id: user.user.id
      };

      const { data: project, error } = await supabase
        .from('projects')
        .insert(sanitizedData)
        .select('id')
        .single();

      if (error) {
        throw new Error(`Erro ao criar projeto: ${error.message}`);
      }

      return {
        data: { id: project.id },
        message: 'Projeto criado com sucesso'
      };

    } catch (error) {
      console.error('Erro no createProject:', error);
      throw error;
    }
  }

  /**
   * Atualiza um projeto existente
   * PUT /api/projects/:id
   */
  async updateProject(id: string, data: UpdateProjectRequest): Promise<ApiResponse> {
    try {
      // Validações
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Nome do projeto é obrigatório');
      }
      
      if (data.name.length > 50) {
        throw new Error('Nome do projeto deve ter no máximo 50 caracteres');
      }

      if (data.customInstructions && data.customInstructions.length > 2000) {
        throw new Error('Instruções customizadas devem ter no máximo 2000 caracteres');
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar ownership
      const { data: existingProject, error: checkError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .single();

      if (checkError || !existingProject) {
        throw new Error('Projeto não encontrado ou sem permissão');
      }

      // Sanitizar inputs
      const sanitizedData = {
        name: data.name.trim(),
        custom_instructions: data.customInstructions?.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('projects')
        .update(sanitizedData)
        .eq('id', id)
        .eq('user_id', user.user.id);

      if (error) {
        throw new Error(`Erro ao atualizar projeto: ${error.message}`);
      }

      return {
        message: 'Projeto atualizado com sucesso'
      };

    } catch (error) {
      console.error('Erro no updateProject:', error);
      throw error;
    }
  }

  /**
   * Exclui um projeto (exclusão física)
   * DELETE /api/projects/:id
   */
  async deleteProject(id: string): Promise<ApiResponse> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar ownership
      const { data: existingProject, error: checkError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .single();

      if (checkError || !existingProject) {
        throw new Error('Projeto não encontrado ou sem permissão');
      }

      // Primeiro, excluir todos os chats associados ao projeto
      const { error: chatsError } = await supabase
        .from('chats')
        .delete()
        .eq('project_id', id)
        .eq('user_id', user.user.id);

      if (chatsError) {
        throw new Error(`Erro ao excluir chats do projeto: ${chatsError.message}`);
      }

      // Depois, excluir o projeto fisicamente
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.user.id);

      if (error) {
        throw new Error(`Erro ao excluir projeto: ${error.message}`);
      }

      return {
        message: 'Projeto excluído com sucesso'
      };

    } catch (error) {
      console.error('Erro no deleteProject:', error);
      throw error;
    }
  }

  /**
   * Lista chats de um projeto específico
   * GET /api/projects/:id/chats
   */
  async getProjectChats(projectId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar ownership do projeto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .single();

      if (projectError || !project) {
        throw new Error('Projeto não encontrado ou sem permissão');
      }

      // Buscar chats do projeto
      const { data: chats, error } = await supabase
        .from('chats')
        .select('id, title, ai_model, created_at')
        .eq('project_id', projectId)
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar chats: ${error.message}`);
      }

      return chats?.map(chat => ({
        id: chat.id,
        title: chat.title,
        aiModel: chat.ai_model,
        createdAt: chat.created_at
      })) || [];

    } catch (error) {
      console.error('Erro no getProjectChats:', error);
      throw error;
    }
  }
}

export const projectService = new ProjectService();