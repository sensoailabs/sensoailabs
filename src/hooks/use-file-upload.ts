import { useState, useCallback, useRef } from "react"

interface FileWithPreview {
  id: string
  name: string
  size: number
  type: string
  preview?: string
  url?: string
}

interface UseFileUploadProps {
  accept?: string
  initialFiles?: FileWithPreview[]
}

export function useFileUpload({ accept = "*", initialFiles = [] }: UseFileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>(initialFiles)
  const inputRef = useRef<HTMLInputElement>(null)

  const openFileDialog = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    const filesWithPreview = selectedFiles.map((file) => {
      const fileWithId = Object.assign(file, {
        id: Math.random().toString(36).substr(2, 9),
        preview: URL.createObjectURL(file),
      })
      return fileWithId
    })

    setFiles(filesWithPreview)
  }, [])

  const removeFile = useCallback((fileId: string) => {
    setFiles((prevFiles) => {
      const fileToRemove = prevFiles.find((f) => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prevFiles.filter((f) => f.id !== fileId)
    })
  }, [])

  const getInputProps = useCallback(() => ({
    ref: inputRef,
    type: "file" as const,
    accept,
    onChange: handleFileChange,
  }), [accept, handleFileChange])

  return [
    { files },
    { removeFile, openFileDialog, getInputProps }
  ] as const
}