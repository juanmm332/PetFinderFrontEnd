"use client"

import type { ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"
import { SessionProvider } from "@/lib/auth/session-context"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </SessionProvider>
  )
}
