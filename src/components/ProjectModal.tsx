"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type Project, type ProjectFormData } from "@/types/project"

interface ProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project
  onSave: (project: Omit<Project, 'id' | 'chatCount'>) => void
  isLoading?: boolean
}

export function ProjectModal({
  open,
  onOpenChange,
  project,
  onSave,
  isLoading = false
}: ProjectModalProps) {
  const [name, setName] = React.useState("")
  const [instructions, setInstructions] = React.useState("")
  const [nameError, setNameError] = React.useState("")
  const [instructionsError, setInstructionsError] = React.useState("")

  const isEditing = !!project

  React.useEffect(() => {
    if (project) {
      setName(project.name)
      setInstructions(project.instructions)
    } else {
      setName("")
      setInstructions("")
    }
    setNameError("")
    setInstructionsError("")
  }, [project, open])

  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError("Nome do projeto é obrigatório")
      return false
    }
    if (value.length > 50) {
      setNameError("Nome deve ter no máximo 50 caracteres")
      return false
    }
    setNameError("")
    return true
  }

  const validateInstructions = (value: string) => {
    if (value.length > 2000) {
      setInstructionsError("Instruções devem ter no máximo 2000 caracteres")
      return false
    }
    setInstructionsError("")
    return true
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    validateName(value)
  }

  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInstructions(value)
    validateInstructions(value)
  }

  const handleSave = () => {
    const isNameValid = validateName(name)
    const isInstructionsValid = validateInstructions(instructions)

    if (isNameValid && isInstructionsValid) {
      onSave({ name: name.trim(), instructions: instructions.trim() })
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const isFormValid = name.trim() && !nameError && !instructionsError

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar projeto" : "Criar novo projeto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Edite as informações do seu projeto" 
              : "Crie um novo projeto para organizar seus chats com IA"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do projeto *</Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="Digite o nome do projeto"
              className={nameError ? "border-red-500" : ""}
              maxLength={50}
            />
            <div className="flex justify-between text-xs">
              <span className="text-red-500">{nameError}</span>
              <span className="text-muted-foreground">{name.length}/50</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="instructions">Instruções personalizadas</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={handleInstructionsChange}
              placeholder="Digite instruções específicas para este projeto (opcional)"
              className={`min-h-[120px] ${instructionsError ? "border-red-500" : ""}`}
              maxLength={2000}
            />
            <div className="flex justify-between text-xs">
              <span className="text-red-500">{instructionsError}</span>
              <span className="text-muted-foreground">{instructions.length}/2000</span>
            </div>
          </div>


        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}