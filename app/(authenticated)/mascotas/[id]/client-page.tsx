"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, Edit3, MapPin, PawPrint } from "lucide-react"
import { AnimalForm } from "@/components/forms/animal-form"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { ApiErrorState, EmptyState, LoadingPanel } from "@/components/data-states"
import { NoticeCard } from "@/components/notice-card"
import { PageHeading } from "@/components/page-heading"
import { PetPhoto } from "@/components/pet-photo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAnimal, useAvisos, useRefreshResources } from "@/lib/api/hooks"
import { API_PATHS, deleteAnimal, updateAnimal } from "@/lib/api/resources"
import { ApiError } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session-context"
import type { EntityId } from "@/lib/types"
import type { AnimalWriteValues } from "@/lib/validation"
import { isAnimalOwner, sameId } from "@/lib/utils/petfinder"

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "No se pudo completar la operación. Inténtalo de nuevo."
}

export default function MascotaDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { session } = useSession()
  const id = Number(params.id)
  const validId = Number.isSafeInteger(id) && id > 0 ? id : null
  const animalQuery = useAnimal(validId)
  const noticesQuery = useAvisos()
  const refreshResources = useRefreshResources()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const animal = animalQuery.data
  const canManage = animal ? isAnimalOwner(animal, session?.userId) : false
  const relatedNotices = noticesQuery.data?.filter((notice) => sameId(notice.idAnimal, animal?.idAnimal)) ?? []

  async function saveAnimal(values: AnimalWriteValues) {
    if (!animal) return
    setIsSaving(true)
    try {
      await updateAnimal(animal.idAnimal, values)
      toast.success("Los cambios de la mascota se guardaron.")
      setDialogOpen(false)
      await refreshResources([API_PATHS.animals, API_PATHS.notices])
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function removeAnimal(idToRemove: EntityId) {
    try {
      await deleteAnimal(idToRemove)
      toast.success("La mascota se marcó como eliminada.")
      await refreshResources([API_PATHS.animals, API_PATHS.notices])
      router.replace("/mascotas")
      return true
    } catch (error) {
      toast.error(errorMessage(error))
      return false
    }
  }

  if (!validId) {
    return <EmptyState icon={PawPrint} title="Identificador no válido" description="La ficha necesita un identificador numérico de mascota." action={<Button nativeButton={false} role="link" render={<Link href="/mascotas" />}>Volver a mascotas</Button>} />
  }

  if (animalQuery.isLoading) return <LoadingPanel label="Cargando ficha de mascota" />
  if (animalQuery.error) return <ApiErrorState error={animalQuery.error} onRetry={() => void animalQuery.mutate()} />
  if (!animal) return null

  return (
    <div className="flex flex-col gap-7">
      <PageHeading
        eyebrow="Ficha de mascota"
        title={animal.nombre}
        description="Información registrada para identificar a esta mascota."
        action={
          <>
            <Button variant="outline" nativeButton={false} role="link" render={<Link href="/mascotas" />}><ArrowLeft aria-hidden="true" data-icon="inline-start" /> Volver</Button>
            {canManage ? <Button onClick={() => setDialogOpen(true)}><Edit3 aria-hidden="true" data-icon="inline-start" /> Editar</Button> : null}
            {canManage ? <ConfirmDeleteDialog itemLabel={animal.nombre} onConfirm={() => removeAnimal(animal.idAnimal)} /> : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <PetPhoto src={animal.foto} alt={`Foto de ${animal.nombre}`} className="aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-border bg-card" />
        <Card className="rounded-[2rem] border-border/80 bg-card shadow-sm">
          <CardContent className="flex h-full flex-col gap-6 p-6 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Información</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Sobre {animal.nombre}</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {animal.comentario?.trim() || "No se ha añadido una descripción para esta mascota."}
              </p>
            </div>
            <div className="mt-auto flex flex-col gap-3 border-t border-border pt-5 text-sm">
              {animal.usuario?.nombre ? <p className="text-muted-foreground">Registrada por <span className="font-medium text-foreground">{animal.usuario.nombre}</span></p> : null}
              <p className="text-xs text-muted-foreground">ID de mascota: {animal.idAnimal}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Avisos relacionados</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Actividad de {animal.nombre}</h2>
        </div>
        {noticesQuery.error ? <ApiErrorState error={noticesQuery.error} onRetry={() => void noticesQuery.mutate()} /> : null}
        {noticesQuery.isLoading ? <LoadingPanel label="Cargando avisos relacionados" /> : null}
        {noticesQuery.data && relatedNotices.length === 0 ? (
          <EmptyState icon={MapPin} title="Sin avisos relacionados" description="La API no devuelve avisos asociados a esta mascota." />
        ) : null}
        {relatedNotices.map((notice) => <NoticeCard key={notice.idAviso} notice={notice} animal={animal} />)}
      </section>

      <Dialog open={dialogOpen} onOpenChange={(open) => !isSaving && setDialogOpen(open)}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar mascota</DialogTitle>
            <DialogDescription>Actualiza la información de esta ficha.</DialogDescription>
          </DialogHeader>
          <AnimalForm
            key={animal.idAnimal}
            initial={animal}
            onSubmit={saveAnimal}
            onCancel={() => setDialogOpen(false)}
            isSaving={isSaving}
            submitLabel="Guardar cambios"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
