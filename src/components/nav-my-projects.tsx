"use client"

import * as React from "react"
import { ChevronRight, Folder, Plus, Search, MessageSquare } from "lucide-react"
import { useProjects, type Project } from "@/hooks/use-projects"
import { ProjectModal } from "@/components/ProjectModal"
import { ProjectActions } from "@/components/ProjectActions"
import { Input } from "@/components/ui/input"
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
    setActiveProject,
    searchProjects
  } = useProjects()

  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filteredProjects, setFilteredProjects] = React.useState(projects)

  React.useEffect(() => {
    setFilteredProjects(searchProjects(searchQuery))
  }, [searchQuery, projects, searchProjects])

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

          {/* Campo de Busca */}
          {projects.length > 0 && (
            <SidebarMenuItem>
              <div className="px-2 py-1">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar projetos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>
            </SidebarMenuItem>
          )}

          {/* Lista de Projetos */}
          {filteredProjects.map((project) => (
            <Collapsible
              key={project.id}
              asChild
              defaultOpen={project.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={project.name}
                    onClick={() => handleProjectClick(project)}
                    className={`group ${project.isActive ? 'bg-accent text-accent-foreground' : ''}`}
                  >
                    <Folder className={project.isActive ? 'text-primary' : ''} />
                    <span className="flex-1 truncate">{project.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {project.chatCount}
                      </span>
                      <ProjectActions
                        project={project}
                        onEdit={handleEditProject}
                        onDelete={handleDeleteProject}
                        isDeleting={isDeleting}
                      />
                      <ChevronRight className="ml-1 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </div>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {getMockChats(project.id, project.chatCount).map((chat) => (
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

          {/* Estado vazio */}
          {filteredProjects.length === 0 && searchQuery && (
            <SidebarMenuItem>
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                Nenhum projeto encontrado
              </div>
            </SidebarMenuItem>
          )}
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
