import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/client"

export function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Cargando contenido">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-border bg-card">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function LoadingPanel({ label = "Cargando" }: { label?: string }) {
  return (
    <div className="flex min-h-56 flex-col gap-4 rounded-3xl border border-border bg-card p-6" aria-busy="true" aria-label={label}>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-full max-w-2xl" />
      <Skeleton className="h-4 w-2/3 max-w-xl" />
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Empty className="min-h-64 rounded-3xl border border-dashed border-border bg-card px-6 py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-12 rounded-2xl bg-secondary text-primary [&_svg:not([class*='size-'])]:size-5">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}

export function ApiErrorState({
  error,
  onRetry,
}: {
  error: unknown
  onRetry?: () => void
}) {
  const message = error instanceof ApiError ? error.message : "No se pudo cargar la información. Inténtalo de nuevo."
  const isConfig = error instanceof ApiError && error.status === 0

  return (
    <Alert variant="destructive" className="rounded-2xl">
      <AlertTitle>{isConfig ? "No se pudo conectar con la API" : "No se pudo cargar la información"}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{message}</span>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry} className="shrink-0">
            Reintentar
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
