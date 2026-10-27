"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, CalendarDays, Edit3, MapPin, MessageCircle, PawPrint, UserRound } from "lucide-react"
import { CommentForm } from "@/components/forms/comment-form"
import { NoticeForm } from "@/components/forms/notice-form"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { ApiErrorState, EmptyState, LoadingPanel } from "@/components/data-states"
import { PageHeading } from "@/components/page-heading"
import { PetPhoto } from "@/components/pet-photo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAnimal, useAnimales, useAviso, useComentarios, useRefreshResources } from "@/lib/api/hooks"
import { API_PATHS, createComentario, deleteAviso, deleteComentario, updateAviso, updateComentario } from "@/lib/api/resources"
import { ApiError } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session-context"
import type { EntityId } from "@/lib/types"
import type { AvisoWriteValues, ComentarioWriteValues } from "@/lib/validation"
import { formatDate, isAnimalOwner, isNoticeOwner, noticeStateVariant, sameId } from "@/lib/utils/petfinder"
import { LocationMap } from "@/components/map/location-map"
import { cleanAddress } from "@/lib/utils/osm"

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "No se pudo completar la operación. Inténtalo de nuevo."
}

export default function AvisoDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { session } = useSession()
  const id = Number(params.id)
  const validId = Number.isSafeInteger(id) && id > 0 ? id : null
  const noticeQuery = useAviso(validId)
  const animalsQuery = useAnimales()
  const commentsQuery = useComentarios()
  const refreshResources = useRefreshResources()
  const [editNoticeOpen, setEditNoticeOpen] = useState(false)
  const [selectedComment, setSelectedComment] = useState<import("@/lib/types").Comentario | undefined>()
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [isNoticeSaving, setIsNoticeSaving] = useState(false)
  const [isCommentSaving, setIsCommentSaving] = useState(false)
  const notice = noticeQuery.data
  const animalQuery = useAnimal(notice?.idAnimal)
  const animal = animalsQuery.data?.find((item) => sameId(item.idAnimal, notice?.idAnimal)) ?? animalQuery.data ?? notice?.animal ?? null
  const comments = commentsQuery.data?.filter((comment) => sameId(comment.idAviso, notice?.idAviso)) ?? []
  const canManageNotice = notice ? isNoticeOwner(notice, animal, session?.userId) : false

  async function saveNotice(values: AvisoWriteValues) {
    if (!notice) return
    setIsNoticeSaving(true)
    try {
      await updateAviso(notice.idAviso, {
        estado: values.estado,
        ultimaUbicacionVista: values.ultimaUbicacionVista,
        comentario: values.comentario,
      })
      toast.success("El aviso se actualizó.")
      setEditNoticeOpen(false)
      await refreshResources([API_PATHS.notices])
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setIsNoticeSaving(false)
    }
  }

  async function removeNotice(idToRemove: EntityId) {
    try {
      await deleteAviso(idToRemove)
      toast.success("El aviso se marcó como eliminado.")
      await refreshResources([API_PATHS.notices, API_PATHS.comments])
      router.replace("/avisos")
      return true
    } catch (error) {
      toast.error(errorMessage(error))
      return false
    }
  }

  async function saveComment(values: ComentarioWriteValues) {
    setIsCommentSaving(true)
    try {
      if (selectedComment) {
        await updateComentario(selectedComment.idComentario, values)
        toast.success("El comentario se actualizó.")
        setCommentDialogOpen(false)
      } else {
        await createComentario(values)
        toast.success("Tu comentario se publicó.")
      }
      await refreshResources([API_PATHS.comments])
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setIsCommentSaving(false)
    }
  }

  async function removeComment(idToRemove: EntityId) {
    try {
      await deleteComentario(idToRemove)
      toast.success("El comentario se marcó como eliminado.")
      await refreshResources([API_PATHS.comments])
      return true
    } catch (error) {
      toast.error(errorMessage(error))
      return false
    }
  }

  if (!validId) {
    return <EmptyState icon={MapPin} title="Identificador no válido" description="El aviso necesita un identificador numérico." action={<Button nativeButton={false} role="link" render={<Link href="/avisos" />}>Volver a avisos</Button>} />
  }
  if (noticeQuery.isLoading) return <LoadingPanel label="Cargando aviso" />
  if (noticeQuery.error) return <ApiErrorState error={noticeQuery.error} onRetry={() => void noticeQuery.mutate()} />
  if (!notice) return null

  const numericNoticeId = Number(notice.idAviso)
  const commentIdIsValid = Number.isSafeInteger(numericNoticeId) && numericNoticeId > 0

  return (
    <div className="flex flex-col gap-7">
      <PageHeading
        eyebrow="Detalle del aviso"
        title={animal?.nombre ?? `Aviso de mascota #${notice.idAnimal}`}
        description="Información publicada por la comunidad. Comprueba los datos antes de compartirlos."
        action={
          <>
            <Button variant="outline" nativeButton={false} role="link" render={<Link href="/avisos" />}><ArrowLeft aria-hidden="true" data-icon="inline-start" /> Volver</Button>
            {canManageNotice ? <Button onClick={() => setEditNoticeOpen(true)}><Edit3 aria-hidden="true" data-icon="inline-start" /> Editar aviso</Button> : null}
            {canManageNotice ? <ConfirmDeleteDialog itemLabel="este aviso" onConfirm={() => removeNotice(notice.idAviso)} /> : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <PetPhoto src={animal?.foto ?? notice.animal?.foto} alt={animal?.nombre ? `Foto de ${animal.nombre}` : "Foto asociada al aviso"} className="aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-border bg-card" />
        <Card className="rounded-[2rem] border-border/80 bg-card shadow-sm">
          <CardContent className="flex h-full flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant={noticeStateVariant(notice.estado)}>{notice.estado}</Badge>
              {formatDate(notice.fechaCreacion ?? notice.createdAt) ? (
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays aria-hidden="true" className="size-4" />{formatDate(notice.fechaCreacion ?? notice.createdAt)}</span>
              ) : null}
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Última ubicación vista</p>
              <p className="flex items-start gap-2 text-base font-medium leading-relaxed">
                <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                {cleanAddress(notice.ultimaUbicacionVista)}
              </p>
              <LocationMap
                location={notice.ultimaUbicacionVista}
                title={`Última ubicación de ${animal?.nombre ?? "mascota"}`}
                className="h-64 sm:h-72 w-full"
              />
              {notice.comentario?.trim() ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{notice.comentario}</p> : null}
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
              {animal?.nombre ? <Link href={`/mascotas/${animal.idAnimal}`} className="inline-flex items-center gap-2 font-medium text-primary hover:underline"><PawPrint aria-hidden="true" className="size-4" />Ver ficha de {animal.nombre}</Link> : <span>Mascota ID: {notice.idAnimal}</span>}
              <span> Aviso ID: {notice.idAviso}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card className="h-fit rounded-3xl border-border/80 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><MessageCircle aria-hidden="true" className="size-5 text-primary" />Compartir una pista</CardTitle>
          </CardHeader>
          <CardContent>
            {commentIdIsValid ? (
              <CommentForm noticeId={numericNoticeId} onSubmit={saveComment} isSaving={isCommentSaving} />
            ) : (
              <p className="text-sm text-muted-foreground">El identificador del aviso no es compatible con el formato requerido para comentar.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Conversación</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Comentarios</h2>
            </div>
            {commentsQuery.data ? <span className="text-sm text-muted-foreground">{comments.length}</span> : null}
          </div>
          {commentsQuery.error ? <ApiErrorState error={commentsQuery.error} onRetry={() => void commentsQuery.mutate()} /> : null}
          {commentsQuery.isLoading ? <LoadingPanel label="Cargando comentarios" /> : null}
          {commentsQuery.data && comments.length === 0 ? <EmptyState icon={MessageCircle} title="Aún no hay comentarios" description="Si tienes información confirmada, puedes compartirla con respeto." /> : null}
          {comments.map((comment) => {
            const isOwner = sameId(comment.idUsuario ?? comment.usuario?.idUsuario, session?.userId)
            const author = comment.usuario?.nombre ?? (isOwner ? session?.name : null) ?? "Miembro de la comunidad"
            return (
              <Card key={comment.idComentario} className="rounded-2xl border-border/80 bg-card shadow-sm">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium"><UserRound aria-hidden="true" className="size-4 text-primary" />{author}</div>
                    <div className="flex items-center gap-2">
                      {formatDate(comment.fechaCreacion ?? comment.createdAt) ? <span className="text-xs text-muted-foreground">{formatDate(comment.fechaCreacion ?? comment.createdAt)}</span> : null}
                      {isOwner ? (
                        <>
                          <Button type="button" variant="ghost" size="icon-sm" aria-label="Editar comentario" onClick={() => { setSelectedComment(comment); setCommentDialogOpen(true) }}><Edit3 aria-hidden="true" /></Button>
                          <ConfirmDeleteDialog itemLabel="este comentario" onConfirm={() => removeComment(comment.idComentario)} iconOnly />
                        </>
                      ) : null}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{comment.texto}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <Dialog open={editNoticeOpen} onOpenChange={(open) => !isNoticeSaving && setEditNoticeOpen(open)}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>Editar aviso</DialogTitle><DialogDescription>Actualiza todos los campos requeridos por la API.</DialogDescription></DialogHeader>
          <NoticeForm
            key={notice.idAviso}
            animals={animalsQuery.data?.filter((item) => session?.isAdmin || isAnimalOwner(item, session?.userId)) ?? []}
            initial={notice}
            onSubmit={saveNotice}
            onCancel={() => setEditNoticeOpen(false)}
            isSaving={isNoticeSaving}
            submitLabel="Guardar cambios"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={commentDialogOpen} onOpenChange={(open) => !isCommentSaving && setCommentDialogOpen(open)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar comentario</DialogTitle><DialogDescription>Actualiza el texto que compartiste en este aviso.</DialogDescription></DialogHeader>
          {selectedComment ? (
            <CommentForm
              key={selectedComment.idComentario}
              noticeId={numericNoticeId}
              initial={selectedComment}
              onSubmit={saveComment}
              onCancel={() => setCommentDialogOpen(false)}
              isSaving={isCommentSaving}
              submitLabel="Guardar cambios"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
