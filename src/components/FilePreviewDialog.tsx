"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, FileIcon } from "lucide-react"
import { formatBytes } from "@/hooks/use-file-upload"

interface FilePreviewDialogProps {
  file: {
    id: string
    file: File | { type: string; name: string; url?: string }
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const getFileType = (file: File | { type: string; name: string }) => {
  const fileType = file instanceof File ? file.type : file.type
  const fileName = file instanceof File ? file.name : file.name
  
  if (fileType.startsWith('image/')) return 'image'
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) return 'pdf'
  return 'other'
}

const formatFileSize = (file: File | { type: string; name: string }) => {
  if (file instanceof File) {
    return formatBytes(file.size)
  }
  return 'Tamanho não disponível'
}

const getFileUrl = (file: File | { type: string; name: string; url?: string }) => {
  if (file instanceof File) {
    return URL.createObjectURL(file)
  }
  return file.url || ''
}

export default function FilePreviewDialog({
  file,
  open,
  onOpenChange
}: FilePreviewDialogProps) {
  if (!file) return null

  const fileType = getFileType(file.file)
  const fileName = file.file instanceof File ? file.file.name : file.file.name
  const fileSize = formatFileSize(file.file)
  const fileUrl = getFileUrl(file.file)

  const renderPreview = () => {
    switch (fileType) {
      case 'image':
        return (
          <div className="flex items-center justify-center max-h-[70vh] overflow-hidden">
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        )
      
      case 'pdf':
        return (
          <div className="h-[70vh] w-full">
            <iframe
              src={fileUrl}
              className="w-full h-full border-0 rounded-lg"
              title={fileName}
            />
          </div>
        )
      
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <FileIcon className="w-16 h-16 text-gray-400" />
            <div className="text-center space-y-2">
              <h3 className="font-medium text-lg">{fileName}</h3>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Tamanho: {fileSize}</p>
                <p>Tipo: {file.file instanceof File ? file.file.type || 'Não identificado' : file.file.type}</p>
                <p>Extensão: {fileName.split('.').pop()?.toUpperCase() || 'N/A'}</p>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold truncate pr-4">
            {fileName}
          </DialogTitle>
          
        </DialogHeader>
        
        <div className="overflow-auto">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  )
}