import { useState, useCallback } from 'react'
import { type Project, type Chat, type ProjectFormData } from '@/types/project'

export type CreateProjectData = ProjectFormData
export interface UpdateProjectData extends Partial<ProjectFormData> {
  id: string
}

// Dados mock para demonstração
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Projeto 1',
    instructions: 'Instruções para o projeto 1',
    chatCount: 5,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Projeto 2',
    instructions: 'Instruções para o projeto 2',
    chatCount: 3,
    isActive: false,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    id: '3',
    name: 'Projeto 3',
    instructions: 'Instruções para o projeto 3',
    chatCount: 8,
    isActive: false,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  },
  {
    id: '4',
    name: 'Projeto 4',
    instructions: 'Instruções para o projeto 4',
    chatCount: 2,
    isActive: false,
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04')
  }
]

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const createProject = useCallback(async (data: CreateProjectData): Promise<Project> => {
    setIsCreating(true)
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: data.name,
      instructions: data.instructions,
      chatCount: 0,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setProjects(prev => [newProject, ...prev])
    setIsCreating(false)
    
    return newProject
  }, [])

  const updateProject = useCallback(async (data: UpdateProjectData): Promise<Project> => {
    setIsUpdating(true)
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const existingProject = projects.find(p => p.id === data.id)!
    const updatedProject: Project = {
      ...existingProject,
      ...(data.name && { name: data.name }),
      ...(data.instructions && { instructions: data.instructions }),
      updatedAt: new Date()
    }
    
    setProjects(prev => prev.map(p => p.id === data.id ? updatedProject : p))
    setIsUpdating(false)
    
    return updatedProject
  }, [projects])

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true)
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setProjects(prev => prev.filter(p => p.id !== id))
    setIsDeleting(false)
  }, [])

  const setActiveProject = useCallback((id: string) => {
    setProjects(prev => prev.map(p => ({ ...p, isActive: p.id === id })))
  }, [])

  const searchProjects = useCallback((query: string) => {
    if (!query.trim()) return projects
    
    return projects.filter(project => 
      project.name.toLowerCase().includes(query.toLowerCase())
    )
  }, [projects])

  return {
    projects,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    createProject,
    updateProject,
    deleteProject,
    setActiveProject,
    searchProjects
  }
}