"use client"

import Link from "next/link"
import { useMemo } from "react"
import { FileText, MessageCircle, PawPrint } from "lucide-react"
import { ApiErrorState, EmptyState, LoadingCards, LoadingPanel } from "@/components/data-states"
import { NoticeCard } from "@/components/notice-card"
import { PageHeading } from "@/components/page-heading"
import { PetCard } from "@/components/pet-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAnimales, useAvisos, useComentarios } from "@/lib/api/hooks"
import { useSession } from "@/lib/auth/session-context"
import { getAnimalForNotice, isAnimalOwner, isNoticeOwner, sameId } from "@/lib/utils/petfinder"

export default function MisPublicacionesPage() {
  const { session } = useSession()
  const animalsQuery = useAnimales()
  const noticesQuery = useAvisos()
  const commentsQuery = useComentarios()

  const animals = useMemo(
    () => (animalsQuery.data ?? []).filter((animal) => isAnimalOwner(animal, session?.userId)),
    [animalsQuery.data, session?.userId],
  )
  const notices = useMemo(
    () => (noticesQuery.data ?? []).filter((notice) => isNoticeOwner(notice, getAnimalForNotice(notice, animalsQuery.data), session?.userId)),
    [animalsQuery.data, noticesQuery.data, session?.userId],
  )
  const comments = useMemo(
    () => (commentsQuery.data ?? []).filter((comment) => sameId(comment.idUsuario ?? comment.usuario?.idUsuario, session?.userId)),
    [commentsQuery.data, session?.userId],
  )
  const isLoading = animalsQuery.isLoading || noticesQuery.isLoading || commentsQuery.isLoading

  return (
    <div className="flex flex-col gap-7">
      <PageHeading
        eyebrow="Tu actividad"
        title="Mis publicaciones"
        description="Encuentra las mascotas, avisos y comentarios asociados a tu cuenta."
      />

      {!session?.userId ? (
        <div className="rounded-2xl border border-accent bg-accent/35 p-4 text-sm leading-relaxed text-accent-foreground" role="status">
          El token de sesión no contiene un identificador de usuario compatible. No se filtrarán publicaciones con datos de otra cuenta.
        </div>
      ) : null}
      {animalsQuery.error ? <ApiErrorState error={animalsQuery.error} onRetry={() => void animalsQuery.mutate()} /> : null}
      {noticesQuery.error ? <ApiErrorState error={noticesQuery.error} onRetry={() => void noticesQuery.mutate()} /> : null}
      {commentsQuery.error ? <ApiErrorState error={commentsQuery.error} onRetry={() => void commentsQuery.mutate()} /> : null}

      <Tabs defaultValue="mascotas" className="flex flex-col gap-5">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl border border-border bg-card p-1 sm:w-fit">
          <TabsTrigger value="mascotas" className="gap-2"><PawPrint aria-hidden="true" />Mascotas <span className="text-xs text-muted-foreground">{animalsQuery.data ? animals.length : "—"}</span></TabsTrigger>
          <TabsTrigger value="avisos" className="gap-2"><FileText aria-hidden="true" />Avisos <span className="text-xs text-muted-foreground">{noticesQuery.data ? notices.length : "—"}</span></TabsTrigger>
          <TabsTrigger value="comentarios" className="gap-2"><MessageCircle aria-hidden="true" />Comentarios <span className="text-xs text-muted-foreground">{commentsQuery.data ? comments.length : "—"}</span></TabsTrigger>
        </TabsList>

        <TabsContent value="mascotas" className="flex flex-col gap-4">
          {animalsQuery.isLoading ? <LoadingCards /> : null}
          {animalsQuery.data && animals.length === 0 ? <EmptyState icon={PawPrint} title="Aún no tienes mascotas" description="Las fichas que registres aparecerán aquí." action={<Button nativeButton={false} role="link" render={<Link href="/mascotas" />}>Ver mascotas</Button>} /> : null}
          {animals.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{animals.map((animal) => <PetCard key={animal.idAnimal} animal={animal} />)}</div> : null}
        </TabsContent>

        <TabsContent value="avisos" className="flex flex-col gap-4">
          {noticesQuery.isLoading ? <LoadingCards count={2} /> : null}
          {noticesQuery.data && notices.length === 0 ? <EmptyState icon={FileText} title="Aún no tienes avisos" description="Los avisos asociados a tus mascotas aparecerán aquí." action={<Button nativeButton={false} role="link" render={<Link href="/avisos" />}>Ver avisos</Button>} /> : null}
          {notices.length > 0 ? <div className="flex flex-col gap-4">{notices.map((notice) => <NoticeCard key={notice.idAviso} notice={notice} animal={getAnimalForNotice(notice, animalsQuery.data)} />)}</div> : null}
        </TabsContent>

        <TabsContent value="comentarios" className="flex flex-col gap-4">
          {commentsQuery.isLoading ? <LoadingPanel label="Cargando comentarios" /> : null}
          {commentsQuery.data && comments.length === 0 ? <EmptyState icon={MessageCircle} title="Aún no has comentado" description="Los comentarios que compartas en avisos aparecerán aquí." action={<Button nativeButton={false} role="link" render={<Link href="/avisos" />}>Explorar avisos</Button>} /> : null}
          {comments.map((comment) => (
            <Card key={comment.idComentario} className="rounded-2xl border-border/80 bg-card shadow-sm">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><MessageCircle aria-hidden="true" className="size-4" /></span>
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.texto}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Comentario #{comment.idComentario} · Aviso #{comment.idAviso}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="shrink-0" nativeButton={false} role="link" render={<Link href={`/avisos/${comment.idAviso}`} />}>Abrir aviso</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      {isLoading ? <span className="sr-only" aria-live="polite">Cargando tus publicaciones</span> : null}
    </div>
  )
}
