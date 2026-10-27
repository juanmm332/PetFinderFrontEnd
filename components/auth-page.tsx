"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Heart, PawPrint, ShieldCheck } from "lucide-react"
import { useSession } from "@/lib/auth/session-context"
import { Skeleton } from "@/components/ui/skeleton"

export function AuthPage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  const router = useRouter()
  const { session, isReady } = useSession()

  useEffect(() => {
    if (isReady && session) router.replace("/inicio")
  }, [isReady, router, session])

  if (!isReady || session) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6" aria-busy="true" aria-label="Cargando">
        <Skeleton className="h-[32rem] w-full max-w-5xl rounded-[2rem]" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-3 sm:p-6 lg:grid lg:place-items-center">
      <div className="mx-auto grid min-h-[min(860px,calc(100vh-3rem))] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-primary/5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-primary p-6 text-primary-foreground sm:p-10 lg:p-12">
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 rounded-xl text-sm font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-foreground/12">
                <PawPrint aria-hidden="true" />
              </span>
              PetFinder
            </Link>
            <div className="mt-10 max-w-lg lg:mt-20">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/8 px-3 py-1.5 text-xs font-medium text-primary-foreground/85">
                <Heart aria-hidden="true" className="size-3.5" /> Una comunidad que acompaña
              </span>
              <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Cada reencuentro empieza con una pista.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/70 sm:text-base">
                Comparte información, sigue avisos y ayuda a que más mascotas vuelvan a casa.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8 flex items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-4 sm:max-w-sm">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/10">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <p className="text-xs leading-relaxed text-primary-foreground/75">
              Acceso protegido para que la información de la comunidad se mantenga bajo control.
            </p>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-14 hidden size-72 rounded-full border border-primary-foreground/10 sm:block" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -right-6 hidden size-56 rounded-full border border-primary-foreground/10 sm:block" />
        </section>

        <section className="flex items-center justify-center p-5 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">PetFinder · Comunidad</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-7">{children}</div>
          </div>
        </section>
      </div>
    </main>
  )
}
