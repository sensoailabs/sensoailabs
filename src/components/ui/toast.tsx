"use client"

// No React import needed for automatic JSX runtime
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
  onDismiss?: (id: string) => void
}

export function Toast({
  id,
  title,
  description,
  variant = 'default',
  onDismiss
}: ToastProps) {
  const handleDismiss = () => {
    onDismiss?.(id)
  }

  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        {
          "border-border bg-background text-foreground": variant === 'default',
          "destructive border-destructive bg-destructive text-destructive-foreground": variant === 'destructive',
          "border-green-200 bg-green-50 text-green-800": variant === 'success'
        }
      )}
    >
      <div className="grid gap-1">
        {title && (
          <div className="text-sm font-semibold">
            {title}
          </div>
        )}
        {description && (
          <div className="text-sm opacity-90">
            {description}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </Button>
    </div>
  )
}

export function ToastContainer({ 
  toasts, 
  onDismiss 
}: { 
  toasts: ToastProps[]
  onDismiss: (id: string) => void 
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}