"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { useSession } from "@/lib/auth/session-context"
import { Skeleton } from "@/components/ui/skeleton"

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, isReady } = useSession()

  useEffect(() => {
    if (isReady && !session) router.replace("/login")
  }, [isReady, router, session])

  if (!isReady || !session) {
    return (
      <main className="min-h-screen bg-background p-6 sm:p-10" aria-busy="true" aria-label="Cargando sesión">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <Skeleton className="h-12 w-48 rounded-xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
          </div>
        </div>
      </main>
    )
  }

  return <AppShell>{children}</AppShell>
}
