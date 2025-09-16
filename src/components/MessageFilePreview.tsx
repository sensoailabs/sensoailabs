"use client"

import { useState } from "react"
import {
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  // ImageIcon removido - não utilizado
  FileImageIcon,
  FileMusicIcon,
  FileVideoIcon,
  FileCodeIcon,
} from "lucide-react"
import FilePreviewDialog from "@/components/FilePreviewDialog"
import type { FileAttachment } from "@/services/chatService"

interface MessageFilePreviewProps {
  files: FileAttachment[]
}

const getFileIcon = (file: FileAttachment) => {
  const fileType = file.file_type || ''
  const fileName = file.file_name || ''
  const extension = fileName.split('.').pop()?.toLowerCase()

  const iconMap = {
    image: {
      icon: FileImageIcon,
      conditions: (type: string) => type && type.startsWith && type.startsWith("image/"),
      color: "text-blue-500"
    },
    video: {
      icon: FileVideoIcon,
      conditions: (type: string) => type && type.includes && type.includes("video/"),
      color: "text-purple-500"
    },
    audio: {
      icon: FileMusicIcon,
      conditions: (type: string) => type && type.includes && type.includes("audio/"),
      color: "text-green-500"
    },
    pdf: {
      icon: FileTextIcon,
      conditions: (type: string, name: string) =>
        (type && type.includes && type.includes("pdf")) || (name && name.endsWith && name.endsWith(".pdf")),
      color: "text-red-500"
    },
    excel: {
      icon: FileSpreadsheetIcon,
      conditions: (type: string, _name: string, ext?: string) =>
        (type && type.includes && (type.includes("excel") || type.includes("spreadsheet"))) ||
        ['xlsx', 'xls', 'csv'].includes(ext || ''),
      color: "text-green-600"
    },
    document: {
      icon: FileTextIcon,
      conditions: (type: string, _name: string, ext?: string) =>
        (type && type.includes && (type.includes("word") || type.includes("document"))) ||
        ['doc', 'docx', 'txt', 'rtf'].includes(ext || ''),
      color: "text-blue-600"
    },
    code: {
      icon: FileCodeIcon,
      conditions: (_type: string, _name: string, ext?: string) =>
        ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c'].includes(ext || ''),
      color: "text-yellow-600"
    },
    archive: {
      icon: FileArchiveIcon,
      conditions: (type: string, _name: string, ext?: string) =>
        (type && type.includes && (type.includes("zip") || type.includes("archive"))) ||
        ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || ''),
      color: "text-orange-500"
    },
  }

  for (const { icon: Icon, conditions, color } of Object.values(iconMap)) {
    if (conditions(fileType, fileName, extension)) {
      return <Icon className="size-5 text-gray-700" />
    }
  }

  return <FileIcon className="size-5 text-gray-700" />
}

const getFilePreview = (file: FileAttachment) => {
  const fileType = file.file_type || ''
  const fileName = file.file_name || ''

  const renderImage = (src: string) => {
    if (!src || src.trim() === '') {
      return (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100">
          {getFileIcon(file)}
        </div>
      )
    }
    return (
      <img
        src={src}
        alt={fileName}
        className="absolute inset-0 w-full h-full object-cover"
      />
    )
  }

  const getFileExtension = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase()
    return ext || 'FILE'
  }

  return (
    <div className="bg-accent flex w-full h-full items-center justify-center overflow-hidden rounded-t-lg relative">
      {fileType && fileType.startsWith && fileType.startsWith("image/") && file.public_url && file.public_url.trim() !== '' ? (
        renderImage(file.public_url)
      ) : (
        <>
          {getFileIcon(file)}
          <div className="absolute bottom-0.5 right-0.5 text-[6px] px-1 py-0 h-3 min-w-0 inline-flex items-center rounded-full border border-transparent bg-secondary text-secondary-foreground font-semibold">
            {getFileExtension(fileName)}
          </div>
        </>
      )}
    </div>
  )
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function MessageFilePreview({ files }: MessageFilePreviewProps) {
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (!files || files.length === 0) {
    return null
  }

  const handleFileClick = (file: FileAttachment) => {
    setSelectedFile(file)
    setIsDialogOpen(true)
  }

  // Converter FileAttachment para o formato esperado pelo FilePreviewDialog
  const convertToDialogFormat = (file: FileAttachment) => {
    return {
      id: file.id || 'unknown',
      file: {
        type: file.file_type,
        name: file.file_name,
        url: file.public_url
      }
    }
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <div
            key={file.id || `file-${index}`}
            className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center gap-2 min-w-[160px] max-w-[220px] cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => handleFileClick(file)}
            title={`${file.file_name} (${formatBytes(file.file_size)})`}
          >
            {/* Ícone do arquivo */}
            <div className="flex-shrink-0">
              {getFileIcon(file)}
            </div>
            
            {/* Nome e tamanho do arquivo */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {file.file_name}
              </p>
              <p className="text-[10px] text-gray-500">
                {formatBytes(file.file_size)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <FilePreviewDialog
        file={selectedFile ? convertToDialogFormat(selectedFile) : null}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}