export interface Project {
  id: string
  name: string
  instructions: string
  isActive?: boolean
  chatCount?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface Chat {
  id: string
  title: string
  projectId: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectFormData {
  name: string
  instructions: string
}