import { useState, useCallback, useRef } from "react"
import type { DragEvent, ChangeEvent, InputHTMLAttributes } from "react"

type FileMetadata = {
  name: string
  size: number
  type: string
  url: string
  id: string
}

type FileWithPreview = {
  file: File | FileMetadata
  id: string
  preview?: string
}

interface UseFileUploadOptions {
  maxFiles?: number
  maxSize?: number
  accept?: string
  multiple?: boolean
  initialFiles?: FileMetadata[]
  onFilesChange?: (files: FileWithPreview[]) => void
  onFilesAdded?: (addedFiles: FileWithPreview[]) => void
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function useFileUpload({
  maxFiles = Infinity,
  maxSize = Infinity,
  accept = "*",
  multiple = false,
  initialFiles = [],
  onFilesChange,
  onFilesAdded
}: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<FileWithPreview[]>(
    initialFiles.map(file => ({ file, id: file.id }))
  )
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `Arquivo "${file.name}" excede o tamanho máximo de ${formatBytes(maxSize)}`
    }

    if (accept !== "*") {
      const acceptedTypes = accept.split(",").map(type => type.trim())
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        if (type.includes("/*")) {
          const baseType = type.split("/")[0]
          return file.type.startsWith(baseType)
        }
        return file.type === type
      })

      if (!isAccepted) {
        return `Tipo de arquivo "${file.type}" não é aceito`
      }
    }

    return null
  }, [maxSize, accept])

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const validFiles: FileWithPreview[] = []
    const newErrors: string[] = []

    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        newErrors.push(error)
        continue
      }

      const isDuplicate = files.some(f => 
        f.file instanceof File 
          ? f.file.name === file.name && f.file.size === file.size
          : f.file.name === file.name && f.file.size === file.size
      )

      if (isDuplicate) {
        newErrors.push(`Arquivo "${file.name}" já foi selecionado`)
        continue
      }

      const fileWithPreview: FileWithPreview = {
        file,
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }

      validFiles.push(fileWithPreview)
    }

    setFiles(prevFiles => {
      const totalFiles = prevFiles.length + validFiles.length
      if (totalFiles > maxFiles) {
        const allowedCount = maxFiles - prevFiles.length
        const allowedFiles = validFiles.slice(0, allowedCount)
        newErrors.push(`Máximo de ${maxFiles} arquivos permitidos. Apenas ${allowedCount} arquivos foram adicionados.`)
        const updatedFiles = multiple ? [...prevFiles, ...allowedFiles] : allowedFiles
        onFilesChange?.(updatedFiles)
        onFilesAdded?.(allowedFiles)
        return updatedFiles
      }

      const updatedFiles = multiple ? [...prevFiles, ...validFiles] : validFiles
      onFilesChange?.(updatedFiles)
      onFilesAdded?.(validFiles)
      return updatedFiles
    })

    setErrors(newErrors)
  }, [files, maxFiles, multiple, validateFile, onFilesChange, onFilesAdded])

  const removeFile = useCallback((fileId: string) => {
    setFiles(prevFiles => {
      const fileToRemove = prevFiles.find(f => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      const updatedFiles = prevFiles.filter(f => f.id !== fileId)
      onFilesChange?.(updatedFiles)
      return updatedFiles
    })
  }, [onFilesChange])

  const clearFiles = useCallback(() => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
    onFilesChange?.([])
  }, [files, onFilesChange])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }, [addFiles])

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [addFiles])

  const openFileDialog = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const getInputProps = useCallback((props?: InputHTMLAttributes<HTMLInputElement>) => ({
    ...props,
    ref: inputRef,
    type: "file" as const,
    accept,
    multiple,
    onChange: handleFileChange,
    style: { display: 'none' }
  }), [accept, multiple, handleFileChange])

  return [
    { files, isDragging, errors },
    {
      addFiles,
      removeFile,
      clearFiles,
      clearErrors,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileChange,
      openFileDialog,
      getInputProps
    }
  ] as const
}