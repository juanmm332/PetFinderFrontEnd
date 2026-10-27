"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Heart, PawPrint, Search, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSession } from "@/lib/auth/session-context"

const features = [
  {
    icon: PawPrint,
    title: "Registra mascotas",
    description: "Mantén a mano la información que ayuda a reconocerlas.",
  },
  {
    icon: Search,
    title: "Consulta avisos",
    description: "Revisa los avisos de la comunidad y sus datos de ubicación.",
  },
  {
    icon: Heart,
    title: "Comparte pistas",
    description: "Aporta información en los comentarios de cada aviso.",
  },
]

export default function HomePage() {
  const router = useRouter()
  const { session, isReady } = useSession()

  useEffect(() => {
    if (isReady && session) router.replace("/inicio")
  }, [isReady, router, session])

  if (isReady && session) return null

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <PawPrint aria-hidden="true" />
          </span>
          <span className="font-semibold tracking-tight">PetFinder</span>
        </Link>
        <nav aria-label="Acceso" className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} role="link" render={<Link href="/login" />}>Iniciar sesión</Button>
          <Button nativeButton={false} role="link" render={<Link href="/registro" />}>Crear cuenta <ArrowRight aria-hidden="true" data-icon="inline-end" /></Button>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 sm:pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-24 lg:pt-16">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-3.5 text-primary" /> Una comunidad de ayuda
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Cada mascota merece volver a casa.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Organiza información de mascotas, consulta avisos y comparte pistas útiles con una comunidad que se preocupa.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" nativeButton={false} role="link" render={<Link href="/registro" />}>Empezar ahora <ArrowRight aria-hidden="true" data-icon="inline-end" /></Button>
            <Button size="lg" variant="outline" nativeButton={false} role="link" render={<Link href="/login" />}>Ya tengo una cuenta</Button>
          </div>
          <p className="mt-5 max-w-md text-xs leading-relaxed text-muted-foreground">
            Para proteger la información de la comunidad, los listados y las publicaciones se muestran después de iniciar sesión.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="rounded-[2rem] border border-border bg-card p-5 shadow-xl shadow-primary/5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">PetFinder</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Pequeñas pistas, grandes reencuentros</h2>
              </div>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Heart aria-hidden="true" />
              </span>
            </div>
            <div className="mt-7 grid min-h-64 place-items-center overflow-hidden rounded-[1.5rem] bg-secondary/70 p-6">
              <div className="flex size-44 items-center justify-center rounded-full border border-primary/10 bg-card shadow-sm">
                <div className="flex size-28 items-center justify-center rounded-[2rem] bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <PawPrint aria-hidden="true" className="size-14" />
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-muted/70 p-4">
              <span className="flex size-9 items-center justify-center rounded-xl bg-card text-primary">
                <Search aria-hidden="true" className="size-4" />
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">Empieza por compartir datos claros y mantener cada aviso actualizado.</p>
            </div>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 -z-10 size-40 rounded-full bg-accent/50 blur-3xl" />
        </div>
      </section>

      <section className="border-t border-border bg-card/60">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Cómo ayuda</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Todo lo importante, en un mismo lugar</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">Herramientas sencillas para compartir información y colaborar con respeto.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="rounded-3xl border-border/80 bg-card shadow-sm">
                <CardContent className="flex flex-col gap-4 p-6">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold tracking-tight">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <span>PetFinder · Comunidad para ayudar a encontrar mascotas</span>
        <Link href="/login" className="font-medium text-primary hover:underline">Acceder a mi cuenta</Link>
      </footer>
    </main>
  )
}
