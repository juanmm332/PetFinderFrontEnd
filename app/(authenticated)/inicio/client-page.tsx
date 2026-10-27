"use client"

import Link from "next/link"
import { ArrowRight, Heart, PawPrint, Plus, ShieldCheck } from "lucide-react"
import { ApiErrorState, EmptyState, LoadingCards } from "@/components/data-states"
import { NoticeCard } from "@/components/notice-card"
import { PageHeading } from "@/components/page-heading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAnimales, useAvisos } from "@/lib/api/hooks"
import { useSession } from "@/lib/auth/session-context"
import { getAnimalForNotice } from "@/lib/utils/petfinder"

function OverviewCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number | string
  icon: typeof PawPrint
}) {
  return (
    <Card className="rounded-3xl border-border/80 bg-card shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Icon aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { session } = useSession()
  const animals = useAnimales()
  const notices = useAvisos()
  const firstName = session?.name?.trim().split(/\s+/)[0] || "bienvenido"
  const activeNotices = notices.data?.filter((notice) => notice.estado === "Activo").length

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Comunidad PetFinder"
        title={`Hola, ${firstName}`}
        description="Consulta la actividad y encuentra el próximo paso para ayudar."
        action={session?.isAdmin ? <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground"><ShieldCheck aria-hidden="true" className="size-4" /> Administrador</span> : undefined}
      />

      <section className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground sm:p-8 lg:p-10">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground/65">La comunidad empieza contigo</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Una pista compartida puede marcar la diferencia.</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-primary-foreground/70 sm:text-base">Registra una mascota o revisa los avisos que necesitan atención. Usa la información confirmada por la API para mantener todo actualizado.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button nativeButton={false} role="link" render={<Link href="/mascotas" />} variant="secondary">
              <Plus aria-hidden="true" data-icon="inline-start" /> Registrar mascota
            </Button>
            <Button nativeButton={false} role="link" render={<Link href="/avisos" />} variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              Ver avisos <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Button>
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 hidden size-80 rounded-full border border-primary-foreground/10 lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-10 hidden size-60 rounded-full border border-primary-foreground/10 lg:block" />
        <PawPrint aria-hidden="true" className="pointer-events-none absolute right-12 bottom-8 hidden size-16 rotate-12 text-primary-foreground/10 lg:block" />
      </section>

      <section aria-label="Resumen de la comunidad" className="grid gap-4 sm:grid-cols-3">
        <OverviewCard label="Mascotas" value={animals.error ? "—" : animals.data?.length ?? "…"} icon={PawPrint} />
        <OverviewCard label="Avisos publicados" value={notices.error ? "—" : notices.data?.length ?? "…"} icon={Heart} />
        <OverviewCard label="Avisos activos" value={notices.error ? "—" : activeNotices ?? "…"} icon={ShieldCheck} />
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Actividad</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Avisos de la comunidad</h2>
          </div>
          <Button variant="ghost" nativeButton={false} role="link" render={<Link href="/avisos" />}>Ir a todos los avisos <ArrowRight aria-hidden="true" data-icon="inline-end" /></Button>
        </div>
        {notices.error ? <ApiErrorState error={notices.error} onRetry={() => void notices.mutate()} /> : null}
        {notices.isLoading ? <LoadingCards count={2} /> : null}
        {notices.data && notices.data.length === 0 ? (
          <EmptyState icon={Heart} title="Todavía no hay avisos" description="Cuando la API reciba publicaciones, aparecerán aquí." action={<Button nativeButton={false} role="link" render={<Link href="/avisos" />}>Explorar avisos</Button>} />
        ) : null}
        {notices.data && notices.data.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {notices.data.slice(0, 4).map((notice) => (
              <NoticeCard key={notice.idAviso} notice={notice} animal={getAnimalForNotice(notice, animals.data)} />
            ))}
          </div>
        ) : null}
        {animals.error ? <ApiErrorState error={animals.error} onRetry={() => void animals.mutate()} /> : null}
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Heart aria-hidden="true" /></span>
          <div>
            <h2 className="font-semibold tracking-tight">¿Tienes información sobre una mascota?</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Añade una mascota y publica un aviso con la última ubicación confirmada.</p>
          </div>
        </div>
        <Button className="mt-4 shrink-0 sm:mt-0" nativeButton={false} role="link" render={<Link href="/mascotas" />}>Ver mis mascotas <ArrowRight aria-hidden="true" data-icon="inline-end" /></Button>
      </section>
    </div>
  )
}
