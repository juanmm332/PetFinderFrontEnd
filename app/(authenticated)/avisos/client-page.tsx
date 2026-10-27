"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Filter, MapPin, Plus, Search } from "lucide-react"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { ApiErrorState, EmptyState, LoadingCards } from "@/components/data-states"
import { NoticeCard } from "@/components/notice-card"
import { NoticeForm } from "@/components/forms/notice-form"
import { PageHeading } from "@/components/page-heading"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAnimales, useAvisos, useRefreshResources } from "@/lib/api/hooks"
import { API_PATHS, createAviso, deleteAviso, updateAviso } from "@/lib/api/resources"
import { ApiError } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session-context"
import { NOTICE_STATES, type Aviso, type EntityId, type NoticeState } from "@/lib/types"
import type { AvisoWriteValues } from "@/lib/validation"
import { getAnimalForNotice, isAnimalOwner, isNoticeOwner } from "@/lib/utils/petfinder"

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "No se pudo completar la operación. Inténtalo de nuevo."
}

type StatusFilter = NoticeState | "Todos"

export default function AvisosPage() {
  const { session } = useSession()
  const noticesQuery = useAvisos()
  const animalsQuery = useAnimales()
  const refreshResources = useRefreshResources()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Aviso | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  const animals = animalsQuery.data ?? []
  const eligibleAnimals = session?.isAdmin
    ? animals
    : animals.filter((animal) => isAnimalOwner(animal, session?.userId))
  const filteredNotices = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es")
    return (noticesQuery.data ?? []).filter((notice) => {
      const animal = getAnimalForNotice(notice, animalsQuery.data)
      const matchesStatus = statusFilter === "Todos" || notice.estado === statusFilter
      const searchable = `${animal?.nombre ?? ""} ${notice.ultimaUbicacionVista} ${notice.comentario ?? ""}`.toLocaleLowerCase("es")
      return matchesStatus && (!term || searchable.includes(term))
    })
  }, [animalsQuery.data, noticesQuery.data, search, statusFilter])

  function openCreate() {
    setSelectedNotice(undefined)
    setDialogOpen(true)
  }

  function openEdit(notice: Aviso) {
    setSelectedNotice(notice)
    setDialogOpen(true)
  }

  async function saveNotice(values: AvisoWriteValues) {
    setIsSaving(true)
    try {
      if (selectedNotice) {
        await updateAviso(selectedNotice.idAviso, values)
        toast.success("El aviso se actualizó.")
      } else {
        await createAviso(values)
        toast.success("El aviso se publicó.")
      }
      setDialogOpen(false)
      await refreshResources([API_PATHS.notices])
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function removeNotice(id: EntityId) {
    try {
      await deleteAviso(id)
      toast.success("El aviso se marcó como eliminado.")
      await refreshResources([API_PATHS.notices, API_PATHS.comments])
      return true
    } catch (error) {
      toast.error(errorMessage(error))
      return false
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeading
        eyebrow="Actividad de la comunidad"
        title="Avisos"
        description="Consulta los avisos disponibles y comparte información basada en lo que has confirmado."
        action={
          <Button onClick={openCreate} disabled={animalsQuery.isLoading || Boolean(animalsQuery.error) || eligibleAnimals.length === 0}>
            <Plus aria-hidden="true" data-icon="inline-start" /> Publicar aviso
          </Button>
        }
      />

      {animalsQuery.error ? <ApiErrorState error={animalsQuery.error} onRetry={() => void animalsQuery.mutate()} /> : null}
      {animalsQuery.data && eligibleAnimals.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-accent bg-accent/35 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-foreground" />
            <p className="text-sm leading-relaxed text-accent-foreground">Para publicar un aviso, primero registra una mascota. La API solo permite asociar un aviso a una mascota existente.</p>
          </div>
          <Button variant="outline" nativeButton={false} role="link" render={<Link href="/mascotas" />}>Ir a mascotas</Button>
        </div>
      ) : null}

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_13rem] sm:p-4">
        <div className="flex items-center gap-2">
          <Search aria-hidden="true" className="ml-1 size-4 shrink-0 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por mascota, ubicación o descripción" aria-label="Buscar avisos" className="border-0 bg-transparent shadow-none focus-visible:ring-0" />
        </div>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="aviso-filtro" className="sr-only">Filtrar por estado</FieldLabel>
          <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value as StatusFilter)}>
            <SelectTrigger id="aviso-filtro" aria-label="Filtrar avisos por estado" className="w-full">
              <Filter aria-hidden="true" data-icon="inline-start" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="Todos">Todos los estados</SelectItem>
                {NOTICE_STATES.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {noticesQuery.error ? <ApiErrorState error={noticesQuery.error} onRetry={() => void noticesQuery.mutate()} /> : null}
      {noticesQuery.isLoading ? <LoadingCards count={2} /> : null}
      {noticesQuery.data && noticesQuery.data.length === 0 ? (
        <EmptyState icon={MapPin} title="Todavía no hay avisos" description="Cuando se publique un aviso, aparecerá aquí." action={eligibleAnimals.length ? <Button onClick={openCreate}><Plus aria-hidden="true" data-icon="inline-start" /> Publicar aviso</Button> : undefined} />
      ) : null}
      {noticesQuery.data && noticesQuery.data.length > 0 && filteredNotices.length === 0 ? (
        <EmptyState icon={Search} title="No encontramos avisos" description="Prueba con otro término o cambia el filtro de estado." action={<Button variant="outline" onClick={() => { setSearch(""); setStatusFilter("Todos") }}>Limpiar filtros</Button>} />
      ) : null}
      {filteredNotices.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredNotices.map((notice) => {
            const animal = getAnimalForNotice(notice, animalsQuery.data)
            const canManage = isNoticeOwner(notice, animal, session?.userId)
            const actions = canManage ? (
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(notice)}>Editar</Button>
                <ConfirmDeleteDialog itemLabel={`el aviso de ${animal?.nombre ?? `mascota #${notice.idAnimal}`}`} onConfirm={() => removeNotice(notice.idAviso)} iconOnly />
              </div>
            ) : null
            return <NoticeCard key={notice.idAviso} notice={notice} animal={animal} actions={actions} />
          })}
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={(open) => !isSaving && setDialogOpen(open)}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedNotice ? "Editar aviso" : "Publicar aviso"}</DialogTitle>
            <DialogDescription>{selectedNotice ? "Actualiza todos los campos requeridos por la API." : "Incluye la mascota, el estado y la última ubicación vista."}</DialogDescription>
          </DialogHeader>
          <NoticeForm
            key={selectedNotice?.idAviso ?? "new-notice"}
            animals={eligibleAnimals}
            initial={selectedNotice}
            onSubmit={saveNotice}
            onCancel={() => setDialogOpen(false)}
            isSaving={isSaving}
            submitLabel={selectedNotice ? "Guardar cambios" : "Publicar aviso"}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
