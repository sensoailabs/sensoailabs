"use client"

import * as React from "react"
import { ChevronRight, Folder, Plus, MessageSquare } from "lucide-react"
import { useProjects, type Project } from "@/hooks/use-projects"
import { ProjectModal } from "@/components/ProjectModal"
import { ProjectActions } from "@/components/ProjectActions"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain() {
  const {
    projects,
    isCreating,
    isUpdating,
    isDeleting,
    createProject,
    updateProject,
    deleteProject,
    setActiveProject
  } = useProjects()

  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)

  const handleCreateProject = async (data: { name: string; instructions: string }) => {
    try {
      await createProject(data)
      setShowCreateModal(false)
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
    }
  }

  const handleUpdateProject = async (data: { name: string; instructions: string }) => {
    if (!editingProject) return
    
    try {
      await updateProject({ ...data, id: editingProject.id })
      setEditingProject(null)
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId)
    } catch (error) {
      console.error('Erro ao excluir projeto:', error)
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
  }

  const handleProjectClick = (project: Project) => {
    setActiveProject(project.id)
  }

  // Mock de chats para demonstração
  const getMockChats = (projectId: string, count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${projectId}-chat-${i + 1}`,
      title: `Chat ${i + 1}`,
      url: `/chat/${projectId}-chat-${i + 1}`
    }))
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Meus projetos</SidebarGroupLabel>
        <SidebarMenu>
          {/* Botão Novo Projeto */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setShowCreateModal(true)}
              className="font-medium text-primary hover:text-primary/80 cursor-pointer"
            >
              <Plus className="text-primary" />
              <span>Novo projeto</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Lista de Projetos */}
          {projects.map((project) => (
            <Collapsible
              key={project.id}
              asChild
              defaultOpen={project.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <div className="flex items-center group">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      tooltip={project.name}
                      onClick={() => handleProjectClick(project)}
                      className={`flex-1 ${project.isActive ? 'bg-accent text-accent-foreground' : ''}`}
                    >
                      <Folder className={project.isActive ? 'text-primary' : ''} />
                      <span className="flex-1 truncate">{project.name}</span>
                      <ChevronRight className="ml-1 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <ProjectActions
                    project={project}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    isDeleting={isDeleting}
                  />
                </div>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {getMockChats(project.id, project.chatCount || 0).map((chat) => (
                      <SidebarMenuSubItem key={chat.id}>
                        <SidebarMenuSubButton asChild>
                          <a href={chat.url} className="flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" />
                            <span className="truncate">{chat.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {/* Modal de Criar Projeto */}
      <ProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSave={handleCreateProject}
        isLoading={isCreating}
      />

      {/* Modal de Editar Projeto */}
      <ProjectModal
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        project={editingProject || undefined}
        onSave={handleUpdateProject}
        isLoading={isUpdating}
      />
    </>
  )
}
