import { useState, useEffect, useCallback } from 'react';
import { projectService, type ProjectResponse } from '@/services/projectService';
import type { Project, Chat, ProjectFormData } from '@/types/project';
import { useToast } from '@/hooks/use-toast';

export interface CreateProjectData extends ProjectFormData {}
export interface UpdateProjectData extends Partial<ProjectFormData> {
  id: string;
}

// Cache local para projetos
let projectsCache: Project[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useProjects() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Converter ProjectResponse para Project
  const mapProjectResponse = (response: ProjectResponse): Project => ({
    id: response.id,
    name: response.name,
    instructions: response.customInstructions || '',
    chatCount: response.chatCount,
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.createdAt),
    isActive: true
  });

  // Invalidar cache
  const invalidateCache = useCallback(() => {
    projectsCache = null;
    cacheTimestamp = 0;
  }, []);

  // Carregar projetos com cache
  const loadProjects = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      // Verificar cache se não for refresh forçado
      if (!forceRefresh && projectsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setProjects(projectsCache);
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await projectService.getProjects();
      const mappedProjects = response.map(mapProjectResponse);
      
      // Atualizar cache
      projectsCache = mappedProjects;
      cacheTimestamp = Date.now();
      
      setProjects(mappedProjects);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar projetos';
      setError(errorMessage);
      console.error('Erro ao carregar projetos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar projetos na inicialização
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = async (data: CreateProjectData): Promise<void> => {
    try {
      setIsCreating(true);
      setError(null);

      // Optimistic update
      const optimisticProject: Project = {
        id: `temp-${Date.now()}`,
        name: data.name,
        instructions: data.instructions || '',
        chatCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      setProjects(prev => [optimisticProject, ...prev]);

      // API call
      const response = await projectService.createProject({
        name: data.name,
        customInstructions: data.instructions
      });

      // Invalidar cache e recarregar
      invalidateCache();
      await loadProjects(true);
      
      toast({
        title: 'Sucesso',
        description: 'Projeto criado com sucesso',
        variant: 'success'
      });

    } catch (err) {
      // Reverter optimistic update em caso de erro
      setProjects(prev => prev.filter(p => !p.id.startsWith('temp-')));
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar projeto';
      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const updateProject = async (data: UpdateProjectData): Promise<void> => {
    const previousProjects = [...projects];
    try {
      setIsUpdating(true);
      setError(null);

      // Optimistic update
      setProjects(prev => prev.map(project => 
        project.id === data.id 
          ? { 
              ...project, 
              name: data.name || project.name,
              instructions: data.instructions !== undefined 
                ? data.instructions 
                : project.instructions,
              updatedAt: new Date()
            }
          : project
      ));

      // API call
      await projectService.updateProject(data.id, {
        name: data.name!,
        customInstructions: data.instructions
      });

      // Invalidar cache
      invalidateCache();
      
      toast({
        title: 'Sucesso',
        description: 'Projeto atualizado com sucesso',
        variant: 'success'
      });

    } catch (err) {
      // Reverter optimistic update em caso de erro
      setProjects(previousProjects);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar projeto';
      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    const previousProjects = [...projects];
    try {
      setIsDeleting(true);
      setError(null);

      // Optimistic update
      setProjects(prev => prev.filter(project => project.id !== id));

      // API call
      await projectService.deleteProject(id);

      // Invalidar cache
      invalidateCache();
      
      toast({
        title: 'Sucesso',
        description: 'Projeto excluído com sucesso',
        variant: 'success'
      });

    } catch (err) {
      // Reverter optimistic update em caso de erro
      setProjects(previousProjects);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir projeto';
      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  const activateProject = async (id: string): Promise<void> => {
    try {
      setError(null);
      
      // Aqui você implementaria a lógica para ativar o projeto
      // Por enquanto, apenas log
      console.log('Projeto ativado:', id);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao ativar projeto';
      setError(errorMessage);
      throw err;
    }
  };

  const getProjectChats = async (projectId: string): Promise<Chat[]> => {
    try {
      const chats = await projectService.getProjectChats(projectId);
      return chats.map(chat => ({
        id: chat.id,
        title: chat.title || 'Chat sem título',
        projectId: projectId,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.createdAt)
      }));
    } catch (err) {
      console.error('Erro ao buscar chats do projeto:', err);
      return [];
    }
  };

  const refreshProjects = useCallback(() => {
    return loadProjects(true);
  }, [loadProjects]);

  const setActiveProject = useCallback((id: string) => {
    setActiveProjectId(id);
    setProjects(prev => prev.map(project => ({
      ...project,
      isActive: project.id === id
    })));
  }, []);

  const searchProjects = useCallback((query: string) => {
    if (!query.trim()) return projects;
    
    return projects.filter(project =>
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.instructions.toLowerCase().includes(query.toLowerCase())
    );
  }, [projects]);

  return {
    projects,
    isLoading: loading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createProject,
    updateProject,
    deleteProject,
    setActiveProject,
    getProjectChats,
    refreshProjects,
    searchProjects,
    setError
  };
}