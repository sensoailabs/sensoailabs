"use client"

import { useState } from "react"
import {
  AlertCircleIcon,
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  Trash2Icon,
  VideoIcon,
  XIcon,
  FileImageIcon,
  FileMusicIcon,
  FileVideoIcon,
  FileCodeIcon,
} from "lucide-react"

import {
  formatBytes,
  useFileUpload,
} from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import FilePreviewDialog from "@/components/FilePreviewDialog"
import type { DragEvent } from "react"

interface FileListProps {
  files: ReturnType<typeof useFileUpload>[0]['files']
  onRemoveFile: (id: string) => void
  onClearFiles: () => void
  onAddFiles: () => void
  errors: string[]
  maxFiles?: number
  maxSizeMB?: number
  onDragEnter?: (e: DragEvent<HTMLElement>) => void
  onDragLeave?: (e: DragEvent<HTMLElement>) => void
  onDragOver?: (e: DragEvent<HTMLElement>) => void
  onDrop?: (e: DragEvent<HTMLElement>) => void
  isDragging?: boolean
}

const getFileIcon = (file: { file: File | { type: string; name: string } }) => {
  const fileType = file.file instanceof File ? file.file.type : file.file.type
  const fileName = file.file instanceof File ? file.file.name : file.file.name
  const extension = fileName.split('.').pop()?.toLowerCase()

  const iconMap = {
    image: {
      icon: FileImageIcon,
      conditions: (type: string) => type.startsWith("image/"),
      color: "text-blue-500"
    },
    video: {
      icon: FileVideoIcon,
      conditions: (type: string) => type.includes("video/"),
      color: "text-purple-500"
    },
    audio: {
      icon: FileMusicIcon,
      conditions: (type: string) => type.includes("audio/"),
      color: "text-green-500"
    },
    pdf: {
      icon: FileTextIcon,
      conditions: (type: string, name: string) =>
        type.includes("pdf") || name.endsWith(".pdf"),
      color: "text-red-500"
    },
    excel: {
      icon: FileSpreadsheetIcon,
      conditions: (type: string, name: string, ext?: string) =>
        type.includes("excel") ||
        type.includes("spreadsheet") ||
        ['xlsx', 'xls', 'csv'].includes(ext || ''),
      color: "text-green-600"
    },
    document: {
      icon: FileTextIcon,
      conditions: (type: string, name: string, ext?: string) =>
        type.includes("word") ||
        type.includes("document") ||
        ['doc', 'docx', 'txt', 'rtf'].includes(ext || ''),
      color: "text-blue-600"
    },
    code: {
      icon: FileCodeIcon,
      conditions: (type: string, name: string, ext?: string) =>
        ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c'].includes(ext || ''),
      color: "text-yellow-600"
    },
    archive: {
      icon: FileArchiveIcon,
      conditions: (type: string, name: string, ext?: string) =>
        type.includes("zip") ||
        type.includes("archive") ||
        ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || ''),
      color: "text-orange-500"
    },
  }

  for (const { icon: Icon, conditions, color } of Object.values(iconMap)) {
      if (conditions(fileType, fileName, extension)) {
        return <Icon className={`size-6 ${color}`} />
      }
    }

    return <FileIcon className="size-6 text-gray-500" />
}

const getFilePreview = (file: {
  file: File | { type: string; name: string; url?: string }
}) => {
  const fileType = file.file instanceof File ? file.file.type : file.file.type
  const fileName = file.file instanceof File ? file.file.name : file.file.name

  const renderImage = (src: string) => (
    <img
      src={src}
      alt={fileName}
      className="absolute inset-0 w-full h-full object-cover"
    />
  )

  const getFileExtension = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase()
    return ext || 'FILE'
  }

  return (
    <div className="bg-accent flex w-full h-full items-center justify-center overflow-hidden rounded-t-xl relative">
      {fileType.startsWith("image/") ? (
        file.file instanceof File ? (
          (() => {
            const previewUrl = URL.createObjectURL(file.file)
            return renderImage(previewUrl)
          })()
        ) : file.file.url ? (
          renderImage(file.file.url)
        ) : (
          <ImageIcon className="size-6 opacity-60" />
        )
      ) : (
        <>
          {getFileIcon(file)}
          <div className="absolute bottom-1 right-1 text-[8px] px-1 py-0 h-4 min-w-0 inline-flex items-center rounded-full border border-transparent bg-secondary text-secondary-foreground font-semibold">
            {getFileExtension(fileName)}
          </div>
        </>
      )}
    </div>
  )
}

export default function FileList({
  files,
  onRemoveFile,
  onClearFiles,
  onAddFiles,
  errors,
  maxFiles = 6,
  maxSizeMB = 5,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  isDragging = false
}: FileListProps) {
  const [selectedFile, setSelectedFile] = useState<typeof files[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleFileClick = (file: typeof files[0]) => {
    setSelectedFile(file)
    setIsDialogOpen(true)
  }

  if (files.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Lista de arquivos */}
      <div className="flex w-full flex-col gap-3 p-4 bg-gray-50 rounded-t-2xl">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-medium">
            Arquivos ({files.length})
          </h3>
         
        </div>

        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-background relative w-24 h-24 rounded-xl border group hover:shadow-md transition-shadow flex-shrink-0 cursor-pointer"
              onClick={() => handleFileClick(file)}
            >
              <div className="w-full h-full overflow-hidden rounded-xl">
                {getFilePreview(file)}
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveFile(file.id)
                }}
                size="icon"
                className="border-background focus-visible:border-background absolute -top-2 -right-2 size-6 rounded-full border-2 shadow-lg bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                aria-label="Remover arquivo"
              >
                <XIcon className="size-3" />
              </Button>

            </div>
          ))}
        </div>
      </div>

      {errors.length > 0 && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}
      
      <FilePreviewDialog
        file={selectedFile}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}