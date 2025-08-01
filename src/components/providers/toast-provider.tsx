"use client"

import * as React from "react"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, dismiss } = useToast()

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}